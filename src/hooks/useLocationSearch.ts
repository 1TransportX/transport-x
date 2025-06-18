
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutocompleteResult {
  place_id: string;
  description: string;
  formatted_address?: string;
}

interface LocationSearchHook {
  suggestions: AutocompleteResult[];
  isLoading: boolean;
  error: string | null;
  searchLocations: (input: string) => Promise<void>;
  getPlaceDetails: (placeId: string) => Promise<string | null>;
  clearSuggestions: () => void;
}

export const useLocationSearch = (): LocationSearchHook => {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocations = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Searching for locations with input:', input);
      
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'autocomplete',
          params: {
            input: input.trim(),
            types: ['address'],
            componentRestrictions: { country: 'in' },
            language: 'en'
          }
        }
      });

      console.log('Google Maps response:', data);

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error('Failed to connect to location service');
      }

      if (data?.status === 'OK' && data?.predictions) {
        const mappedSuggestions = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
        }));
        console.log('Mapped suggestions:', mappedSuggestions);
        setSuggestions(mappedSuggestions);
      } else if (data?.status === 'ZERO_RESULTS') {
        console.log('No results found for:', input);
        setSuggestions([]);
      } else {
        console.error('Unexpected API response:', data);
        setSuggestions([]);
        setError('No locations found. Please try a different search term.');
      }
    } catch (err) {
      console.error('Location search error:', err);
      setError('Unable to search locations. Please check your connection and try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<string | null> => {
    try {
      console.log('Getting place details for:', placeId);
      
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'place-details',
          params: { 
            placeId,
            fields: 'formatted_address,geometry'
          }
        }
      });

      if (functionError) {
        console.error('Place details function error:', functionError);
        throw functionError;
      }

      if (data?.status === 'OK' && data?.result) {
        console.log('Place details result:', data.result);
        return data.result.formatted_address || null;
      }
      
      console.log('No place details found');
      return null;
    } catch (err) {
      console.error('Place details error:', err);
      return null;
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchLocations,
    getPlaceDetails,
    clearSuggestions
  };
};
