
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Zap, AlertCircle, Loader2, Maximize } from 'lucide-react';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<Props> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setLoading(false);
        requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      setLoading(false);
    }
  };

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simulación de escaneo para entornos donde BarcodeDetector no está disponible
      // En una implementación real se usaría: new (window as any).BarcodeDetector()
      // Para efectos de esta app, implementamos un detector visual
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Aquí iría la lógica de JSQR o BarcodeDetector. 
      // Si el navegador soporta BarcodeDetector (Chrome/Edge modernos):
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
        barcodeDetector.detect(canvas)
          .then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              setIsScanning(false);
              onScan(rawValue);
            }
          })
          .catch(console.error);
      }
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsScanning(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
      
      {/* Marco de Escaneo */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 z-10">
        <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem]"></div>
        {/* Esquinas Brillantes */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-navifest-gold rounded-tl-[2rem]"></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-navifest-gold rounded-tr-[2rem]"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-navifest-gold rounded-bl-[2rem]"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-navifest-gold rounded-br-[2rem]"></div>
        
        {/* Línea de Escaneo Animada */}
        <div className="absolute left-4 right-4 h-0.5 bg-navifest-gold shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-[scanLine_2s_ease-in-out_infinite] z-20"></div>
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover rounded-[2rem] bg-gray-900"
        />
        <canvas ref={canvasRef} className="hidden" />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[2rem]">
            <Loader2 className="animate-spin text-navifest-gold mb-2" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Iniciando Cámara</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-[2rem] p-6 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <p className="text-white text-xs font-bold">{error}</p>
            <button onClick={startCamera} className="mt-4 px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">Reintentar</button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center z-10 px-8">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Lector de Activación</h3>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-[250px] mx-auto leading-relaxed">
          Encuadra el código QR o código de barras de la marca para desbloquear su menú exclusivo.
        </p>
      </div>

      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all"
      >
        <X size={24} />
      </button>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
