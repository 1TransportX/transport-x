
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizeInput, validateInputLength } from '@/utils/security';
import { cn } from '@/lib/utils';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  type?: 'text' | 'email' | 'tel' | 'password';
  className?: string;
  id?: string;
  allowSpaces?: boolean;
}

const SecureInput: React.FC<SecureInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  minLength = 1,
  maxLength = 255,
  type = 'text',
  className,
  id,
  allowSpaces = true
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeInput(rawValue, allowSpaces);
    
    // Validate length
    const validation = validateInputLength(sanitizedValue, minLength, maxLength, label);
    
    if (!validation.isValid && touched) {
      setError(validation.error || '');
    } else {
      setError('');
    }
    
    onChange(sanitizedValue);
  };

  const handleBlur = () => {
    setTouched(true);
    const validation = validateInputLength(value, minLength, maxLength, label);
    
    if (!validation.isValid) {
      setError(validation.error || '');
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}{required && ' *'}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SecureInput;
