import express from 'express';
import userAuth, { requireAdmin, checkDistrictAccess, checkSiteAccess } from '../../middleware/userAuth';
import Site from '../../models/Site';
import District from '../../models/District';
import { ErrorCode, errorWrapper } from '../../utils/consts';

const router = express.Router();

// @route   GET api/site
// @desc    Get all sites (filtered by user access)
// @access  Private
router.get('/', userAuth, async (req: any, res: any) => {
	try {
		let sites;
		
		// Admins can see all sites
		if (req.user.userType === 'admin') {
			sites = await Site.find().populate('district');
		} else {
			// Managers and operators can only see sites in their assigned districts
			const user = await require('../../models/User').findById(req.user.id).populate('assignedDistricts');
			const districtIds = user.assignedDistricts.map((district: any) => district._id);
			sites = await Site.find({ district: { $in: districtIds } }).populate('district');
		}
		
		res.json(sites);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   POST api/site
// @desc    Create a new site (admin only)
// @access  Private (Admin)
router.post('/', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const { id, name, location, districtId, block, description } = req.body;

		// Check if site with this ID already exists
		const existingSite = await Site.findOne({ id });
		if (existingSite) {
			return res
				.status(ErrorCode.HTTP_BAD_REQUEST)
				.json(errorWrapper('Site with this ID already exists'));
		}

		// Verify district exists
		const district = await District.findOne({ id: districtId });
		if (!district) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('District not found'));
		}

		const newSite = new Site({
			id,
			name,
			location,
			district: district._id,
			block,
			description,
			createdBy: req.user.id,
		});

		const site = await newSite.save();
		
		// Add site to district's sites array
		district.sites.push(site._id);
		await district.save();
		
		res.json(site);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   PUT api/site/:id
// @desc    Update a site (admin only)
// @access  Private (Admin)
router.put('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const { name, location, block, description, status } = req.body;
		const siteId = req.params.id;

		const site = await Site.findOne({ id: siteId });
		if (!site) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('Site not found'));
		}

		site.name = name || site.name;
		site.location = location || site.location;
		site.block = block || site.block;
		site.description = description || site.description;
		site.status = status || site.status;

		const updatedSite = await site.save();
		res.json(updatedSite);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   DELETE api/site/:id
// @desc    Delete a site (admin only)
// @access  Private (Admin)
router.delete('/:id', [userAuth, requireAdmin], async (req: any, res: any) => {
	try {
		const siteId = req.params.id;

		const site = await Site.findOne({ id: siteId });
		if (!site) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('Site not found'));
		}

		// Check if site has sirens
		const Siren = require('../../models/Siren');
		const sirensInSite = await Siren.find({ site: site._id });
		if (sirensInSite.length > 0) {
			return res
				.status(ErrorCode.HTTP_BAD_REQUEST)
				.json(errorWrapper('Cannot delete site with existing sirens'));
		}

		// Remove site from district's sites array
		const district = await District.findById(site.district);
		if (district) {
			district.sites = district.sites.filter((siteRef: any) => siteRef.toString() !== site._id.toString());
			await district.save();
		}

		await site.remove();
		res.json({ msg: 'Site removed' });
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route   GET api/site/:id
// @desc    Get a specific site (with access control)
// @access  Private
router.get('/:id', [userAuth, checkSiteAccess], async (req: any, res: any) => {
	try {
		const siteId = req.params.id;
		
		const site = await Site.findOne({ id: siteId }).populate('district');
		if (!site) {
			return res
				.status(ErrorCode.HTTP_NOT_FOUND)
				.json(errorWrapper('Site not found'));
		}

		res.json(site);
	} catch (err: any) {
		console.error(err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

export default router;
