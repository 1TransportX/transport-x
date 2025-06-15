
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IndianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const IndianPhoneInput: React.FC<IndianPhoneInputProps> = ({
  value,
  onChange,
  label = "Phone Number",
  placeholder = "XXXXX XXXXX",
  required = false,
  error
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Format the value for display
    if (value) {
      let cleanValue = value.replace(/\D/g, '');
      
      // Remove +91 if present at the start
      if (cleanValue.startsWith('91') && cleanValue.length >= 12) {
        cleanValue = cleanValue.substring(2);
      }
      
      // Format as XXXXX XXXXX
      if (cleanValue.length <= 10) {
        const formatted = cleanValue.replace(/(\d{5})(\d{5})/, '$1 $2');
        setDisplayValue(formatted);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let cleanValue = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleanValue.length > 10) {
      cleanValue = cleanValue.substring(0, 10);
    }
    
    // Format for display
    const formatted = cleanValue.replace(/(\d{5})(\d{5})/, '$1 $2');
    setDisplayValue(formatted);
    
    // Store with +91 prefix if we have digits
    if (cleanValue.length > 0) {
      onChange(`+91${cleanValue}`);
    } else {
      onChange('');
    }
  };

  const isValid = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 12 && cleanPhone.startsWith('91');
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="phone" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">+91</span>
        </div>
        <Input
          id="phone"
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-12 ${error ? 'border-red-500' : ''}`}
          required={required}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {value && !isValid(value) && !error && (
        <p className="text-sm text-orange-500">
          Please enter a valid 10-digit Indian phone number
        </p>
      )}
    </div>
  );
};
