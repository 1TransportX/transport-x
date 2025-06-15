
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

const sizeClasses = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-2xl sm:text-3xl lg:text-4xl',
  '4xl': 'text-3xl sm:text-4xl lg:text-5xl'
};

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  as: Component = 'p',
  size = 'base',
  className
}) => {
  return (
    <Component className={cn(sizeClasses[size], className)}>
      {children}
    </Component>
  );
};
