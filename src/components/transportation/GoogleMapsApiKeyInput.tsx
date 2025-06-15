
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Key } from 'lucide-react';

interface GoogleMapsApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
}

const GoogleMapsApiKeyInput: React.FC<GoogleMapsApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if API key is already stored
    const storedApiKey = localStorage.getItem('google_maps_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsValid(true);
      onApiKeySet(storedApiKey);
    }
  }, [onApiKeySet]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('google_maps_api_key', apiKey.trim());
      setIsValid(true);
      onApiKeySet(apiKey.trim());
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('google_maps_api_key');
    setApiKey('');
    setIsValid(false);
  };

  if (isValid) {
    return (
      <Alert className="mb-4">
        <MapPin className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Google Maps API is configured and ready for address suggestions.</span>
          <Button variant="outline" size="sm" onClick={handleClearApiKey}>
            Change API Key
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Google Maps API Key Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            To enable address suggestions and location search, please provide your Google Maps API key.
            You can get one from the Google Cloud Console.
          </AlertDescription>
        </Alert>
        
        <div>
          <Label htmlFor="api-key">Google Maps API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Maps API key..."
          />
        </div>
        
        <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
          Save API Key
        </Button>
        
        <div className="text-sm text-gray-600">
          <p><strong>How to get a Google Maps API key:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Go to the Google Cloud Console</li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the "Places API" and "Maps JavaScript API"</li>
            <li>Create credentials (API key)</li>
            <li>Restrict the API key to your domain for security</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsApiKeyInput;
