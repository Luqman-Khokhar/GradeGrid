import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupColumns } from './columnGroups.js';

const col = (label) => ({ key: label.toLowerCase(), label });

test('groups subject columns by kind, preferring the longest suffix', () => {
  const groups = groupColumns(
    ['Name', 'URDU Total', 'ENGLISH Total', 'PHYSICS Practical', 'PHYSICS Status Practical', 'URDU Status Practical'].map(col),
  );
  assert.deepEqual(groups, [
    { label: 'Status Practical', keys: ['physics status practical', 'urdu status practical'] },
    { label: 'Total', keys: ['urdu total', 'english total'] },
  ]);
});
