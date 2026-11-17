import { Router } from 'express';
import { analyze, save, transcribe, analyzeAudio } from '../controllers/calls.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { liveCallLimiter, scanLimiter, transcribeLimiter } from '../middleware/rateLimit.js';
import { uploadAudioChunk, uploadCallAudio } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { analyzeCallBody, saveCallBody } from '../schemas/index.js';

const router = Router();

router.use(requireAuth);

router.post('/transcribe', transcribeLimiter, uploadAudioChunk, transcribe);
router.post('/analyze-audio', scanLimiter, uploadCallAudio, analyzeAudio);
router.post('/analyze', liveCallLimiter, validate({ body: analyzeCallBody }), analyze);
// Saving a call runs a full AI scan, so it shares the scan budget.
router.post('/', scanLimiter, validate({ body: saveCallBody }), save);

export default router;
