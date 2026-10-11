import { configureStore } from '@reduxjs/toolkit';
import uploadReducer from '../features/upload/uploadSlice';

export const store = configureStore({
  reducer: {
    upload: uploadReducer,
  },
});
