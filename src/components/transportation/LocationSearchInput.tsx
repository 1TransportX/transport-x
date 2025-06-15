
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: typeof google;
  }
}

interface LocationSearchInputProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  label = "Address",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google?.maps?.places) {
      initializeAutocomplete();
      setIsLoaded(true);
    } else {
      // Load Google Maps API
      loadGoogleMapsAPI();
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const loadGoogleMapsAPI = () => {
    // Check if script is already loading or loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initializeAutocomplete();
          setIsLoaded(true);
        }
      }, 100);
      return;
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem('google_maps_api_key');
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeAutocomplete();
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }, // Restrict to US addresses
      fields: ['formatted_address', 'geometry', 'place_id']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place && place.formatted_address) {
        onChange(place.formatted_address);
      }
    });
  };

  return (
    <div>
      <Label htmlFor="location-search">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          id="location-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLoaded ? placeholder : "Loading maps..."}
          required={required}
          className="pl-10"
          disabled={!isLoaded}
        />
      </div>
      {!isLoaded && (
        <p className="text-xs text-gray-500 mt-1">
          Loading Google Maps for address suggestions...
        </p>
      )}
    </div>
  );
};

export default LocationSearchInput;
