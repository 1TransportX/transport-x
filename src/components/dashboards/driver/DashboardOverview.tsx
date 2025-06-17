
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, CheckCircle, Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardOverviewProps {
  totalDeliveries: number;
  completedCount: number;
  inProgressCount: number;
  vehicle: any;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  totalDeliveries,
  completedCount,
  inProgressCount,
  vehicle
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Today</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{totalDeliveries}</p>
            </div>
            <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-lg md:text-2xl font-bold text-orange-600">{inProgressCount}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Vehicle</p>
              <p className="text-lg md:text-2xl font-bold text-blue-600">{vehicle ? 'Assigned' : 'None'}</p>
            </div>
            <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
