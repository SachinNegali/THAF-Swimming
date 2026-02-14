/**
 * Redux State Types
 * Defines the shape of all Redux state slices
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumber?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  activeModals: {
    [key: string]: boolean;
  };
  activeBottomSheets: {
    [key: string]: boolean;
  };
  loadingStates: {
    [key: string]: boolean;
  };
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface AppState {
  isOnboarded: boolean;
  appVersion: string;
  lastSync: string | null;
  preferences: {
    notifications: boolean;
    locationTracking: boolean;
    language: string;
  };
  featureFlags: {
    [key: string]: boolean;
  };
}
