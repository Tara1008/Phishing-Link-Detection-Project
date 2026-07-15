import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv  from 'dotenv';

import { bootstrapDatabase, testConnection } from './db/pool';
import analyzeRouter  from './routes/analyze';
import historyRouter  from './routes/history';
import statsRouter    from './routes/stats';

dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Global rate limiter
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max:      Number(process.env.RATE_LIMIT_MAX       ?? 200),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, please slow down.' },
}));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/analyze',  analyzeRouter);
app.use('/api/history',  historyRouter);
app.use('/api/stats',    statsRouter);

// Health check
app.get('/api/health', async (_req, res) => {
  const db = await testConnection();
  res.json({
    status: 'ok',
    db:     db ? 'connected' : 'disconnected',
    time:   new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap & Start ────────────────────────────────────────────
async function main() {
  try {
    console.log('🔌  Connecting to MySQL…');
    await bootstrapDatabase();

    app.listen(PORT, () => {
      console.log(`🚀  PhishGuard API running at http://localhost:${PORT}`);
      console.log(`📊  Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
