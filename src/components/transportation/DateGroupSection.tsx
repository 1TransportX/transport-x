
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Calendar, MapPin, Clock, Truck, Users, Package, Zap, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import DeliveryAssignmentCard from './DeliveryAssignmentCard';
import { useAuth } from '@/hooks/useAuth';

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
  onCreateAssignment: (date: string) => void;
  onOptimizeDate: (date: string) => void;
  onDeleteAssignment: (id: string) => void;
  isOptimizing: boolean;
}

const DateGroupSection: React.FC<DateGroupSectionProps> = ({
  dateGroup,
  drivers,
  onCreateAssignment,
  onOptimizeDate,
  onDeleteAssignment,
  isOptimizing
}) => {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const openInGoogleMaps = () => {
    // Collect all delivery addresses for this date
    const addresses: string[] = [];
    
    dateGroup.assignments.forEach(assignment => {
      assignment.delivery_ids.forEach((deliveryId: string) => {
        // This would need to be enhanced to get actual addresses
        // For now, we'll use a placeholder
        addresses.push(`Delivery ${deliveryId}`);
      });
    });

    if (addresses.length === 0) {
      return;
    }

    // Create Google Maps URL with multiple waypoints
    const origin = addresses[0];
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(1, -1).join('|');
    
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    if (waypoints) {
      mapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    
    window.open(mapsUrl, '_blank');
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
                {dateGroup.totalDistance > 0 && (
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {dateGroup.totalDistance.toFixed(1)} km
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      {formatDuration(dateGroup.totalDuration)}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  {profile?.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateAssignment(dateGroup.date);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                    >
                      Create Route
                    </Button>
                  )}
                  
                  {dateGroup.assignments.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGoogleMaps();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Open in Maps
                      </Button>
                      
                      {profile?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOptimizeDate(dateGroup.date);
                          }}
                          disabled={isOptimizing}
                          className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                        >
                          <Zap className={`h-4 w-4 mr-1 ${isOptimizing ? 'animate-spin' : ''}`} />
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
