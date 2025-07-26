import CAPSource from '../models/CAPSource';
import CAPAlert from '../models/CAPAlert';
import capParser from './capParser';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { cleanAlertData } from '../utils/cleanAlertData';

interface SchedulerStats {
	totalFetches: number;
	successfulFetches: number;
	failedFetches: number;
	newAlerts: number;
	updatedAlerts: number;
	expiredAlerts: number;
	cleanedUpAlerts: number;
}

class CAPSchedulerService {
	private intervals: Map<string, NodeJS.Timeout> = new Map();
	private isRunning: boolean = false;
	private io: Server | null = null;
	private stats: SchedulerStats = {
		totalFetches: 0,
		successfulFetches: 0,
		failedFetches: 0,
		newAlerts: 0,
		updatedAlerts: 0,
		expiredAlerts: 0,
		cleanedUpAlerts: 0,
	};
	private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
	private readonly OLD_ALERT_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days
	private readonly BATCH_SIZE = 50; // Process alerts in batches
	private cleanupTimer: NodeJS.Timeout | null = null;

	/**
	 * Set the Socket.IO instance
	 */
	setSocketIO(io: Server) {
		this.io = io;
	}

	/**
	 * Start the scheduler
	 */
	async start() {
		if (this.isRunning) {
			console.log('CAP Scheduler already running');
			return;
		}

		console.log('Starting CAP Scheduler...');
		this.isRunning = true;

		// Fetch active sources and set up intervals
		const sources = await CAPSource.getActiveSources();

		for (const source of sources) {
			this.scheduleSourceFetching(source);
		}

		// Start cleanup timer
		this.startCleanupTimer();

		console.log(`CAP Scheduler started with ${sources.length} active sources`);
	}

	/**
	 * Stop the scheduler
	 */
	stop() {
		console.log('Stopping CAP Scheduler...');

		// Clear all intervals
		for (const [sourceId, interval] of this.intervals) {
			clearInterval(interval);
		}

		// Clear cleanup timer
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}

		this.intervals.clear();
		this.isRunning = false;

		console.log('CAP Scheduler stopped');
	}

	/**
	 * Start the cleanup timer for old alerts
	 */
	private startCleanupTimer() {
		// Initial cleanup
		this.cleanupOldAlerts();

		// Set up periodic cleanup
		this.cleanupTimer = setInterval(() => {
			this.cleanupOldAlerts();
		}, this.CLEANUP_INTERVAL);

		console.log(
			`Cleanup timer started - will run every ${this.CLEANUP_INTERVAL / (60 * 60 * 1000)} hours`
		);
	}

	/**
	 * Clean up old alerts to prevent database bloat
	 */
	private async cleanupOldAlerts() {
		try {
			const cutoffDate = new Date(Date.now() - this.OLD_ALERT_THRESHOLD);

			// Remove very old alerts that are expired and inactive
			const deletedResult = await CAPAlert.deleteMany({
				isActive: false,
				'info.expires': { $lt: cutoffDate },
				fetchedAt: { $lt: cutoffDate },
			});

			if (deletedResult.deletedCount > 0) {
				this.stats.cleanedUpAlerts += deletedResult.deletedCount;
				console.log(`Cleaned up ${deletedResult.deletedCount} old alerts`);
			}

			// Also mark any alerts that should be expired but aren't marked as such
			const now = new Date();
			const expiredResult = await CAPAlert.updateMany(
				{
					isActive: true,
					'info.expires': { $lt: now },
				},
				{ isActive: false }
			);

			if (expiredResult.modifiedCount > 0) {
				this.stats.expiredAlerts += expiredResult.modifiedCount;
				console.log(`Marked ${expiredResult.modifiedCount} alerts as expired during cleanup`);
			}
		} catch (error) {
			console.error('Error during cleanup:', error);
		}
	}

	/**
	 * Schedule fetching for a specific source
	 */
	private scheduleSourceFetching(source: any) {
		// Clear existing interval if any
		if (this.intervals.has(source._id.toString())) {
			clearInterval(this.intervals.get(source._id.toString())!);
		}

		// Initial fetch
		this.fetchAlertsFromSource(source);

		// Set up interval
		const intervalMs = source.fetchInterval * 1000; // Convert seconds to milliseconds
		const interval = setInterval(() => {
			this.fetchAlertsFromSource(source);
		}, intervalMs);

		this.intervals.set(source._id.toString(), interval);

		console.log(`Scheduled fetching for ${source.name} every ${source.fetchInterval} seconds`);
	}

	/**
	 * Get existing alert identifiers for a source to enable incremental processing
	 */
	private async getExistingAlertIdentifiers(sourceId: string): Promise<Set<string>> {
		try {
			const existingAlerts = await CAPAlert.find(
				{ sourceId: new mongoose.Types.ObjectId(sourceId) },
				{ identifier: 1 }
			).lean();

			return new Set(existingAlerts.map(alert => alert.identifier));
		} catch (error) {
			console.error(`Error fetching existing identifiers for source ${sourceId}:`, error);
			return new Set();
		}
	}

	/**
	 * Process alerts in batches to reduce memory usage and database load
	 */
	private async processAlertsBatch(
		alerts: any[],
		sourceId: string,
		existingIdentifiers: Set<string>
	) {
		const batch = [];
		let newCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const alert of alerts) {
			try {
				// Skip if we've already processed this alert recently (unless it's been updated)
				if (existingIdentifiers.has(alert.identifier)) {
					// Check if alert needs updating (compare dates or other fields)
					const existingAlert = await CAPAlert.findOne({
						identifier: alert.identifier,
						sourceId: new mongoose.Types.ObjectId(sourceId),
					}).lean();

					if (
						existingAlert &&
						existingAlert.sent.getTime() === alert.sent.getTime() &&
						existingAlert.isActive === capParser.isAlertActive(alert)
					) {
						skippedCount++;
						continue; // Skip processing if nothing changed
					}
				}

				batch.push(alert);

				// Process batch when it reaches the batch size
				if (batch.length >= this.BATCH_SIZE) {
					const batchResults = await this.processBatch(batch, sourceId, existingIdentifiers);
					newCount += batchResults.newCount;
					updatedCount += batchResults.updatedCount;
					errorCount += batchResults.errorCount;
					batch.length = 0; // Clear batch
				}
			} catch (error) {
				errorCount++;
				console.error(`Error processing alert ${alert.identifier}:`, error);
			}
		}

		// Process remaining alerts in the batch
		if (batch.length > 0) {
			const batchResults = await this.processBatch(batch, sourceId, existingIdentifiers);
			newCount += batchResults.newCount;
			updatedCount += batchResults.updatedCount;
			errorCount += batchResults.errorCount;
		}

		return { newCount, updatedCount, skippedCount, errorCount };
	}

	/**
	 * Process a batch of alerts efficiently
	 */
	private async processBatch(alerts: any[], sourceId: string, existingIdentifiers: Set<string>) {
		let newCount = 0;
		let updatedCount = 0;
		let errorCount = 0;

		// Use bulk operations for efficiency
		const bulkOps = [];
		const newAlerts = [];

		for (const alert of alerts) {
			try {
				const alertIsActive = capParser.isAlertActive(alert);

				if (existingIdentifiers.has(alert.identifier)) {
					// Update existing alert
					// Clean alert data to prevent MongoDB error 16755
					const cleanedAlert = cleanAlertData(alert);

					bulkOps.push({
						updateOne: {
							filter: {
								identifier: alert.identifier,
								sourceId: new mongoose.Types.ObjectId(sourceId),
							},
							update: {
								...cleanedAlert,
								fetchedAt: new Date(),
								isActive: alertIsActive,
							},
						},
					});
					updatedCount++;
				} else {
					// Prepare new alert - clean data to prevent MongoDB error 16755
					const cleanedAlert = cleanAlertData(alert);

					const newAlert = {
						...cleanedAlert,
						sourceId: new mongoose.Types.ObjectId(sourceId),
						fetchedAt: new Date(),
						isActive: alertIsActive,
					};
					newAlerts.push(newAlert);
					newCount++;
				}
			} catch (error) {
				errorCount++;
				console.error(`Error preparing alert ${alert.identifier}:`, error);
			}
		}

		// Execute bulk operations
		try {
			if (bulkOps.length > 0) {
				await CAPAlert.bulkWrite(bulkOps);
			}

			if (newAlerts.length > 0) {
				const createdAlerts = await CAPAlert.insertMany(newAlerts, { ordered: false });

				// Convert polygon/circle to GeoJSON for new alerts
				for (const alert of createdAlerts) {
					try {
						alert.convertToGeoJSON();
						await alert.save();

						// Emit new alert via WebSocket
						if (this.io) {
							this.io.emit('cap-alert-new', alert);
						}
					} catch (geoError: any) {
						console.error(`Error converting GeoJSON for alert ${alert.identifier}:`, geoError);
						
						// If it's a MongoDB geospatial error, log more details
						if (geoError.code === 16755) {
							console.error(`MongoDB geospatial error 16755 for alert ${alert.identifier} - invalid polygon geometry`);
							console.error('Alert data:', JSON.stringify(alert.info?.map(i => i.area), null, 2));
						}
						
						// Continue processing other alerts even if this one fails
						continue;
					}
				}
			}
		} catch (bulkError: any) {
			console.error('Error executing bulk operations:', bulkError);
			// Log specific error details to help diagnose issues
			if (bulkError.code === 16755) {
				console.error('MongoDB geospatial index error (16755) - invalid polygon geometry detected');
				console.error('This indicates self-intersecting polygons or invalid coordinates');
				console.error('Check the polygon validation logic in convertToGeoJSON method');
			}
			errorCount += alerts.length;
		}

		return { newCount, updatedCount, errorCount };
	}

	/**
	 * Fetch alerts from a specific source with optimized processing
	 */
	private async fetchAlertsFromSource(source: any) {
		let currentSource: any;
		this.stats.totalFetches++;

		try {
			// Check if source needs fetching
			currentSource = await CAPSource.findById(source._id);
			if (!currentSource || !currentSource.isActive) {
				// Source was deactivated, remove its interval
				this.removeSourceInterval(source._id.toString());
				return;
			}

			// Check if source actually needs fetching (respects intervals)
			if (!currentSource.needsFetching()) {
				console.log(`Skipping ${source.name} - not due for fetching yet`);
				return;
			}

			console.log(`Fetching alerts from ${source.name}...`);
		} catch (dbError) {
			console.error(`Database error checking source ${source.name}:`, dbError);
			this.stats.failedFetches++;
			return;
		}

		let alerts: any[] = [];
		let fetchSuccessful = false;
		let fetchError: string | undefined;

		try {
			alerts = await capParser.fetchAlertsFromSource(source);
			fetchSuccessful = true;
			this.stats.successfulFetches++;
		} catch (error) {
			fetchError = error instanceof Error ? error.message : 'Unknown error';
			console.error(`Failed to fetch alerts from ${source.name}:`, fetchError);
			this.stats.failedFetches++;
			// Continue with empty alerts array to at least update the source status
		}

		// Get existing identifiers for incremental processing
		const existingIdentifiers = await this.getExistingAlertIdentifiers(source._id.toString());

		// Process alerts in batches
		const results = await this.processAlertsBatch(
			alerts,
			source._id.toString(),
			existingIdentifiers
		);

		// Update statistics
		this.stats.newAlerts += results.newCount;
		this.stats.updatedAlerts += results.updatedCount;

		try {
			// Record the fetch attempt with analytics
			if (currentSource) {
				await currentSource.recordFetchAttempt(fetchSuccessful, fetchError);
			}

			// Mark expired alerts as inactive (more efficient query)
			const now = new Date();
			const expiredAlerts = await CAPAlert.updateMany(
				{
					sourceId: source._id,
					isActive: true,
					'info.expires': { $lt: now },
				},
				{ isActive: false }
			);

			if (expiredAlerts.modifiedCount > 0) {
				this.stats.expiredAlerts += expiredAlerts.modifiedCount;
				console.log(`Marked ${expiredAlerts.modifiedCount} alerts as expired for ${source.name}`);
			}
		} catch (updateError) {
			console.error(`Error updating source status for ${source.name}:`, updateError);
		}

		// Log summary with source analytics
		if (fetchSuccessful) {
			const successRate = currentSource ? (currentSource.getSuccessRate() * 100).toFixed(1) : 'N/A';
			console.log(
				`${source.name}: ${results.newCount} new, ${results.updatedCount} updated, ${results.skippedCount} skipped, ${results.errorCount} errors (Success rate: ${successRate}%)`
			);
		} else {
			console.log(`${source.name}: Fetch failed, will retry on next interval`);
		}

		// Log statistics periodically
		if (this.stats.totalFetches % 10 === 0) {
			this.logStatistics();
		}
	}

	/**
	 * Add or update a source in the scheduler
	 */
	async updateSource(sourceId: string) {
		const source = await CAPSource.findById(sourceId);

		if (!source) {
			this.removeSourceInterval(sourceId);
			return;
		}

		if (source.isActive) {
			this.scheduleSourceFetching(source);
		} else {
			this.removeSourceInterval(sourceId);
		}
	}

	/**
	 * Remove a source from the scheduler
	 */
	removeSourceInterval(sourceId: string) {
		if (this.intervals.has(sourceId)) {
			clearInterval(this.intervals.get(sourceId)!);
			this.intervals.delete(sourceId);
			console.log(`Removed scheduling for source ${sourceId}`);
		}
	}

	/**
	 * Get scheduler status
	 */
	getStatus() {
		return {
			isRunning: this.isRunning,
			activeSources: Array.from(this.intervals.keys()),
			sourceCount: this.intervals.size,
			stats: this.stats,
		};
	}

	/**
	 * Log comprehensive statistics
	 */
	private logStatistics() {
		console.log('CAP Scheduler Statistics:', {
			totalFetches: this.stats.totalFetches,
			successfulFetches: this.stats.successfulFetches,
			failedFetches: this.stats.failedFetches,
			successRate:
				this.stats.totalFetches > 0
					? ((this.stats.successfulFetches / this.stats.totalFetches) * 100).toFixed(2) + '%'
					: '0%',
			newAlerts: this.stats.newAlerts,
			updatedAlerts: this.stats.updatedAlerts,
			expiredAlerts: this.stats.expiredAlerts,
			cleanedUpAlerts: this.stats.cleanedUpAlerts,
			activeSources: this.intervals.size,
		});
	}
}

export default new CAPSchedulerService();
