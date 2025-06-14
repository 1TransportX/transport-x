
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, User, Clock, Navigation } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  status: 'active' | 'maintenance' | 'retired';
}

interface VehicleTrackingDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleAssignment {
  id: string;
  driver_id: string;
  vehicle_id: string;
  assigned_date: string;
  is_active: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface GPSLocation {
  id: string;
  location_lat: number;
  location_lng: number;
  vehicle_id: string | null;
  clock_in: string;
  created_at: string;
}

const VehicleTrackingDialog: React.FC<VehicleTrackingDialogProps> = ({ vehicle, open, onOpenChange }) => {
  const [lastKnownLocation, setLastKnownLocation] = useState<GPSLocation | null>(null);

  // Fetch current driver assignment
  const { data: assignment } = useQuery({
    queryKey: ['vehicle-assignment', vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          profiles:driver_id (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('vehicle_id', vehicle.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as VehicleAssignment | null;
    },
    enabled: open
  });

  // Fetch vehicle's GPS location from attendance records
  const { data: vehicleLocation } = useQuery({
    queryKey: ['vehicle-gps-location', vehicle.id],
    queryFn: async () => {
      // First try to get location directly linked to the vehicle
      let { data: directVehicleLocation, error: directError } = await supabase
        .from('attendance')
        .select('id, location_lat, location_lng, vehicle_id, clock_in, created_at')
        .eq('vehicle_id', vehicle.id)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (directVehicleLocation) {
        return directVehicleLocation as GPSLocation;
      }

      // If no direct vehicle location, get driver's location if assigned
      if (assignment?.driver_id) {
        const { data: driverLocation, error: driverError } = await supabase
          .from('attendance')
          .select('id, location_lat, location_lng, vehicle_id, clock_in, created_at')
          .eq('user_id', assignment.driver_id)
          .not('location_lat', 'is', null)
          .not('location_lng', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (driverError && driverError.code !== 'PGRST116') throw driverError;
        return driverLocation as GPSLocation | null;
      }

      return null;
    },
    enabled: open,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    if (vehicleLocation) {
      setLastKnownLocation(vehicleLocation);
    }
  }, [vehicleLocation]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openInMaps = () => {
    if (lastKnownLocation) {
      const url = `https://www.google.com/maps?q=${lastKnownLocation.location_lat},${lastKnownLocation.location_lng}`;
      window.open(url, '_blank');
    }
  };

  const getLocationAccuracy = () => {
    if (!lastKnownLocation) return null;
    
    const now = new Date();
    const locationTime = new Date(lastKnownLocation.created_at);
    const minutesAgo = Math.floor((now.getTime() - locationTime.getTime()) / (1000 * 60));
    
    if (minutesAgo < 5) return { status: 'Live', color: 'text-green-600' };
    if (minutesAgo < 30) return { status: 'Recent', color: 'text-yellow-600' };
    return { status: 'Outdated', color: 'text-red-600' };
  };

  const locationAccuracy = getLocationAccuracy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vehicle Tracking - {vehicle.vehicle_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {assignment.profiles.first_name} {assignment.profiles.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{assignment.profiles.phone}</p>
                  <p className="text-sm text-gray-600">
                    Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No driver currently assigned</p>
                  <p className="text-sm text-gray-400">Assign a driver to enable GPS tracking</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                GPS Location
                {locationAccuracy && (
                  <span className={`text-sm font-normal ${locationAccuracy.color}`}>
                    ({locationAccuracy.status})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastKnownLocation ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Latitude:</span>
                      <p>{lastKnownLocation.location_lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>
                      <p>{lastKnownLocation.location_lng.toFixed(6)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {formatDateTime(lastKnownLocation.created_at)}</span>
                  </div>

                  {lastKnownLocation.vehicle_id && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Navigation className="h-4 w-4" />
                      <span>Vehicle GPS tracking active</span>
                    </div>
                  )}
                  
                  <Button onClick={openInMaps} className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-2">
                    {assignment 
                      ? "No GPS location available"
                      : "No driver assigned to track location"
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    {assignment 
                      ? "Driver needs to clock in with location services enabled to show GPS data"
                      : "Assign a driver to this vehicle to enable GPS tracking"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleTrackingDialog;
