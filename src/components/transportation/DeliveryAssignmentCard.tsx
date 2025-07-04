import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Truck, Edit, Trash2, Route, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouteCalculations } from '@/hooks/useRouteCalculations';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeliveryAssignmentCardProps {
  assignment: {
    id: string;
    driver_id: string;
    delivery_ids: string[];
    optimized_order: number[];
    total_distance: number;
    estimated_duration: number;
    status: string;
  };
  driverName: string;
  onDelete: () => void;
}

const DeliveryAssignmentCard: React.FC<DeliveryAssignmentCardProps> = ({
  assignment,
  driverName,
  onDelete
}) => {
  const { profile } = useAuth();
  const { generateOptimizedMapsUrl } = useRouteCalculations();
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  // Fetch delivery details
  const { data: deliveries = [] } = useQuery({
    queryKey: ['assignment-deliveries', assignment.delivery_ids],
    queryFn: async () => {
      if (assignment.delivery_ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_number, customer_name, customer_address, status, latitude, longitude')
        .in('id', assignment.delivery_ids);

      if (error) throw error;
      return data;
    },
    enabled: assignment.delivery_ids.length > 0
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openRouteInGoogleMaps = async () => {
    if (deliveries.length === 0) return;

    const mapsUrl = await generateOptimizedMapsUrl(deliveries);
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
    }
  };

  // Sort deliveries by optimized order if available
  const sortedDeliveries = assignment.optimized_order.length > 0 
    ? assignment.optimized_order.map(index => deliveries[index]).filter(Boolean)
    : deliveries;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3`}>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{driverName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {assignment.delivery_ids.length} deliveries
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'items-center gap-2'}`}>
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-1'}`}>
                  {assignment.status === 'planned' && deliveries.length > 0 && (
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "sm"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openRouteInGoogleMaps();
                      }}
                      className={`bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 ${isMobile ? 'w-full' : ''}`}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Open in Maps
                    </Button>
                  )}
                  
                  {profile?.role === 'admin' && (
                    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-1'}`}>
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add edit functionality here
                        }}
                        className={isMobile ? 'w-full' : ''}
                      >
                        <Edit className="h-4 w-4" />
                        {isMobile && <span className="ml-2">Edit</span>}
                      </Button>
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className={isMobile ? 'w-full' : ''}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isMobile && <span className="ml-2">Delete</span>}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className={`flex items-center justify-center ${isMobile ? 'w-full mt-2' : 'w-10 h-8'}`}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {assignment.optimized_order.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <Route className="h-4 w-4" />
                  Route optimized for shortest distance
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Delivery Stops:</h4>
                {sortedDeliveries.length === 0 ? (
                  <p className="text-sm text-gray-500">No deliveries assigned</p>
                ) : (
                  <div className="space-y-2">
                    {sortedDeliveries.map((delivery, index) => (
                      <div key={delivery.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {delivery.delivery_number}
                            </Badge>
                            <span className="font-medium text-sm">{delivery.customer_name}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {delivery.customer_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DeliveryAssignmentCard;
