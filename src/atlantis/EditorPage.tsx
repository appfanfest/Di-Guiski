import React, { useState, useRef, useEffect } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, Image as ImageIcon, Download, Lock, Unlock, ChevronLeft, Type, Maximize2, RotateCcw, Loader2, Sparkles, Trash2, ArrowDown } from 'lucide-react';

const VIRTUAL_WIDTH = 1000;
const VIRTUAL_HEIGHT = 1777;
const ASPECT_RATIO = 9 / 16;
const BASE_FONT_SIZE = 80;
const PHOTO_BASE_WIDTH = 600;

const FONTS = [
  { id: 'montserrat', name: '1', style: 'font-family: Montserrat, sans-serif' },
  { id: 'festive', name: '2', style: 'font-family: "Mountains of Christmas", cursive' },
  { id: 'lobster', name: '3', style: 'font-family: Lobster, cursive' },
  { id: 'script', name: '4', style: 'font-family: "Pinyon Script", cursive' },
];

const COLORS = [
  { name: 'Blanco', value: '#FFFFFF' }, { name: 'Negro', value: '#000000' },
  { name: 'Rojo', value: '#FF2D31' }, { name: 'Verde', value: '#00F5A0' }, { name: 'Oro', value: '#FFD700' }
];

interface Props { experienceId: string; onBack: () => void; }

export const EditorPage: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const primaryColor = nicheConfig?.primary_color || '#10b981';

  const [userImage, setUserImage] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'photo' | 'text'>('photo');
  const [isLocked, setIsLocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [photoPos, setPhotoPos] = useState({ x: 500, y: 888 });
  const [photoScale, setPhotoScale] = useState(1.0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoRadius, setPhotoRadius] = useState(0);
  const [text, setText] = useState('Tu Texto Aquí...');
  const [textPos, setTextPos] = useState({ x: 500, y: 1500 });
  const [textScale, setTextScale] = useState(1);
  const [textRotation, setTextRotation] = useState(0);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState(FONTS[1]);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorRect, setEditorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => { if (editorRef.current) setEditorRect(editorRef.current.getBoundingClientRect()); };
    updateRect();
    window.addEventListener('resize', updateRect);
    const el = editorRef.current;
    const preventDefault = (e: TouchEvent) => { if (!isLocked && e.touches.length === 1) e.preventDefault(); };
    if (el) el.addEventListener('touchmove', preventDefault, { passive: false });
    return () => { window.removeEventListener('resize', updateRect); if (el) el.removeEventListener('touchmove', preventDefault); };
  }, [isLocked]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => { setUserImage(ev.target?.result as string); setShowGuide(false); }; r.readAsDataURL(file); }
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked || !editorRect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeX = ((clientX - editorRect.left) / editorRect.width) * VIRTUAL_WIDTH;
    const relativeY = ((clientY - editorRect.top) / editorRect.height) * VIRTUAL_HEIGHT;
    if (activeLayer === 'photo') setPhotoPos({ x: relativeX, y: relativeY });
    else setTextPos({ x: relativeX, y: relativeY });
  };

  const handleReset = () => {
    if (window.confirm("¿Limpiar todo y empezar de nuevo?")) {
      setUserImage(null); setPhotoPos({ x: 500, y: 888 }); setPhotoScale(1.0); setPhotoRotation(0); setPhotoRadius(0);
      setText('Tu Texto Aquí...'); setTextPos({ x: 500, y: 1500 }); setTextScale(1); setTextRotation(0); setTextColor('#FFFFFF'); setTextFont(FONTS[1]); setShowGuide(true);
    }
  };

  const exportPostal = async () => {
    if (!experience) return;
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const overlayImg = new Image(); overlayImg.crossOrigin = 'anonymous';
    overlayImg.src = `${experience.demoLink}?t=${Date.now()}`;
    await new Promise(r => { overlayImg.onload = r; overlayImg.onerror = r; });
    await document.fonts.ready;
    const W = overlayImg.naturalWidth || 1080; const H = overlayImg.naturalHeight || 1920;
    canvas.width = W; canvas.height = H;
    const scaleFactor = W / VIRTUAL_WIDTH;
    const bgImg = new Image(); bgImg.crossOrigin = 'anonymous';
    bgImg.src = `${experience.activationLink}?t=${Date.now()}`;
    await new Promise(r => bgImg.onload = r);
    ctx.drawImage(bgImg, 0, 0, W, H);
    if (userImage) {
      const uImg = new Image(); uImg.src = userImage;
      await new Promise(r => uImg.onload = r);
      const fw = PHOTO_BASE_WIDTH * photoScale * scaleFactor;
      const fh = (uImg.height / uImg.width) * fw;
      const bsz = 15 * scaleFactor;
      const radius = (photoRadius / 100) * (Math.min(fw, fh) / 2 + bsz);
      ctx.save(); ctx.translate(photoPos.x * scaleFactor, photoPos.y * scaleFactor); ctx.rotate((photoRotation * Math.PI) / 180);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-(fw + bsz * 2) / 2, -(fh + bsz * 2) / 2, fw + bsz * 2, fh + bsz * 2, radius); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(-fw / 2, -fh / 2, fw, fh, Math.max(0, radius - bsz / 2)); ctx.clip();
      ctx.drawImage(uImg, -fw / 2, -fh / 2, fw, fh); ctx.restore(); ctx.restore();
    }
    ctx.drawImage(overlayImg, 0, 0, W, H);
    if (text.trim()) {
      ctx.save(); ctx.translate(textPos.x * scaleFactor, textPos.y * scaleFactor); ctx.rotate((textRotation * Math.PI) / 180);
      const fs = BASE_FONT_SIZE * textScale * scaleFactor;
      const fontName = textFont.id === 'montserrat' ? 'Montserrat' : textFont.id === 'festive' ? 'Mountains of Christmas' : textFont.id === 'lobster' ? 'Lobster' : 'Pinyon Script';
      ctx.font = `bold ${fs}px ${fontName}`; ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      text.split('\n').forEach((line, i) => ctx.fillText(line, 0, i * fs * 1.2)); ctx.restore();
    }
    const link = document.createElement('a'); link.download = `Postal_${Date.now()}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.92); link.click();
    setIsExporting(false);
  };

  if (!experience) return <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">No encontrada.</div>;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden font-sans h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="h-14 bg-black/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all active:scale-90 shadow-lg text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">{t.atlantis.postalesWassapTitle || 'POSTALES WASSAP'}</span>
        </div>
        <button onClick={exportPostal} disabled={isExporting} className="h-10 backdrop-blur-md border px-4 rounded-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-2 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}>
          {isExporting ? <Loader2 className="animate-spin" size={12} /> : <Download size={14} />}
          {isExporting ? 'Procesando' : 'Descargar'}
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-1 bg-black overflow-hidden min-h-0">
        <div ref={editorRef} onMouseMove={(e) => e.buttons === 1 && handleDrag(e)} onTouchMove={handleDrag}
          className="relative shadow-2xl bg-gray-900 overflow-hidden select-none rounded-lg"
          style={{ aspectRatio: ASPECT_RATIO, height: '100%', maxHeight: 'calc(100vh - 170px)', touchAction: 'none' }}>
          <img src={experience.activationLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" alt="BG" />
          {userImage && (
            <div className="absolute pointer-events-none"
              style={{ left: `${(photoPos.x / VIRTUAL_WIDTH) * 100}%`, top: `${(photoPos.y / VIRTUAL_HEIGHT) * 100}%`, width: `${(PHOTO_BASE_WIDTH * photoScale / VIRTUAL_WIDTH) * 100}%`, transform: `translate(-50%, -50%) rotate(${photoRotation}deg)`, backgroundColor: 'white', padding: '1.25%', borderRadius: `${photoRadius}%`, overflow: 'hidden' }}>
              <img src={userImage} className="w-full h-auto block" style={{ borderRadius: `${photoRadius * 0.8}%` }} alt="User" />
            </div>
          )}
          <img src={experience.demoLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-10" alt="Overlay" />
          <div className="absolute pointer-events-none z-20 text-center whitespace-pre-wrap flex items-center justify-center font-bold"
            style={{ left: `${(textPos.x / VIRTUAL_WIDTH) * 100}%`, top: `${(textPos.y / VIRTUAL_HEIGHT) * 100}%`, transform: `translate(-50%, -50%) rotate(${textRotation}deg) scale(${textScale})`, color: textColor, fontFamily: textFont.id === 'montserrat' ? 'Montserrat, sans-serif' : textFont.id === 'festive' ? '"Mountains of Christmas", cursive' : textFont.id === 'lobster' ? 'Lobster, cursive' : '"Pinyon Script", cursive', fontSize: `${BASE_FONT_SIZE * (editorRect ? editorRect.width / VIRTUAL_WIDTH : 0.4)}px`, width: '90%', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {text}
          </div>
          {!isLocked && (
            <div className="absolute w-6 h-6 border-2 rounded-full animate-pulse pointer-events-none z-50 opacity-40"
              style={{ left: `${((activeLayer === 'photo' ? photoPos.x : textPos.x) / VIRTUAL_WIDTH) * 100}%`, top: `${((activeLayer === 'photo' ? photoPos.y : textPos.y) / VIRTUAL_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)', borderColor: '#FFD700' }} />
          )}
        </div>
        {showGuide && !userImage && (
          <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none px-6">
            <div className="flex flex-col items-center gap-8 w-full max-w-[320px]">
              <div className="bg-black/40 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-white/10 text-white/90 text-xs font-black uppercase tracking-[0.2em] text-center">Toma una Foto o Selecciona una Imagen</div>
              <div className="animate-bounce bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/10" style={{ backgroundColor: `${primaryColor}40` }}>
                <ArrowDown size={32} className="text-white/60" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black/95 backdrop-blur-3xl p-1.5 space-y-2 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-2 px-1">
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 flex-1">
            <button onClick={() => setActiveLayer('photo')} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeLayer === 'photo' ? 'bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-transparent text-gray-500'}`}>Imagen</button>
            <button onClick={() => setActiveLayer('text')} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeLayer === 'text' ? 'bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-transparent text-gray-500'}`}>Mensaje</button>
          </div>
          {activeLayer === 'photo' && (
            <div className="flex gap-2">
              <label className="p-2 bg-white/5 border border-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all shadow-sm"><ImageIcon size={16} /><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
              <label className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-yellow-500/20 transition-all shadow-sm"><Camera size={16} /><input type="file" capture="environment" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
            </div>
          )}
          <button onClick={() => setIsLocked(!isLocked)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLocked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button onClick={handleReset} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center active:scale-95"><Trash2 size={14} /></button>
        </div>
        <div className="flex gap-3 px-1">
          <div className="flex-1 space-y-2">
            <div className="text-[8px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1"><Maximize2 size={10} /> ESCALA</div>
            <input type="range" min="0.1" max="2.5" step="0.01" value={activeLayer === 'photo' ? photoScale : textScale} onChange={(e) => activeLayer === 'photo' ? setPhotoScale(parseFloat(e.target.value)) : setTextScale(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[8px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1"><RotateCcw size={10} /> GIRO</div>
            <input type="range" min="-180" max="180" step="1" value={activeLayer === 'photo' ? photoRotation : textRotation} onChange={(e) => activeLayer === 'photo' ? setPhotoRotation(parseInt(e.target.value)) : setTextRotation(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
          </div>
          {activeLayer === 'photo' && (
            <div className="flex-1 space-y-2">
              <div className="text-[8px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10} /> BORDE</div>
              <input type="range" min="0" max="50" step="1" value={photoRadius} onChange={(e) => setPhotoRadius(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
            </div>
          )}
        </div>
        {activeLayer === 'text' && (
          <div className="space-y-1.5 px-1">
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white text-[12px] h-16 resize-none font-medium outline-none" placeholder="Escribe tu mensaje..." />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <Type size={12} className="text-gray-500" />
                <div className="flex gap-1">
                  {FONTS.map(f => (
                    <button key={f.id} onClick={() => setTextFont(f)} className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-black border transition-all ${textFont.id === f.id ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-black/50 text-gray-400 border-white/10'}`}>{f.name}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                {COLORS.map(c => (
                  <button key={c.name} onClick={() => setTextColor(c.value)} className={`w-4 h-4 rounded-full border ${textColor === c.value ? 'border-white scale-125 shadow-lg' : 'border-white/10'}`} style={{ backgroundColor: c.value }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
