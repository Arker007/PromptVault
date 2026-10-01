import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/api.ts';
import { getDb } from '../server/db.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database initialization middleware for serverless
app.use(async (req, res, next) => {
  try {
    await getDb();
    next();
  } catch (err) {
    console.error('Database initialization failed:', err);
    next(err);
  }
});

// Mount API router
app.use('/api', apiRouter);

// Standard error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ code: 'SERVER_ERROR', message: err.message || 'Internal Server Error' });
});

export default app;
