import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { presetStore } from './presetStorage';

const toMessage = (err) => err.message ?? 'Something went wrong.';

export const fetchPresets = createAsyncThunk('presets/fetch', async (_, { rejectWithValue }) => {
  try {
    return presetStore.list();
  } catch (err) {
    return rejectWithValue(toMessage(err));
  }
});

export const savePreset = createAsyncThunk('presets/save', async (preset, { rejectWithValue }) => {
  try {
    return presetStore.create(preset);
  } catch (err) {
    return rejectWithValue(toMessage(err));
  }
});

export const removePreset = createAsyncThunk('presets/remove', async (id, { rejectWithValue }) => {
  try {
    return presetStore.remove(id);
  } catch (err) {
    return rejectWithValue(toMessage(err));
  }
});

const presetsSlice = createSlice({
  name: 'presets',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    saving: false,
    saveError: null,
    removeError: null,
  },
  reducers: {
    clearSaveError: (state) => {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresets.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPresets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPresets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(savePreset.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(savePreset.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [...state.items, action.payload].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
      })
      .addCase(savePreset.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })
      .addCase(removePreset.pending, (state) => {
        state.removeError = null;
      })
      .addCase(removePreset.fulfilled, (state, action) => {
        state.items = state.items.filter((preset) => preset.id !== action.payload);
      })
      .addCase(removePreset.rejected, (state, action) => {
        state.removeError = action.payload;
      });
  },
});

export const { clearSaveError } = presetsSlice.actions;
export const selectPresets = (state) => state.presets;
export default presetsSlice.reducer;
