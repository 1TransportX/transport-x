
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  subtitle,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {children && (
          <div className="flex flex-col space-y-2 w-full">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex justify-between items-start", className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center space-x-3">
          {children}
        </div>
      )}
    </div>
  );
};
