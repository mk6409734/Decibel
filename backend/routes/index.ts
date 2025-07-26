import express from 'express';
import sirenRoutes from './api/siren';
import districtRoutes from './api/district';
import capAlertRoutes from './api/capAlerts';
import capSourceRoutes from './api/capSources';

const router = express.Router();

router.use('/api/sirens', sirenRoutes);
router.use('/api/districts', districtRoutes);
router.use('/api/cap-alerts', capAlertRoutes);
router.use('/api/cap-sources', capSourceRoutes);

export default router;
