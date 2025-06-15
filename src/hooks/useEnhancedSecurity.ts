
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { secureLogger } from '@/utils/secureLogger';
import { SecureErrorHandler } from '@/utils/errorHandler';
import { 
  isSessionExpired, 
  getLastActivity, 
  updateLastActivity,
  SESSION_TIMEOUT_MS 
} from '@/utils/security';

export const useEnhancedSecurity = () => {
  const { profile, signOut } = useAuth();
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  // Enhanced session timeout with warning
  useEffect(() => {
    if (!profile) return;

    const checkSession = () => {
      const lastActivity = getLastActivity();
      
      if (lastActivity && profile) {
        const timeUntilExpiry = SESSION_TIMEOUT_MS - (Date.now() - lastActivity.getTime());
        
        // Show warning 5 minutes before expiry
        if (timeUntilExpiry <= WARNING_THRESHOLD && timeUntilExpiry > 0 && !sessionWarningShown) {
          setSessionWarningShown(true);
          secureLogger.warn('Session expiring soon', { 
            userId: profile.id,
            timeUntilExpiry: Math.floor(timeUntilExpiry / 1000)
          });
        }
        
        // Auto logout on expiry
        if (isSessionExpired(lastActivity)) {
          secureLogger.warn('Session expired, logging out user', { userId: profile.id });
          signOut();
        }
      }
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [profile, signOut, sessionWarningShown]);

  // Activity tracking with enhanced events
  useEffect(() => {
    if (!profile) return;

    const trackActivity = () => {
      updateLastActivity();
      setSessionWarningShown(false); // Reset warning when user is active
    };

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'focus', 'blur', 'visibilitychange'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [profile]);

  // Detect suspicious activity patterns
  const logSecurityEvent = useCallback((
    action: string, 
    severity: 'info' | 'warning' | 'error' = 'info',
    details?: any
  ) => {
    if (!profile?.id) return;

    const securityEvent = {
      action,
      severity,
      userId: profile.id,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...details
    };

    switch (severity) {
      case 'error':
        secureLogger.error(`Security event: ${action}`, securityEvent);
        break;
      case 'warning':
        secureLogger.warn(`Security event: ${action}`, securityEvent);
        break;
      default:
        secureLogger.info(`Security event: ${action}`, securityEvent);
    }
  }, [profile?.id]);

  // Handle errors securely
  const handleSecureError = useCallback((error: any, context: string) => {
    const appError = SecureErrorHandler.handleError(error, context);
    logSecurityEvent('error_handled', appError.severity as any, {
      errorCode: appError.code,
      context
    });
    return appError.userMessage;
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    handleSecureError,
    sessionWarningShown
  };
};
