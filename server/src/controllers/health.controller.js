import { connectDB, getDbIssue, isDbConfigured } from '../config/db.js';

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
    const db = await dbStatus();
    res.json({
      success: true,
      data: {
        status: 'ok',
        db,
        ...(db === 'unreachable' && { dbIssue: getDbIssue() }),
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
