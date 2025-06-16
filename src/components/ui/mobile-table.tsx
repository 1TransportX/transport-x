
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileTableProps<T> {
  data: T[];
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  renderDesktopTable: () => React.ReactNode;
  className?: string;
}

export function MobileTable<T>({
  data,
  renderMobileCard,
  renderDesktopTable,
  className
}: MobileTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No data available
            </CardContent>
          </Card>
        ) : (
          data.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                {renderMobileCard(item, index)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return renderDesktopTable();
}
