import {
    GoogleAuthError,
    GoogleAuthErrorCodes,
    configureGoogleSignIn,
} from '@/lib/auth/googleAuth';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react';

import { useGoogleLogin, useLogout } from '@/hooks/api/useAuth';
import { useAppSelector } from '@/store/hooks';

// ─── Types ──────────────────────────────────────────────
interface AuthContextValue {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether a sign-in or sign-out operation is in progress */
  isLoading: boolean;
  /** The authenticated user's profile (from backend, NOT from Google frontend data) */
  user: import('@/types/state').User | null;
  /** Trigger the Google Sign-In flow → send idToken to backend */
  signIn: () => void;
  /** Full logout: backend + SecureStore + Google revocation */
  signOut: () => void;
  /** Last error message, or null if no error */
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider — wraps the app to provide authentication state and actions.
 *
 * Responsibilities:
 * 1. Configures Google Sign-In SDK on mount
 * 2. Exposes signIn/signOut via context (backed by React Query mutations)
 * 3. Reads auth state from Redux (single source of truth)
 * 4. Guards against concurrent sign-in attempts
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const isConfigured = useRef(false);

  // ── Configure Google Sign-In once on mount ────────────
  useEffect(() => {
    if (!isConfigured.current) {
      try {
        configureGoogleSignIn();
        isConfigured.current = true;
      } catch (error) {
        // Configuration failure is logged but doesn't crash the app.
        // Sign-in will fail at attempt-time with a clear error.
        if (__DEV__) {
          console.error('Google Sign-In configuration failed:', error);
        }
      }
    }
  }, []);

  // ── Auth state from Redux (populated by useAuth hooks) ──
  const { isAuthenticated, user, isLoading: reduxLoading, error: reduxError } =
    useAppSelector((state) => state.auth);

  // ── Mutations ─────────────────────────────────────────
  const googleLogin = useGoogleLogin();
  const logoutMutation = useLogout();

  // ── Sign In ───────────────────────────────────────────
  const signIn = useCallback(() => {
    // Prevent double-taps / concurrent calls
    if (googleLogin.isPending) return;

    googleLogin.mutate(undefined, {
      onError: (error) => {
        // Don't surface cancellation to the user
        if (
          error instanceof GoogleAuthError &&
          error.code === GoogleAuthErrorCodes.CANCELLED
        ) {
          return;
        }
        // Other errors are surfaced via the `error` field in context
      },
    });
  }, [googleLogin]);

  // ── Sign Out ──────────────────────────────────────────
  const signOut = useCallback(() => {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate();
  }, [logoutMutation]);

  // ── Derive loading & error state ──────────────────────
  const isLoading = reduxLoading || googleLogin.isPending || logoutMutation.isPending;

  const error = useMemo(() => {
    if (reduxError) return reduxError;
    if (googleLogin.error) {
      // Don't show cancellation as an error
      if (
        googleLogin.error instanceof GoogleAuthError &&
        googleLogin.error.code === GoogleAuthErrorCodes.CANCELLED
      ) {
        return null;
      }
      return googleLogin.error.message;
    }
    if (logoutMutation.error) return logoutMutation.error.message;
    return null;
  }, [reduxError, googleLogin.error, logoutMutation.error]);

  // ── Context value (memoized to prevent unnecessary re-renders) ──
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      signIn,
      signOut,
      error,
    }),
    [isAuthenticated, isLoading, user, signIn, signOut, error],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────

/**
 * Access authentication state and actions from any component.
 *
 * @example
 * ```tsx
 * const { signIn, signOut, isAuthenticated, user } = useAuth();
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
