// ────────────────────────────────────────────────────────────
// src/metaverse/ar/ARFaceGlam.tsx
// AR component: face paint projected onto the face oval.
// Supports two modes (can be combined in one experience):
//   Modo A — face_paint_url: a PNG (flag, animal, logo) is
//             scaled and clipped to the face oval contour.
//   Modo B — face_paint_zones: solid color fills on lips,
//             eyes or cheeks.
// Optional particle system and marco overlay on top.
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
  LIPS_OUTER,
  LEFT_EYE,
  RIGHT_EYE,
  Landmark,
  buildPath,
  getBBox,
  lmToXY,
  loadImage,
  startCamera,
  stopStream,
  shareCanvas,
} from './utils';

interface Props {
  experience: Experience;
  onBack: () => void;
}

// ── Draw: Modo A — full-face image projected + clipped ────────
function drawFacePaintUrl(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  img: HTMLImageElement,
  opacity: number,
  blend: GlobalCompositeOperation,
  w: number,
  h: number,
  mirrored: boolean,
) {
  ctx.save();
  buildPath(ctx, lm, FACE_OVAL, w, h, mirrored);
  ctx.clip();

  const bbox = getBBox(lm, FACE_OVAL, w, h, mirrored);
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = blend;
  ctx.drawImage(img, bbox.x, bbox.y, bbox.w, bbox.h);
  ctx.restore();
}

// ── Draw: Modo B — color zone fill ───────────────────────────
function drawZone(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  indices: number[],
  color: string,
  opacity: number,
  w: number,
  h: number,
  mirrored: boolean,
) {
  ctx.save();
  buildPath(ctx, lm, indices, w, h, mirrored);
  ctx.clip();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawCheeks(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  color: string,
  opacity: number,
  w: number,
  h: number,
  mirrored: boolean,
) {
  // Cheek centers: left=234, right=454
  [234, 454].forEach((idx) => {
    const { x, y } = lmToXY(lm[idx], w, h, mirrored);
    const rx = w * 0.10;
    const ry = h * 0.065;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ── Component ─────────────────────────────────────────────────

export const ARFaceGlam: React.FC<Props> = ({ experience, onBack }) => {
  const config   = experience.ar_config ?? {};
  const marcoUrl = experience.activationLink;

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [camError, setCamError]     = useState<string | null>(null);
  const [captured, setCaptured]     = useState<string | null>(null);
  const [flash, setFlash]           = useState(false);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);

  const facePaintImgRef = useRef<HTMLImageElement | null>(null);
  const marcoImgRef     = useRef<HTMLImageElement | null>(null);

  const { isReady: faceReady, landmarksRef, sendFrame } = useFaceMesh();
  const particles = useParticles(config.particles);

  // ── Load image assets ──────────────────────────────────────
  useEffect(() => {
    const loads = [
      config.face_paint_url ? loadImage(config.face_paint_url).catch(() => null) : Promise.resolve(null),
      marcoUrl              ? loadImage(marcoUrl).catch(() => null)               : Promise.resolve(null),
    ];
    Promise.all(loads).then(([paint, marco]) => {
      if (!isMounted.current) return;
      facePaintImgRef.current = paint as HTMLImageElement | null;
      marcoImgRef.current     = marco as HTMLImageElement | null;
    });
  }, [config.face_paint_url, marcoUrl]);

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

      if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d')!;
      const { width: W, height: H } = canvas;

      // — Layer 1: Video —
      ctx.save();
      if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      // — Layer 2: Face Paint —
      const lm = landmarksRef.current;
      if (lm) {
        // Modo A: PNG image projected onto face
        if (facePaintImgRef.current && config.face_paint_url) {
          const opacity = config.face_paint_opacity ?? 0.75;
          const blend   = (config.face_paint_blend as GlobalCompositeOperation) ?? 'source-over';
          drawFacePaintUrl(ctx, lm, facePaintImgRef.current, opacity, blend, W, H, mirrored);
        }

        // Modo B: color zones
        const zones = config.face_paint_zones || (!config.face_paint_url && !facePaintImgRef.current ? {
          lips: { color: 'rgba(255, 20, 147, 0.5)' },
          cheeks: { color: 'rgba(255, 105, 180, 0.3)' }
        } : null);
        if (zones) {
          if (zones.lips)   drawZone(ctx, lm, LIPS_OUTER, zones.lips.color,   zones.lips.opacity,   W, H, mirrored);
          if (zones.eyes) {
            drawZone(ctx, lm, LEFT_EYE,  zones.eyes.color, zones.eyes.opacity, W, H, mirrored);
            drawZone(ctx, lm, RIGHT_EYE, zones.eyes.color, zones.eyes.opacity, W, H, mirrored);
          }
          if (zones.cheeks) drawCheeks(ctx, lm, zones.cheeks.color, zones.cheeks.opacity, W, H, mirrored);
        }
      }

      // — Layer 3: Particles —
      particles.drawFrame(ctx, W, H);

      // — Layer 4: Marco overlay —
      if (marcoImgRef.current) ctx.drawImage(marcoImgRef.current, 0, 0, W, H);

      sendFrame(video);
    };

    rAF = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rAF);
  }, [faceReady, facingMode, particles, captured, sendFrame, config]);

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
            FACE <span className="text-pink-400">GLAM</span>
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
              <Loader2 size={40} className="animate-spin text-pink-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Cargando Face Paint AR…
              </p>
              <p className="text-[8px] text-white/30 text-center px-8">
                Descargando modelo facial<br />(solo la primera vez)
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
            className="w-20 h-20 rounded-full bg-pink-500 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all shadow-2xl"
          >
            <Share2 size={26} className="text-white" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">
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

        <div className="w-12" />
      </footer>
    </div>
  );
};
