
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Camera, Image as ImageIcon, Download, Lock, Unlock, 
  ChevronLeft, Type, Maximize2, RotateCcw, Save, Loader2, Sparkles, Trash2, ArrowDown
} from 'lucide-react';

const VIRTUAL_WIDTH = 1000;
const VIRTUAL_HEIGHT = 1777; // 1000 * (16/9)
const ASPECT_RATIO = 9 / 16;
const BASE_FONT_SIZE = 80; 
const PHOTO_BASE_WIDTH = 600; 

const FONTS = [
  { id: 'montserrat', name: '1', class: 'font-display' },
  { id: 'festive', name: '2', class: 'font-festive' },
  { id: 'lobster', name: '3', class: 'font-lobster' },
  { id: 'script', name: '4', class: 'font-script' }
];

const COLORS = [
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Negro', value: '#000000' },
  { name: 'Rojo', value: '#FF2D31' },
  { name: 'Verde', value: '#00F5A0' },
  { name: 'Oro', value: '#FFD700' }
];

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { experiences, nicheConfig } = useAppContext();
  const experience = experiences.find(e => e.id === id);

  const [userImage, setUserImage] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'photo' | 'text'>('photo');
  const [isLocked, setIsLocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const [photoPos, setPhotoPos] = useState({ x: 500, y: 888 });
  const [photoScale, setPhotoScale] = useState(1.0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoRadius, setPhotoRadius] = useState(0); 

  // 1) Cambio de texto predefinido
  const [text, setText] = useState('Tu Texto Aquí...');
  const [textPos, setTextPos] = useState({ x: 500, y: 1500 });
  const [textScale, setTextScale] = useState(1);
  const [textRotation, setTextRotation] = useState(0);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState(FONTS[1]);

  const editorRef = useRef<HTMLDivElement>(null);
  const [editorRect, setEditorRect] = useState<DOMRect | null>(null);

  // 2) Obtener color primario dinámico
  const primaryColor = nicheConfig?.primary_color || '#FF2D31';

  useEffect(() => {
    const updateRect = () => {
      if (editorRef.current) setEditorRect(editorRef.current.getBoundingClientRect());
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    
    // Bloqueo físico de eventos de scroll/pull-to-refresh en el área del editor
    const preventDefault = (e: TouchEvent) => {
      if (!isLocked) {
        // Solo prevenimos si el usuario está interactuando con un dedo (arrastrando imagen/texto)
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      }
    };

    const el = editorRef.current;
    if (el) {
      el.addEventListener('touchmove', preventDefault, { passive: false });
    }
    
    return () => {
      window.removeEventListener('resize', updateRect);
      if (el) {
        el.removeEventListener('touchmove', preventDefault);
      }
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
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
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
      setText('Tu Texto Aquí...');
      setTextPos({ x: 500, y: 1500 });
      setTextScale(1);
      setTextRotation(0);
      setTextColor('#FFFFFF');
      setTextFont(FONTS[1]);
      setShowGuide(true);
    }
  };

  const exportPostal = async () => {
    if (!experience) return;
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
    await new Promise(r => bgImg.onload = r);
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
      ctx.roundRect(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight, radius);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      const innerRadius = Math.max(0, radius - borderSize / 2);
      ctx.roundRect(-finalPhotoWidth / 2, -finalPhotoHeight / 2, finalPhotoWidth, finalPhotoHeight, innerRadius);
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
        const fontName = textFont.id === 'montserrat' ? 'Montserrat' : textFont.id === 'festive' ? 'Mountains of Christmas' : textFont.id === 'lobster' ? 'Lobster' : 'Pinyon Script';
        ctx.font = `bold ${finalFontSize}px ${fontName}`;
        ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lines = text.split('\n');
        lines.forEach((line, i) => ctx.fillText(line, 0, i * finalFontSize * 1.2));
        ctx.restore();
    }
    const link = document.createElement('a');
    link.download = `Postal_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    setIsExporting(false);
  };

  if (!experience) return <div className="p-20 text-center text-white">No encontrada.</div>;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in overflow-hidden font-sans">
      <header className="h-14 bg-black/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate(-1)} 
                className="p-1.5 backdrop-blur-md border rounded-lg hover:text-white transition-all active:scale-90 shadow-lg"
                style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }}
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>EDITOR PRO</span>
        </div>
        <button 
            onClick={exportPostal} 
            disabled={isExporting}
            className="h-10 backdrop-blur-md border px-4 rounded-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-lg"
            style={{ 
              backgroundColor: `${primaryColor}20`, 
              borderColor: `${primaryColor}40`, 
              color: primaryColor,
              '--tw-hover-bg': primaryColor
            } as any}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.color = 'black'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}20`; e.currentTarget.style.color = primaryColor; }}
        >
            {isExporting ? <Loader2 className="animate-spin" size={12} /> : <Download size={14} />}
            {isExporting ? 'Procesando' : 'Descargar'}
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-1 bg-black">
        <div 
          ref={editorRef}
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          onTouchMove={handleDrag}
          className="relative shadow-2xl bg-gray-900 overflow-hidden select-none rounded-lg"
          style={{ 
            aspectRatio: ASPECT_RATIO, 
            height: '100%', 
            maxHeight: 'calc(100vh - 170px)',
            touchAction: 'none', // Desactiva gestos nativos del navegador en este elemento
            overscrollBehavior: 'none' // Evita el pull-to-refresh en Chrome/Android
          }}
        >
          <img src={experience.activationLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" alt="BG" />
          {userImage && (
            <div className="absolute pointer-events-none"
              style={{
                left: `${(photoPos.x / VIRTUAL_WIDTH) * 100}%`,
                top: `${(photoPos.y / VIRTUAL_HEIGHT) * 100}%`,
                width: `${(PHOTO_BASE_WIDTH * photoScale / VIRTUAL_WIDTH) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${photoRotation}deg)`,
                backgroundColor: 'white', padding: '1.25%', borderRadius: `${photoRadius}%`, overflow: 'hidden'
              }}
            >
              <img src={userImage} className="w-full h-auto block" style={{ borderRadius: `${photoRadius * 0.8}%` }} alt="User" />
            </div>
          )}
          <img src={experience.demoLink} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-10" alt="Overlay" />
          <div className={`absolute pointer-events-none z-20 text-center whitespace-pre-wrap flex items-center justify-center font-bold ${textFont.class}`}
            style={{
              left: `${(textPos.x / VIRTUAL_WIDTH) * 100}%`,
              top: `${(textPos.y / VIRTUAL_HEIGHT) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${textRotation}deg) scale(${textScale})`,
              color: textColor,
              fontSize: `${BASE_FONT_SIZE * (editorRect ? editorRect.width / VIRTUAL_WIDTH : 0.4)}px`,
              width: '90%', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {text}
          </div>
          {!isLocked && (
            <div className="absolute w-6 h-6 border-2 rounded-full animate-pulse pointer-events-none z-50 opacity-40"
              style={{
                left: `${((activeLayer === 'photo' ? photoPos.x : textPos.x) / VIRTUAL_WIDTH) * 100}%`,
                top: `${((activeLayer === 'photo' ? photoPos.y : textPos.y) / VIRTUAL_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)',
                borderColor: '#FFD700'
              }}
            />
          )}
        </div>

        {showGuide && !userImage && (
          <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none px-6">
            <div className="flex flex-col items-center gap-8 animate-fade-in w-full max-w-[320px]">
              <div className="bg-black/40 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-white/10 text-white/90 text-xs font-black uppercase tracking-[0.2em] text-center shadow-xl leading-relaxed">
                Toma una Foto o Selecciona una Imagen de la Galería
              </div>
              <div className="animate-bounce bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/10 shadow-lg" style={{ backgroundColor: `${primaryColor}40` }}>
                  <ArrowDown size={32} className="text-white/60" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black/95 backdrop-blur-3xl p-1.5 space-y-2 shrink-0 border-t border-white/5 shadow-2xl">
        <div className="flex items-center gap-2 px-1">
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 flex-1">
                <button onClick={() => setActiveLayer('photo')} className="flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all" style={{ backgroundColor: activeLayer === 'photo' ? `${primaryColor}15` : 'transparent', color: activeLayer === 'photo' ? primaryColor : '#6B7280' }}>Imagen</button>
                <button onClick={() => setActiveLayer('text')} className="flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all" style={{ backgroundColor: activeLayer === 'text' ? `${primaryColor}15` : 'transparent', color: activeLayer === 'text' ? primaryColor : '#6B7280' }}>Mensaje</button>
            </div>
            
            {activeLayer === 'photo' && (
              <div className="flex gap-1">
                <label className="p-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg flex items-center cursor-pointer transition-all hover:bg-white/10 hover:text-white" title="Galería"><ImageIcon size={14} /><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
                <label className="p-1.5 border rounded-lg flex items-center cursor-pointer transition-all" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }} title="Cámara"><Camera size={14} /><input type="file" capture="environment" accept="image/*" className="hidden" onChange={handleFileUpload} /></label>
              </div>
            )}
            
            <button onClick={() => setIsLocked(!isLocked)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLocked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <button onClick={handleReset} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center active:scale-95 transition-all hover:bg-white/10 hover:text-white" title="Limpiar Editor">
                <Trash2 size={14} />
            </button>
        </div>

        <div className="flex gap-2 px-1">
            <div className="flex-1 space-y-1">
                <div className="text-[7px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><Maximize2 size={8}/> ESCALA</div>
                <input type="range" min="0.1" max="2.5" step="0.01" value={activeLayer === 'photo' ? photoScale : textScale} onChange={(e) => activeLayer === 'photo' ? setPhotoScale(parseFloat(e.target.value)) : setTextScale(parseFloat(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none" style={{ accentColor: primaryColor } as any} />
            </div>
            <div className="flex-1 space-y-1">
                <div className="text-[7px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><RotateCcw size={8}/> GIRO</div>
                <input type="range" min="-180" max="180" step="1" value={activeLayer === 'photo' ? photoRotation : textRotation} onChange={(e) => activeLayer === 'photo' ? setPhotoRotation(parseInt(e.target.value)) : setTextRotation(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none" style={{ accentColor: primaryColor } as any} />
            </div>
            {activeLayer === 'photo' && (
              <div className="flex-1 space-y-1">
                  <div className="text-[7px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><Sparkles size={8}/> BORDE</div>
                  <input type="range" min="0" max="50" step="1" value={photoRadius} onChange={(e) => setPhotoRadius(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none" style={{ accentColor: primaryColor } as any} />
              </div>
            )}
        </div>

        {activeLayer === 'text' && (
          <div className="space-y-1.5 px-1 animate-slide-in">
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white text-[12px] h-16 resize-none font-medium outline-none shadow-inner focus:border-white/20" placeholder="Escribe tu mensaje aquí..." />
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1 text-gray-500">
                        <Type size={12} />
                    </div>
                    <div className="flex gap-1">
                        {FONTS.map(f => (
                            <button key={f.id} onClick={() => setTextFont(f)} className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black border transition-all" style={{ backgroundColor: textFont.id === f.id ? primaryColor : 'rgba(0,0,0,0.5)', color: textFont.id === f.id ? 'black' : '#9CA3AF', borderColor: textFont.id === f.id ? primaryColor : 'rgba(255,255,255,0.1)' }}>{f.name}</button>
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
