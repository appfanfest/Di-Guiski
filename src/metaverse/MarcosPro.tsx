
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Image as ImageIcon, Download, Trash2, ChevronLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Experience } from './types';
import { motion, AnimatePresence } from 'motion/react';

const EXPORT_WIDTH = 2160;
const EXPORT_HEIGHT = 3840;

interface MarcosProProps {
  experience: Experience;
  onBack: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export const MarcosPro: React.FC<MarcosProProps> = ({ 
  experience, 
  onBack, 
  primaryColor = '#0066ff', 
  secondaryColor = '#ffcc00' 
}) => {
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

  const currentOverlayUrl = useMemo(() => {
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
    link.download = `FanFest_Postal_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col font-sans overflow-hidden select-none h-[100dvh]">
      {/* Header Fijo */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 z-[110] bg-slate-900/80 backdrop-blur-xl shrink-0">
        <button 
            onClick={onBack} 
            className="p-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all text-white"
        >
            <ChevronLeft size={18} /> VOLVER
        </button>
        <div className="flex flex-col items-center">
            <span className="font-black text-[12px] tracking-[0.2em] uppercase text-white">FANFEST <span style={{ color: secondaryColor }}>POSTCARDS</span></span>
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">{experience.title}</span>
        </div>
        <div className="w-12"></div>
      </header>

      {/* Visor de Cámara */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden p-4">
        <div className="relative h-full aspect-[9/16] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
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
                <img src={currentOverlayUrl} key={selectedOverlay} className="w-full h-full object-contain opacity-100" alt="Overlay" />
            </div>

            {/* Flash */}
            <AnimatePresence>
              {showFlash && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-[200]"
                />
              )}
            </AnimatePresence>
            
            {/* Botón de Captura / Guardar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                {userImage ? (
                    <button 
                      onClick={exportMarco} 
                      disabled={isExporting} 
                      className="w-20 h-20 rounded-full backdrop-blur-2xl flex flex-col items-center justify-center border-4 border-white/20 active:scale-90 transition-all disabled:opacity-50 shadow-2xl"
                      style={{ backgroundColor: `${primaryColor}CC`, color: 'white' }}
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={28} /> : <Download size={28} />}
                        <span className="text-[7px] font-black mt-1 uppercase tracking-widest text-white">GUARDAR</span>
                    </button>
                ) : (
                    <button onClick={handleCapture} className="w-20 h-20 rounded-full border-8 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center group active:scale-95 transition-all shadow-2xl">
                        <div className="w-14 h-14 rounded-full bg-white/40 group-active:bg-white transition-all flex items-center justify-center">
                            <Camera size={28} className="text-white group-active:text-slate-900" />
                        </div>
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* BARRA DE CONTROLES */}
      <footer className="h-28 bg-slate-900 border-t border-white/5 flex items-center justify-between px-8 z-[120] shrink-0">
        <div className="flex gap-3">
            <button 
                disabled={!!userImage} 
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:bg-white active:text-slate-900 transition-all disabled:opacity-0 shadow-lg"
            >
                <RefreshCw size={22} />
            </button>
            <label className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:bg-white active:text-slate-900 transition-all cursor-pointer shadow-lg">
                <ImageIcon size={22} />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>

        <div className="flex gap-2 bg-black/40 p-1.5 rounded-full border border-white/5 shadow-inner">
            {[1, 2, 3, 4].map((num) => (
                <button 
                    key={num} 
                    onClick={() => setSelectedOverlay(num as 1 | 2 | 3 | 4)} 
                    className={`w-10 h-10 rounded-full font-black text-xs transition-all border-2 flex items-center justify-center ${selectedOverlay === num ? 'scale-110 shadow-lg' : 'bg-white/5 opacity-40 text-white'}`}
                    style={{
                        backgroundColor: selectedOverlay === num ? secondaryColor : undefined,
                        color: selectedOverlay === num ? 'black' : undefined,
                        borderColor: selectedOverlay === num ? 'white' : 'transparent'
                    }}
                >
                    {num}
                </button>
            ))}
        </div>

        <button onClick={handleReset} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center active:bg-red-500 active:text-white transition-all shadow-lg">
            <Trash2 size={22} />
        </button>
      </footer>

      {cameraError && !userImage && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] bg-white text-slate-900 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 border-2 border-slate-900">
              <AlertCircle size={16} className="text-red-600" /> {cameraError}
          </div>
      )}
    </div>
  );
};
