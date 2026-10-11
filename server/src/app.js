import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, HttpError, notFound } from './middleware/errorHandler.js';
import { requireOrigin } from './middleware/requireOrigin.js';

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
app.use(requireOrigin);
// No JSON endpoints take large bodies; uploads are multipart and handled by multer.
app.use(express.json({ limit: '10kb' }));
// Vercel sits in front as one proxy hop; needed for the real client IP in rate limiting.
// Must match the real proxy chain, or clients can spoof X-Forwarded-For (see TRUST_PROXY).
app.set('trust proxy', env.trustProxy);

// Routes connect to MongoDB only when they need it. In development extraction works without it;
// in production it is refused until rate limiting can run (see routes/index.js).
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
