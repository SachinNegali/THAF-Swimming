import { AxiosError } from 'axios';
import { ApiError } from './client';

/**
 * Parse API error into user-friendly message
 */
export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined;
    
    // Check for custom error message from API
    if (apiError?.message) {
      return apiError.message;
    }
    
    // Check for validation errors
    if (apiError?.errors) {
      const firstError = Object.values(apiError.errors)[0];
      if (firstError && firstError.length > 0) {
        return firstError[0];
      }
    }
    
    // HTTP status code messages
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logApiError(error: unknown, context?: string): void {
  if (__DEV__) {
    console.error(`[API Error${context ? ` - ${context}` : ''}]:`, error);
  }
  
  // TODO: Send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error);
  // }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && error.code === 'ERR_NETWORK';
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}
