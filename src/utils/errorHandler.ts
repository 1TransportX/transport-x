
import { secureLogger } from './secureLogger';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecureErrorHandler {
  private static errors: Record<string, AppError> = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password provided',
      userMessage: 'Invalid email or password. Please try again.',
      severity: 'medium'
    },
    AUTH_SESSION_EXPIRED: {
      code: 'AUTH_SESSION_EXPIRED',
      message: 'User session has expired',
      userMessage: 'Your session has expired. Please log in again.',
      severity: 'medium'
    },
    AUTH_INSUFFICIENT_PERMISSIONS: {
      code: 'AUTH_INSUFFICIENT_PERMISSIONS',
      message: 'User lacks required permissions',
      userMessage: 'You do not have permission to perform this action.',
      severity: 'high'
    },
    
    // Input validation errors
    VALIDATION_INVALID_INPUT: {
      code: 'VALIDATION_INVALID_INPUT',
      message: 'Invalid input provided',
      userMessage: 'Please check your input and try again.',
      severity: 'low'
    },
    VALIDATION_REQUIRED_FIELD: {
      code: 'VALIDATION_REQUIRED_FIELD',
      message: 'Required field missing',
      userMessage: 'Please fill in all required fields.',
      severity: 'low'
    },
    
    // Network errors
    NETWORK_CONNECTION_ERROR: {
      code: 'NETWORK_CONNECTION_ERROR',
      message: 'Network connection failed',
      userMessage: 'Connection error. Please check your internet connection and try again.',
      severity: 'medium'
    },
    NETWORK_TIMEOUT: {
      code: 'NETWORK_TIMEOUT',
      message: 'Request timeout',
      userMessage: 'Request timed out. Please try again.',
      severity: 'medium'
    },
    
    // Database errors
    DATABASE_CONNECTION_ERROR: {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection failed',
      userMessage: 'Service temporarily unavailable. Please try again later.',
      severity: 'critical'
    },
    
    // Generic errors
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'medium'
    }
  };

  static handleError(error: any, context?: string): AppError {
    let appError: AppError;
    
    // Try to map specific errors to our predefined types
    if (error?.message?.includes('Invalid login credentials')) {
      appError = this.errors.AUTH_INVALID_CREDENTIALS;
    } else if (error?.message?.includes('JWT expired')) {
      appError = this.errors.AUTH_SESSION_EXPIRED;
    } else if (error?.message?.includes('Insufficient permissions')) {
      appError = this.errors.AUTH_INSUFFICIENT_PERMISSIONS;
    } else if (error?.message?.includes('NetworkError')) {
      appError = this.errors.NETWORK_CONNECTION_ERROR;
    } else if (error?.code === 'TIMEOUT') {
      appError = this.errors.NETWORK_TIMEOUT;
    } else {
      appError = this.errors.UNKNOWN_ERROR;
    }
    
    // Log the error securely
    secureLogger.error(
      `Error in ${context || 'unknown context'}: ${appError.code}`,
      {
        errorCode: appError.code,
        severity: appError.severity,
        context,
        originalError: error?.message
      }
    );
    
    return appError;
  }

  static getUserMessage(error: any, context?: string): string {
    const appError = this.handleError(error, context);
    return appError.userMessage;
  }
}
