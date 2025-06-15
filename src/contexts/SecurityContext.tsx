
import React, { createContext, useContext, ReactNode } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface SecurityContextType {
  logSecurityEvent: (action: string, severity?: 'info' | 'warning' | 'error', details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { logSecurityEvent } = useSecurityMonitoring();

  return (
    <SecurityContext.Provider value={{ logSecurityEvent }}>
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
