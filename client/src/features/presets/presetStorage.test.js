import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPresetStore } from './presetStorage.js';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
};

test('saves, lists sorted by name, and removes', () => {
  const storage = memoryStorage();
  const store = createPresetStore(() => storage);
  const totals = store.create({ name: '  Totals   only ', columns: ['total', 'total', ' name '] });
  store.create({ name: 'all marks', columns: ['math'] });

  assert.equal(totals.name, 'Totals only');
  assert.deepEqual(totals.columns, ['total', 'name']);
  assert.deepEqual(store.list().map((p) => p.name), ['all marks', 'Totals only']);

  store.remove(totals.id);
  assert.deepEqual(store.list().map((p) => p.name), ['all marks']);
});

test('rejects duplicate names case-insensitively and empty selections', () => {
  const storage = memoryStorage();
  const store = createPresetStore(() => storage);
  store.create({ name: 'Totals', columns: ['total'] });

  assert.throws(() => store.create({ name: 'totals', columns: ['x'] }), /already exists/);
  assert.throws(() => store.create({ name: 'Empty', columns: [] }), /between 1 and/);
  assert.throws(() => store.create({ name: '   ', columns: ['x'] }), /Name is required/);
});

test('ignores corrupt stored data instead of crashing', () => {
  const storage = memoryStorage();
  storage.setItem('gradegrid-presets', '{not json');
  assert.deepEqual(createPresetStore(() => storage).list(), []);

  storage.setItem('gradegrid-presets', JSON.stringify([{ id: 1 }, { id: 'a', name: 'Ok', columns: ['x'] }]));
  assert.deepEqual(createPresetStore(() => storage).list().map((p) => p.name), ['Ok']);
});

test('reports blocked storage as a readable error', () => {
  const store = createPresetStore(() => {
    throw new Error('SecurityError');
  });
  assert.throws(() => store.list(), /blocks site storage/);
});
