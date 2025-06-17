
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryLocation {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface RouteCalculationResult {
  totalDistance: number;
  totalDuration: number;
  optimizedOrder: number[];
  mapsUrl: string;
  optimizedDeliveries: DeliveryLocation[];
}

export const useRouteCalculations = () => {
  const calculateRouteMetrics = useCallback(async (
    deliveries: DeliveryLocation[],
    startLocation: { latitude: number; longitude: number; address: string }
  ): Promise<RouteCalculationResult | null> => {
    if (deliveries.length === 0) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('route-optimizer', {
        body: {
          deliveries,
          startLocation
        }
      });

      if (error) {
        console.error('Route calculation error:', error);
        return null;
      }

      // Generate Google Maps URL with optimized order
      const orderedDeliveries = data.optimizedOrder
        .map((index: number) => data.deliveries[index])
        .filter((d: DeliveryLocation) => d.latitude && d.longitude);

      const waypoints = orderedDeliveries
        .map((delivery: DeliveryLocation) => `${delivery.latitude},${delivery.longitude}`)
        .join('/');

      const mapsUrl = orderedDeliveries.length > 0 
        ? `https://www.google.com/maps/dir/${startLocation.latitude},${startLocation.longitude}/${waypoints}`
        : '';

      return {
        totalDistance: data.totalDistance,
        totalDuration: data.totalDuration,
        optimizedOrder: data.optimizedOrder,
        optimizedDeliveries: orderedDeliveries,
        mapsUrl
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      return null;
    }
  }, []);

  const generateOptimizedMapsUrl = useCallback(async (
    deliveries: { id: string; customer_address: string; latitude?: number; longitude?: number }[],
    startLocation?: { latitude: number; longitude: number }
  ): Promise<string> => {
    if (deliveries.length === 0) {
      return '';
    }

    // Use a more accurate default start location or get current location
    const defaultStart = {
      latitude: startLocation?.latitude || 28.6139, // New Delhi coordinates as fallback
      longitude: startLocation?.longitude || 77.2090,
      address: "Start Location"
    };

    // If we have coordinates and more than one delivery, optimize the route
    if (deliveries.length > 0 && deliveries.some(d => d.latitude && d.longitude)) {
      const deliveryLocations = deliveries.map(d => ({
        id: d.id,
        address: d.customer_address,
        latitude: d.latitude,
        longitude: d.longitude
      }));

      const optimizationResult = await calculateRouteMetrics(deliveryLocations, defaultStart);
      
      if (optimizationResult && optimizationResult.mapsUrl) {
        return optimizationResult.mapsUrl;
      }
    }

    // Fallback to address-based routing with proper start location
    const addresses = deliveries.map(d => encodeURIComponent(d.customer_address)).join('/');
    return `https://www.google.com/maps/dir/${defaultStart.latitude},${defaultStart.longitude}/${addresses}`;
  }, [calculateRouteMetrics]);

  const generateMapsUrl = useCallback((
    deliveries: { address: string; latitude?: number; longitude?: number }[],
    startLocation?: { latitude: number; longitude: number }
  ): string => {
    const validDeliveries = deliveries.filter(d => d.latitude && d.longitude);
    
    // Use more accurate start location
    const defaultStart = {
      latitude: startLocation?.latitude || 28.6139,
      longitude: startLocation?.longitude || 77.2090
    };

    if (validDeliveries.length === 0) {
      // Use addresses if no coordinates available
      const addresses = deliveries.map(d => encodeURIComponent(d.address)).join('/');
      return `https://www.google.com/maps/dir/${defaultStart.latitude},${defaultStart.longitude}/${addresses}`;
    }

    const waypoints = validDeliveries
      .map(d => `${d.latitude},${d.longitude}`)
      .join('/');
    return `https://www.google.com/maps/dir/${defaultStart.latitude},${defaultStart.longitude}/${waypoints}`;
  }, []);

  return {
    calculateRouteMetrics,
    generateMapsUrl,
    generateOptimizedMapsUrl
  };
};
