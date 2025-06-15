import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Package, User, Route, Zap, Navigation, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from '@/components/dashboards/AddDeliveryDialog';
import RouteOptimizer from './RouteOptimizer';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';
import { ResponsiveHeader } from '@/components/ui/responsive-header';

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
  const isMobile = useIsMobile();
  
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
        console.error('Geocoding function error:', error);
        throw error;
      }

      console.log('Geocoding response:', data);

      if (data?.status === 'OK' && data?.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Geocoded location:', location);
        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: data.results[0].formatted_address
        };
      }

      console.log('No geocoding results for address:', address, 'Response:', data);
      return null;
    } catch (error) {
      console.error('Geocoding error for address', address, ':', error);
      return null;
    }
  };

  // Function to geocode all missing coordinates - only for pending and in_progress deliveries
  const geocodeAllMissingAddresses = async () => {
    const deliveriesWithoutCoordinates = deliveries.filter(d => 
      (!d.latitude || !d.longitude) && (d.status === 'pending' || d.status === 'in_progress')
    );

    if (deliveriesWithoutCoordinates.length === 0) {
      toast({
        title: "All Set",
        description: "All pending/in-progress deliveries already have coordinates.",
      });
      return;
    }

    setIsGeocodingAddresses(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const delivery of deliveriesWithoutCoordinates) {
        console.log('Processing delivery:', delivery.delivery_number, 'Address:', delivery.customer_address);
        
        const coordinates = await geocodeAddress(delivery.customer_address);
        
        if (coordinates) {
          console.log('Updating delivery', delivery.id, 'with coordinates:', coordinates);
          
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
            console.log('Successfully updated coordinates for delivery', delivery.id);
            successCount++;
          }
        } else {
          console.log('Failed to geocode address for delivery', delivery.id);
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Geocoding Complete",
        description: `Successfully geocoded ${successCount} addresses. ${failCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      // Refresh the data
      if (successCount > 0) {
        refetch();
      }
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

    // Filter only pending and in_progress deliveries
    const pendingDeliveries = deliveriesForDate.filter(d => d.status === 'pending' || d.status === 'in_progress');
    
    if (pendingDeliveries.length === 0) {
      toast({
        title: "No Pending Deliveries",
        description: "No pending or in-progress deliveries found for this date.",
        variant: "destructive"
      });
      return;
    }

    // Check if we need to geocode any addresses first
    const deliveriesWithoutCoordinates = pendingDeliveries.filter(d => !d.latitude || !d.longitude);

    if (deliveriesWithoutCoordinates.length > 0) {
      toast({
        title: "Geocoding Addresses",
        description: `Geocoding ${deliveriesWithoutCoordinates.length} addresses first...`,
      });

      // Geocode missing addresses
      for (const delivery of deliveriesWithoutCoordinates) {
        const coordinates = await geocodeAddress(delivery.customer_address);
        
        if (coordinates) {
          // Update the delivery object for immediate use
          delivery.latitude = coordinates.latitude;
          delivery.longitude = coordinates.longitude;
          
          // Update in database
          await supabase
            .from('deliveries')
            .update({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            })
            .eq('id', delivery.id);
        }
      }
    }

    // Now filter deliveries that have valid coordinates
    const deliveriesWithCoords = pendingDeliveries.filter(d => d.latitude && d.longitude);
    
    if (deliveriesWithCoords.length === 0) {
      toast({
        title: "No Valid Coordinates",
        description: "Could not geocode any delivery addresses.",
        variant: "destructive"
      });
      return;
    }

    console.log('Optimizing route for deliveries:', deliveriesWithCoords);

    const deliveryLocations = deliveriesWithCoords.map(d => ({
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
        description: `Optimized route for ${deliveriesWithCoords.length} deliveries on ${new Date(date).toLocaleDateString()}`,
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

    // Filter deliveries that have valid coordinates and are not completed
    const validDeliveries = deliveriesForDate.filter(d => 
      d.latitude && d.longitude && !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude))
      && (d.status === 'pending' || d.status === 'in_progress')
    );
    
    if (validDeliveries.length === 0) {
      toast({
        title: "No Valid Coordinates",
        description: "No pending/in-progress deliveries have valid coordinates for mapping.",
        variant: "destructive"
      });
      return;
    }

    console.log('Opening Google Maps for deliveries:', validDeliveries);

    // If we have an optimized route, use that order correctly
    let orderedDeliveries = validDeliveries;
    if (optimizedRoute && optimizedRoute.deliveries.length > 0) {
      console.log('Using optimized route order:', optimizedRoute.optimizedOrder);
      console.log('Optimized route deliveries:', optimizedRoute.deliveries);
      
      // Create ordered deliveries based on optimized order
      orderedDeliveries = optimizedRoute.optimizedOrder
        .map(index => {
          // Find the delivery in validDeliveries that matches the optimized route delivery at this index
          const routeDelivery = optimizedRoute.deliveries[index];
          return validDeliveries.find(d => d.id === routeDelivery.id);
        })
        .filter(d => d !== undefined) as Delivery[];
      
      console.log('Ordered deliveries for Google Maps:', orderedDeliveries);
      
      // Add any remaining deliveries not in the optimized route
      const optimizedIds = new Set(orderedDeliveries.map(d => d.id));
      const remainingDeliveries = validDeliveries.filter(d => !optimizedIds.has(d.id));
      orderedDeliveries = [...orderedDeliveries, ...remainingDeliveries];
    }

    // Create Google Maps URL with waypoints in the correct order
    const waypoints = orderedDeliveries
      .map(delivery => `${delivery.latitude},${delivery.longitude}`)
      .join('/');

    const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${waypoints}`;

    console.log('Opening Google Maps URL:', url);
    console.log('Waypoints in order:', orderedDeliveries.map(d => ({ 
      id: d.id, 
      customer: d.customer_name, 
      coords: `${d.latitude},${d.longitude}` 
    })));
    
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

  const missingCoordinatesCount = deliveries.filter(d => 
    (!d.latitude || !d.longitude) && (d.status === 'pending' || d.status === 'in_progress')
  ).length;

  // Mobile card renderer for deliveries
  const renderMobileDeliveryCard = (delivery: Delivery) => (
    <Card key={delivery.id} className="p-3">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-sm">{delivery.delivery_number}</p>
            <p className="text-sm text-gray-900">{delivery.customer_name}</p>
          </div>
          <Badge className={getStatusBadgeColor(delivery.status) + ' text-xs'}>
            {delivery.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 break-words">{delivery.customer_address}</p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>Date: {new Date(delivery.scheduled_date).toLocaleDateString()}</p>
          <p>Driver: {delivery.profiles 
            ? `${delivery.profiles.first_name} ${delivery.profiles.last_name}`
            : 'Unassigned'
          }</p>
          {delivery.delivery_items?.length > 0 && (
            <div>
              <p>Items:</p>
              <div className="ml-2">
                {delivery.delivery_items.map((item, index) => (
                  <p key={index}>{item.quantity}x {item.inventory?.product_name}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (error) {
    return (
      <div className={isMobile ? 'p-3' : 'p-6'}>
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
    <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-6'}`}>
      {/* Stats Cards - 2x2 grid on mobile */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
        <Card>
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center gap-2">
              <MapPin className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-blue-600`} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Total Routes</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center gap-2">
              <User className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-green-600`} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Assigned</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center gap-2">
              <Calendar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-yellow-600`} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Unassigned</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center gap-2">
              <Package className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-purple-600`} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Completed</p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Coordinates Alert */}
      {missingCoordinatesCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className={`font-medium text-orange-800 ${isMobile ? 'text-sm' : ''}`}>
                    {missingCoordinatesCount} deliveries missing coordinates
                  </p>
                  <p className={`text-orange-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Coordinates will be automatically fetched when needed for route optimization.
                  </p>
                </div>
              </div>
              <Button
                onClick={geocodeAllMissingAddresses}
                disabled={isGeocodingAddresses}
                className="flex items-center gap-2"
                variant="outline"
                size={isMobile ? "sm" : "default"}
              >
                <RefreshCw className={`h-4 w-4 ${isGeocodingAddresses ? 'animate-spin' : ''}`} />
                {isGeocodingAddresses ? 'Getting...' : isMobile ? 'Get Coords' : 'Get Missing Coordinates'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ResponsiveTabs defaultValue="daily-routes" className="w-full">
        <ResponsiveTabsList>
          <ResponsiveTabsTrigger value="daily-routes" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isMobile ? 'Daily' : 'Daily Route Optimization'}
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="optimizer" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            {isMobile ? 'Manual' : 'Manual Route Optimizer'}
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="deliveries" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {isMobile ? 'All' : 'All Deliveries'}
          </ResponsiveTabsTrigger>
        </ResponsiveTabsList>

        <ResponsiveTabsContent value="daily-routes">
          <div className="space-y-4">
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Daily Route Planning</h3>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setShowAddDeliveryDialog(true)}
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="h-4 w-4" />
                Add Route
              </Button>
            </div>
            
            {Object.entries(groupedDeliveries).map(([date, deliveriesForDate]) => {
              const pendingCount = deliveriesForDate.filter(d => d.status === 'pending').length;
              const completedCount = deliveriesForDate.filter(d => d.status === 'completed').length;
              const allCompleted = completedCount === deliveriesForDate.length;
              const validCoordinatesCount = deliveriesForDate.filter(d => d.latitude && d.longitude).length;
              
              return (
                <Card key={date}>
                  <CardHeader className={isMobile ? 'p-3 pb-2' : 'p-6'}>
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                          <Calendar className="h-5 w-5" />
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: isMobile ? 'short' : 'long', 
                            year: 'numeric', 
                            month: isMobile ? 'short' : 'long', 
                            day: 'numeric' 
                          })}
                          {allCompleted && (
                            <Badge className="bg-green-100 text-green-800 ml-2 text-xs">
                              Route Completed
                            </Badge>
                          )}
                        </CardTitle>
                        <p className={`text-gray-600 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {deliveriesForDate.length} total, {pendingCount} pending, {completedCount} completed
                        </p>
                      </div>
                      <div className={`flex ${isMobile ? 'flex-col space-y-2 w-full' : 'gap-2'}`}>
                        <Button
                          onClick={() => handleOptimizeRouteForDate(date, deliveriesForDate)}
                          disabled={pendingCount === 0 || isOptimizing}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Zap className="h-4 w-4" />
                          {isOptimizing ? 'Optimizing...' : isMobile ? 'Optimize' : 'Optimize Route'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openInGoogleMaps(deliveriesForDate)}
                          disabled={validCoordinatesCount === 0}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Navigation className="h-4 w-4" />
                          {isMobile ? 'Maps' : 'View in Maps'}
                        </Button>
                        <Button
                          onClick={() => handleCompleteRoute(date, deliveriesForDate)}
                          disabled={allCompleted}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isMobile ? 'Complete' : 'Complete Route'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={isMobile ? 'p-3 pt-0' : 'p-6 pt-0'}>
                    {optimizedRoute && (
                      <div className={`bg-blue-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg mb-4`}>
                        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center gap-4'}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              Optimized Route: {optimizedRoute.totalDistance.toFixed(1)} km
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-blue-600" />
                            <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              Duration: {optimizedRoute.totalDuration} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isMobile ? (
                      <div className="space-y-2">
                        {deliveriesForDate.map((delivery) => renderMobileDeliveryCard(delivery))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Delivery #</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead>Driver</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Status</TableHead>
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
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {Object.keys(groupedDeliveries).length === 0 && (
              <Card>
                <CardContent className={`${isMobile ? 'p-6' : 'p-12'} text-center`}>
                  <Calendar className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-gray-400 mx-auto mb-4`} />
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>No Scheduled Deliveries</h3>
                  <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                    Add some delivery routes to see daily optimization suggestions.
                  </p>
                  <Button onClick={() => setShowAddDeliveryDialog(true)} size={isMobile ? "sm" : "default"}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Delivery
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="optimizer">
          <RouteOptimizer />
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="deliveries">
          <Card>
            <CardHeader className={isMobile ? 'p-3 pb-2' : 'p-6'}>
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
                <div>
                  <CardTitle className={isMobile ? 'text-base' : ''}>All Delivery Routes ({filteredDeliveries.length})</CardTitle>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setShowAddDeliveryDialog(true)}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className="h-4 w-4" />
                  Add Route
                </Button>
              </div>
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isMobile ? "text-sm" : "max-w-sm"}
              />
            </CardHeader>
            <CardContent className={isMobile ? 'p-3 pt-0' : 'p-6 pt-0'}>
              {isMobile ? (
                <div className="space-y-2">
                  {filteredDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No delivery routes found.
                    </div>
                  ) : (
                    filteredDeliveries.map((delivery) => renderMobileDeliveryCard(delivery))
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                </div>
              )}
            </CardContent>
          </Card>
        </ResponsiveTabsContent>
      </ResponsiveTabs>

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
