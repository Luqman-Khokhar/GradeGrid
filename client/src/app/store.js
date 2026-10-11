import { configureStore } from '@reduxjs/toolkit';
import presetsReducer from '../features/presets/presetsSlice';
import uploadReducer from '../features/upload/uploadSlice';

export const store = configureStore({
  reducer: {
    upload: uploadReducer,
    presets: presetsReducer,
  },
});
