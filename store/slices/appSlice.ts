import { AppState } from '@/types/state';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: AppState = {
  isOnboarded: false,
  appVersion: '1.0.0',
  lastSync: null,
  preferences: {
    notifications: true,
    locationTracking: true,
    language: 'en',
  },
  featureFlags: {
    chatEnabled: true,
    eventsEnabled: true,
    socialLoginEnabled: true,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnboarded: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    },
    
    setAppVersion: (state, action: PayloadAction<string>) => {
      state.appVersion = action.payload;
    },
    
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    
    updatePreferences: (
      state,
      action: PayloadAction<Partial<AppState['preferences']>>
    ) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
    
    toggleFeatureFlag: (
      state,
      action: PayloadAction<{ flag: string; enabled: boolean }>
    ) => {
      state.featureFlags[action.payload.flag] = action.payload.enabled;
    },
    
    resetAppState: () => initialState,
  },
});

export const {
  setOnboarded,
  setAppVersion,
  setLastSync,
  updatePreferences,
  toggleFeatureFlag,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;
