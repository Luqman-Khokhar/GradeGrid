import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, HttpError, notFound } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      cb(new HttpError(403, `Origin not allowed: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
// Vercel sits in front as one proxy hop; needed for the real client IP in rate limiting.
app.set('trust proxy', 1);

// Routes connect to MongoDB only when they need it, so extraction works even if the DB is down.
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
