
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
    try {
      const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
      console.error(`[SECURITY ERROR] ${message}`, sanitizedData);
    } catch (err) {
      console.error(`[SECURITY ERROR] Failed to log error: ${message}`);
    }
  }

  warn(message: string, data?: any) {
    try {
      const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
      console.warn(`[SECURITY WARNING] ${message}`, sanitizedData);
    } catch (err) {
      console.warn(`[SECURITY WARNING] Failed to log warning: ${message}`);
    }
  }

  info(message: string, data?: any) {
    if (!this.isProduction) {
      try {
        const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
        console.info(`[SECURITY INFO] ${message}`, sanitizedData);
      } catch (err) {
        console.info(`[SECURITY INFO] Failed to log info: ${message}`);
      }
    }
  }

  debug(message: string, data?: any) {
    if (!this.isProduction) {
      try {
        const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
        console.debug(`[SECURITY DEBUG] ${message}`, sanitizedData);
      } catch (err) {
        console.debug(`[SECURITY DEBUG] Failed to log debug: ${message}`);
      }
    }
  }
}

export const secureLogger = SecureLogger.getInstance();
