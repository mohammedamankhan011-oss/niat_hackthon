import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  // Render (and most hosts) sit behind one proxy; needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(compression());
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, server-to-server) which send no Origin.
        if (!origin || config.clientUrls.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS_NOT_ALLOWED'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  // Keep-awake / uptime check: no database or AI calls, not rate limited.
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, status: 'ok' });
  });

  app.use(express.json({ limit: '100kb' }));

  app.use('/api', generalLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
