import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const extractResults = createAsyncThunk('upload/extract', async (files, { rejectWithValue }) => {
  try {
    return await api.extractResults(files);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  results: [],
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(extractResults.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(extractResults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload;
      })
      .addCase(extractResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const { reset } = uploadSlice.actions;
export default uploadSlice.reducer;
