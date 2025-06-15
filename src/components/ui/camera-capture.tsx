
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onCapture,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob/file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        handleCancel();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-lg max-h-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">Starting camera...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <p className="mb-4 text-center">{error}</p>
            <Button onClick={handleCancel} variant="outline">
              Close
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-lg"
              autoPlay
              playsInline
              muted
            />
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
