import { Router } from 'express';
import { lookup, report } from '../controllers/community.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { lookupLimiter, reportLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { lookupQuery, reportBody } from '../schemas/index.js';

const router = Router();

router.get('/lookup', lookupLimiter, validate({ query: lookupQuery }), lookup);
router.post('/reports', requireAuth, reportLimiter, validate({ body: reportBody }), report);

export default router;
