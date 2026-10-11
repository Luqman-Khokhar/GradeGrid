// Local dev only: load server/.env if present. Vercel injects env vars itself.
// Done in code because `node --watch --env-file-if-exists` crashes when the file is missing.
try {
  process.loadEnvFile('.env');
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
