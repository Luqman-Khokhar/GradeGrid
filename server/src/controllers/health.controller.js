import mongoose from 'mongoose';

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const getHealth = async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'ok',
        db: STATES[mongoose.connection.readyState] ?? 'unknown',
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
