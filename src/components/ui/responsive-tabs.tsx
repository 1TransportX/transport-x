
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      {children}
    </Tabs>
  );
};

export const ResponsiveTabsList: React.FC<ResponsiveTabsListProps> = ({
  children,
  className
}) => {
  const isMobile = useIsMobile();

  return (
    <TabsList className={cn(
      isMobile ? "w-full overflow-x-auto flex-nowrap justify-start" : "inline-flex",
      className
    )}>
      {children}
    </TabsList>
  );
};

export const ResponsiveTabsTrigger: React.FC<ResponsiveTabsTriggerProps> = ({
  value,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  return (
    <TabsTrigger
      value={value}
      className={cn(
        isMobile ? "whitespace-nowrap flex-shrink-0 text-xs px-2 py-1.5" : "",
        className
      )}
    >
      {children}
    </TabsTrigger>
  );
};

export { TabsContent as ResponsiveTabsContent };
