
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Image as ImageIcon, Download, Lock, Unlock, 
  ChevronLeft, Type, Maximize2, RotateCcw, Loader2, Sparkles, Trash2, ArrowDown
} from 'lucide-react';
import { Experience } from './types';
import { motion, AnimatePresence } from 'motion/react';

const VIRTUAL_WIDTH = 1000;
const VIRTUAL_HEIGHT = 1777; 
const ASPECT_RATIO = 9 / 16;
const BASE_FONT_SIZE = 80; 
const PHOTO_BASE_WIDTH = 600; 

const FONTS = [
  { id: 'montserrat', name: 'Sans', class: 'font-sans' },
  { id: 'display', name: 'Display', class: 'font-black' },
  { id: 'italic', name: 'Italic', class: 'italic font-black' },
  { id: 'script', name: 'Script', class: 'font-serif' }
];

const COLORS = [
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Negro', value: '#000000' },
  { name: 'Azul Fifa', value: '#0066ff' },
  { name: 'Oro', value: '#ffcc00' },
  { name: 'Esmeralda', value: '#10b981' }
];

interface PostcardEditorProps {
  experience: Experience;
  onBack: () => void;
  primaryColor?: string;
}

export const PostcardEditor: React.FC<PostcardEditorProps> = ({ 
  experience, 
  onBack,
  primaryColor = '#0066ff'
}) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'photo' | 'text'>('photo');
  const [isLocked, setIsLocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const [photoPos, setPhotoPos] = useState({ x: 500, y: 888 });
  const [photoScale, setPhotoScale] = useState(1.0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoRadius, setPhotoRadius] = useState(0); 

  const [text, setText] = useState('¡VAMOS SELECCIÓN!');
  const [textPos, setTextPos] = useState({ x: 500, y: 1500 });
  const [textScale, setTextScale] = useState(1);
  const [textRotation, setTextRotation] = useState(0);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState(FONTS[1]);

  const editorRef = useRef<HTMLDivElement>(null);
  const [editorRect, setEditorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      if (editorRef.current) setEditorRect(editorRef.current.getBoundingClientRect());
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    
    const preventDefault = (e: TouchEvent) => {
      if (!isLocked && e.touches.length === 1) e.preventDefault();
    };

    const el = editorRef.current;
    if (el) el.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      window.removeEventListener('resize', updateRect);
      if (el) el.removeEventListener('touchmove', preventDefault);
    };
  }, [isLocked]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImage(ev.target?.result as string);
        setShowGuide(false); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked || !editorRect) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    const relativeX = ((clientX - editorRect.left) / editorRect.width) * VIRTUAL_WIDTH;
    const relativeY = ((clientY - editorRect.top) / editorRect.height) * VIRTUAL_HEIGHT;
    if (activeLayer === 'photo') setPhotoPos({ x: relativeX, y: relativeY });
    else setTextPos({ x: relativeX, y: relativeY });
  };

  const handleReset = () => {
    if (window.confirm("¿Estás seguro de limpiar todo y empezar de nuevo?")) {
      setUserImage(null);
      setPhotoPos({ x: 500, y: 888 });
      setPhotoScale(1.0);
      setPhotoRotation(0);
      setPhotoRadius(0);
      setText('¡VAMOS SELECCIÓN!');
      setTextPos({ x: 500, y: 1500 });
      setTextScale(1);
      setTextRotation(0);
      setTextColor('#FFFFFF');
      setTextFont(FONTS[1]);
      setShowGuide(true);
    }
  };

  const exportPostal = async () => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const overlayImg = new Image();
    overlayImg.crossOrigin = 'anonymous';
    overlayImg.src = `${experience.demoLink}?t=${Date.now()}`;
    await new Promise(r => { overlayImg.onload = r; overlayImg.onerror = r; });

    const W = overlayImg.naturalWidth || 1080;
    const H = overlayImg.naturalHeight || 1920;
    canvas.width = W; canvas.height = H;
    const scaleFactor = W / VIRTUAL_WIDTH;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = `${experience.activationLink}?t=${Date.now()}`;
    await new Promise(r => { bgImg.onload = r; bgImg.onerror = r; });
    ctx.drawImage(bgImg, 0, 0, W, H);

    if (userImage) {
      const uImg = new Image();
      uImg.src = userImage;
      await new Promise(r => uImg.onload = r);
      const finalPhotoWidth = PHOTO_BASE_WIDTH * photoScale * scaleFactor;
      const finalPhotoHeight = (uImg.height / uImg.width) * finalPhotoWidth;
      const borderSize = 15 * scaleFactor;
      const totalWidth = finalPhotoWidth + borderSize * 2;
      const totalHeight = finalPhotoHeight + borderSize * 2;
      const radius = (photoRadius / 100) * (Math.min(finalPhotoWidth, finalPhotoHeight) / 2 + borderSize);
      
      ctx.save();
      ctx.translate(photoPos.x * scaleFactor, photoPos.y * scaleFactor);
      ctx.rotate((photoRotation * Math.PI) / 180);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      (ctx as any).roundRect?.(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight, radius);
      ctx.fill();
      
      ctx.save();
      ctx.beginPath();
      const innerRadius = Math.max(0, radius - borderSize / 2);
      (ctx as any).roundRect?.(-finalPhotoWidth / 2, -finalPhotoHeight / 2, finalPhotoWidth, finalPhotoHeight, innerRadius);
      ctx.clip();
      ctx.drawImage(uImg, -finalPhotoWidth / 2, -finalPhotoHeight / 2, finalPhotoWidth, finalPhotoHeight);
      ctx.restore();
      ctx.restore();
    }

    ctx.drawImage(overlayImg, 0, 0, W, H);

    if (text.trim()) {
        ctx.save();
        ctx.translate(textPos.x * scaleFactor, textPos.y * scaleFactor);
        ctx.rotate((textRotation * Math.PI) / 180);
        const finalFontSize = BASE_FONT_SIZE * textScale * scaleFactor;
        let fontStyle = 'normal';
        let fontWeight = 'normal';
        let fontFamily = 'sans-serif';
        if (textFont.id === 'display') { fontWeight = '900'; fontFamily = 'system-ui, -apple-system, sans-serif'; }
        if (textFont.id === 'italic') { fontStyle = 'italic'; fontWeight = '900'; fontFamily = 'system-ui, -apple-system, sans-serif'; }
        if (textFont.id === 'script') { fontFamily = 'serif'; }
        
        await document.fonts.ready;
        ctx.font = `${fontStyle} ${fontWeight} ${finalFontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lines = text.split('\n');
        lines.forEach((line, i) => ctx.fillText(line, 0, i * finalFontSize * 1.2));
        ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `FanFest_Postal_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col font-sans overflow-hidden h-[100dvh]">
      <header className="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack} 
                className="p-2 bg-white/5 border border-white/10 rounded-2xl hover:text-white transition-all active:scale-90 shadow-lg text-white"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">EDITOR <span className="text-emerald-500">POSTAL</span></span>
        </div>
        <button 
            onClick={exportPostal} 
            disabled={isExporting}
            className="h-11 bg-yellow-500 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-yellow-900/20"
        >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={18} />}
            {isExporting ? 'Procesando' : 'Descargar'}
        </button>
      </header>

      <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-slate-950">
        <div 
          ref={editorRef}
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          onTouchMove={handleDrag}
          className="relative shadow-2xl bg-slate-900 overflow-hidden select-none rounded-3xl border border-white/10"
          style={{ 
            aspectRatio: ASPECT_RATIO, 
            height: '100%', 
            maxHeight: 'calc(100vh - 200px)',
            touchAction: 'none'
          }}
        >
          <img src={experience.activationLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" alt="BG" />
          
          <AnimatePresence>
            {userImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute pointer-events-none shadow-2xl"
                style={{
                  left: `${(photoPos.x / VIRTUAL_WIDTH) * 100}%`,
                  top: `${(photoPos.y / VIRTUAL_HEIGHT) * 100}%`,
                  width: `${(PHOTO_BASE_WIDTH * photoScale / VIRTUAL_WIDTH) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${photoRotation}deg)`,
                  backgroundColor: 'white', padding: '1.5%', borderRadius: `${photoRadius}%`, overflow: 'hidden'
                }}
              >
                <img src={userImage} className="w-full h-auto block" style={{ borderRadius: `${photoRadius * 0.8}%` }} alt="User" />
              </motion.div>
            )}
          </AnimatePresence>

          <img src={experience.demoLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-10" alt="Overlay" />
          
          <div className={`absolute pointer-events-none z-20 text-center whitespace-pre-wrap flex items-center justify-center font-black ${textFont.class}`}
            style={{
              left: `${(textPos.x / VIRTUAL_WIDTH) * 100}%`,
              top: `${(textPos.y / VIRTUAL_HEIGHT) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${textRotation}deg) scale(${textScale})`,
              color: textColor,
              fontSize: `${BASE_FONT_SIZE * (editorRect ? editorRect.width / VIRTUAL_WIDTH : 0.4)}px`,
              width: '90%', textShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}
          >
            {text}
          </div>

          {!isLocked && (
            <div className="absolute w-8 h-8 border-4 border-yellow-500 rounded-full animate-pulse pointer-events-none z-50 opacity-60"
              style={{
                left: `${((activeLayer === 'photo' ? photoPos.x : textPos.x) / VIRTUAL_WIDTH) * 100}%`,
                top: `${((activeLayer === 'photo' ? photoPos.y : textPos.y) / VIRTUAL_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )}
        </div>

        {showGuide && !userImage && (
          <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none px-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto">
                <ImageIcon size={32} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white/90">Sube una foto y crea tu postal oficial</p>
              <div className="animate-bounce inline-block">
                <ArrowDown size={24} className="text-yellow-500" />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/95 backdrop-blur-3xl p-4 space-y-4 shrink-0 border-t border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 flex-1">
                <button onClick={() => setActiveLayer('photo')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeLayer === 'photo' ? 'bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-white/40'}`}>Imagen</button>
                <button onClick={() => setActiveLayer('text')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeLayer === 'text' ? 'bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-white/40'}`}>Mensaje</button>
            </div>
            
            <div className="flex gap-2">
                <label className="w-11 h-11 bg-white/5 border border-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/10"><ImageIcon size={18} /><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
                <label className="w-11 h-11 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-yellow-500/20"><Camera size={18} /><input type="file" capture="environment" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
            </div>
            
            <button onClick={() => setIsLocked(!isLocked)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isLocked ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </button>
        </div>

        <div className="flex gap-4">
            <div className="flex-1 space-y-2">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><Maximize2 size={10}/> Escala</div>
                <input type="range" min="0.1" max="2.5" step="0.01" value={activeLayer === 'photo' ? photoScale : textScale} onChange={(e) => activeLayer === 'photo' ? setPhotoScale(parseFloat(e.target.value)) : setTextScale(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><RotateCcw size={10}/> Giro</div>
                <input type="range" min="-180" max="180" step="1" value={activeLayer === 'photo' ? photoRotation : textRotation} onChange={(e) => activeLayer === 'photo' ? setPhotoRotation(parseInt(e.target.value)) : setTextRotation(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
            </div>
            {activeLayer === 'photo' && (
              <div className="flex-1 space-y-2">
                  <div className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> Borde</div>
                  <input type="range" min="0" max="50" step="1" value={photoRadius} onChange={(e) => setPhotoRadius(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none accent-yellow-500" />
              </div>
            )}
            <button onClick={handleReset} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/20 flex items-center justify-center active:bg-red-500/20 active:text-red-500 transition-all">
                <Trash2 size={18} />
            </button>
        </div>

        {activeLayer === 'text' && (
          <div className="space-y-3 animate-slide-in">
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-[13px] h-20 resize-none font-bold outline-none focus:border-yellow-500/50 transition-all shadow-inner" placeholder="Escribe tu mensaje..." />
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 flex-1 overflow-x-auto no-scrollbar">
                    {FONTS.map(f => (
                        <button key={f.id} onClick={() => setTextFont(f)} className={`px-4 py-1.5 rounded-full text-[9px] font-black border transition-all whitespace-nowrap ${textFont.id === f.id ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-white/40 border-white/5'}`}>{f.name}</button>
                    ))}
                </div>
                <div className="flex gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                    {COLORS.map(c => (
                        <button key={c.name} onClick={() => setTextColor(c.value)} className={`w-5 h-5 rounded-full border-2 ${textColor === c.value ? 'border-white scale-125 shadow-lg' : 'border-white/10'}`} style={{ backgroundColor: c.value }} />
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
