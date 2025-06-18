
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Get Google Maps API key from environment
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Google Maps API key found');

    const requestBody = await req.json();
    const { action, params } = requestBody;

    console.log('Request received:', { action, params });

    if (!action || !params) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let apiUrl: string;
    let queryParams = new URLSearchParams();

    switch (action) {
      case 'autocomplete':
        const { input, types, componentRestrictions, language } = params;
        
        if (!input || input.length < 2) {
          return new Response(JSON.stringify({ 
            status: 'INVALID_REQUEST',
            error_message: 'Input too short'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        apiUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        queryParams.set('input', input);
        queryParams.set('key', googleMapsApiKey);
        queryParams.set('language', language || 'en');
        
        if (types && Array.isArray(types)) {
          queryParams.set('types', types.join('|'));
        }
        
        if (componentRestrictions?.country) {
          queryParams.set('components', `country:${componentRestrictions.country}`);
        }

        console.log('Making autocomplete request with params:', queryParams.toString());
        break;

      case 'place-details':
        const { placeId, fields } = params;
        
        if (!placeId) {
          return new Response(JSON.stringify({ error: 'Missing place ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        apiUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
        queryParams.set('place_id', placeId);
        queryParams.set('key', googleMapsApiKey);
        queryParams.set('fields', fields || 'formatted_address,geometry');

        console.log('Making place details request for:', placeId);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const fullUrl = `${apiUrl}?${queryParams.toString()}`;
    console.log('Full API URL (without key):', fullUrl.replace(googleMapsApiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      console.error(`Google Maps API HTTP error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ 
        error: 'Google Maps API error',
        status: response.status 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Google Maps API response status:', data.status);
    
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Maps API error:', data.status, data.error_message);
    }

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in google-maps-proxy:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
