
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DeliveryCard from './DeliveryCard';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

interface DeliveryRoutesProps {
  todaysDeliveries: Delivery[];
  allDeliveries: Delivery[];
  onStatusUpdate: (deliveryId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void;
  onNavigation: (address: string) => void;
  onAddRoute: () => void;
}

const DeliveryRoutes: React.FC<DeliveryRoutesProps> = ({
  todaysDeliveries,
  allDeliveries,
  onStatusUpdate,
  onNavigation,
  onAddRoute
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={isMobile ? 'p-4 pb-2' : 'p-6'}>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Route Management
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className={`${isMobile ? 'w-full' : 'grid w-full'} grid-cols-2`}>
            <TabsTrigger value="today" className={isMobile ? 'text-xs' : ''}>Today's Routes</TabsTrigger>
            <TabsTrigger value="scheduled" className={isMobile ? 'text-xs' : ''}>All Scheduled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
            {todaysDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className={`text-gray-500 mb-4 ${isMobile ? 'text-sm' : ''}`}>No routes scheduled for today</p>
                <Button onClick={onAddRoute} size={isMobile ? "sm" : "default"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Route
                </Button>
              </div>
            ) : (
              <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                {todaysDeliveries.map((delivery, index) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    index={index}
                    onStatusUpdate={onStatusUpdate}
                    onNavigation={onNavigation}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scheduled" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
            {allDeliveries.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className={`text-gray-500 mb-4 ${isMobile ? 'text-sm' : ''}`}>No scheduled routes found</p>
                <Button onClick={onAddRoute} size={isMobile ? "sm" : "default"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Route
                </Button>
              </div>
            ) : (
              <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                {allDeliveries.map((delivery, index) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    index={index}
                    onStatusUpdate={onStatusUpdate}
                    onNavigation={onNavigation}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DeliveryRoutes;
