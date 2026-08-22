import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, Image as ImageIcon, Download, Trash2, ChevronLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
const EXPORT_W = 2160, EXPORT_H = 3840;
interface Props { experienceId: string; onBack: () => void; }
export const MarcosPro: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';
  const [userImage, setUserImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isExporting, setIsExporting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sel, setSel] = useState<1|2|3|4>(1);
  const [isCam, setIsCam] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const overlayUrl = useMemo(() => {
    if (!experience) return "";
    if (sel === 2) return experience.demoLink;
    if (sel === 3) return experience.photoboothLink3 || experience.activationLink;
    if (sel === 4) return experience.photoboothLink4 || experience.activationLink;
    return experience.activationLink;
  }, [experience, sel]);
  const startCam = async (retries = 2) => {
    if (!mounted.current || !isCam) return;
    setCameraError(null);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false });
      if (!mounted.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch { if (retries > 0) await startCam(retries - 1); else setCameraError(t.atlantis.camUnavailable); }
  };
  useEffect(() => { mounted.current = true; if (isCam && !userImage) startCam(); return () => { mounted.current = false; streamRef.current?.getTracks().forEach(t => t.stop()); }; }, [facingMode, isCam, userImage]);
  const capture = () => {
    if (!videoRef.current) return;
    setShowFlash(true); setTimeout(() => setShowFlash(false), 300);
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const v = videoRef.current; const vA = v.videoWidth / v.videoHeight; const tA = 9 / 16;
    let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
    if (vA > tA) { sw = v.videoHeight * tA; sx = (v.videoWidth - sw) / 2; } else { sh = v.videoWidth / tA; sy = (v.videoHeight - sh) / 2; }
    ctx.save(); if (facingMode === 'user') { ctx.translate(1080, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, 1080, 1920); ctx.restore();
    setUserImage(canvas.toDataURL('image/jpeg', 0.95)); setIsCam(false);
  };
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => { setUserImage(ev.target?.result as string); setIsCam(false); }; r.readAsDataURL(f); } };
  const reset = () => { setUserImage(null); setIsCam(true); setCameraError(null); };
  const exportIt = async () => {
    if (!userImage) return; setIsExporting(true);
    const canvas = document.createElement('canvas'); canvas.width = EXPORT_W; canvas.height = EXPORT_H;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const img = new Image(); img.src = userImage; await new Promise(r => img.onload = r);
    ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H);
    const ov = new Image(); ov.crossOrigin = 'anonymous'; ov.src = overlayUrl;
    await new Promise(r => { ov.onload = r; ov.onerror = r; });
    ctx.drawImage(ov, 0, 0, EXPORT_W, EXPORT_H);
    const link = document.createElement('a'); link.download = `MarcosPro_${Date.now()}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.95); link.click();
    setIsExporting(false);
  };
  if (!experience) return <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">{t.atlantis.notFound}</div>;
  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/90 backdrop-blur-md shrink-0">
        <button onClick={onBack} className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all active:scale-90 shadow-lg text-yellow-400 flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={16} /> {t.atlantis.back}</button>
        <span className="font-black text-[11px] tracking-[0.3em] uppercase text-yellow-400">{t.atlantis.marcosproTitle}</span>
        <div className="w-10" />
      </header>
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-0">
        <div className="relative h-full max-h-full aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute inset-0 z-10 bg-black">
            {userImage ? <img src={userImage} className="w-full h-full object-cover" alt="P" /> : isCam ? <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} /> : null}
          </div>
          <div className="absolute inset-0 z-30 pointer-events-none">
            <img src={overlayUrl} key={sel} className="w-full h-full object-contain mix-blend-screen" alt="Overlay" />
          </div>
          {showFlash && <div className="absolute inset-0 bg-white z-[200]" />}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            {userImage ? (
              <button onClick={exportIt} disabled={isExporting} className="w-16 h-16 rounded-full backdrop-blur-2xl flex flex-col items-center justify-center border-2 active:scale-90 disabled:opacity-50" style={{ backgroundColor: `${pc}30`, color: 'white', borderColor: pc }}>
                {isExporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                <span className="text-[6px] font-black mt-0.5 uppercase tracking-widest">{t.atlantis.ready}</span>
              </button>
            ) : (
              <button onClick={capture} className="w-16 h-16 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center group active:scale-95 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-white/20 group-active:bg-white flex items-center justify-center"><Camera size={24} className="text-white group-active:text-black" /></div>
              </button>
            )}
          </div>
        </div>
      </div>
      <footer className="h-24 bg-black border-t border-white/10 flex items-center justify-between px-6 z-[120] shrink-0">
        <div className="flex gap-3">
          <button disabled={!!userImage} onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center active:bg-yellow-500 active:text-slate-950 disabled:opacity-0"><RefreshCw size={18} /></button>
          <label className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center cursor-pointer"><ImageIcon size={18} /><input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          {([1,2,3,4] as const).map(n => (
            <button key={n} onClick={() => setSel(n)} className={`w-9 h-9 rounded-full font-black text-xs transition-all border-2 flex items-center justify-center ${sel===n?'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110':'bg-yellow-500/5 text-yellow-500/60 border-yellow-500/20'}`}>{n}</button>
          ))}
        </div>
        <button onClick={reset} className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center active:bg-red-600 active:text-white"><Trash2 size={18} /></button>
      </footer>
      {cameraError && !userImage && <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14} className="text-red-600" /> {cameraError}</div>}
    </div>
  );
};
