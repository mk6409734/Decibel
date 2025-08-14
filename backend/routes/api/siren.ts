import express from 'express';
import userAuth, { requireAdmin, checkSiteAccess } from '../../middleware/userAuth';
import Siren from '../../models/Siren';
import Site from '../../models/Site';
import { ErrorCode, errorWrapper } from '../../utils/consts';

const router = express.Router();

// @route   GET api/siren/all
// @desc    Get all sirens (filtered by user access)
// @access  Private
router.get('/all', userAuth, async (req: any, res: any) => {
	try {
		let sirens;
		
		// Admins can see all sirens
		if (req.user.userType === 'admin') {
			sirens = await Siren.find().populate('site');
		} else {
			// Managers and operators can only see sirens in their assigned districts
			const user = await require('../../models/User').findById(req.user.id).populate('assignedDistricts');
			const districtIds = user.assignedDistricts.map((district: any) => district._id);
			
			// Get sites in assigned districts
			const sites = await Site.find({ district: { $in: districtIds } });
			const siteIds = sites.map((site: any) => site._id);
			
			sirens = await Siren.find({ site: { $in: siteIds } }).populate('site');
		}
		
		const transformedSirens = sirens.map(siren => ({
			id: siren.id,
			name: siren.name,
			type: siren.type,
			location: siren.district, // Using district as location string
			status: siren.status,
			lastChecked: siren.lastChecked,
			latitude: siren.location.lat,
			longitude: siren.location.lng,
			district: siren.district,
			block: siren.block,
			parent_site: siren.parent_site,
			color: siren.color,
			labels: siren.labels,
			site: siren.site,
		}));
		res.json(transformedSirens);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   GET api/siren/:id
// @desc    Get a specific siren (with access control)
// @access  Private
router.get('/:id', [userAuth, checkSiteAccess], async (req: any, res: any) => {
	try {
		const siren = await Siren.findById(req.params.id).populate('site');
		if (!siren) {
			return res.status(ErrorCode.HTTP_NOT_FOUND).json(errorWrapper('Siren not found'));
		}
		const transformedSiren = {
			id: siren.id,
			name: siren.name,
			type: siren.type,
			location: siren.district, // Using district as location string
			status: siren.status,
			lastChecked: siren.lastChecked,
			latitude: siren.location.lat,
			longitude: siren.location.lng,
			district: siren.district,
			block: siren.block,
			parent_site: siren.parent_site,
			color: siren.color,
			labels: siren.labels,
			site: siren.site,
		};
		res.json(transformedSiren);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   POST api/siren/create
// @desc    Create a new siren (admin only)
// @access  Private (Admin)
router.post('/create', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const {
			id,
			name,
			location,
			type,
			status,
			lastChecked,
			district,
			block,
			parent_site,
			color,
			labels,
			siteId,
		} = req.body;

		// Verify site exists
		const site = await Site.findById(siteId);
		if (!site) {
			return res.status(ErrorCode.HTTP_NOT_FOUND).json(errorWrapper('Site not found'));
		}

		const siren = new Siren({
			id,
			name,
			location: {
				lat: location.latitude,
				lng: location.longitude,
			},
			type,
			status,
			lastChecked,
			district,
			block,
			parent_site,
			color,
			labels,
			playing: false,
			site: siteId,
		});

		const newSiren = await siren.save();
		const transformedSiren = {
			id: newSiren.id,
			name: newSiren.name,
			type: newSiren.type,
			location: newSiren.district,
			status: newSiren.status,
			lastChecked: newSiren.lastChecked,
			latitude: newSiren.location.lat,
			longitude: newSiren.location.lng,
			district: newSiren.district,
			block: newSiren.block,
			parent_site: newSiren.parent_site,
			color: newSiren.color,
			labels: newSiren.labels,
			site: newSiren.site,
		};
		res.status(201).json(transformedSiren);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   PATCH api/siren/:id
// @desc    Update a siren (admin only)
// @access  Private (Admin)
router.patch('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const updates = req.body;
		if (updates.location) {
			updates.location = {
				lat: updates.location.latitude,
				lng: updates.location.longitude,
			};
		}
		const updatedSiren = await Siren.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		}).populate('site');
		if (!updatedSiren) {
			return res.status(ErrorCode.HTTP_NOT_FOUND).json(errorWrapper('Siren not found'));
		}
		const transformedSiren = {
			id: updatedSiren.id,
			name: updatedSiren.name,
			type: updatedSiren.type,
			location: updatedSiren.district,
			status: updatedSiren.status,
			lastChecked: updatedSiren.lastChecked,
			latitude: updatedSiren.location.lat,
			longitude: updatedSiren.location.lng,
			district: updatedSiren.district,
			block: updatedSiren.block,
			parent_site: updatedSiren.parent_site,
			color: updatedSiren.color,
			labels: updatedSiren.labels,
			site: updatedSiren.site,
		};
		res.json(transformedSiren);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   DELETE api/siren/:id
// @desc    Delete a siren (admin only)
// @access  Private (Admin)
router.delete('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const deletedSiren = await Siren.findByIdAndDelete(req.params.id);
		if (!deletedSiren) {
			return res.status(ErrorCode.HTTP_NOT_FOUND).json(errorWrapper('Siren not found'));
		}
		const transformedSiren = {
			id: deletedSiren.id,
			name: deletedSiren.name,
			type: deletedSiren.type,
			location: deletedSiren.district,
			status: deletedSiren.status,
			lastChecked: deletedSiren.lastChecked,
			latitude: deletedSiren.location.lat,
			longitude: deletedSiren.location.lng,
			district: deletedSiren.district,
			block: deletedSiren.block,
			parent_site: deletedSiren.parent_site,
			color: deletedSiren.color,
			labels: deletedSiren.labels,
			site: deletedSiren.site,
		};
		res.json({ message: 'Siren deleted', siren: transformedSiren });
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   POST api/siren/add_many
// @desc    Add multiple sirens (admin only)
// @access  Private (Admin)
router.post('/add_many', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		// Ensure body is an array
		if (!Array.isArray(req.body)) {
			return res.status(ErrorCode.HTTP_BAD_REQUEST).json(errorWrapper('Request body must be an array of sirens'));
		}

		const sirensToAdd = req.body;
		const newSirens = [];
		const errors = [];

		// Process each siren in the array
		for (let i = 0; i < sirensToAdd.length; i++) {
			const {
				id,
				name,
				location,
				type,
				status,
				lastChecked,
				district,
				block,
				parent_site,
				color,
				labels,
				siteId,
			} = sirensToAdd[i];

			// Verify site exists
			const site = await Site.findById(siteId);
			if (!site) {
				errors.push({
					index: i,
					siren: sirensToAdd[i],
					error: 'Site not found',
				});
				continue;
			}

			// Create new siren object
			const siren = new Siren({
				id,
				name,
				location: {
					lat: location.latitude,
					lng: location.longitude,
				},
				type,
				status,
				lastChecked,
				district,
				block,
				parent_site,
				color,
				labels,
				playing: false,
				site: siteId,
			});

			// Save and transform each siren
			try {
				const savedSiren = await siren.save();
				newSirens.push({
					id: savedSiren.id,
					name: savedSiren.name,
					type: savedSiren.type,
					location: savedSiren.district,
					status: savedSiren.status,
					lastChecked: savedSiren.lastChecked,
					latitude: savedSiren.location.lat,
					longitude: savedSiren.location.lng,
					district: savedSiren.district,
					block: savedSiren.block,
					parent_site: savedSiren.parent_site,
					color: savedSiren.color,
					labels: savedSiren.labels,
					site: savedSiren.site,
				});
			} catch (err: any) {
				// Track errors for individual sirens
				errors.push({
					index: i,
					siren: sirensToAdd[i],
					error: err.message,
				});
			}
		}

		// Return results
		res.status(201).json({
			message: `Successfully added ${newSirens.length} sirens with ${errors.length} errors`,
			sirens: newSirens,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

export default router;
