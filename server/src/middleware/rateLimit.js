import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

function limitHandler(message, code) {
  return (_req, res, _next, options) => {
    res.status(options.statusCode).json({ error: { message, code } });
  };
}

// Applies to every /api route.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many requests. Please slow down and try again shortly.', 'RATE_LIMITED'),
});

// Strict: login/signup brute-force protection.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many login attempts. Please wait 15 minutes and try again.', 'RATE_LIMITED'),
});

// Strict: AI scans are expensive. Keyed by user (runs after requireAuth).
export const scanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: limitHandler('You have scanned a lot of messages. Please wait a few minutes and try again.', 'RATE_LIMITED'),
});

// AI re-explanations share a separate, slightly looser budget.
export const explainLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: limitHandler('Too many explanation requests. Please wait a few minutes and try again.', 'RATE_LIMITED'),
});

// Live Call Guard polls every few seconds during a call.
export const liveCallLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: limitHandler('Live call checks are coming in too fast. Please wait a moment.', 'RATE_LIMITED'),
});

// Public "Check before you pay" lookups.
export const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many checks. Please wait a minute and try again.', 'RATE_LIMITED'),
});

// Community reports: protects the database from spam.
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: limitHandler('You have sent many reports. Please try again later.', 'RATE_LIMITED'),
});

// Live audio transcription: one short chunk every few seconds during a call.
export const transcribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: limitHandler('Too many audio chunks. Please wait a moment.', 'RATE_LIMITED'),
});
