import { Toast, UIState } from '@/types/state';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: UIState = {
  theme: 'system',
  activeModals: {},
  activeBottomSheets: {},
  loadingStates: {},
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    toggleModal: (state, action: PayloadAction<{ id: string; isOpen: boolean }>) => {
      state.activeModals[action.payload.id] = action.payload.isOpen;
    },
    
    toggleBottomSheet: (state, action: PayloadAction<{ id: string; isOpen: boolean }>) => {
      state.activeBottomSheets[action.payload.id] = action.payload.isOpen;
    },
    
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.isLoading;
    },
    
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({
        id,
        ...action.payload,
        duration: action.payload.duration ?? 3000,
      });
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setTheme,
  toggleModal,
  toggleBottomSheet,
  setLoading,
  addToast,
  removeToast,
  clearAllToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
