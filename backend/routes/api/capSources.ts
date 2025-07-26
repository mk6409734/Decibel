import express, { Request, Response } from 'express';
import CAPSource from '../../models/CAPSource';
import { io } from '../../sockets/socketManager';

const router = express.Router();

/**
 * @route   GET /api/cap-sources
 * @desc    Get all CAP sources
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
	try {
		const sources = await CAPSource.find().sort({ country: 1, name: 1 });

		res.json({
			success: true,
			count: sources.length,
			sources,
		});
	} catch (error) {
		console.error('Error fetching CAP sources:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch CAP sources',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-sources/active
 * @desc    Get all active CAP sources
 * @access  Public
 */
router.get('/active', async (req: Request, res: Response) => {
	try {
		const sources = await CAPSource.getActiveSources();

		res.json({
			success: true,
			count: sources.length,
			sources,
		});
	} catch (error) {
		console.error('Error fetching active CAP sources:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch active CAP sources',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-sources/default
 * @desc    Get the default CAP source
 * @access  Public
 */
router.get('/default', async (req: Request, res: Response) => {
	try {
		const source = await CAPSource.getDefaultSource();

		if (!source) {
			return res.status(404).json({
				success: false,
				message: 'No default source configured',
			});
		}

		res.json({
			success: true,
			source,
		});
	} catch (error) {
		console.error('Error fetching default CAP source:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch default CAP source',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   GET /api/cap-sources/:id
 * @desc    Get specific CAP source by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const source = await CAPSource.findById(req.params.id);

		if (!source) {
			return res.status(404).json({
				success: false,
				message: 'Source not found',
			});
		}

		res.json({
			success: true,
			source,
		});
	} catch (error) {
		console.error('Error fetching CAP source:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch CAP source',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   POST /api/cap-sources
 * @desc    Create a new CAP source
 * @access  Private (should be protected in production)
 */
router.post('/', async (req: Request, res: Response) => {
	try {
		const {
			name,
			url,
			country,
			language,
			isActive,
			isDefault,
			fetchInterval,
			description,
			metadata,
		} = req.body;

		// Validate required fields
		if (!name || !url || !country) {
			return res.status(400).json({
				success: false,
				message: 'Name, URL, and country are required',
			});
		}

		// Check if source with same name already exists
		const existingSource = await CAPSource.findOne({ name });
		if (existingSource) {
			return res.status(400).json({
				success: false,
				message: 'Source with this name already exists',
			});
		}

		const newSource = new CAPSource({
			name,
			url,
			country,
			language: language || 'en',
			isActive: isActive !== undefined ? isActive : true,
			isDefault: isDefault || false,
			fetchInterval: fetchInterval || 3,
			description,
			metadata,
		});

		await newSource.save();

		// Emit new source via WebSocket
		io.emit('cap-source-new', newSource);

		res.status(201).json({
			success: true,
			message: 'CAP source created successfully',
			source: newSource,
		});
	} catch (error) {
		console.error('Error creating CAP source:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to create CAP source',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   PUT /api/cap-sources/:id
 * @desc    Update a CAP source
 * @access  Private (should be protected in production)
 */
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const source = await CAPSource.findById(req.params.id);

		if (!source) {
			return res.status(404).json({
				success: false,
				message: 'Source not found',
			});
		}

		// Update fields if provided
		const updateFields = [
			'name',
			'url',
			'country',
			'language',
			'isActive',
			'isDefault',
			'fetchInterval',
			'description',
			'metadata',
		];
		updateFields.forEach(field => {
			if (req.body[field] !== undefined) {
				(source as any)[field] = req.body[field];
			}
		});

		await source.save();

		// Emit updated source via WebSocket
		io.emit('cap-source-update', source);

		res.json({
			success: true,
			message: 'CAP source updated successfully',
			source,
		});
	} catch (error) {
		console.error('Error updating CAP source:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update CAP source',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   DELETE /api/cap-sources/:id
 * @desc    Delete a CAP source
 * @access  Private (should be protected in production)
 */
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const source = await CAPSource.findById(req.params.id);

		if (!source) {
			return res.status(404).json({
				success: false,
				message: 'Source not found',
			});
		}

		// Prevent deletion of default source if it's the only one
		if (source.isDefault) {
			const otherSources = await CAPSource.countDocuments({ _id: { $ne: source._id } });
			if (otherSources === 0) {
				return res.status(400).json({
					success: false,
					message: 'Cannot delete the only default source',
				});
			}
		}

		await source.deleteOne();

		// Emit deleted source via WebSocket
		io.emit('cap-source-delete', { id: req.params.id });

		res.json({
			success: true,
			message: 'CAP source deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting CAP source:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to delete CAP source',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * @route   POST /api/cap-sources/seed
 * @desc    Seed default CAP sources (including NDMA India)
 * @access  Private (should be protected in production)
 */
router.post('/seed', async (req: Request, res: Response) => {
	try {
		// Check if sources already exist
		const existingCount = await CAPSource.countDocuments();
		if (existingCount > 0) {
			return res.status(400).json({
				success: false,
				message: 'CAP sources already exist. Delete existing sources before seeding.',
			});
		}

		// Default sources
		const defaultSources = [
			{
				name: 'NDMA India',
				url: 'https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml',
				country: 'India',
				language: 'en',
				isActive: true,
				isDefault: true,
				fetchInterval: 3,
				description:
					'National Disaster Management Authority of India - Official CAP alerts for disasters and emergencies across India',
				metadata: {
					provider: 'National Disaster Management Authority',
					documentation: 'https://sachet.ndma.gov.in/',
					contactEmail: 'support@ndma.gov.in',
				},
			},
		];

		const createdSources = await CAPSource.insertMany(defaultSources);

		res.json({
			success: true,
			message: 'Default CAP sources seeded successfully',
			count: createdSources.length,
			sources: createdSources,
		});
	} catch (error) {
		console.error('Error seeding CAP sources:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to seed CAP sources',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export default router;
