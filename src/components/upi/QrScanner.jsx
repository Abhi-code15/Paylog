import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, AlertCircle, ArrowLeft } from 'lucide-react';

export function QrScanner({ onScanSuccess, onFallbackToManual, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let stream = null;
    let animationFrameId = null;

    async function startCamera() {
      try {
        setError(null);
        setPermissionDenied(false);

        // Request environment (back) camera on mobile, or any camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          await videoRef.current.play();
          requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera. Please enter UPI details manually.');
        }
        setIsScanning(false);
      }
    }

    function scanFrame() {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          setIsScanning(false);
          // Play subtle vibration if supported
          if (navigator.vibrate) navigator.vibrate(50);
          onScanSuccess(code.data);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    }

    startCamera();

    return () => {
      setIsScanning(false);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="flex flex-col items-center">
      {/* Viewfinder Window */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <CameraOff className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-rose-400 mb-2">{error}</p>
            <p className="text-xs text-slate-400 mb-4">
              {permissionDenied
                ? 'Camera access was blocked. You can still enter the payee UPI ID manually.'
                : 'QR scanner is unavailable. Please continue manually.'}
            </p>
            <button
              type="button"
              onClick={onFallbackToManual}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Enter UPI ID Manually
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-blue-400/80 rounded-xl pointer-events-none animate-pulse">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
            </div>

            <div className="absolute bottom-3 px-3 py-1 bg-slate-950/70 backdrop-blur-sm rounded-full text-[11px] font-medium text-slate-200">
              Align UPI QR code inside frame
            </div>
          </>
        )}
      </div>

      {/* Manual Fallback Action */}
      <div className="mt-4 flex items-center justify-between w-full max-w-[320px]">
        <button
          type="button"
          onClick={onFallbackToManual}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          UPI Not Working? Pay Manually
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
