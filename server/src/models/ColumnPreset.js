import mongoose from 'mongoose';

export const PRESET_LIMITS = Object.freeze({ nameLength: 60, columns: 500, columnLength: 120, total: 200 });

// A named column selection staff can reuse. Stores field keys only, never student data.
const columnPresetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: PRESET_LIMITS.nameLength },
    columns: {
      type: [{ type: String, trim: true, maxlength: PRESET_LIMITS.columnLength }],
      validate: {
        validator: (columns) => columns.length > 0 && columns.length <= PRESET_LIMITS.columns,
        message: `A preset needs 1 to ${PRESET_LIMITS.columns} columns.`,
      },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Names are unique (case-insensitive) among presets that are not deleted.
columnPresetSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false }, collation: { locale: 'en', strength: 2 } },
);

// Soft delete: exclude deleted docs from every find/count unless explicitly asked for.
columnPresetSchema.pre(/^find|^count/, function excludeDeleted() {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

export const ColumnPreset = mongoose.models.ColumnPreset ?? mongoose.model('ColumnPreset', columnPresetSchema);
