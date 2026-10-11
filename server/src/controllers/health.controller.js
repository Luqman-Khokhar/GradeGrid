import { connectDB, isDbConfigured } from '../config/db.js';

const dbStatus = async () => {
  if (!isDbConfigured()) return 'not configured';
  try {
    await connectDB();
    return 'connected';
  } catch {
    return 'unreachable';
  }
};

export const getHealth = async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'ok',
        db: await dbStatus(),
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
