
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Camera, Image as ImageIcon, Download, Trash2, ChevronLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const EXPORT_WIDTH = 2160;
const EXPORT_HEIGHT = 3840;

export const MarcosPro: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { experiences, nicheConfig } = useAppContext();
  const experience = experiences.find(e => e.id === id);

  const [userImage, setUserImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isExporting, setIsExporting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<1 | 2 | 3 | 4>(1);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showFlash, setShowFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);

  const primaryColor = nicheConfig?.primary_color || '#FF2D31';
  const secondaryColor = nicheConfig?.secondary_color || '#FFD700';

  // Mapeo solicitado:
  // 1: activation_link
  // 2: demo_link
  // 3: photobooth_link3
  // 4: photobooth_link4
  const currentOverlayUrl = useMemo(() => {
    if (!experience) return "";
    switch (selectedOverlay) {
      case 1: return experience.activationLink;
      case 2: return experience.demoLink;
      case 3: return experience.photoboothLink3 || experience.activationLink;
      case 4: return experience.photoboothLink4 || experience.activationLink;
      default: return experience.activationLink;
    }
  }, [experience, selectedOverlay]);

  const startCamera = async (retries = 2) => {
    if (!isMounted.current || !isCameraActive) return;
    setCameraError(null);
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    const constraints = { 
        video: { 
            facingMode: { ideal: facingMode }, 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 } 
        }, 
        audio: false 
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        await videoRef.current.play();
      }
    } catch (err: any) { 
        if (retries > 0) await startCamera(retries - 1);
        else setCameraError("Cámara no disponible");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (isCameraActive && !userImage) startCamera();
    return () => {
        isMounted.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
    };
  }, [facingMode, isCameraActive, userImage]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 9 / 16;
    let sx, sy, sw, sh;

    if (videoAspect > targetAspect) {
      sw = video.videoHeight * targetAspect; sh = video.videoHeight;
      sx = (video.videoWidth - sw) / 2; sy = 0;
    } else {
      sw = video.videoWidth; sh = video.videoWidth / targetAspect;
      sx = 0; sy = (video.videoHeight - sh) / 2;
    }

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    setUserImage(canvas.toDataURL('image/jpeg', 0.95));
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImage(ev.target?.result as string);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setUserImage(null);
    setIsCameraActive(true);
    setCameraError(null);
  };

  const exportMarco = async () => {
    if (!userImage) return;
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH; canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = userImage;
    await new Promise(r => img.onload = r);
    ctx.drawImage(img, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    const overlay = new Image();
    overlay.crossOrigin = 'anonymous';
    overlay.src = currentOverlayUrl;
    await new Promise(r => { overlay.onload = r; overlay.onerror = r; });
    ctx.drawImage(overlay, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    const link = document.createElement('a');
    link.download = `MarcosPro_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    setIsExporting(false);
  };

  if (!experience) return <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Experiencia no encontrada</div>;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col font-inter overflow-hidden select-none h-[100dvh]">
      {/* Header Fijo */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 z-[110] bg-black/90 backdrop-blur-md shrink-0">
        <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 backdrop-blur-md border rounded-xl flex items-center gap-1 font-black text-[9px] uppercase tracking-widest active:scale-90 transition-all shadow-md"
            style={{ color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}
        >
            <ChevronLeft size={16} /> VOLVER
        </button>
        <span className="font-orbitron font-black text-[11px] tracking-[0.3em] uppercase" style={{ color: primaryColor }}>
            Marcos Pro
        </span>
        <div className="w-10"></div>
      </header>

      {/* Visor de Cámara - Ajustable dinámicamente */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-0">
        <div className="relative h-full max-h-full aspect-[9/16] bg-navifest-gray rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            {/* Capa de Base */}
            <div className="absolute inset-0 z-10 bg-black">
                {userImage ? (
                    <img src={userImage} className="w-full h-full object-cover" alt="Preview" />
                ) : isCameraActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                ) : null}
            </div>

            {/* Capa de Overlay */}
            <div className="absolute inset-0 z-30 pointer-events-none">
                <img src={currentOverlayUrl} key={selectedOverlay} className="w-full h-full object-contain mix-blend-screen opacity-100" alt="Overlay" />
            </div>

            {/* Flash */}
            {showFlash && <div className="absolute inset-0 bg-white z-[200] animate-flash"></div>}
            
            {/* Botón de Captura / Guardar sobre el visor */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                {userImage ? (
                    <button 
                      onClick={exportMarco} 
                      disabled={isExporting} 
                      className="w-16 h-16 rounded-full backdrop-blur-2xl flex flex-col items-center justify-center border-2 active:scale-90 transition-all disabled:opacity-50 shadow-2xl"
                      style={{ backgroundColor: `${primaryColor}30`, color: 'white', borderColor: primaryColor }}
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                        <span className="text-[6px] font-black mt-0.5 uppercase tracking-widest">LISTO</span>
                    </button>
                ) : (
                    <button onClick={handleCapture} className="w-16 h-16 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center group active:scale-95 transition-all shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-white/20 group-active:bg-white transition-all flex items-center justify-center">
                            <Camera size={24} className="text-white group-active:text-black" />
                        </div>
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* BARRA DE CONTROLES (FOOTER) - Siempre visible en la base */}
      <footer className="h-24 bg-black border-t border-white/10 flex items-center justify-between px-6 z-[120] shrink-0">
        {/* Controles: Cámara y Galería */}
        <div className="flex gap-3">
            <button 
                disabled={!!userImage} 
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                className="w-10 h-10 rounded-xl bg-navifest-gray border border-white/10 text-white flex items-center justify-center active:bg-white active:text-black transition-all disabled:opacity-0"
            >
                <RefreshCw size={18} />
            </button>
            <label className="w-10 h-10 rounded-xl bg-navifest-gray border border-white/10 text-white flex items-center justify-center active:bg-white active:text-black transition-all cursor-pointer">
                <ImageIcon size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>

        {/* Selector de 4 Overlays */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10 shadow-inner">
            {[1, 2, 3, 4].map((num) => (
                <button 
                    key={num} 
                    onClick={() => setSelectedOverlay(num as 1 | 2 | 3 | 4)} 
                    className={`w-9 h-9 rounded-full font-orbitron font-black text-xs transition-all border-2 flex items-center justify-center ${selectedOverlay === num ? 'scale-110' : 'bg-navifest-gray opacity-60'}`}
                    style={{
                        backgroundColor: selectedOverlay === num ? secondaryColor : undefined,
                        color: selectedOverlay === num ? 'black' : secondaryColor,
                        borderColor: selectedOverlay === num ? 'white' : 'transparent',
                        boxShadow: selectedOverlay === num ? `0 0 15px ${secondaryColor}60` : 'none'
                    }}
                >
                    {num}
                </button>
            ))}
        </div>

        {/* Botón de Limpieza (Trash) */}
        <button onClick={handleReset} className="w-10 h-10 rounded-xl bg-navifest-gray border border-white/10 text-white/40 flex items-center justify-center active:bg-red-600 active:text-white transition-all">
            <Trash2 size={18} />
        </button>
      </footer>

      {/* Alerta de Cámara */}
      {cameraError && !userImage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-black/10">
              <AlertCircle size={14} className="text-red-600" /> {cameraError}
          </div>
      )}
    </div>
  );
};
