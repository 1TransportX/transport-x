
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeliveryLocation {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface OptimizeRouteRequest {
  deliveries: DeliveryLocation[];
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      return new Response('Service configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const requestBody: OptimizeRouteRequest = await req.json();
    const { deliveries, startLocation } = requestBody;

    if (!deliveries || deliveries.length === 0) {
      return new Response('No deliveries provided', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Optimizing route for ${deliveries.length} deliveries`);

    // First, geocode any addresses that don't have coordinates
    const geocodedDeliveries = await Promise.all(
      deliveries.map(async (delivery) => {
        if (delivery.latitude && delivery.longitude) {
          return delivery;
        }

        try {
          const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
          geocodeUrl.searchParams.set('address', delivery.address);
          geocodeUrl.searchParams.set('key', googleMapsApiKey);
          geocodeUrl.searchParams.set('region', 'in'); // Bias towards India

          const response = await fetch(geocodeUrl.toString());
          const data = await response.json();

          if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
              ...delivery,
              latitude: location.lat,
              longitude: location.lng
            };
          }
        } catch (error) {
          console.error(`Failed to geocode ${delivery.address}:`, error);
        }

        return delivery;
      })
    );

    // Filter out deliveries that couldn't be geocoded
    const validDeliveries = geocodedDeliveries.filter(d => d.latitude && d.longitude);

    if (validDeliveries.length === 0) {
      return new Response('No valid delivery locations found', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // If only one delivery, return simple route
    if (validDeliveries.length === 1) {
      return new Response(JSON.stringify({
        optimizedOrder: [0],
        totalDistance: 0,
        totalDuration: 0,
        deliveries: validDeliveries
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create distance matrix request
    const origins = [startLocation, ...validDeliveries];
    const destinations = validDeliveries;

    const matrixUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    matrixUrl.searchParams.set('origins', origins.map(o => `${o.latitude},${o.longitude}`).join('|'));
    matrixUrl.searchParams.set('destinations', destinations.map(d => `${d.latitude},${d.longitude}`).join('|'));
    matrixUrl.searchParams.set('key', googleMapsApiKey);
    matrixUrl.searchParams.set('units', 'metric');
    matrixUrl.searchParams.set('mode', 'driving');

    const matrixResponse = await fetch(matrixUrl.toString());
    const matrixData = await matrixResponse.json();

    if (matrixData.status !== 'OK') {
      throw new Error('Distance matrix request failed');
    }

    // Simple nearest neighbor optimization (for production, consider using OR-Tools)
    const optimizedOrder = nearestNeighborTSP(matrixData.rows, validDeliveries.length);
    
    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < optimizedOrder.length; i++) {
      const fromIndex = i === 0 ? 0 : optimizedOrder[i - 1] + 1; // +1 because first row is start location
      const toIndex = optimizedOrder[i] + 1; // +1 because destinations don't include start location
      
      const element = matrixData.rows[fromIndex]?.elements[optimizedOrder[i]];
      if (element && element.status === 'OK') {
        totalDistance += element.distance.value; // in meters
        totalDuration += element.duration.value; // in seconds
      }
    }

    return new Response(JSON.stringify({
      optimizedOrder,
      totalDistance: totalDistance / 1000, // convert to km
      totalDuration: Math.round(totalDuration / 60), // convert to minutes
      deliveries: validDeliveries,
      geocodingFailures: deliveries.length - validDeliveries.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Simple nearest neighbor TSP approximation
function nearestNeighborTSP(distanceMatrix: any[], numDeliveries: number): number[] {
  const visited = new Set<number>();
  const route: number[] = [];
  let currentIndex = 0; // Start from the start location (index 0)

  while (route.length < numDeliveries) {
    let nearestIndex = -1;
    let shortestDistance = Infinity;

    // Find nearest unvisited delivery
    for (let i = 0; i < numDeliveries; i++) {
      if (!visited.has(i)) {
        const element = distanceMatrix[currentIndex]?.elements[i];
        if (element && element.status === 'OK' && element.distance.value < shortestDistance) {
          shortestDistance = element.distance.value;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      visited.add(nearestIndex);
      route.push(nearestIndex);
      currentIndex = nearestIndex + 1; // +1 because we need to look at the row for this delivery
    } else {
      break;
    }
  }

  return route;
}
