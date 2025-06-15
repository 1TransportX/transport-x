
import React, { createContext, useContext, ReactNode } from 'react';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';

interface SecurityContextType {
  logSecurityEvent: (action: string, severity?: 'info' | 'warning' | 'error', details?: any) => void;
  handleSecureError: (error: any, context: string) => string;
  sessionWarningShown: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { logSecurityEvent, handleSecureError, sessionWarningShown } = useEnhancedSecurity();

  return (
    <SecurityContext.Provider value={{ 
      logSecurityEvent, 
      handleSecureError, 
      sessionWarningShown 
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
