
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useSecurity } from '@/contexts/SecurityContext';

interface SecureLocationSearchInputProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const SecureLocationSearchInput: React.FC<SecureLocationSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  label,
  required = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const { suggestions, isLoading, error, searchLocations, getPlaceDetails, clearSuggestions } = useLocationSearch();
  const { logSecurityEvent } = useSecurity();

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue && inputValue.length >= 3) {
        searchLocations(inputValue);
        setShowSuggestions(true);
      } else {
        clearSuggestions();
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchLocations, clearSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    try {
      logSecurityEvent('location_selected', 'info', { placeId: suggestion.place_id });
      
      // Get detailed address
      const detailedAddress = await getPlaceDetails(suggestion.place_id);
      const finalAddress = detailedAddress || suggestion.description;
      
      setInputValue(finalAddress);
      onChange(finalAddress);
      setShowSuggestions(false);
      clearSuggestions();
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error selecting suggestion:', error);
      // Fallback to description
      setInputValue(suggestion.description);
      onChange(suggestion.description);
      setShowSuggestions(false);
      clearSuggestions();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor="location-search" className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="location-search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required}
          className="pr-10"
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={suggestion.place_id}
                  ref={el => suggestionRefs.current[index] = el}
                  variant="ghost"
                  className={`w-full justify-start p-3 h-auto text-left rounded-none border-b last:border-b-0 ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                  <span className="break-words">{suggestion.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-3">
            <p className="text-sm text-gray-500 text-center">
              No locations found. Try a different search term.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecureLocationSearchInput;
