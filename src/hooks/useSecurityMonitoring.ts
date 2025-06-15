
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuditLogger, isSessionExpired, getLastActivity, updateLastActivity } from '@/utils/security';

export const useSecurityMonitoring = () => {
  const { profile, signOut } = useAuth();
  const auditLogger = AuditLogger.getInstance();

  // Session timeout monitoring
  useEffect(() => {
    const checkSession = () => {
      const lastActivity = getLastActivity();
      
      if (lastActivity && isSessionExpired(lastActivity) && profile) {
        auditLogger.log('session_timeout', 'warning', profile.id);
        signOut();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profile, signOut, auditLogger]);

  // Activity tracking
  useEffect(() => {
    const trackActivity = () => {
      if (profile) {
        updateLastActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [profile]);

  const logSecurityEvent = useCallback((
    action: string, 
    severity: 'info' | 'warning' | 'error' = 'info',
    details?: any
  ) => {
    auditLogger.log(action, severity, profile?.id, details);
  }, [profile?.id, auditLogger]);

  return {
    logSecurityEvent
  };
};
