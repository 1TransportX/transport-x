
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileStatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  className?: string;
}

export const MobileStatusCard: React.FC<MobileStatusCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  valueColor,
  className
}) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex-shrink-0', iconColor)}>
            <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
              {title}
            </p>
            <p className={cn(
              'text-lg sm:text-xl lg:text-2xl font-bold truncate',
              valueColor || 'text-gray-900'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
