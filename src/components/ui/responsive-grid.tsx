
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className
}) => {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8'
  };

  const gridCols = `grid-cols-${cols.mobile} ${cols.tablet ? `sm:grid-cols-${cols.tablet}` : ''} ${cols.desktop ? `lg:grid-cols-${cols.desktop}` : ''}`;

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};
