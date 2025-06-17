
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

interface DeliveryCardProps {
  delivery: Delivery;
  index: number;
  onStatusUpdate: (deliveryId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void;
  onNavigation: (address: string) => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  index,
  onStatusUpdate,
  onNavigation
}) => {
  const isMobile = useIsMobile();

  return (
    <div 
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border ${
        delivery.status === 'completed' ? 'bg-green-50 border-green-200' :
        delivery.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
        'bg-white border-gray-200'
      } hover:shadow-md transition-shadow space-y-3 sm:space-y-0`}
    >
      <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
          delivery.status === 'completed' ? 'bg-green-500' :
          delivery.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 sm:flex-none">
          <p className="font-medium text-gray-900 text-sm sm:text-base">{delivery.customer_name}</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{delivery.customer_address}</p>
          <p className="text-xs text-gray-500">
            #{delivery.delivery_number} • {delivery.scheduled_date}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
          delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
          delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          delivery.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {delivery.status.replace('_', ' ')}
        </span>
        <div className="flex space-x-1 sm:space-x-2 w-full sm:w-auto">
          {delivery.status === 'in_progress' && (
            <Button 
              size="sm"
              onClick={() => onStatusUpdate(delivery.id, 'completed')}
              className="flex-1 sm:flex-none text-xs"
            >
              Complete
            </Button>
          )}
          {delivery.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStatusUpdate(delivery.id, 'in_progress')}
              className="flex-1 sm:flex-none text-xs"
            >
              Start
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigation(delivery.customer_address)}
            className="flex-none p-1 sm:p-2"
          >
            <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryCard;
