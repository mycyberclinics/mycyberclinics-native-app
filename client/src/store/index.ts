import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the state type
interface DemoState {
  defaultField: string;
}

// Initial state
const initialState: DemoState = { defaultField: 'Hello Redux!' };

// Create the slice with typed action
const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    setDefaultField: (state, action: PayloadAction<string>) => {
      state.defaultField = action.payload;
    }
  }
});

// Export actions
export const { setDefaultField } = demoSlice.actions;

// Create store with typed reducer
const store = configureStore({
  reducer: {
    demo: demoSlice.reducer
  }
});

// Export RootState and AppDispatch types for useSelector/useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;