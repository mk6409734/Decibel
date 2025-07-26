import express from 'express';
import District from '../../models/District';
import Siren from '../../models/Siren';

const router = express.Router();

router.get('/all', async (req, res) => {
	try {
		const districts = await District.find();
		res.json(districts);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const district = await District.findById(req.params.id);
		if (!district) {
			return res.status(404).json({ message: 'District not found' });
		}
		res.json(district);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.post('/create', async (req, res) => {
	const { id, name, blocks } = req.body;

	const district = new District({
		id,
		name,
		blocks,
	});

	try {
		const newDistrict = await district.save();
		res.status(201).json(newDistrict);
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
});

router.patch('/:id', async (req, res) => {
	const updates = req.body;
	try {
		const updatedDistrict = await District.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		});
		if (!updatedDistrict) {
			return res.status(404).json({ message: 'District not found' });
		}
		res.json(updatedDistrict);
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const deletedDistrict = await District.findByIdAndDelete(req.params.id);
		if (!deletedDistrict) {
			return res.status(404).json({ message: 'District not found' });
		}
		res.json({ message: 'District deleted', district: deletedDistrict });
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.get('/dashboard/data', async (req, res) => {
	try {
		// Get all districts with blocks as string arrays
		const districts = await District.find();

		// Get all sirens to populate the blocks
		const sirens = await Siren.find();

		// Transform the data to match the desired format for dashboard
		const transformedData = districts.map(district => {
			// Create block objects for each district
			const blockObjects = district.blocks.map(blockName => {
				// Find sirens for this block
				const blockSirens = sirens.filter(
					siren => siren.district === district.name && siren.block === blockName
				);

				// Map sirens to the required format
				const formattedSirens = blockSirens.map(siren => ({
					id: siren.id,
					name: siren.name,
					type: siren.type,
					location: siren.district,
					status: siren.status,
					lastChecked: siren.lastChecked,
					latitude: siren.location.lat,
					longitude: siren.location.lng,
				}));

				// Return the formatted block
				return {
					id: `b${blockName.toLowerCase().replace(/[^a-z0-9]/g, '')}`, // Create a block ID
					name: blockName,
					parent_site: blockName,
					sirens: formattedSirens,
				};
			});

			// Return the district with blocks as objects containing sirens
			return {
				id: district.id,
				name: district.name,
				blocks: blockObjects,
			};
		});

		res.json(transformedData);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.post('/add_many', async (req, res) => {
	try {
		// Ensure body is an array
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ message: 'Request body must be an array of districts' });
		}

		const districtsToAdd = req.body;
		const newDistricts = [];
		const errors = [];

		// Process each district in the array
		for (let i = 0; i < districtsToAdd.length; i++) {
			const { id, name, blocks } = districtsToAdd[i];

			// Create new district object
			const district = new District({
				id,
				name,
				blocks,
			});

			// Save each district
			try {
				const savedDistrict = await district.save();
				newDistricts.push(savedDistrict);
			} catch (err: any) {
				// Track errors for individual districts
				errors.push({
					index: i,
					district: districtsToAdd[i],
					error: err.message,
				});
			}
		}

		// Return results
		res.status(201).json({
			message: `Successfully added ${newDistricts.length} districts with ${errors.length} errors`,
			districts: newDistricts,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

export default router;
