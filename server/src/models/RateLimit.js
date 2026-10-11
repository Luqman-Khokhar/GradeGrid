import mongoose from 'mongoose';

// One document per client per window; MongoDB's TTL monitor deletes it when the window ends.
const rateLimitSchema = new mongoose.Schema(
  {
    _id: { type: String },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.models.RateLimit ?? mongoose.model('RateLimit', rateLimitSchema);
