
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

class SecureLogger {
  private static instance: SecureLogger;
  private isProduction = import.meta.env.PROD;
  
  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      // Remove sensitive patterns
      return data
        .replace(/password[=:]\s*[^\s,}]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s,}]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s,}]+/gi, 'key=***')
        .replace(/secret[=:]\s*[^\s,}]+/gi, 'secret=***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '***';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  error(message: string, data?: any) {
    const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
    console.error(`[SECURITY ERROR] ${message}`, sanitizedData);
  }

  warn(message: string, data?: any) {
    const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
    console.warn(`[SECURITY WARNING] ${message}`, sanitizedData);
  }

  info(message: string, data?: any) {
    if (!this.isProduction) {
      const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
      console.info(`[SECURITY INFO] ${message}`, sanitizedData);
    }
  }

  debug(message: string, data?: any) {
    if (!this.isProduction) {
      const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
      console.debug(`[SECURITY DEBUG] ${message}`, sanitizedData);
    }
  }
}

export const secureLogger = SecureLogger.getInstance();
