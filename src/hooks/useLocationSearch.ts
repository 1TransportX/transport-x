
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
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'autocomplete',
          params: {
            input: input.trim(),
            types: ['address'],
            componentRestrictions: { country: 'us' }
          }
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.status === 'OK' && data?.predictions) {
        setSuggestions(data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
        })));
      } else {
        setSuggestions([]);
        if (data?.status !== 'ZERO_RESULTS') {
          setError('Failed to fetch location suggestions');
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
      setError('Unable to search locations. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<string | null> => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          action: 'place-details',
          params: { placeId }
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.status === 'OK' && data?.result) {
        return data.result.formatted_address || null;
      }
      
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
