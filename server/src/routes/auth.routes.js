import { Router } from 'express';
import { login, me, signup } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginBody, signupBody } from '../schemas/index.js';

const router = Router();

router.post('/signup', authLimiter, validate({ body: signupBody }), signup);
router.post('/login', authLimiter, validate({ body: loginBody }), login);
router.get('/me', requireAuth, me);

export default router;
