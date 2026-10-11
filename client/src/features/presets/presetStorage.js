// Saved column selections live in this browser only, so each user keeps a private list.
const STORAGE_KEY = 'gradegrid-presets';

export const PRESET_LIMITS = Object.freeze({ nameLength: 60, columns: 500, columnLength: 120, total: 200 });

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

const isPreset = (value) =>
  value &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  Array.isArray(value.columns) &&
  value.columns.every((column) => typeof column === 'string');

const read = (storage) => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPreset) : [];
  } catch {
    return [];
  }
};

const write = (storage, presets) => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    throw new Error('This browser blocked saving. Check that site data is allowed, then try again.');
  }
};

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const validate = ({ name, columns }) => {
  const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  if (!cleanName || cleanName.length > PRESET_LIMITS.nameLength) {
    throw new Error(`Name is required and must be at most ${PRESET_LIMITS.nameLength} characters.`);
  }
  const cleanColumns = Array.isArray(columns)
    ? [...new Set(columns.filter((c) => typeof c === 'string').map((c) => c.trim()).filter(Boolean))]
    : [];
  if (!cleanColumns.length || cleanColumns.length > PRESET_LIMITS.columns) {
    throw new Error(`Select between 1 and ${PRESET_LIMITS.columns} columns.`);
  }
  if (cleanColumns.some((column) => column.length > PRESET_LIMITS.columnLength)) {
    throw new Error(`Column keys must be at most ${PRESET_LIMITS.columnLength} characters.`);
  }
  return { name: cleanName, columns: cleanColumns };
};

/** `storage` is injectable for tests; defaults to window.localStorage. */
export const createPresetStore = (getStorage = () => window.localStorage) => {
  const storage = () => {
    try {
      return getStorage();
    } catch {
      throw new Error('Saved selections are unavailable because this browser blocks site storage.');
    }
  };

  return {
    list: () => read(storage()).sort(byName),

    create: (input) => {
      const { name, columns } = validate(input);
      const store = storage();
      const presets = read(store);
      if (presets.length >= PRESET_LIMITS.total) {
        throw new Error(`You already have ${PRESET_LIMITS.total} saved selections. Delete some first.`);
      }
      if (presets.some((preset) => byName(preset, { name }) === 0)) {
        throw new Error('A saved selection with this name already exists.');
      }
      const preset = { id: newId(), name, columns, updatedAt: new Date().toISOString() };
      write(store, [...presets, preset]);
      return preset;
    },

    remove: (id) => {
      const store = storage();
      const presets = read(store);
      if (!presets.some((preset) => preset.id === id)) throw new Error('Saved selection not found.');
      write(store, presets.filter((preset) => preset.id !== id));
      return id;
    },
  };
};

export const presetStore = createPresetStore();
