import { Router } from 'express';
import { updateMe } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeBody } from '../schemas/index.js';

const router = Router();

router.patch('/me', requireAuth, validate({ body: updateMeBody }), updateMe);

export default router;
