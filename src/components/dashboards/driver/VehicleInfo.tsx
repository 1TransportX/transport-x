
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  current_mileage: number;
  fuel_type: string;
  status: string;
}

interface VehicleInfoProps {
  vehicle: Vehicle;
}

const VehicleInfo: React.FC<VehicleInfoProps> = ({ vehicle }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={isMobile ? 'p-4 pb-2' : 'p-6'}>
        <CardTitle className="flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Vehicle Information - {vehicle.vehicle_number}
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Model</p>
            <p className="font-medium text-sm md:text-base">{vehicle.make} {vehicle.model}</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Fuel Type</p>
            <p className="font-medium text-sm md:text-base">{vehicle.fuel_type}</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Mileage</p>
            <p className="font-medium text-sm md:text-base">{vehicle.current_mileage.toLocaleString()} km</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Status</p>
            <p className="font-medium text-green-600 text-sm md:text-base">{vehicle.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleInfo;
