
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
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Play the video and ensure it's visible as soon as the stream is ready
        await new Promise<void>((resolve) => {
          // In some browsers, `onloadedmetadata` fires before assignment. Defensive:
          videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play();
            resolve();
          };
          // If already loaded:
          if (videoRef.current!.readyState >= 1) {
            videoRef.current!.play();
            resolve();
          }
        });
        console.log('Video playing');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Use natural video dimensions for image capture
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        // The parent will handle closing camera overlay
      }
    }, 'image/jpeg', 0.8);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel(); // Just closes this overlay, parent dialog remains open
  };

  if (!isOpen) return null;

  // Use full-screen fixed overlay. Use high z-index to overlay any other dialog (z-80 > z-50).
  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center touch-none">
      <div className="relative w-full h-full max-h-screen max-w-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <div className="text-white text-lg">Starting camera...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-4 bg-black">
            <p className="mb-6 text-center text-lg">{error}</p>
            <Button 
              onClick={handleCancel} 
              variant="outline"
              size="lg"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Close
            </Button>
          </div>
        )}

        {/* MAIN CAMERA PREVIEW */}
        {!isLoading && !error && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover bg-black"
              autoPlay
              playsInline
              muted
              style={{
                // ensure video covers popup, both orientation (mobile/desktop)
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                background: '#000',
                zIndex: 1,
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Mobile-optimized controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-6 pb-8 z-20">
              <div className="flex justify-center items-center space-x-6">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-14 px-6"
                >
                  <X className="h-6 w-6 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="bg-white hover:bg-gray-200 text-black h-16 w-16 rounded-full p-0 shadow-lg flex items-center justify-center"
                  style={{ minWidth: 64, minHeight: 64 }}
                >
                  <Camera className="h-8 w-8" />
                </Button>
              </div>
            </div>
            {/* Safe area indicator for mobile */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/30 rounded-full z-30" />
          </>
        )}
      </div>
    </div>
  );
};
