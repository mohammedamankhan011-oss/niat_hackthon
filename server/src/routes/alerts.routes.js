import { Router } from 'express';
import { list, markRead } from '../controllers/alerts.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../schemas/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.patch('/:id/read', validate({ params: idParams }), markRead);

export default router;
