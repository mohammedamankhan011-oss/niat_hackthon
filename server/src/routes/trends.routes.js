import { Router } from 'express';
import { trends } from '../controllers/trends.controller.js';

const router = Router();

router.get('/', trends);

export default router;
