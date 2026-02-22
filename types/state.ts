/**
 * Redux State Types
 * Defines the shape of all Redux state slices
 */

export interface User {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  socialAccounts?: Array<{
    provider: string;
    id: string;
    _id: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
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
