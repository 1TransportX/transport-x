
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
        mapsUrl
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      return null;
    }
  }, []);

  const generateMapsUrl = useCallback((
    deliveries: { address: string; latitude?: number; longitude?: number }[],
    startLocation?: { latitude: number; longitude: number }
  ): string => {
    const validDeliveries = deliveries.filter(d => d.latitude && d.longitude);
    
    if (validDeliveries.length === 0) {
      return '';
    }

    if (startLocation) {
      const waypoints = validDeliveries
        .map(d => `${d.latitude},${d.longitude}`)
        .join('/');
      return `https://www.google.com/maps/dir/${startLocation.latitude},${startLocation.longitude}/${waypoints}`;
    } else {
      // Use addresses if no coordinates available
      const addresses = deliveries.map(d => encodeURIComponent(d.address)).join('/');
      return `https://www.google.com/maps/dir/${addresses}`;
    }
  }, []);

  return {
    calculateRouteMetrics,
    generateMapsUrl
  };
};
