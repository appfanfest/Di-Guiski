// ────────────────────────────────────────────────────────────
// src/metaverse/ar/ARFondosInmersivos.tsx
// AR component: selfie segmentation to replace background.
// The person is extracted from their real environment and placed
// in front of an immersive background image (from ar_config or
// activation_link). Optional sparkle particle system on top,
// plus reusable marco overlay as top layer.
// All processing is on-device via MediaPipe SelfieSegmentation.
// ────────────────────────────────────────────────────────────

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  Camera,
  RefreshCw,
  Share2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience } from '../types';
import { useSegmentation } from './hooks/useSegmentation';
import { useParticles } from './hooks/useParticles';
import { loadImage, startCamera, stopStream, shareCanvas } from './utils';

interface Props {
  experience: Experience;
  onBack: () => void;
}

export const ARFondosInmersivos: React.FC<Props> = ({ experience, onBack }) => {
  const config   = experience.ar_config ?? {};
  // Background: ar_config.background_url → activation_link fallback
  const bgUrl    = config.background_url || experience.activationLink;
  const marcoUrl = experience.activationLink !== bgUrl ? experience.activationLink : null;
  const blurEdge = config.blur_edge ?? 4;

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [camError, setCamError]     = useState<string | null>(null);
  const [captured, setCaptured]     = useState<string | null>(null);
  const [flash, setFlash]           = useState(false);

  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  // Offscreen canvas used for person isolation
  const tempCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const streamRef     = useRef<MediaStream | null>(null);
  const isMounted     = useRef(true);

  const bgImgRef    = useRef<HTMLImageElement | null>(null);
  const marcoImgRef = useRef<HTMLImageElement | null>(null);

  const { isReady: segReady, maskRef, sendFrame } = useSegmentation();
  const particles = useParticles(config.particles);

  // ── Load image assets ──────────────────────────────────────
  useEffect(() => {
    const loads = [
      bgUrl    ? loadImage(bgUrl).catch(() => null)    : Promise.resolve(null),
      marcoUrl ? loadImage(marcoUrl).catch(() => null) : Promise.resolve(null),
    ];
    Promise.all(loads).then(([bg, marco]) => {
      if (!isMounted.current) return;
      bgImgRef.current    = bg as HTMLImageElement | null;
      marcoImgRef.current = marco as HTMLImageElement | null;
    });
  }, [bgUrl, marcoUrl]);

  // ── Camera ─────────────────────────────────────────────────
  const initCamera = useCallback(async () => {
    if (!videoRef.current || !isMounted.current) return;
    stopStream(streamRef.current);
    streamRef.current = null;
    setCamError(null);
    try {
      const stream = await startCamera(videoRef.current, facingMode);
      if (!isMounted.current) { stopStream(stream); return; }
      streamRef.current = stream;
    } catch {
      setCamError('Cámara no disponible');
    }
  }, [facingMode]);

  useEffect(() => {
    isMounted.current = true;
    initCamera();
    return () => {
      isMounted.current = false;
      stopStream(streamRef.current);
    };
  }, [initCamera]);

  // ── Render loop ────────────────────────────────────────────
  useEffect(() => {
    if (!segReady || captured) return;

    let rAF = 0;
    const mirrored = facingMode === 'user';

    const render = () => {
      rAF = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      const temp   = tempCanvasRef.current;
      if (!canvas || !video || video.readyState < 2) return;

      // Sync canvas resolution
      if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx  = canvas.getContext('2d')!;
      const { width: W, height: H } = canvas;

      // MediaPipe standard pattern for background replacement:
      ctx.save();
      ctx.clearRect(0, 0, W, H);

      const mask = maskRef.current;
      if (mask) {
        // 1. Draw mask
        if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        if (blurEdge > 0) ctx.filter = `blur(${blurEdge}px)`;
        ctx.drawImage(mask, 0, 0, W, H);
        ctx.filter = 'none';

        // 2. Draw video over mask with source-in (keeps video only where mask is opaque)
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(video, 0, 0, W, H);

        // reset transform for background
        if (mirrored) { ctx.scale(-1, 1); ctx.translate(-W, 0); }
      } else {
        // No mask yet — draw plain video while model warms up
        if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0, W, H);
        if (mirrored) { ctx.scale(-1, 1); ctx.translate(-W, 0); }
      }

      // 3. Draw background behind the person
      ctx.globalCompositeOperation = 'destination-atop';
      const bg = bgImgRef.current;
      if (bg) {
        const imgA = bg.naturalWidth / bg.naturalHeight;
        const canA = W / H;
        let sx = 0, sy = 0, sw = bg.naturalWidth, sh = bg.naturalHeight;
        if (imgA > canA) { sw = sh * canA; sx = (bg.naturalWidth - sw) / 2; }
        else             { sh = sw / canA; sy = (bg.naturalHeight - sh) / 2; }
        ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, W, H);
      } else {
        // Default gradient background if image is missing
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(1, '#312e81');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      // — Layer 3: Particles —
      particles.drawFrame(ctx, W, H);

      // — Layer 4: Marco overlay —
      if (marcoImgRef.current) ctx.drawImage(marcoImgRef.current, 0, 0, W, H);

      sendFrame(video);
    };

    rAF = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rAF);
  }, [segReady, facingMode, particles, captured, sendFrame, blurEdge]);

  // ── Capture & Share ────────────────────────────────────────
  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await shareCanvas(canvas, experience.title);
  };

  const handleRetake = () => {
    setCaptured(null);
    initCamera();
  };

  const isLoading = !segReady && !camError;

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col select-none h-[100dvh]">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-xl shrink-0 z-10">
        <button
          onClick={captured ? handleRetake : onBack}
          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 h-10 font-black text-[10px] uppercase tracking-widest text-white active:scale-95 transition-all"
        >
          {captured ? <RotateCcw size={16} /> : <ChevronLeft size={16} />}
          {captured ? 'REPETIR' : 'VOLVER'}
        </button>

        <div className="flex flex-col items-center">
          <span className="font-black text-[11px] tracking-[0.2em] uppercase text-white">
            FONDOS <span className="text-cyan-400">INMERSIVOS</span>
          </span>
          <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">
            {experience.title}
          </span>
        </div>

        <div className="w-20" />
      </header>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />

        {!captured && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {captured && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={captured}
            className="absolute inset-0 w-full h-full object-contain"
            alt="Captura"
          />
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-sm z-20"
            >
              <Loader2 size={40} className="animate-spin text-cyan-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Cargando Fondo Inmersivo…
              </p>
              <p className="text-[8px] text-white/30 text-center px-8">
                Descargando modelo de segmentación<br />(solo la primera vez)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {camError && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              {camError}
            </p>
          </div>
        )}

        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-30 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <footer className="h-28 bg-slate-900 border-t border-white/5 flex items-center justify-around px-8 shrink-0 z-10">
        <button
          onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
          disabled={!!captured || !!camError}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white active:text-slate-900 transition-all disabled:opacity-30"
        >
          <RefreshCw size={20} />
        </button>

        {captured ? (
          <button
            onClick={handleShare}
            className="w-20 h-20 rounded-full bg-cyan-500 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all shadow-2xl"
          >
            <Share2 size={26} className="text-white" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">
              COMPARTIR
            </span>
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!segReady || !!camError}
            className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/5 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
              <Camera size={28} className="text-white" />
            </div>
          </button>
        )}

        <div className="w-12" />
      </footer>
    </div>
  );
};
