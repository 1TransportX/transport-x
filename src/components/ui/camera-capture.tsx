
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  console.log('[CameraCapture] Component rendered, isOpen:', isOpen);

  useEffect(() => {
    if (isOpen) {
      console.log('[CameraCapture] Opening camera...');
      startCamera();
    } else {
      console.log('[CameraCapture] Closing camera...');
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    setIsVideoReady(false);

    try {
      console.log('[CameraCapture] Requesting camera access...');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('[CameraCapture] Camera stream obtained:', stream);
      streamRef.current = stream;

      if (videoRef.current) {
        console.log('[CameraCapture] Setting video source...');
        videoRef.current.srcObject = stream;
        
        const handleLoadedMetadata = () => {
          console.log('[CameraCapture] Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('[CameraCapture] Video playing successfully');
              setIsVideoReady(true);
              setIsLoading(false);
            }).catch(err => {
              console.error('[CameraCapture] Video play failed:', err);
              setError('Failed to start video preview');
              setIsLoading(false);
            });
          }
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
    } catch (err) {
      console.error('[CameraCapture] Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    console.log('[CameraCapture] Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
    setIsLoading(false);
    setError(null);
    setIsCapturing(false);
  };

  const handleCapturePhoto = useCallback(async (event: React.MouseEvent) => {
    console.log('[CameraCapture] Capture button clicked - preventing default and propagation');
    event.preventDefault();
    event.stopPropagation();
    
    if (!videoRef.current || !canvasRef.current || !isVideoReady || isCapturing) {
      console.error('[CameraCapture] Cannot capture - video not ready or already capturing');
      return;
    }

    setIsCapturing(true);
    console.log('[CameraCapture] Starting capture process...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('[CameraCapture] No canvas context');
        setIsCapturing(false);
        return;
      }

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      console.log('[CameraCapture] Capturing image:', { width: canvas.width, height: canvas.height });
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          console.log('[CameraCapture] Image captured successfully, creating file...');
          const file = new File([blob], `receipt_${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          
          console.log('[CameraCapture] File created, calling onCapture callback...');
          onCapture(file);
          
          // Small delay to ensure state updates complete before closing
          setTimeout(() => {
            console.log('[CameraCapture] Capture complete, ready to close');
            setIsCapturing(false);
          }, 100);
        } else {
          console.error('[CameraCapture] Failed to create blob');
          setIsCapturing(false);
        }
      }, 'image/jpeg', 0.85);
    } catch (error) {
      console.error('[CameraCapture] Error during capture:', error);
      setIsCapturing(false);
    }
  }, [onCapture, isVideoReady, isCapturing]);

  const handleCancel = useCallback((event: React.MouseEvent) => {
    console.log('[CameraCapture] Cancel button clicked - preventing default and propagation');
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <div className="text-white text-lg">Starting camera...</div>
          </div>
        )}

        {/* Capturing state */}
        {isCapturing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="text-white text-lg bg-black/80 px-6 py-3 rounded-lg">Capturing photo...</div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-4 bg-black">
            <p className="mb-6 text-center text-lg">{error}</p>
            <button
              onClick={handleCancel}
              type="button"
              className="bg-white/20 border border-white/30 text-white hover:bg-white/30 px-6 py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        )}

        {/* Camera preview */}
        {!error && (
          <>
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                style={{ backgroundColor: '#000' }}
              />
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pb-8 z-20">
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={handleCancel}
                  type="button"
                  disabled={isCapturing}
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 h-14 px-6 rounded-lg flex items-center disabled:opacity-50"
                >
                  <X className="h-6 w-6 mr-2" />
                  Cancel
                </button>
                
                {isVideoReady && (
                  <button
                    onClick={handleCapturePhoto}
                    type="button"
                    disabled={isCapturing}
                    className="bg-white hover:bg-gray-200 text-black h-16 w-16 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                  >
                    <Camera className="h-8 w-8" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
