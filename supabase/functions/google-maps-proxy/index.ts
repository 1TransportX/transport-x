
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (clientIP: string, maxRequests = 100, windowMs = 3600000): boolean => {
  const now = Date.now();
  const key = clientIP;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count++;
  return false;
};

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"'&]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim()
    .slice(0, 200);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced authentication verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Unauthorized access attempt');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response('Rate limit exceeded', { 
        status: 429, 
        headers: corsHeaders 
      });
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

    console.log('Google Maps API key found, length:', googleMapsApiKey.length);

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.warn('Invalid JSON in request body');
      return new Response('Invalid request format', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const { action, params } = requestBody;

    if (!action || !params) {
      return new Response('Missing required parameters', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    let response;

    switch (action) {
      case 'autocomplete':
        const { input, types = ['establishment', 'geocode'], componentRestrictions, language = 'en' } = params;
        
        // Enhanced input validation
        if (!input || typeof input !== 'string' || input.length < 2 || input.length > 200) {
          return new Response('Invalid input parameter', { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const sanitizedInput = sanitizeInput(input);
        
        // Additional validation for suspicious patterns
        if (sanitizedInput.length < 2) {
          return new Response('Input too short after sanitization', { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        autocompleteUrl.searchParams.set('input', sanitizedInput);
        autocompleteUrl.searchParams.set('key', googleMapsApiKey);
        autocompleteUrl.searchParams.set('language', language);
        
        if (types && Array.isArray(types)) {
          autocompleteUrl.searchParams.set('types', types.join('|'));
        }
        
        if (componentRestrictions?.country && typeof componentRestrictions.country === 'string') {
          autocompleteUrl.searchParams.set('components', `country:${componentRestrictions.country}`);
        }

        console.log('Making request to Google Maps API with URL:', autocompleteUrl.toString().replace(googleMapsApiKey, 'API_KEY_HIDDEN'));

        response = await fetch(autocompleteUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0'
          }
        });

        console.log('Google Maps API response status:', response.status);
        break;

      case 'place-details':
        const { placeId } = params;
        
        if (!placeId || typeof placeId !== 'string' || placeId.length > 100) {
          return new Response('Invalid place ID', { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // Validate place ID format (basic check)
        if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
          return new Response('Invalid place ID format', { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', placeId);
        detailsUrl.searchParams.set('key', googleMapsApiKey);
        detailsUrl.searchParams.set('fields', 'formatted_address,geometry,place_id');

        console.log('Making place details request to Google Maps API');

        response = await fetch(detailsUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0'
          }
        });
        break;

      default:
        console.warn(`Invalid action attempted: ${action}`);
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
    
    // Enhanced logging for security monitoring
    console.log(`Maps API request: ${action} from ${clientIP} - Status: ${data.status || 'success'} - Timestamp: ${new Date().toISOString()}`);

    // Log any API errors for debugging
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Maps API returned error status:', data.status, 'Error message:', data.error_message);
    }

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      },
    });

  } catch (error) {
    console.error('Error in google-maps-proxy:', error);
    
    // Don't expose internal error details in production
    const errorMessage = Deno.env.get('DENO_DEPLOYMENT_ID') ? 
      'Internal server error' : 
      `Internal server error: ${error.message}`;
      
    return new Response(errorMessage, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
