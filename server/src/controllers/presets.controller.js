import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { ColumnPreset, PRESET_LIMITS } from '../models/ColumnPreset.js';

const toDto = (preset) => ({ id: preset._id, name: preset.name, columns: preset.columns, updatedAt: preset.updatedAt });

const validateBody = (body) => {
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > PRESET_LIMITS.nameLength) {
    throw new HttpError(400, `Name is required and must be at most ${PRESET_LIMITS.nameLength} characters.`);
  }

  if (!Array.isArray(body.columns)) throw new HttpError(400, 'Columns must be a list of column keys.');
  const columns = [...new Set(body.columns.filter((c) => typeof c === 'string').map((c) => c.trim()).filter(Boolean))];
  if (!columns.length || columns.length > PRESET_LIMITS.columns) {
    throw new HttpError(400, `Select between 1 and ${PRESET_LIMITS.columns} columns.`);
  }
  if (columns.some((column) => column.length > PRESET_LIMITS.columnLength)) {
    throw new HttpError(400, `Column keys must be at most ${PRESET_LIMITS.columnLength} characters.`);
  }
  return { name, columns };
};

// GET /api/presets
export const listPresets = async (_req, res, next) => {
  try {
    await connectDB();
    const presets = await ColumnPreset.find().collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).lean();
    res.json({ success: true, data: presets.map(toDto) });
  } catch (err) {
    next(err);
  }
};

// POST /api/presets { name, columns }
export const createPreset = async (req, res, next) => {
  try {
    const { name, columns } = validateBody(req.body);
    await connectDB();

    if ((await ColumnPreset.countDocuments()) >= PRESET_LIMITS.total) {
      throw new HttpError(400, `There are already ${PRESET_LIMITS.total} saved selections. Delete some first.`);
    }

    const preset = await ColumnPreset.create({ name, columns });
    res.status(201).json({ success: true, data: toDto(preset) });
  } catch (err) {
    if (err.code === 11000) return next(new HttpError(409, 'A saved selection with this name already exists.'));
    next(err);
  }
};

// DELETE /api/presets/:id (soft delete)
export const deletePreset = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
    await connectDB();

    const preset = await ColumnPreset.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!preset) throw new HttpError(404, 'Saved selection not found.');
    res.json({ success: true, data: { id: preset._id } });
  } catch (err) {
    next(err);
  }
};
