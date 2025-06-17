
/**
 * Security utilities for input validation and sanitization
 */

import { secureLogger } from './secureLogger';

// Input sanitization with option to preserve spaces
export const sanitizeInput = (input: string, preserveSpaces: boolean = true): string => {
  const original = input;
  let sanitized = input
    .replace(/[<>\"'&]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol

  if (!preserveSpaces) {
    sanitized = sanitized.replace(/\s+/g, ' '); // Normalize whitespace but keep single spaces
  }

  sanitized = sanitized.trim().slice(0, 500); // Limit length

  if (original !== sanitized) {
    secureLogger.warn('Input sanitized', { 
      originalLength: original.length, 
      sanitizedLength: sanitized.length 
    });
  }

  return sanitized;
};

// Enhanced phone number validation
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const sanitized = phone.replace(/\D/g, '');
  
  if (!sanitized) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (sanitized.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  // Check for obviously fake numbers
  if (/^(\d)\1{9}$/.test(sanitized)) {
    secureLogger.warn('Suspicious phone number pattern detected', { pattern: 'repeated_digits' });
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true };
};

// Enhanced email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email address too long' };
  }
  
  return { isValid: true };
};

// Input length validation
export const validateInputLength = (
  input: string, 
  minLength: number = 1, 
  maxLength: number = 255,
  fieldName: string = 'Field'
): { isValid: boolean; error?: string } => {
  if (input.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
  }
  
  return { isValid: true };
};

// Rate limiting helper (client-side basic protection)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      secureLogger.warn('Rate limit exceeded', { key, attempts: recentAttempts.length });
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
}

// Content Security Policy helper
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Consider removing unsafe-inline in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
});

// Enhanced audit logger
export class AuditLogger {
  private static instance: AuditLogger;
  private logs: Array<{
    timestamp: Date;
    action: string;
    userId?: string;
    details?: any;
    severity: 'info' | 'warning' | 'error';
  }> = [];

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  log(action: string, severity: 'info' | 'warning' | 'error' = 'info', userId?: string, details?: any) {
    this.logs.push({
      timestamp: new Date(),
      action,
      userId,
      details,
      severity
    });

    // Use secure logging
    switch (severity) {
      case 'error':
        secureLogger.error(`Audit: ${action}`, { userId, details });
        break;
      case 'warning':
        secureLogger.warn(`Audit: ${action}`, { userId, details });
        break;
      default:
        secureLogger.info(`Audit: ${action}`, { userId, details });
    }
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  getLogs(severity?: 'info' | 'warning' | 'error') {
    if (severity) {
      return this.logs.filter(log => log.severity === severity);
    }
    return [...this.logs];
  }
}

// Session security
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const isSessionExpired = (lastActivity: Date): boolean => {
  return Date.now() - lastActivity.getTime() > SESSION_TIMEOUT_MS;
};

export const updateLastActivity = (): Date => {
  const now = new Date();
  localStorage.setItem('lastActivity', now.toISOString());
  return now;
};

export const getLastActivity = (): Date | null => {
  const stored = localStorage.getItem('lastActivity');
  return stored ? new Date(stored) : null;
};

// Enhanced error sanitization for production
export const sanitizeError = (error: any): string => {
  // Use secure error handler
  if (import.meta.env.PROD) {
    secureLogger.error('Production error occurred', { 
      message: error?.message,
      stack: error?.stack?.substring(0, 200) // Log limited stack trace
    });
    return 'An error occurred. Please try again.';
  }
  
  // In development, return more detailed errors
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
