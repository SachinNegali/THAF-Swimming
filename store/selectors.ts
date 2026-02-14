import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

// Auth selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;

// UI selectors
export const selectUI = (state: RootState) => state.ui;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectToasts = (state: RootState) => state.ui.toasts;

export const selectModalState = (modalId: string) =>
  createSelector(
    [(state: RootState) => state.ui.activeModals],
    (modals) => modals[modalId] ?? false
  );

export const selectBottomSheetState = (sheetId: string) =>
  createSelector(
    [(state: RootState) => state.ui.activeBottomSheets],
    (sheets) => sheets[sheetId] ?? false
  );

export const selectLoadingState = (key: string) =>
  createSelector(
    [(state: RootState) => state.ui.loadingStates],
    (loadingStates) => loadingStates[key] ?? false
  );

// App selectors
export const selectApp = (state: RootState) => state.app;
export const selectIsOnboarded = (state: RootState) => state.app.isOnboarded;
export const selectPreferences = (state: RootState) => state.app.preferences;
export const selectFeatureFlags = (state: RootState) => state.app.featureFlags;

export const selectFeatureFlag = (flag: string) =>
  createSelector(
    [(state: RootState) => state.app.featureFlags],
    (flags) => flags[flag] ?? false
  );
