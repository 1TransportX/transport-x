import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, MapPin, Package, User, Route, Zap, Navigation, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from '@/components/dashboards/AddDeliveryDialog';
import RouteOptimizer from './RouteOptimizer';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: string;
  driver_id: string | null;
  latitude?: number;
  longitude?: number;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  delivery_items: Array<{
    quantity: number;
    inventory: {
      product_name: string;
    };
  }>;
}

interface GroupedDeliveries {
  [date: string]: Delivery[];
}

const RouteManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDeliveryDialog, setShowAddDeliveryDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isGeocodingAddresses, setIsGeocodingAddresses] = useState(false);
  const { toast } = useToast();
  
  const {
    optimizeRoute,
    saveOptimizedRoute,
    clearOptimizedRoute,
    isOptimizing,
    optimizedRoute
  } = useRouteOptimization();

  console.log('RouteManagement: Component rendering');

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

  const { data: deliveries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['routes-deliveries'],
    queryFn: async () => {
      console.log('RouteManagement: Fetching deliveries...');
      try {
        const { data, error } = await supabase
          .from('deliveries')
          .select(`
            id,
            delivery_number,
            customer_name,
            customer_address,
            scheduled_date,
            status,
            driver_id,
            latitude,
            longitude,
            profiles:driver_id(first_name, last_name),
            delivery_items(
              quantity,
              inventory(product_name)
            )
          `)
          .order('scheduled_date', { ascending: true });

        if (error) {
          console.error('RouteManagement: Error fetching deliveries:', error);
          throw error;
        }
        
        console.log('RouteManagement: Fetched deliveries:', data);
        return (data || []) as Delivery[];
      } catch (error) {
        console.error('RouteManagement: Query error:', error);
        throw error;
      }
    }
  });

  // Function to geocode a single address
  const geocodeAddress = async (address: string) => {
    try {
      console.log('Geocoding address:', address);
      
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'geocode',
          params: {
            address: address.trim(),
            region: 'in'
          }
        }
      });

      if (error) {
        console.error('Geocoding error:', error);
        return null;
      }

      if (data?.status === 'OK' && data?.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Geocoded location:', location);
        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: data.results[0].formatted_address
        };
      }

      console.log('No geocoding results for address:', address);
      return null;
    } catch (error) {
      console.error('Geocoding error for address', address, ':', error);
      return null;
    }
  };

  // Function to geocode all missing coordinates
  const geocodeAllMissingAddresses = async () => {
    const deliveriesWithoutCoordinates = deliveries.filter(d => 
      !d.latitude || !d.longitude
    );

    if (deliveriesWithoutCoordinates.length === 0) {
      toast({
        title: "All Set",
        description: "All deliveries already have coordinates.",
      });
      return;
    }

    setIsGeocodingAddresses(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const delivery of deliveriesWithoutCoordinates) {
        const coordinates = await geocodeAddress(delivery.customer_address);
        
        if (coordinates) {
          // Update the delivery with coordinates
          const { error } = await supabase
            .from('deliveries')
            .update({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            })
            .eq('id', delivery.id);

          if (error) {
            console.error('Error updating coordinates for delivery', delivery.id, ':', error);
            failCount++;
          } else {
            successCount++;
          }
        } else {
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Geocoding Complete",
        description: `Successfully geocoded ${successCount} addresses. ${failCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error during batch geocoding:', error);
      toast({
        title: "Geocoding Error",
        description: "An error occurred while geocoding addresses.",
        variant: "destructive"
      });
    } finally {
      setIsGeocodingAddresses(false);
    }
  };

  const groupedDeliveries = useMemo((): GroupedDeliveries => {
    if (!deliveries) return {};
    
    return deliveries.reduce((groups: GroupedDeliveries, delivery) => {
      const date = delivery.scheduled_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(delivery);
      return groups;
    }, {});
  }, [deliveries]);

  const stats = useMemo(() => {
    if (!deliveries || deliveries.length === 0) {
      return {
        total: 0,
        assigned: 0,
        unassigned: 0,
        completed: 0
      };
    }

    const totalRoutes = deliveries.length;
    const assignedRoutes = deliveries.filter(d => d.driver_id).length;
    const unassignedRoutes = deliveries.filter(d => !d.driver_id).length;
    const completedRoutes = deliveries.filter(d => d.status === 'completed').length;

    return {
      total: totalRoutes,
      assigned: assignedRoutes,
      unassigned: unassignedRoutes,
      completed: completedRoutes
    };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    
    return deliveries.filter(delivery =>
      delivery.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deliveries, searchTerm]);

  const handleOptimizeRouteForDate = async (date: string, deliveriesForDate: Delivery[]) => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please allow location access to optimize routes.",
        variant: "destructive"
      });
      return;
    }

    // First, check if we need to geocode any addresses
    const deliveriesWithoutCoordinates = deliveriesForDate.filter(d => 
      d.status === 'pending' && (!d.latitude || !d.longitude)
    );

    if (deliveriesWithoutCoordinates.length > 0) {
      toast({
        title: "Geocoding Required",
        description: `${deliveriesWithoutCoordinates.length} deliveries need coordinates. Please click "Get Missing Coordinates" first.`,
        variant: "destructive"
      });
      return;
    }

    // Filter only pending deliveries that have coordinates
    const pendingDeliveries = deliveriesForDate.filter(d => 
      d.status === 'pending' && d.latitude && d.longitude
    );
    
    if (pendingDeliveries.length === 0) {
      toast({
        title: "No Valid Deliveries",
        description: "No pending deliveries with valid coordinates found for this date.",
        variant: "destructive"
      });
      return;
    }

    console.log('Optimizing route for deliveries:', pendingDeliveries);

    const deliveryLocations = pendingDeliveries.map(d => ({
      id: d.id,
      address: d.customer_address,
      latitude: d.latitude,
      longitude: d.longitude
    }));

    try {
      await optimizeRoute(deliveryLocations, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: "Current Location"
      });

      toast({
        title: "Route Optimized",
        description: `Optimized route for ${pendingDeliveries.length} deliveries on ${new Date(date).toLocaleDateString()}`,
      });
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize route. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openInGoogleMaps = (deliveriesForDate: Delivery[]) => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please allow location access to open in Google Maps.",
        variant: "destructive"
      });
      return;
    }

    // Filter deliveries that have valid coordinates
    const validDeliveries = deliveriesForDate.filter(d => 
      d.latitude && d.longitude && !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude))
    );
    
    if (validDeliveries.length === 0) {
      toast({
        title: "No Valid Coordinates",
        description: "No deliveries have valid coordinates for mapping.",
        variant: "destructive"
      });
      return;
    }

    console.log('Opening Google Maps for deliveries:', validDeliveries);

    // If we have an optimized route, use that order
    let orderedDeliveries = validDeliveries;
    if (optimizedRoute && optimizedRoute.deliveries.length > 0) {
      // Match deliveries with optimized route order
      orderedDeliveries = optimizedRoute.optimizedOrder
        .map(index => optimizedRoute.deliveries[index])
        .map(routeDelivery => validDeliveries.find(d => d.id === routeDelivery.id))
        .filter(d => d !== undefined) as Delivery[];
      
      // Add any remaining deliveries not in the optimized route
      const optimizedIds = new Set(orderedDeliveries.map(d => d.id));
      const remainingDeliveries = validDeliveries.filter(d => !optimizedIds.has(d.id));
      orderedDeliveries = [...orderedDeliveries, ...remainingDeliveries];
    }

    // Create destination parameter for Google Maps
    const destination = orderedDeliveries[orderedDeliveries.length - 1];
    const waypoints = orderedDeliveries.slice(0, -1);

    // Build Google Maps URL with proper waypoint format
    let url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}`;
    
    if (waypoints.length > 0) {
      const waypointParams = waypoints
        .map(d => `${d.latitude},${d.longitude}`)
        .join('/');
      url += `/${waypointParams}`;
    }
    
    url += `/${destination.latitude},${destination.longitude}`;

    console.log('Opening Google Maps URL:', url);
    window.open(url, '_blank');
  };

  const handleCompleteRoute = async (date: string, deliveriesForDate: Delivery[]) => {
    try {
      console.log('RouteManagement: Completing route for date:', date);
      
      // Get deliveries that are not already completed
      const deliveriesToComplete = deliveriesForDate.filter(d => d.status !== 'completed');
      
      if (deliveriesToComplete.length === 0) {
        toast({
          title: "Route Already Completed",
          description: "All deliveries for this date are already marked as completed.",
          variant: "destructive"
        });
        return;
      }

      const deliveryIds = deliveriesToComplete.map(d => d.id);
      
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .in('id', deliveryIds);

      if (error) {
        console.error('RouteManagement: Error completing route:', error);
        toast({
          title: "Error",
          description: "Failed to complete route. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Route Completed",
        description: `Marked ${deliveriesToComplete.length} deliveries as completed for ${new Date(date).toLocaleDateString()}`,
      });

      // Refresh the data
      refetch();
    } catch (error) {
      console.error('RouteManagement: Error in handleCompleteRoute:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while completing the route.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const missingCoordinatesCount = deliveries.filter(d => !d.latitude || !d.longitude).length;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading route data: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Coordinates Alert */}
      {missingCoordinatesCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">
                    {missingCoordinatesCount} deliveries missing coordinates
                  </p>
                  <p className="text-sm text-orange-600">
                    Coordinates are required for route optimization and navigation.
                  </p>
                </div>
              </div>
              <Button
                onClick={geocodeAllMissingAddresses}
                disabled={isGeocodingAddresses}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isGeocodingAddresses ? 'animate-spin' : ''}`} />
                {isGeocodingAddresses ? 'Getting Coordinates...' : 'Get Missing Coordinates'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="daily-routes" className="w-full">
        <TabsList>
          <TabsTrigger value="daily-routes" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Route Optimization
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Deliveries
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Manual Route Optimizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-routes">
          <div className="space-y-4">
            {Object.entries(groupedDeliveries).map(([date, deliveriesForDate]) => {
              const pendingCount = deliveriesForDate.filter(d => d.status === 'pending').length;
              const completedCount = deliveriesForDate.filter(d => d.status === 'completed').length;
              const allCompleted = completedCount === deliveriesForDate.length;
              const validCoordinatesCount = deliveriesForDate.filter(d => d.latitude && d.longitude).length;
              
              return (
                <Card key={date}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {allCompleted && (
                            <Badge className="bg-green-100 text-green-800 ml-2">
                              Route Completed
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {deliveriesForDate.length} total deliveries, {pendingCount} pending, {completedCount} completed
                          {validCoordinatesCount < deliveriesForDate.length && (
                            <span className="text-orange-600 ml-2">
                              ({deliveriesForDate.length - validCoordinatesCount} missing coordinates)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOptimizeRouteForDate(date, deliveriesForDate)}
                          disabled={pendingCount === 0 || isOptimizing || validCoordinatesCount === 0}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Zap className="h-4 w-4" />
                          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openInGoogleMaps(deliveriesForDate)}
                          disabled={validCoordinatesCount === 0}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Navigation className="h-4 w-4" />
                          View in Maps
                        </Button>
                        <Button
                          onClick={() => handleCompleteRoute(date, deliveriesForDate)}
                          disabled={allCompleted}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete Route
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {optimizedRoute && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              Optimized Route: {optimizedRoute.totalDistance.toFixed(1)} km
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              Duration: {optimizedRoute.totalDuration} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Delivery #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Coordinates</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deliveriesForDate.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                            <TableCell>{delivery.customer_name}</TableCell>
                            <TableCell className="max-w-xs truncate">{delivery.customer_address}</TableCell>
                            <TableCell>
                              {delivery.profiles 
                                ? `${delivery.profiles.first_name} ${delivery.profiles.last_name}`
                                : 'Unassigned'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {delivery.delivery_items?.length > 0 ? (
                                  delivery.delivery_items.map((item, index) => (
                                    <div key={index}>
                                      {item.quantity}x {item.inventory?.product_name}
                                    </div>
                                  ))
                                ) : (
                                  'No items'
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(delivery.status)}>
                                {delivery.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {delivery.latitude && delivery.longitude ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Valid
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  Missing
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
            
            {Object.keys(groupedDeliveries).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Deliveries</h3>
                  <p className="text-gray-600 mb-4">
                    Add some delivery routes to see daily optimization suggestions.
                  </p>
                  <Button onClick={() => setShowAddDeliveryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Delivery
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Delivery Routes ({filteredDeliveries.length})</CardTitle>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setShowAddDeliveryDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Route
                </Button>
              </div>
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No delivery routes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                        <TableCell>{delivery.customer_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{delivery.customer_address}</TableCell>
                        <TableCell>
                          {new Date(delivery.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {delivery.profiles 
                            ? `${delivery.profiles.first_name} ${delivery.profiles.last_name}`
                            : 'Unassigned'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {delivery.delivery_items?.length > 0 ? (
                              delivery.delivery_items.map((item, index) => (
                                <div key={index}>
                                  {item.quantity}x {item.inventory?.product_name}
                                </div>
                              ))
                            ) : (
                              'No items'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(delivery.status)}>
                            {delivery.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizer">
          <RouteOptimizer />
        </TabsContent>
      </Tabs>

      <AddDeliveryDialog 
        isOpen={showAddDeliveryDialog}
        onClose={() => setShowAddDeliveryDialog(false)}
        onSuccess={() => {
          setShowAddDeliveryDialog(false);
          refetch();
        }}
      />
    </div>
  );
};

export default RouteManagement;
