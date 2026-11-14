import { Router } from 'express';
import { analyze, save } from '../controllers/calls.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { liveCallLimiter, scanLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { analyzeCallBody, saveCallBody } from '../schemas/index.js';

const router = Router();

router.use(requireAuth);

router.post('/analyze', liveCallLimiter, validate({ body: analyzeCallBody }), analyze);
// Saving a call runs a full AI scan, so it shares the scan budget.
router.post('/', scanLimiter, validate({ body: saveCallBody }), save);

export default router;
