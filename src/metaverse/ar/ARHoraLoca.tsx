// ────────────────────────────────────────────────────────────
// src/metaverse/ar/ARHoraLoca.tsx
// AR component: hats + glasses + stickers anchored to face,
// optional particle system, reusable marco overlay on top.
// All processing is on-device via MediaPipe FaceMesh (CDN WASM).
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
import { useFaceMesh } from './hooks/useFaceMesh';
import { useParticles } from './hooks/useParticles';
import {
  FACE_OVAL,
  Landmark,
  lmToXY,
  getBBox,
  loadImage,
  startCamera,
  stopStream,
  shareCanvas,
} from './utils';

// Movement threshold (canvas pixels) to trigger a particle burst
const MOVEMENT_THRESHOLD = 8;

interface Props {
  experience: Experience;
  onBack: () => void;
}

// ── Draw helpers ─────────────────────────────────────────────

function drawHat(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  img: HTMLImageElement,
  w: number,
  h: number,
  mirrored: boolean,
) {
  const crown    = lmToXY(lm[10],  w, h, mirrored);
  const leftEar  = lmToXY(lm[234], w, h, mirrored);
  const rightEar = lmToXY(lm[454], w, h, mirrored);

  const faceW = Math.abs(rightEar.x - leftEar.x);
  const hatW  = faceW * 1.35;
  const hatH  = hatW * (img.naturalHeight / img.naturalWidth);

  // Bottom of hat ~10% below crown so it sits on the head correctly
  ctx.drawImage(img, crown.x - hatW / 2, crown.y - hatH * 0.92, hatW, hatH);
}

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  img: HTMLImageElement,
  w: number,
  h: number,
  mirrored: boolean,
) {
  // Outer eye corners
  const lEye = lmToXY(lm[33],  w, h, mirrored);
  const rEye = lmToXY(lm[263], w, h, mirrored);
  const nose = lmToXY(lm[168], w, h, mirrored);

  const glassW = Math.abs(rEye.x - lEye.x) * 1.45;
  const glassH = glassW * (img.naturalHeight / img.naturalWidth);
  const cx     = (lEye.x + rEye.x) / 2;
  const cy     = nose.y - glassH * 0.25;

  ctx.drawImage(img, cx - glassW / 2, cy - glassH / 2, glassW, glassH);
}

function drawStickers(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  imgs: HTMLImageElement[],
  w: number,
  h: number,
  mirrored: boolean,
) {
  if (!imgs.length) return;
  // Anchor positions: left cheek (234), right cheek (454), forehead (151)
  const anchors = [234, 454, 151];
  imgs.forEach((img, i) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const anchor = lmToXY(lm[anchors[i % anchors.length]], w, h, mirrored);
    const size = w * 0.12;
    ctx.drawImage(img, anchor.x - size / 2, anchor.y - size / 2, size, size);
  });
}

// ── Component ────────────────────────────────────────────────

export const ARHoraLoca: React.FC<Props> = ({ experience, onBack }) => {
  const config    = experience.ar_config ?? {};
  const marcoUrl  = experience.activationLink;

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [camError, setCamError]     = useState<string | null>(null);
  const [captured, setCaptured]     = useState<string | null>(null);
  const [flash, setFlash]           = useState(false);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);

  // Assets
  const hatImgRef      = useRef<HTMLImageElement | null>(null);
  const glassesImgRef  = useRef<HTMLImageElement | null>(null);
  const stickerImgsRef = useRef<HTMLImageElement[]>([]);
  const marcoImgRef    = useRef<HTMLImageElement | null>(null);
  const assetsReady    = useRef(false);

  // Previous crown position for movement detection
  const prevCrownRef = useRef<{ x: number; y: number } | null>(null);

  const { isReady: faceReady, landmarksRef, sendFrame } = useFaceMesh();
  const particles = useParticles(config.particles);

  // ── Load all image assets ──────────────────────────────────
  useEffect(() => {
    const urls = [
      config.hat_url      ? loadImage(config.hat_url)     : Promise.resolve(null),
      config.glasses_url  ? loadImage(config.glasses_url) : Promise.resolve(null),
      marcoUrl            ? loadImage(marcoUrl)            : Promise.resolve(null),
    ];

    const stickerLoads = (config.sticker_urls ?? []).map((u) =>
      loadImage(u).catch(() => null),
    );

    Promise.all([...urls, ...stickerLoads]).then(([hat, glasses, marco, ...stickers]) => {
      if (!isMounted.current) return;
      hatImgRef.current      = hat as HTMLImageElement | null;
      glassesImgRef.current  = glasses as HTMLImageElement | null;
      marcoImgRef.current    = marco as HTMLImageElement | null;
      stickerImgsRef.current = (stickers as (HTMLImageElement | null)[]).filter(Boolean) as HTMLImageElement[];
      assetsReady.current    = true;
    });

    return () => { assetsReady.current = false; };
  }, [config.hat_url, config.glasses_url, marcoUrl]);

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
    if (!faceReady || captured) return;

    let rAF = 0;
    const mirrored = facingMode === 'user';

    const render = () => {
      rAF = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      if (!canvas || !video || video.readyState < 2) return;

      // Sync canvas resolution to video
      if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d')!;
      const { width: W, height: H } = canvas;

      // — Layer 1: Video (mirrored for front cam) —
      ctx.save();
      if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      // — Layer 2: AR elements —
      const lm = landmarksRef.current;
      if (lm) {
        if (hatImgRef.current)     drawHat(ctx, lm, hatImgRef.current, W, H, mirrored);
        if (glassesImgRef.current) drawGlasses(ctx, lm, glassesImgRef.current, W, H, mirrored);
        if (!hatImgRef.current && !glassesImgRef.current) {
          // Demo/fallback si las imágenes de BD no existen o fallan: nariz de payaso
          const nose = lmToXY(lm[4], W, H, mirrored);
          ctx.beginPath();
          ctx.arc(nose.x, nose.y, W * 0.05, 0, 2 * Math.PI);
          ctx.fillStyle = '#ff0055';
          ctx.fill();
        }
        if (stickerImgsRef.current.length) drawStickers(ctx, lm, stickerImgsRef.current, W, H, mirrored);

        // Particle movement detection
        if (particles.active && config.particles?.trigger === 'movement') {
          const crown = lmToXY(lm[10], W, H, mirrored);
          const prev  = prevCrownRef.current;
          if (prev) {
            const dx = crown.x - prev.x;
            const dy = crown.y - prev.y;
            if (Math.sqrt(dx * dx + dy * dy) > MOVEMENT_THRESHOLD) {
              // Burst near hat position (above crown)
              const bbox = config.hat_url ? getBBox(lm, FACE_OVAL, W, H, mirrored) : null;
              const burstY = bbox ? bbox.y - 20 : crown.y - 40;
              particles.triggerBurst(crown.x, burstY);
            }
          }
          prevCrownRef.current = crown;
        }
      }

      // — Layer 3: Particles —
      particles.drawFrame(ctx, W, H);

      // — Layer 4: Marco overlay —
      if (marcoImgRef.current) {
        ctx.drawImage(marcoImgRef.current, 0, 0, W, H);
      }

      // Send frame to FaceMesh (rate-limited internally)
      sendFrame(video);
    };

    rAF = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rAF);
  }, [faceReady, facingMode, particles, captured, sendFrame]);

  // ── Capture ────────────────────────────────────────────────
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
    prevCrownRef.current = null;
    initCamera();
  };

  const isLoading = !faceReady && !camError;

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
            HORA LOCA <span className="text-yellow-400">HATS</span>
          </span>
          <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">
            {experience.title}
          </span>
        </div>

        <div className="w-20" />
      </header>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Hidden video element — feeds the canvas */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* AR Canvas */}
        {!captured && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Captured image preview */}
        {captured && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={captured}
            className="absolute inset-0 w-full h-full object-contain"
            alt="Captura"
          />
        )}

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-sm z-20"
            >
              <Loader2 size={40} className="animate-spin text-yellow-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Cargando experiencia AR…
              </p>
              <p className="text-[8px] text-white/30 text-center px-8">
                Descargando modelo de reconocimiento facial<br />(solo la primera vez)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera error */}
        {camError && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              {camError}
            </p>
          </div>
        )}

        {/* Flash */}
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
        {/* Flip camera (only in viewfinder) */}
        <button
          onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
          disabled={!!captured || !!camError}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white active:text-slate-900 transition-all disabled:opacity-30"
        >
          <RefreshCw size={20} />
        </button>

        {/* Capture / Share */}
        {captured ? (
          <button
            onClick={handleShare}
            className="w-20 h-20 rounded-full bg-yellow-400 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all shadow-2xl"
          >
            <Share2 size={26} className="text-slate-900" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-900">
              COMPARTIR
            </span>
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!faceReady || !!camError}
            className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/5 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
              <Camera size={28} className="text-white" />
            </div>
          </button>
        )}

        {/* Spacer */}
        <div className="w-12" />
      </footer>
    </div>
  );
};
