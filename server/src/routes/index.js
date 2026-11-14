import { Router } from 'express';
import alertsRoutes from './alerts.routes.js';
import authRoutes from './auth.routes.js';
import callsRoutes from './calls.routes.js';
import communityRoutes from './community.routes.js';
import guardiansRoutes from './guardians.routes.js';
import scansRoutes from './scans.routes.js';
import trendsRoutes from './trends.routes.js';
import usersRoutes from './users.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/scans', scansRoutes);
router.use('/guardians', guardiansRoutes);
router.use('/alerts', alertsRoutes);
router.use('/trends', trendsRoutes);
router.use('/calls', callsRoutes);
router.use('/', communityRoutes);

export default router;
