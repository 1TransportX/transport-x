
import { useEffect } from 'react';

const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    try {
      // Set security headers via meta tags (limited effectiveness but better than nothing)
      const addMetaTag = (name: string, content: string) => {
        try {
          const existing = document.querySelector(`meta[name="${name}"]`);
          if (!existing) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
          }
        } catch (err) {
          console.warn(`Failed to add meta tag ${name}:`, err);
        }
      };

      const addHttpEquivTag = (httpEquiv: string, content: string) => {
        try {
          const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
          if (!existing) {
            const meta = document.createElement('meta');
            meta.httpEquiv = httpEquiv;
            meta.content = content;
            document.head.appendChild(meta);
          }
        } catch (err) {
          console.warn(`Failed to add http-equiv tag ${httpEquiv}:`, err);
        }
      };

      // Referrer Policy
      addMetaTag('referrer', 'strict-origin-when-cross-origin');
      
      // Permissions Policy
      addMetaTag('permissions-policy', 'geolocation=(), microphone=(), camera=()');
      
      // X-Frame-Options equivalent
      addHttpEquivTag('X-Frame-Options', 'DENY');
      
      // X-Content-Type-Options equivalent
      addHttpEquivTag('X-Content-Type-Options', 'nosniff');
      
      // Basic CSP (limited in effectiveness via meta tag)
      addHttpEquivTag('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co",
        "frame-ancestors 'none'"
      ].join('; '));
      
    } catch (err) {
      console.warn('Failed to set security headers:', err);
    }
  }, []);

  return null; // This component doesn't render anything
};

export default SecurityHeaders;
