import express from 'express';
import userAuth, { requireAdmin, checkDistrictAccess } from '../../middleware/userAuth';
import District from '../../models/District';
import Site from '../../models/Site';
import { ErrorCode, errorWrapper } from '../../utils/consts';

const router = express.Router();

// @route   GET api/district
// @desc    Get all districts (filtered by user access)
// @access  Private
router.get('/', userAuth, async (req: any, res: any) => {
	try {
		let districts;
		
		// Admins can see all districts
		if (req.user.userType === 'admin') {
			districts = await District.find().populate('sites');
		} else {
			// Managers and operators can only see their assigned districts
			const user = await require('../../models/User').findById(req.user.id).populate('assignedDistricts');
			districts = user.assignedDistricts;
		}
		
		res.json(districts);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   POST api/district
// @desc    Create a new district (admin only)
// @access  Private (Admin)
router.post('/', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const { id, name, blocks } = req.body;

		// Check if district with this ID already exists
		const existingDistrict = await District.findOne({ id });
		if (existingDistrict) {
			return res
				.status(ErrorCode.HTTP_BAD_REQUEST)
				.json(errorWrapper('District with this ID already exists'));
		}

		const newDistrict = new District({
			id,
			name,
			blocks: blocks || [],
			createdBy: req.user.id,
		});

		const district = await newDistrict.save();
		res.json(district);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   PUT api/district/:id
// @desc    Update a district (admin only)
// @access  Private (Admin)
router.put('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const { name, blocks } = req.body;
		const districtId = req.params.id;

		const district = await District.findOne({ id: districtId });
		if (!district) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('District not found'));
		}

		district.name = name || district.name;
		district.blocks = blocks || district.blocks;

		const updatedDistrict = await district.save();
		res.json(updatedDistrict);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   DELETE api/district/:id
// @desc    Delete a district (admin only)
// @access  Private (Admin)
router.delete('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const districtId = req.params.id;

		const district = await District.findOne({ id: districtId });
		if (!district) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('District not found'));
		}

		// Check if district has sites
		const sitesInDistrict = await Site.find({ district: district._id });
		if (sitesInDistrict.length > 0) {
			return res
				.status(ErrorCode.HTTP_BAD_REQUEST)
				.json(errorWrapper('Cannot delete district with existing sites'));
		}

		await district.remove();
		res.json({ msg: 'District removed' });
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   GET api/district/:id/sites
// @desc    Get all sites in a district (with access control)
// @access  Private
router.get('/:id/sites', [userAuth, checkDistrictAccess], async (req: any, res: any) => {
	try {
		const districtId = req.params.id;
		
		const district = await District.findOne({ id: districtId });
		if (!district) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('District not found'));
		}

		const sites = await Site.find({ district: district._id });
		res.json(sites);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

export default router;
