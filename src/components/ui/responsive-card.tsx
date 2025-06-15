
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className={cn(
      'w-full',
      isMobile ? 'rounded-lg' : 'rounded-lg',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? 'p-4 pb-2' : 'p-6',
          headerClassName
        )}>
          {title && (
            <CardTitle className={cn(
              isMobile ? 'text-lg' : 'text-2xl'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              isMobile ? 'text-sm' : 'text-base'
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile ? 'p-4 pt-0' : 'p-6 pt-0',
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};
