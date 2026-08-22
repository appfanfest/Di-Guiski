
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Camera, RefreshCw, Download, Trash2, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Experience } from './types';
import { motion, AnimatePresence } from 'motion/react';

const COUNTDOWN_SECONDS = 3;
const TOTAL_SLOTS = 4;
const EXPORT_WIDTH = 2160;
const EXPORT_HEIGHT = 3840;

interface PhotoBoothProps {
  experience: Experience;
  onBack: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export const PhotoBooth: React.FC<PhotoBoothProps> = ({ 
  experience, 
  onBack,
  primaryColor = '#0066ff',
  secondaryColor = '#ffcc00'
}) => {
  const [status, setStatus] = useState<'idle' | 'countdown' | 'flash' | 'finished'>('idle');
  const [capturedPhotos, setCapturedPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isExporting, setIsExporting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<1 | 2 | 3 | 4>(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMounted = useRef(true);

  const currentOverlayUrl = useMemo(() => {
    switch (selectedOverlay) {
      case 2: return experience.demoLink;
      case 3: return experience.photoboothLink3 || experience.activationLink;
      case 4: return experience.photoboothLink4 || experience.activationLink;
      default: return experience.activationLink;
    }
  }, [experience, selectedOverlay]);

  const playShutterSound = useCallback(() => {
    try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) { console.warn("AudioContext failed", e); }
  }, []);

  const startCamera = async (retries = 2) => {
    if (!isMounted.current) return;
    setCameraError(null);
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    const constraints: MediaStreamConstraints = { 
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, 
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
        else setCameraError("Error de cámara");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    startCamera();
    return () => {
        isMounted.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
    };
  }, [facingMode]);

  const takeCapture = async () => {
    if (!videoRef.current || !isMounted.current) return;
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 9 / 16;
    let sx, sy, sw, sh;

    if (videoAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sh = video.videoHeight;
      sx = (video.videoWidth - sw) / 2;
      sy = 0;
    } else {
      sw = video.videoWidth;
      sh = video.videoWidth / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhotos(prev => {
        const next = [...prev];
        next[currentSlot] = dataUrl;
        return next;
    });

    playShutterSound();
    setStatus('flash');

    setTimeout(() => {
        if (!isMounted.current) return;
        if (currentSlot < TOTAL_SLOTS - 1) {
            setCurrentSlot(currentSlot + 1);
            setCountdown(COUNTDOWN_SECONDS);
            setStatus('countdown');
        } else {
            setStatus('finished');
        }
    }, 400); 
  };

  const startSession = () => {
    if (status !== 'idle' || cameraError) return;
    setCapturedPhotos([null, null, null, null]);
    setCurrentSlot(0);
    setCountdown(COUNTDOWN_SECONDS);
    setStatus('countdown');
  };

  useEffect(() => {
    if (status === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'countdown' && countdown === 0) {
      takeCapture();
    }
  }, [status, countdown]);

  const handleReset = () => {
    setCapturedPhotos([null, null, null, null]);
    setCurrentSlot(0);
    setStatus('idle');
    startCamera();
  };

  const exportCollage = async () => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (!capturedPhotos[i]) continue;
        const img = new Image();
        img.src = capturedPhotos[i]!;
        await new Promise(r => img.onload = r);
        const dx = (i % 2) * (EXPORT_WIDTH / 2);
        const dy = Math.floor(i / 2) * (EXPORT_HEIGHT / 2);
        ctx.drawImage(img, dx, dy, EXPORT_WIDTH / 2, EXPORT_HEIGHT / 2);
    }

    const overlay = new Image();
    overlay.crossOrigin = 'anonymous';
    overlay.src = currentOverlayUrl;
    await new Promise(r => { overlay.onload = r; overlay.onerror = r; });
    ctx.drawImage(overlay, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    const link = document.createElement('a');
    link.download = `FanFest_Booth_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
    setIsExporting(false);
  };

  const getCameraStyle = () => {
    const isLeft = currentSlot % 2 === 0;
    const isTop = Math.floor(currentSlot / 2) === 0;
    return { 
        left: '4px', top: '4px', width: 'calc(50% - 6px)', height: 'calc(50% - 6px)',
        transform: `translate(${isLeft ? '0' : 'calc(100% + 4px)'}, ${isTop ? '0' : 'calc(100% + 4px)'})`
    };
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col font-sans overflow-hidden select-none h-[100dvh]">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 z-[110] bg-slate-900/90 backdrop-blur-xl shrink-0">
        <button 
            onClick={() => {
              if (status === 'finished') {
                handleReset();
              } else {
                onBack();
              }
            }} 
            className="p-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all text-white"
        >
            <ChevronLeft size={18} /> VOLVER
        </button>
        <div className="flex flex-col items-center">
            <span className="font-black text-[12px] tracking-[0.2em] uppercase text-white">FANFEST <span style={{ color: secondaryColor }}>BOOTH</span></span>
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">4 FOTOS • COLLAGE</span>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 relative p-1 z-[105] bg-slate-950">
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full w-full">
            {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="relative bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-inner">
                    {capturedPhotos[idx] && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={capturedPhotos[idx]!} className="absolute inset-0 w-full h-full object-cover" alt={`Foto ${idx}`} />}
                    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                        <img src={currentOverlayUrl} key={`slot-${idx}-${selectedOverlay}`} className="absolute w-[200%] h-[200%] max-w-none opacity-100" style={{ left: `${-(idx % 2) * 100}%`, top: `${-Math.floor(idx / 2) * 100}%` }} alt="Overlay" />
                    </div>
                </div>
            ))}
        </div>

        {status !== 'finished' && !cameraError && (
            <motion.div 
              layoutId="camera"
              className="absolute z-50 overflow-hidden rounded-[2rem] border-4 border-emerald-500 shadow-2xl" 
              style={getCameraStyle()}
            >
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                    <img src={currentOverlayUrl} key={`cam-${selectedOverlay}`} className="absolute w-[200%] h-[200%] max-w-none opacity-100" style={{ left: `${-(currentSlot % 2) * 100}%`, top: `${-Math.floor(currentSlot / 2) * 100}%` }} alt="Overlay" />
                </div>
                {status === 'countdown' && <div className="absolute inset-0 border-4 border-white/40 animate-pulse z-40 rounded-[2rem]"></div>}
            </motion.div>
        )}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]">
            {status === 'finished' ? (
                <button 
                  onClick={exportCollage} 
                  disabled={isExporting} 
                  className="w-24 h-24 rounded-full backdrop-blur-2xl flex flex-col items-center justify-center border-4 border-emerald-500 active:scale-90 transition-all disabled:opacity-50 shadow-2xl bg-emerald-600"
                >
                    {isExporting ? <Loader2 className="animate-spin text-white" size={32} /> : <Download size={32} className="text-white" />}
                    <span className="text-[8px] font-black mt-1 uppercase tracking-widest text-white">GUARDAR</span>
                </button>
            ) : status === 'idle' ? (
                <button onClick={startSession} disabled={!!cameraError} className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center group active:scale-95 transition-all disabled:opacity-30 shadow-2xl">
                    <div className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center bg-white/10 group-active:bg-white transition-all">
                        <Camera size={36} className="text-white group-active:text-slate-950" />
                    </div>
                </button>
            ) : null}
        </div>

        <AnimatePresence>
          {status === 'countdown' && countdown > 0 && (
            <motion.div 
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-[150] pointer-events-none"
            >
              <span className="text-[12rem] font-black text-white drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {status === 'flash' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-[200]"
            />
          )}
        </AnimatePresence>
      </div>

      <footer className="h-28 bg-slate-900 border-t border-white/5 flex items-center justify-between px-8 z-[110] shadow-2xl shrink-0">
        <button disabled={status !== 'idle'} onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/50 flex items-center justify-center active:bg-white active:text-slate-950 transition-all disabled:opacity-0 shadow-lg">
            <RefreshCw size={22} />
        </button>

        <div className="flex gap-2 bg-black/40 p-1.5 rounded-full border border-white/5 shadow-inner">
            {[1, 2, 3, 4].map((num) => (
                <button 
                  key={num} 
                  onClick={() => setSelectedOverlay(num as 1 | 2 | 3 | 4)} 
                  disabled={status === 'countdown' || status === 'flash'} 
                  className={`w-10 h-10 rounded-full font-black text-xs transition-all border-2 flex items-center justify-center disabled:opacity-20 shadow-lg ${selectedOverlay === num ? 'scale-110 shadow-lg' : 'bg-white/5 opacity-40 text-white'}`}
                  style={{
                    backgroundColor: selectedOverlay === num ? secondaryColor : undefined,
                    color: selectedOverlay === num ? 'black' : undefined,
                    borderColor: selectedOverlay === num ? 'white' : 'transparent',
                  }}
                >
                    {num}
                </button>
            ))}
        </div>

        <button onClick={handleReset} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/20 flex items-center justify-center active:bg-red-500/20 active:text-red-500 transition-all shadow-lg">
            <Trash2 size={22} />
        </button>
      </footer>

      {cameraError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-slate-900 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
              <AlertCircle size={14} className="text-red-600" /> {cameraError}
          </div>
      )}
    </div>
  );
};
