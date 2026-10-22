import { createSelector } from '@reduxjs/toolkit';
import { cardFromFields } from '../../utils/classSheetPlan';
import { selectUpload } from '../upload/uploadSlice';

export const FILE_COLUMN = { key: '__file', label: 'File name' };

const selectResults = (state) => selectUpload(state).results;

/** One row per successfully extracted result card: { __file, [fieldKey]: value }. */
export const selectStudentRows = createSelector([selectResults], (results) =>
  Object.values(results)
    .filter((result) => result.ok && result.fields?.length)
    .map((result) => ({
      [FILE_COLUMN.key]: result.fileName,
      ...Object.fromEntries(result.fields.map((field) => [field.key, field.value])),
    })),
);

export const selectEmptyResultNames = createSelector([selectResults], (results) =>
  Object.values(results)
    .filter((result) => result.ok && !result.fields?.length)
    .map((result) => result.fileName),
);

export const selectWarnedNames = createSelector([selectResults], (results) =>
  Object.values(results)
    .filter((result) => result.ok && result.warnings?.length)
    .map((result) => result.fileName),
);

/** Every field seen across all cards, in first-seen order, with how many cards have it. */
export const selectColumns = createSelector([selectResults], (results) => {
  const columns = new Map();
  Object.values(results).forEach((result) => {
    if (!result.ok) return;
    result.fields?.forEach((field) => {
      const column = columns.get(field.key);
      if (column) column.count += 1;
      else columns.set(field.key, { key: field.key, label: field.label, count: 1 });
    });
  });
  return [...columns.values()];
});

/** Structured cards for the class sheet; rebuilt from the fields when the API sent none. */
export const selectCards = createSelector([selectResults], (results) =>
  Object.values(results)
    .filter((result) => result.ok)
    .map((result) => (result.card?.subjects?.length ? result.card : cardFromFields(result.fields)))
    .filter(Boolean),
);
