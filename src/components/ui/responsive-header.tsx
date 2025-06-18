
import React from 'react';
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
  return (
    <div className={cn(
      "flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0",
      className
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-600 sm:text-base sm:mt-2">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-col space-y-3 w-full sm:w-auto sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          {children}
        </div>
      )}
    </div>
  );
};
