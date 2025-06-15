
import { useEffect } from 'react';

const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set security headers via meta tags (limited effectiveness but better than nothing)
    const addMetaTag = (name: string, content: string) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Referrer Policy
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    addMetaTag('permissions-policy', 'geolocation=(), microphone=(), camera=()');
    
    // X-Frame-Options equivalent
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'DENY';
    document.head.appendChild(frameOptions);
    
    // X-Content-Type-Options equivalent
    const contentTypeOptions = document.createElement('meta');
    contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    contentTypeOptions.content = 'nosniff';
    document.head.appendChild(contentTypeOptions);
    
    // Basic CSP (limited in effectiveness via meta tag)
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'"
    ].join('; ');
    document.head.appendChild(csp);
    
  }, []);

  return null; // This component doesn't render anything
};

export default SecurityHeaders;
