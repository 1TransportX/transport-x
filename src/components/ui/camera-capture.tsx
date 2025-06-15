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

  // LOGGING UTILITY
  const debug = (msg: string, ...args: any[]) =>
    console.log('[CameraCapture]', msg, ...args);

  // Use to force re-render video once stream is assigned
  const [, forceRender] = useState<number>(0);

  useEffect(() => {
    debug('EFFECT isOpen', isOpen);

    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      debug('Start camera...');

      if (streamRef.current) {
        debug('Stopping old stream before starting new.');
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      debug('Requesting getUserMedia', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      debug('Got stream', stream);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Needed on iOS/Safari/Chrome for mobile.
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;

        // Wait for metadata before playing (safe for cross-browser)
        videoRef.current.onloadedmetadata = () => {
          debug("Metadata loaded, video should play.");
          try {
            videoRef.current && videoRef.current.play();
          } catch (err) {
            debug('Play error:', err);
          }
          forceRender(n => n + 1); // trigger rerender
        };

        // Fallback: If readyState is already enough, start playing now
        if (videoRef.current.readyState >= 1) {
          debug("ReadyState already sufficient, force play now");
          videoRef.current.play();
          forceRender(n => n + 1);
        }
      } else {
        debug('No videoRef.current at camera start.');
      }
    } catch (err) {
      debug('Error at camera access', err);
      setError('Unable to access camera. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    debug('Stopping camera/stream.');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        debug('Stopped camera track.');
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Prevent event bubbling to parent dialog, keep overlay alive
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const capturePhoto = () => {
    debug('Capture photo clicked');
    if (!videoRef.current || !canvasRef.current) {
      debug('Capture failed: missing refs.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      debug('No context.');
      return;
    }

    // use the current video dimensions
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    debug('Drawing frame', { w: canvas.width, h: canvas.height });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        debug('Got image blob:', blob);
        const file = new File([blob], `receipt_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        stopCamera(); // stop camera once captured
        onCapture(file);
      } else {
        debug('canvas.toBlob returned null');
      }
    }, 'image/jpeg', 0.85);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    debug('Cancel clicked');
    if (e) e.stopPropagation();
    stopCamera();
    onCancel(); // ONLY close camera overlay, do not close parent dialog
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center touch-none"
      style={{
        zIndex: 9999, // ensures above all dialogs
      }}
      onClick={handleCancel}
    >
      <div
        className="relative w-full h-full max-h-screen max-w-full overflow-hidden"
        onClick={handleOverlayClick}
      >
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

        {/* Camera Preview */}
        {!isLoading && !error && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover bg-black"
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
                background: '#000',
              }}
              aria-label="Camera feed"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom Controls - mobile optimized */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pb-8 z-20 flex justify-center items-end">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-14 px-6 mr-2"
                aria-label="Cancel camera capture"
                type="button"
              >
                <X className="h-6 w-6 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-white hover:bg-gray-200 text-black h-16 w-16 rounded-full p-0 shadow-lg flex items-center justify-center"
                aria-label="Take photo"
                style={{ minWidth: 64, minHeight: 64 }}
                type="button"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
            {/* Top harm-less bar for safe area indicator */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/30 rounded-full z-30" />
          </>
        )}
      </div>
    </div>
  );
};
