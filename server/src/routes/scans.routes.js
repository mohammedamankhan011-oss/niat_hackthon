import { Router } from 'express';
import {
  createScan,
  deleteMyScan,
  explainMyScan,
  getMyScan,
  listMyScans,
} from '../controllers/scans.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { explainLimiter, scanLimiter } from '../middleware/rateLimit.js';
import { uploadScanImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createScanBody, explainBody, idParams, listScansQuery } from '../schemas/index.js';

const router = Router();

router.use(requireAuth);

router.post('/', scanLimiter, uploadScanImage, validate({ body: createScanBody }), createScan);
router.get('/', validate({ query: listScansQuery }), listMyScans);
router.get('/:id', validate({ params: idParams }), getMyScan);
router.post('/:id/explain', explainLimiter, validate({ params: idParams, body: explainBody }), explainMyScan);
router.delete('/:id', validate({ params: idParams }), deleteMyScan);

export default router;
