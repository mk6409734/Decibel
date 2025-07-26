import express from 'express';
import Siren from '../../models/Siren';

const router = express.Router();

router.get('/all', async (req, res) => {
	try {
		const sirens = await Siren.find();
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
		}));
		res.json(transformedSirens);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const siren = await Siren.findById(req.params.id);
		if (!siren) {
			return res.status(404).json({ message: 'Siren not found' });
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
		};
		res.json(transformedSiren);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.post('/create', async (req, res) => {
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
	} = req.body;

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
	});

	try {
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
		};
		res.status(201).json(transformedSiren);
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
});

router.patch('/:id', async (req, res) => {
	const updates = req.body;
	try {
		if (updates.location) {
			updates.location = {
				lat: updates.location.latitude,
				lng: updates.location.longitude,
			};
		}
		const updatedSiren = await Siren.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		});
		if (!updatedSiren) {
			return res.status(404).json({ message: 'Siren not found' });
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
		};
		res.json(transformedSiren);
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const deletedSiren = await Siren.findByIdAndDelete(req.params.id);
		if (!deletedSiren) {
			return res.status(404).json({ message: 'Siren not found' });
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
		};
		res.json({ message: 'Siren deleted', siren: transformedSiren });
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
});

router.post('/add_many', async (req, res) => {
	try {
		// Ensure body is an array
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ message: 'Request body must be an array of sirens' });
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
			} = sirensToAdd[i];

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
		res.status(500).json({ message: err.message });
	}
});

export default router;
