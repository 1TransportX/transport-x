
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { cn } from '@/lib/utils';

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
  label = "Address",
  required = false,
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const { suggestions, isLoading, error, searchLocations, getPlaceDetails, clearSuggestions } = useLocationSearch();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue && inputValue !== value) {
        searchLocations(inputValue);
        setShowSuggestions(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, value, searchLocations]);

  // Update input when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    // If user clears the input, also clear the parent value
    if (!newValue) {
      onChange('');
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    setShowSuggestions(false);
    setInputValue(suggestion.description);
    
    // Get detailed address information
    const detailedAddress = await getPlaceDetails(suggestion.place_id);
    onChange(detailedAddress || suggestion.description);
    
    clearSuggestions();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="secure-location-search">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
        <Input
          ref={inputRef}
          id="secure-location-search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="pl-10 pr-10"
          autoComplete="off"
        />
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              ref={el => suggestionRefs.current[index] = el}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
                selectedIndex === index && "bg-blue-50"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{suggestion.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecureLocationSearchInput;
