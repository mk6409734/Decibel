import express, { Request, Response } from 'express';
import CAPAlert from '../../models/CAPAlert';
import CAPSource from '../../models/CAPSource';
import capParser from '../../services/capParser';
import { io } from '../../sockets/socketManager';
import { cleanAlertData } from '../../utils/cleanAlertData';

const router = express.Router();

/**
 * @route   GET /api/cap-alerts/fetch
 * @desc    Fetch latest alerts from active sources and update database
 * @access  Public
 */
router.get('/fetch', async (req: Request, res: Response) => {
	try {
		// Get source ID from query params, or fetch from all active sources
		const sourceId = req.query.sourceId as string;
		let sources: any[] = [];

		if (sourceId) {
			const source = await CAPSource.findById(sourceId);
			if (source && source.isActive) {
				sources = [source];
			}
		} else {
			// Fetch from all active sources
			sources = await CAPSource.getActiveSources();
		}

		if (sources.length === 0) {
			return res.json({
				success: true,
				message: 'No active sources to fetch from',
				alerts: [],
			});
		}

		const allSavedAlerts = [];
		let totalNewAlerts = 0;
		let totalUpdatedAlerts = 0;

		for (const source of sources) {
			try {
				const alerts = await capParser.fetchAlertsFromSource(source);

				if (alerts.length === 0) {
					console.log(`No new alerts from ${source.name}`);
					continue;
				}

				// Get existing alerts for this source for bulk comparison
				const existingAlerts = await CAPAlert.find(
					{ sourceId: source._id },
					{ identifier: 1, sent: 1, isActive: 1 }
				).lean();

				const existingMap = new Map(existingAlerts.map(alert => [alert.identifier, alert]));

				// Prepare bulk operations
				const bulkOps = [];
				const newAlerts = [];

				for (const alert of alerts) {
					const existing = existingMap.get(alert.identifier);
					const alertIsActive = capParser.isAlertActive(alert);

					if (!existing) {
						// Prepare new alert
						newAlerts.push({
							...alert,
							sourceId: source._id,
							fetchedAt: new Date(),
							isActive: alertIsActive,
						});
						totalNewAlerts++;
					} else {
						// Check if update is needed
						if (
							existing.sent.getTime() !== alert.sent.getTime() ||
							existing.isActive !== alertIsActive
						) {
							// Clean alert data to prevent MongoDB error 16755
							const cleanedAlert = cleanAlertData(alert);

							bulkOps.push({
								updateOne: {
									filter: {
										identifier: alert.identifier,
										sourceId: source._id,
									},
									update: {
										...cleanedAlert,
										fetchedAt: new Date(),
										isActive: alertIsActive,
									},
								},
							});
							totalUpdatedAlerts++;
						}
					}
				}

				// Execute bulk operations
				try {
					if (bulkOps.length > 0) {
						await CAPAlert.bulkWrite(bulkOps);
						console.log(`Updated ${bulkOps.length} alerts for ${source.name}`);
					}

					if (newAlerts.length > 0) {
						// Use ordered: false to continue on errors
						const insertResult = await CAPAlert.insertMany(newAlerts, { 
							ordered: false,
							rawResult: true 
						});
						
						// Handle successfully inserted alerts
						const createdAlerts = insertResult.insertedIds ? 
							await CAPAlert.find({ _id: { $in: Object.values(insertResult.insertedIds) } }) : 
							[];

						// Convert to GeoJSON and emit via WebSocket
						for (const alert of createdAlerts) {
							try {
								alert.convertToGeoJSON();
								await alert.save();
								allSavedAlerts.push(alert);

								// Emit new alert via WebSocket
								io.emit('cap-alert-new', alert);
							} catch (geoError) {
								console.error(`Error converting GeoJSON for alert ${alert.identifier}:`, geoError);
								// Continue processing other alerts
							}
						}

						console.log(`Created ${createdAlerts.length} new alerts for ${source.name}`);
					}
				} catch (bulkError: any) {
					console.error(`Error with bulk operations for ${source.name}:`, bulkError);
					// Log specific error details to help diagnose issues
					if (bulkError.code === 16755) {
						console.error('MongoDB geospatial index error - check alert data for invalid coordinates');
					}
				}

				// Record the fetch attempt
				await source.recordFetchAttempt(true);
			} catch (error) {
				console.error(`Error fetching from source ${source.name}:`, error);
				// Record the failed attempt
				await source.recordFetchAttempt(
					false,
					error instanceof Error ? error.message : 'Unknown error'
				);
			}
		}

		// Mark expired alerts as inactive (more efficient with index)
		const now = new Date();
		const expiredResult = await CAPAlert.updateMany(
			{
				isActive: true,
				'info.expires': { $lt: now },
			},
			{ isActive: false }
		);

		res.json({
			success: true,
			message: `Processed alerts: ${totalNewAlerts} new, ${totalUpdatedAlerts} updated, ${expiredResult.modifiedCount} expired from ${sources.length} source(s)`,
			stats: {
				newAlerts: totalNewAlerts,
				updatedAlerts: totalUpdatedAlerts,
				expiredAlerts: expiredResult.modifiedCount,
				totalProcessed: allSavedAlerts.length,
			},
			sources: sources.map(s => ({
				id: s._id,
				name: s.name,
				successRate: (s.getSuccessRate() * 100).toFixed(1) + '%',
			})),
		});
	} catch (error) {
		console.error('Error fetching CAP alerts:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch CAP alerts',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-alerts/active
 * @desc    Get all active alerts
 * @access  Public
 */
router.get('/active', async (req: Request, res: Response) => {
	try {
		const alerts = await CAPAlert.findActiveAlerts();

		res.json({
			success: true,
			count: alerts.length,
			alerts,
		});
	} catch (error) {
		console.error('Error fetching active alerts:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch active alerts',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-alerts/:id
 * @desc    Get specific alert by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const alert = await CAPAlert.findById(req.params.id);

		if (!alert) {
			return res.status(404).json({
				success: false,
				message: 'Alert not found',
			});
		}

		res.json({
			success: true,
			alert,
		});
	} catch (error) {
		console.error('Error fetching alert:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch alert',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-alerts/area/:lat/:lng
 * @desc    Get alerts for a specific location
 * @access  Public
 */
router.get('/area/:lat/:lng', async (req: Request, res: Response) => {
	try {
		const lat = parseFloat(req.params.lat);
		const lng = parseFloat(req.params.lng);

		if (isNaN(lat) || isNaN(lng)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid coordinates',
			});
		}

		const alerts = await CAPAlert.findAlertsInArea([lng, lat]);

		res.json({
			success: true,
			count: alerts.length,
			alerts,
		});
	} catch (error) {
		console.error('Error fetching alerts by area:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch alerts by area',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-alerts/severity/:level
 * @desc    Get alerts by severity level
 * @access  Public
 */
router.get('/severity/:level', async (req: Request, res: Response) => {
	try {
		const severity = req.params.level;
		const validSeverities = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];

		if (!validSeverities.includes(severity)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid severity level',
				validSeverities,
			});
		}

		const alerts = await CAPAlert.find({
			isActive: true,
			'info.severity': severity,
		}).sort({ sent: -1 });

		res.json({
			success: true,
			count: alerts.length,
			alerts,
		});
	} catch (error) {
		console.error('Error fetching alerts by severity:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch alerts by severity',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   POST /api/cap-alerts/refresh
 * @desc    Manually refresh alerts from active sources
 * @access  Private (should be protected in production)
 */
router.post('/refresh', async (req: Request, res: Response) => {
	try {
		// In production, this should be protected by authentication
		// For now, we'll proceed with the refresh

		const sourceId = req.body.sourceId;
		let sources: any[] = [];

		if (sourceId) {
			const source = await CAPSource.findById(sourceId);
			if (source && source.isActive) {
				sources = [source];
			}
		} else {
			sources = await CAPSource.getActiveSources();
		}

		let totalAlerts = 0;
		let newCount = 0;
		let updatedCount = 0;

		for (const source of sources) {
			try {
				const alerts = await capParser.fetchAlertsFromSource(source);
				totalAlerts += alerts.length;

				for (const alert of alerts) {
					try {
						const existingAlert = await CAPAlert.findOne({
							identifier: alert.identifier,
							sourceId: source._id,
						});

						if (!existingAlert) {
							// Clean alert data to prevent MongoDB error 16755
							const cleanedAlert = cleanAlertData(alert);
							
							const newAlert = new CAPAlert({
								...cleanedAlert,
								sourceId: source._id,
								fetchedAt: new Date(),
								isActive: capParser.isAlertActive(alert)
							});
							await newAlert.convertToGeoJSON();
							await newAlert.save();
							newCount++;

							// Emit new alert
							io.emit('cap-alert-new', newAlert);
						} else {
							// Clean alert data to prevent MongoDB error 16755
							const cleanedAlert = cleanAlertData(alert);
							
							existingAlert.set(cleanedAlert);
							existingAlert.fetchedAt = new Date();
							existingAlert.isActive = capParser.isAlertActive(alert);
							await existingAlert.convertToGeoJSON();
							await existingAlert.save();
							updatedCount++;

							// Emit updated alert
							io.emit('cap-alert-update', existingAlert);
						}
					} catch (error) {
						console.error(`Error processing alert ${alert.identifier}:`, error);
					}
				}

				// Update last fetched time
				source.lastFetched = new Date();
				await source.save();
			} catch (error) {
				console.error(`Error refreshing from source ${source.name}:`, error);
			}
		}

		res.json({
			success: true,
			message: 'Alerts refreshed successfully',
			stats: {
				sources: sources.length,
				total: totalAlerts,
				new: newCount,
				updated: updatedCount,
			},
		});
	} catch (error) {
		console.error('Error refreshing alerts:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to refresh alerts',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-alerts/stats
 * @desc    Get alert statistics
 * @access  Public
 */
router.get('/stats', async (req: Request, res: Response) => {
	try {
		const activeAlerts = await CAPAlert.countDocuments({ isActive: true });
		const totalAlerts = await CAPAlert.countDocuments();

		const severityStats = await CAPAlert.aggregate([
			{ $match: { isActive: true } },
			{ $unwind: '$info' },
			{ $group: { _id: '$info.severity', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]);

		const categoryStats = await CAPAlert.aggregate([
			{ $match: { isActive: true } },
			{ $unwind: '$info' },
			{ $unwind: '$info.category' },
			{ $group: { _id: '$info.category', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]);

		// Include parser statistics
		const parserStats = capParser.getStatistics();

		res.json({
			success: true,
			stats: {
				total: totalAlerts,
				active: activeAlerts,
				severity: severityStats,
				category: categoryStats,
				parser: parserStats,
			},
		});
	} catch (error) {
		console.error('Error fetching alert stats:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch alert statistics',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export default router;
