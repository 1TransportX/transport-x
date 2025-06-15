
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePhoneNumber } from '@/utils/security';
import { cn } from '@/lib/utils';

interface SecurePhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

const SecurePhoneInput: React.FC<SecurePhoneInputProps> = ({
  value,
  onChange,
  label = "Phone Number",
  placeholder = "1234567890",
  required = false,
  className,
  id
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (rawValue.length <= 10) {
      onChange(rawValue);
      
      if (touched && rawValue.length > 0) {
        const validation = validatePhoneNumber(rawValue);
        setError(validation.error || '');
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (value) {
      const validation = validatePhoneNumber(value);
      setError(validation.error || '');
    }
  };

  const formatDisplayValue = (phone: string) => {
    if (phone.length >= 6) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    } else if (phone.length >= 3) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    }
    return phone;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}{required && ' *'}</Label>
      <Input
        id={id}
        type="tel"
        value={formatDisplayValue(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        maxLength={14} // Formatted length
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SecurePhoneInput;
