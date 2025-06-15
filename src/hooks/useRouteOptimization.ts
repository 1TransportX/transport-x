
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryLocation {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface OptimizedRoute {
  optimizedOrder: number[];
  totalDistance: number;
  totalDuration: number;
  deliveries: DeliveryLocation[];
  geocodingFailures?: number;
}

export const useRouteOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const { toast } = useToast();

  const optimizeRoute = useCallback(async (
    deliveries: DeliveryLocation[],
    startLocation: { latitude: number; longitude: number; address: string }
  ) => {
    if (deliveries.length === 0) {
      toast({
        title: "No deliveries",
        description: "Please select deliveries to optimize the route.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      console.log('Optimizing route for deliveries:', deliveries);
      
      const { data, error } = await supabase.functions.invoke('route-optimizer', {
        body: {
          deliveries,
          startLocation
        }
      });

      if (error) {
        throw error;
      }

      console.log('Route optimization result:', data);
      setOptimizedRoute(data);

      toast({
        title: "Route Optimized",
        description: `Optimized route for ${deliveries.length} deliveries. Total distance: ${data.totalDistance.toFixed(1)} km, Duration: ${data.totalDuration} minutes.`,
      });

      return data;
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  const saveOptimizedRoute = useCallback(async (
    routeName: string,
    driverId: string,
    vehicleId: string,
    startLocation: { latitude: number; longitude: number; address: string }
  ) => {
    if (!optimizedRoute) {
      toast({
        title: "No route to save",
        description: "Please optimize a route first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the route record
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert({
          route_name: routeName,
          driver_id: driverId,
          vehicle_id: vehicleId,
          start_location: startLocation.address,
          start_latitude: startLocation.latitude,
          start_longitude: startLocation.longitude,
          total_distance: optimizedRoute.totalDistance,
          estimated_duration: optimizedRoute.totalDuration,
          status: 'planned'
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create route stops in optimized order
      const routeStops = optimizedRoute.optimizedOrder.map((deliveryIndex, stopOrder) => {
        const delivery = optimizedRoute.deliveries[deliveryIndex];
        return {
          route_id: route.id,
          delivery_id: delivery.id,
          stop_order: stopOrder + 1,
          status: 'pending'
        };
      });

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(routeStops);

      if (stopsError) throw stopsError;

      // Update delivery coordinates in the database
      for (const delivery of optimizedRoute.deliveries) {
        if (delivery.latitude && delivery.longitude) {
          await supabase
            .from('deliveries')
            .update({
              latitude: delivery.latitude,
              longitude: delivery.longitude
            })
            .eq('id', delivery.id);
        }
      }

      toast({
        title: "Route Saved",
        description: `Route "${routeName}" has been saved successfully.`,
      });

      return route;
    } catch (error) {
      console.error('Error saving route:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the optimized route. Please try again.",
        variant: "destructive"
      });
    }
  }, [optimizedRoute, toast]);

  const clearOptimizedRoute = useCallback(() => {
    setOptimizedRoute(null);
  }, []);

  return {
    optimizeRoute,
    saveOptimizedRoute,
    clearOptimizedRoute,
    isOptimizing,
    optimizedRoute
  };
};
