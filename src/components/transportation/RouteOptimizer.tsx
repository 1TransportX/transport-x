
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Route, MapPin, Clock, Navigation, Save, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
}

const RouteOptimizer = () => {
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const { toast } = useToast();
  
  const {
    optimizeRoute,
    saveOptimizedRoute,
    clearOptimizedRoute,
    isOptimizing,
    optimizedRoute
  } = useRouteOptimization();

  // Get current location
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a location in India if geolocation fails
          setCurrentLocation({
            latitude: 28.6139, // New Delhi
            longitude: 77.2090
          });
        }
      );
    }
  }, []);

  const { data: deliveries = [] } = useQuery({
    queryKey: ['pending-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Delivery[];
    }
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', 
          await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'driver')
            .then(res => res.data?.map(r => r.user_id) || [])
        );

      if (error) throw error;
      return data as Driver[];
    }
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      return data as Vehicle[];
    }
  });

  const selectedDeliveriesData = useMemo(() => {
    return deliveries.filter(d => selectedDeliveries.has(d.id));
  }, [deliveries, selectedDeliveries]);

  const handleSelectDelivery = (deliveryId: string, checked: boolean) => {
    const newSelected = new Set(selectedDeliveries);
    if (checked) {
      newSelected.add(deliveryId);
    } else {
      newSelected.delete(deliveryId);
    }
    setSelectedDeliveries(newSelected);
  };

  const handleOptimizeRoute = async () => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please allow location access to optimize routes.",
        variant: "destructive"
      });
      return;
    }

    const deliveryLocations = selectedDeliveriesData.map(d => ({
      id: d.id,
      address: d.customer_address,
      latitude: d.latitude,
      longitude: d.longitude
    }));

    await optimizeRoute(deliveryLocations, {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: "Current Location"
    });
  };

  const handleSaveRoute = async () => {
    if (!routeName || !selectedDriver || !selectedVehicle || !currentLocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    await saveOptimizedRoute(
      routeName,
      selectedDriver,
      selectedVehicle,
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: "Current Location"
      }
    );

    setShowSaveDialog(false);
    setRouteName('');
    setSelectedDriver('');
    setSelectedVehicle('');
    setSelectedDeliveries(new Set());
    clearOptimizedRoute();
  };

  const openInGoogleMaps = () => {
    if (!optimizedRoute || !currentLocation) return;

    const waypoints = optimizedRoute.optimizedOrder
      .map(index => optimizedRoute.deliveries[index])
      .filter(d => d.latitude && d.longitude)
      .map(d => `${d.latitude},${d.longitude}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${waypoints}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleOptimizeRoute}
              disabled={selectedDeliveries.size === 0 || isOptimizing}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
            </Button>
            
            {optimizedRoute && (
              <>
                <Button
                  variant="outline"
                  onClick={openInGoogleMaps}
                  className="flex items-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Open in Maps
                </Button>
                
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Route
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Optimized Route</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="routeName">Route Name</Label>
                        <Input
                          id="routeName"
                          value={routeName}
                          onChange={(e) => setRouteName(e.target.value)}
                          placeholder="Enter route name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver">Assign Driver</Label>
                        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.first_name} {driver.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle">Assign Vehicle</Label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map(vehicle => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleSaveRoute} className="w-full">
                        Save Route
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {optimizedRoute && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Total Distance: {optimizedRoute.totalDistance.toFixed(1)} km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Estimated Duration: {optimizedRoute.totalDuration} minutes
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Deliveries ({selectedDeliveries.size} selected)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Delivery #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                {optimizedRoute && <TableHead>Route Order</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => {
                const isSelected = selectedDeliveries.has(delivery.id);
                const routeIndex = optimizedRoute?.deliveries.findIndex(d => d.id === delivery.id);
                const orderInRoute = routeIndex !== undefined && routeIndex >= 0 
                  ? optimizedRoute?.optimizedOrder.indexOf(routeIndex) 
                  : -1;

                return (
                  <TableRow key={delivery.id} className={isSelected ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectDelivery(delivery.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.customer_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{delivery.customer_address}</TableCell>
                    <TableCell>{new Date(delivery.scheduled_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={delivery.status === 'pending' ? 'secondary' : 'default'}>
                        {delivery.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    {optimizedRoute && (
                      <TableCell>
                        {orderInRoute >= 0 ? (
                          <Badge variant="outline">Stop #{orderInRoute + 1}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteOptimizer;
