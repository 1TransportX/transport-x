
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Calendar, Users, Package, Zap, Navigation, Truck } from 'lucide-react';
import { format } from 'date-fns';
import DeliveryAssignmentCard from './DeliveryAssignmentCard';
import { useAuth } from '@/hooks/useAuth';
import { useRouteCalculations } from '@/hooks/useRouteCalculations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DateGroup {
  date: string;
  assignments: any[];
  totalDrivers: number;
  totalDeliveries: number;
  totalDistance: number;
  totalDuration: number;
  unassignedDeliveries: number;
}

interface DateGroupSectionProps {
  dateGroup: DateGroup;
  drivers: any[];
  onOptimizeDate: (date: string) => void;
  onDeleteAssignment: (id: string) => void;
  isOptimizing: boolean;
}

const DateGroupSection: React.FC<DateGroupSectionProps> = ({
  dateGroup,
  drivers,
  onOptimizeDate,
  onDeleteAssignment,
  isOptimizing
}) => {
  const { profile } = useAuth();
  const { generateOptimizedMapsUrl } = useRouteCalculations();
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch all deliveries for this date to create optimized maps link
  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['date-deliveries', dateGroup.date],
    queryFn: async () => {
      const allDeliveryIds = dateGroup.assignments.flatMap(a => a.delivery_ids);
      if (allDeliveryIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, customer_address, latitude, longitude')
        .in('id', allDeliveryIds);

      if (error) throw error;
      return data;
    },
    enabled: dateGroup.assignments.length > 0
  });

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
  };

  const openInGoogleMaps = async () => {
    if (allDeliveries.length === 0) return;

    const mapsUrl = await generateOptimizedMapsUrl(allDeliveries);
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
    }
  };

  const isToday = new Date().toISOString().split('T')[0] === dateGroup.date;
  const dateDisplay = format(new Date(dateGroup.date), 'EEEE, MMMM d, yyyy');

  return (
    <Card className={`${isToday ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {dateDisplay}
                    {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {dateGroup.totalDrivers} drivers
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {dateGroup.totalDeliveries} deliveries
                    </div>
                    {dateGroup.unassignedDeliveries > 0 && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {dateGroup.unassignedDeliveries} unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {dateGroup.assignments.length > 0 && (
                    <>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGoogleMaps();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Open in Maps
                      </Button>
                      
                      {profile?.role === 'admin' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOptimizeDate(dateGroup.date);
                          }}
                          disabled={isOptimizing}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 flex items-center gap-2"
                        >
                          <Zap className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                          Optimize Route
                        </Button>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-center w-10 h-8">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {dateGroup.assignments.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No route assignments for this date</p>
                {dateGroup.unassignedDeliveries > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {dateGroup.unassignedDeliveries} deliveries available for assignment
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dateGroup.assignments.map((assignment) => (
                  <DeliveryAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    driverName={getDriverName(assignment.driver_id)}
                    onDelete={() => onDeleteAssignment(assignment.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DateGroupSection;
