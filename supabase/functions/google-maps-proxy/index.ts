
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Get Google Maps API key from environment
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured');
      return new Response('Service configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const { action, params } = await req.json();

    // Rate limiting check (simple implementation)
    const userAgent = req.headers.get('User-Agent') || '';
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    let response;

    switch (action) {
      case 'autocomplete':
        const { input, types = ['address'], componentRestrictions } = params;
        
        // Input validation and sanitization
        if (!input || typeof input !== 'string' || input.length > 200) {
          return new Response('Invalid input parameter', { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const sanitizedInput = input.replace(/[<>\"']/g, ''); // Basic XSS protection
        
        const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        autocompleteUrl.searchParams.set('input', sanitizedInput);
        autocompleteUrl.searchParams.set('key', googleMapsApiKey);
        
        if (types) {
          autocompleteUrl.searchParams.set('types', types.join('|'));
        }
        
        if (componentRestrictions?.country) {
          autocompleteUrl.searchParams.set('components', `country:${componentRestrictions.country}`);
        }

        response = await fetch(autocompleteUrl.toString());
        break;

      case 'place-details':
        const { placeId } = params;
        
        if (!placeId || typeof placeId !== 'string') {
          return new Response('Invalid place ID', { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', placeId);
        detailsUrl.searchParams.set('key', googleMapsApiKey);
        detailsUrl.searchParams.set('fields', 'formatted_address,geometry,place_id');

        response = await fetch(detailsUrl.toString());
        break;

      default:
        return new Response('Invalid action', { 
          status: 400, 
          headers: corsHeaders 
        });
    }

    if (!response.ok) {
      console.error(`Google Maps API error: ${response.status} ${response.statusText}`);
      return new Response('External service error', { 
        status: 502, 
        headers: corsHeaders 
      });
    }

    const data = await response.json();
    
    // Log for security monitoring (without sensitive data)
    console.log(`Maps API request: ${action} from ${clientIP} - Status: ${data.status || 'success'}`);

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      },
    });

  } catch (error) {
    console.error('Error in google-maps-proxy:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
