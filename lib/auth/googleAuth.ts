import {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';

// ─────────────────────────────────────────────────────────
// SECURITY: Read client IDs from environment variables only.
// Never hardcode OAuth client IDs in source code.
// ─────────────────────────────────────────────────────────
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// ─── Custom error class for typed error handling ────────
export class GoogleAuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
  }
}

export const GoogleAuthErrorCodes = {
  /** Google Play Services not available (Android) */
  PLAY_SERVICES_UNAVAILABLE: 'PLAY_SERVICES_UNAVAILABLE',
  /** User cancelled the sign-in flow */
  CANCELLED: 'CANCELLED',
  /** Another sign-in is already in progress */
  IN_PROGRESS: 'IN_PROGRESS',
  /** No idToken was returned by Google */
  NO_ID_TOKEN: 'NO_ID_TOKEN',
  /** Unknown / unclassified error */
  UNKNOWN: 'UNKNOWN',
  /** Network error during sign-in */
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// ─── Mutex: prevent duplicate concurrent sign-in calls ──
let _isSigningIn = false;

/**
 * Configure the Google Sign-In SDK.
 * Must be called once before any sign-in attempt (typically at app startup).
 *
 * SECURITY DECISIONS:
 * - webClientId is REQUIRED — without it, Google returns null idToken.
 * - offlineAccess: true — requests a server auth code for backend token exchange.
 * - forceCodeForRefreshToken: true — ensures a fresh refresh token on every login.
 */
export function configureGoogleSignIn(): void {
  if (!WEB_CLIENT_ID) {
    throw new GoogleAuthError(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured. Google Sign-In will not produce an idToken.',
      GoogleAuthErrorCodes.UNKNOWN,
    );
  }

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

/**
 * Trigger the native Google account picker and return the idToken.
 *
 * SECURITY: This function returns ONLY the idToken.
 * - Profile data (email, name, photo) from the Google response is intentionally DISCARDED.
 * - The backend must verify the idToken with Google's servers and extract user info there.
 * - This prevents token-substitution attacks where a malicious client could send
 *   a valid idToken with forged profile data.
 *
 * @returns Promise resolving to `{ idToken: string }`
 * @throws GoogleAuthError with typed code for each failure scenario
 */
export async function signInWithGoogle(): Promise<{ idToken: string }> {
  // ── Guard: prevent concurrent sign-in attempts ────────
  if (_isSigningIn) {
    throw new GoogleAuthError(
      'A sign-in attempt is already in progress.',
      GoogleAuthErrorCodes.IN_PROGRESS,
    );
  }

  _isSigningIn = true;

  try {
    // ── Step 1: Check Google Play Services (Android-only, no-op on iOS) ──
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // ── Step 2: Show native account picker ──
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new GoogleAuthError(
        'Google sign-in did not return a successful response.',
        GoogleAuthErrorCodes.UNKNOWN,
      );
    }

    // ── Step 3: Extract ONLY the idToken ──
    // SECURITY: We intentionally ignore response.data.user (email, name, photo).
    // All user profile data MUST come from backend verification of the idToken.
    const { idToken } = response.data;

    if (!idToken) {
      // This happens when webClientId is missing or misconfigured.
      throw new GoogleAuthError(
        'Google did not return an idToken. Verify that webClientId is correctly configured.',
        GoogleAuthErrorCodes.NO_ID_TOKEN,
      );
    }

    return { idToken };
  } catch (error) {
    // Re-throw our own errors as-is
    if (error instanceof GoogleAuthError) {
      throw error;
    }

    // ── Map Google SDK error codes to our typed errors ──
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          throw new GoogleAuthError(
            'Sign-in already in progress.',
            GoogleAuthErrorCodes.IN_PROGRESS,
          );
        case statusCodes.SIGN_IN_CANCELLED:
          throw new GoogleAuthError(
            'Sign-in was cancelled by the user.',
            GoogleAuthErrorCodes.CANCELLED,
          );
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new GoogleAuthError(
            'Google Play Services is not available on this device.',
            GoogleAuthErrorCodes.PLAY_SERVICES_UNAVAILABLE,
          );
        default:
          throw new GoogleAuthError(
            error.message ?? 'An unknown Google sign-in error occurred.',
            GoogleAuthErrorCodes.UNKNOWN,
          );
      }
    }

    // ── Network / unknown errors ──
    if (error instanceof Error && error.message?.includes('network')) {
      throw new GoogleAuthError(
        'Network error during Google sign-in. Please check your connection.',
        GoogleAuthErrorCodes.NETWORK_ERROR,
      );
    }

    throw new GoogleAuthError(
      error instanceof Error ? error.message : 'Google sign-in failed.',
      GoogleAuthErrorCodes.UNKNOWN,
    );
  } finally {
    _isSigningIn = false;
  }
}

/**
 * Revoke Google access and sign out locally.
 *
 * SECURITY: `revokeAccess()` invalidates the Google grant entirely,
 * forcing the user to re-consent on next sign-in. This is the correct
 * behaviour for a full logout — it prevents silent re-authentication.
 *
 * Call order matters:
 * 1. revokeAccess() — invalidates the grant with Google servers
 * 2. signOut() — clears local Google Sign-In SDK state
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // Best-effort: If revoke fails (e.g. network), continue with local sign-out.
    // The token will expire naturally on Google's side.
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // Best-effort: Local state cleanup should not block logout.
  }
}
