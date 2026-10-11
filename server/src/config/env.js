export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  // Optional: without it, extraction still works; saved selections and rate limiting are off.
  mongoUri: process.env.MONGODB_URI?.trim() || null,
  clientOrigins: (process.env.CLIENT_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 4,
  filesPerHour: Number(process.env.RATE_LIMIT_FILES_PER_HOUR) || 200,
});
