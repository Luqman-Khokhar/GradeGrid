import mongoose from 'mongoose';

// A known result card layout: maps labels on the PDF to named columns.
const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    pattern: { type: String, trim: true },
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    fields: { type: [fieldSchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Soft delete: exclude deleted docs from every find unless explicitly asked for.
templateSchema.pre(/^find|^count/, function excludeDeleted() {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

export const Template = mongoose.models.Template ?? mongoose.model('Template', templateSchema);
