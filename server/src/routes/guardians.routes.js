import { Router } from 'express';
import { accept, invite, list, remove } from '../controllers/guardians.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams, inviteGuardianBody } from '../schemas/index.js';

const router = Router();

router.use(requireAuth);

router.post('/invite', validate({ body: inviteGuardianBody }), invite);
router.get('/', list);
router.post('/:id/accept', validate({ params: idParams }), accept);
router.delete('/:id', validate({ params: idParams }), remove);

export default router;
