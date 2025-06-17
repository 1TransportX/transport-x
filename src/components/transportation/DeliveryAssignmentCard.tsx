
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, MapPin, Clock, Truck, Edit, Trash2, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch delivery details
  const { data: deliveries = [] } = useQuery({
    queryKey: ['assignment-deliveries', assignment.delivery_ids],
    queryFn: async () => {
      if (assignment.delivery_ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_number, customer_name, customer_address, status')
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Sort deliveries by optimized order if available
  const sortedDeliveries = assignment.optimized_order.length > 0 
    ? assignment.optimized_order.map(index => deliveries[index]).filter(Boolean)
    : deliveries;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-3 w-3" />
                  {assignment.total_distance.toFixed(1)} km
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-3 w-3" />
                  {formatDuration(assignment.estimated_duration)}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </div>
        </CardHeader>

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
