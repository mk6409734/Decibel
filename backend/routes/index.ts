import express from 'express';
import sirenRoutes from './api/siren';
import districtRoutes from './api/district';
import siteRoutes from './api/site';
import capAlertRoutes from './api/capAlerts';
import capSourceRoutes from './api/capSources';
import authRoutes from './api/auth';

const router = express.Router();

router.use('/api/sirens', sirenRoutes);
router.use('/api/districts', districtRoutes);
router.use('/api/sites', siteRoutes);
router.use('/api/cap-alerts', capAlertRoutes);
router.use('/api/cap-sources', capSourceRoutes);
router.use('/api/auth', authRoutes);

export default router;
