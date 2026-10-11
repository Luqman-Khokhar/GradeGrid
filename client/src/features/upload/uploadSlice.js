import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { createBatches } from './fileRules';

// items: [{ id, file }]. File objects stay out of state; only results are stored.
export const extractResults = createAsyncThunk('upload/extract', async (items, { dispatch }) => {
  for (const batch of createBatches(items)) {
    let results;
    try {
      const data = await api.extractResults(batch.map((item) => item.file));
      results = batch.map((item, index) => ({
        ok: false,
        error: 'No result returned for this file.',
        ...data?.[index],
        id: item.id,
        fileName: item.file.name,
      }));
    } catch (err) {
      results = batch.map((item) => ({ id: item.id, fileName: item.file.name, ok: false, error: err.message }));
    }
    dispatch(batchCompleted(results));
  }
});

const initialState = {
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  progress: { done: 0, total: 0 },
  results: {}, // keyed by file id
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    reset: () => initialState,
    batchCompleted: (state, action) => {
      action.payload.forEach((result) => {
        state.results[result.id] = result;
      });
      state.progress.done += action.payload.length;
    },
    resultRemoved: (state, action) => {
      delete state.results[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extractResults.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.progress = { done: 0, total: action.meta.arg.length };
        action.meta.arg.forEach((item) => {
          delete state.results[item.id];
        });
      })
      .addCase(extractResults.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(extractResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Extraction stopped unexpectedly.';
      });
  },
});

export const { reset, batchCompleted, resultRemoved } = uploadSlice.actions;
export const selectUpload = (state) => state.upload;
export default uploadSlice.reducer;
