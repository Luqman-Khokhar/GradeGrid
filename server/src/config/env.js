// "1" → 1 hop, "true"/"false" → boolean, anything else (e.g. "loopback") is passed to Express as is.
const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return 1;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true' || value === 'false') return value === 'true';
  return value;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  // Optional in development. In production extraction is refused while rate limiting cannot run.
  mongoUri: process.env.MONGODB_URI?.trim() || null,
  clientOrigins: (process.env.CLIENT_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 4,
  filesPerHour: Number(process.env.RATE_LIMIT_FILES_PER_HOUR) || 200,
  // Ceiling for every client together: caps compute cost even when many IPs are used.
  globalFilesPerHour: Number(process.env.RATE_LIMIT_GLOBAL_FILES_PER_HOUR) || 2000,
  // Default 1 = one proxy hop (Vercel). Set to match the real proxy chain on other hosts.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY?.trim()),
  // Optional Cloudflare Turnstile secret. When set, every extraction needs a valid challenge token.
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY?.trim() || null,
});
