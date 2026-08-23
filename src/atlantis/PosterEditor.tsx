import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, Download, Trash2, Plus, Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw, FileImage, AlertCircle, Circle, Heart, Star, Droplet, Square, MessageSquare, Type, LayoutTemplate } from 'lucide-react';
import { MaskType, getMaskCSS, drawMaskToCanvas } from './maskUtils';

// Dimensiones del poster 50x60cm a 300dpi
const POSTER_W = 5906;
const POSTER_H = 7087;
const ASPECT = POSTER_W / POSTER_H; // ~0.833
const MAX_SLOTS = 10;

interface PhotoSlot {
  id: number;
  dataUrl: string | null;
  // Posición relativa (0-1) del centro de la foto en el canvas
  x: number;
  y: number;
  scale: number;
  rotation: number;
  maskType: MaskType;
  widthPct: number;
  heightPct: number;
}

export interface StickyNote {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontFamily: string;
  fontSizeScale: number;
}

const BORDER_PCT = 0.006; // ~0.6% of poster width as border gap (outline doesn't affect layout)

export type PosterLayoutId = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-round-single';

export const generateSlots = (layoutId: PosterLayoutId, prevSlots: PhotoSlot[] = []): PhotoSlot[] => {
  const SAFE_Y_START = 0.28;
  const SAFE_Y_END = 0.92;
  const SAFE_H = SAFE_Y_END - SAFE_Y_START;
  const SAFE_W = 0.90;
  const START_X = 0.05;
  const GAP_X = 0.025;
  const GAP_Y = 0.025;

  const slots: PhotoSlot[] = [];
  let id = 0;

  const addSlot = (cx: number, cy: number, w: number, h: number, m: MaskType = 'none') => {
    const prev = prevSlots[id];
    slots.push({
      id: id++,
      x: cx,
      y: cy,
      widthPct: w,
      heightPct: h,
      dataUrl: prev?.dataUrl || null,
      scale: prev?.scale || 1,
      rotation: prev?.rotation || 0,
      maskType: m !== 'none' ? m : (prev?.maskType || 'none'),
    });
  };

  // Add 3 small circles at the top for all layouts
  addSlot(0.15, 0.15, 0.20, 0.20, 'circle');
  addSlot(0.5, 0.15, 0.20, 0.20, 'circle');
  addSlot(0.85, 0.15, 0.20, 0.20, 'circle');

  if (layoutId === 'layout-1') {
    // 4 portrait - 4 portrait (8 slots)
    const cols = 4;
    const colW = (SAFE_W - (cols - 1) * GAP_X) / cols;
    const colH = colW * (16/9) * (POSTER_W / POSTER_H);
    
    const totalH = 2 * colH + GAP_Y;
    const startY = SAFE_Y_START + (SAFE_H - totalH) / 2;
    const y1 = startY + colH / 2;
    const y2 = y1 + colH + GAP_Y;
    
    for (const y of [y1, y2]) {
      for (let c = 0; c < cols; c++) {
        const x = START_X + c * (colW + GAP_X) + colW / 2;
        addSlot(x, y, colW, colH);
      }
    }

  } else if (layoutId === 'layout-2') {
    // 2 portrait grandes - abajo 2 landscapes pequeños (4 slots)
    const topAreaH = SAFE_H * 0.72;
    const bottomAreaH = SAFE_H * 0.28 - GAP_Y;
    
    const portW = (SAFE_W - GAP_X) / 2;
    const portH = topAreaH;
    const px1 = START_X + portW / 2;
    const px2 = START_X + portW + GAP_X + portW / 2;
    const py = SAFE_Y_START + portH / 2;
    
    addSlot(px1, py, portW, portH);
    addSlot(px2, py, portW, portH);
    
    const landW = (SAFE_W - GAP_X) / 2;
    const landH = bottomAreaH;
    const ly = SAFE_Y_START + topAreaH + GAP_Y + landH / 2;
    
    addSlot(px1, ly, landW, landH);
    addSlot(px2, ly, landW, landH);

  } else if (layoutId === 'layout-3') {
    // 1 portrait grande - 3 landscapes pequeños paralelos (4 slots)
    const leftW = SAFE_W * 0.58;
    const rightW = SAFE_W * 0.42 - GAP_X;
    
    const lx = START_X + leftW / 2;
    const ly = SAFE_Y_START + SAFE_H / 2;
    addSlot(lx, ly, leftW, SAFE_H);
    
    const rh = (SAFE_H - 2 * GAP_Y) / 3;
    const rx = START_X + leftW + GAP_X + rightW / 2;
    for (let i = 0; i < 3; i++) {
      const ry = SAFE_Y_START + i * (rh + GAP_Y) + rh / 2;
      addSlot(rx, ry, rightW, rh);
    }

  } else if (layoutId === 'layout-4') {
    // 1 landscape grande - abajo 3 landscape pequeños (4 slots)
    const topH = SAFE_H * 0.65;
    const bottomH = SAFE_H * 0.35 - GAP_Y;
    
    const tx = 0.5;
    const ty = SAFE_Y_START + topH / 2;
    addSlot(tx, ty, SAFE_W, topH);
    
    const bw = (SAFE_W - 2 * GAP_X) / 3;
    const by = SAFE_Y_START + topH + GAP_Y + bottomH / 2;
    
    for (let i = 0; i < 3; i++) {
      const bx = START_X + i * (bw + GAP_X) + bw / 2;
      addSlot(bx, by, bw, bottomH);
    }
  } else if (layoutId === 'layout-round-single') {
    addSlot(0.5, 0.5, 0.8, 0.8 * ASPECT, 'circle');
  }

  return slots;
};

interface Props {
  experienceId: string;
  onBack: () => void;
}

export const PosterEditor: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';

  const [currentLayoutId, setCurrentLayoutId] = useState<PosterLayoutId>('layout-1');
  const [slots, setSlots] = useState<PhotoSlot[]>(() => generateSlots('layout-1'));
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [showLayouts, setShowLayouts] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [draggingNote, setDraggingNote] = useState<number | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasPreviewRef = useRef<HTMLDivElement>(null);

  // URL de fondo desde los campos de la experience
  const backgroundUrl = experience?.activationLink || experience?.activation_link || '';

  const filledCount = useMemo(() => slots.filter(s => s.dataUrl).length, [slots]);

  const handleSlotClick = (slotId: number) => {
    setActiveNote(null);
    const slot = slots.find(s => s.id === slotId);
    if (slot?.dataUrl) {
      setActiveSlot(slotId);
    } else {
      setActiveSlot(slotId);
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSlots(prev => prev.map(s =>
        s.id === activeSlot ? { ...s, dataUrl } : s
      ));
    };
    reader.readAsDataURL(file);
    // Reset input para permitir re-selección
    e.target.value = '';
  };

  const removePhoto = (slotId: number) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, dataUrl: null, scale: 1 } : s
    ));
    setActiveSlot(null);
  };

  const adjustScale = (slotId: number, delta: number) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, scale: Math.max(0.3, Math.min(3, s.scale + delta)) } : s
    ));
  };

  const rotatePhoto = (slotId: number, delta: number) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, rotation: (s.rotation + delta) % 360 } : s
    ));
  };

  const changeMask = (slotId: number, mask: MaskType) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, maskType: mask } : s
    ));
  };

  // --- STICKY NOTES LOGIC ---
  const addNote = () => {
    if (notes.length >= 4) return;
    const newId = Date.now();
    setNotes(prev => [...prev, {
      id: newId, text: 'Nota', color: '#FFF59D', x: 0.5, y: 0.5, scale: 1, rotation: Math.floor(Math.random() * 20) - 10, fontFamily: 'sans-serif', fontSizeScale: 1
    }]);
    setActiveSlot(null);
    setActiveNote(newId);
  };

  const removeNote = (id: number) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveNote(null);
  };

  const updateNote = (id: number, field: Partial<StickyNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...field } : n));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNote === null || !canvasPreviewRef.current) return;
    const rect = canvasPreviewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    updateNote(draggingNote, { x, y });
  };

  const resetAll = () => {
    setSlots(generateSlots(currentLayoutId));
    setNotes([]);
    setActiveSlot(null);
    setActiveNote(null);
  };

  // Exportar poster como PDF de alta calidad
  const exportPDF = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      // Importar jsPDF dinámicamente
      const { default: jsPDF } = await import('jspdf');

      const canvas = document.createElement('canvas');
      canvas.width = POSTER_W;
      canvas.height = POSTER_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      // Función helper para cargar imágenes
      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`No se pudo cargar: ${src.substring(0, 50)}...`));
          img.src = src;
        });

      // CAPA 1: Fondo
      if (backgroundUrl) {
        try {
          const bgImg = await loadImg(backgroundUrl);
          ctx.drawImage(bgImg, 0, 0, POSTER_W, POSTER_H);
        } catch {
          // Fondo blanco si no carga
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, POSTER_W, POSTER_H);
        }
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, POSTER_W, POSTER_H);
      }

      // CAPA 2: Fotos del usuario
      for (const slot of slots) {
        if (!slot.dataUrl) continue;
        try {
          const photo = await loadImg(slot.dataUrl);
          const centerX = slot.x * POSTER_W;
          const centerY = slot.y * POSTER_H;
          const drawW = slot.widthPct * POSTER_W * slot.scale;
          const drawH = slot.heightPct * POSTER_H * slot.scale;
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((slot.rotation * Math.PI) / 180);
          
          // Mover ctx de manera que el 0,0 sea la esquina superior izquierda del área de dibujo
          ctx.translate(-drawW/2, -drawH/2);
          
          // Aplicar máscara
          drawMaskToCanvas(ctx, slot.maskType, drawW, drawH);
          ctx.clip();
          
          // Pintar la foto (object-fit: cover)
          const imgRatio = photo.width / photo.height;
          const slotRatio = drawW / drawH;
          let sx = 0, sy = 0, sWidth = photo.width, sHeight = photo.height;
          
          if (imgRatio > slotRatio) {
            sWidth = photo.height * slotRatio;
            sx = (photo.width - sWidth) / 2;
          } else {
            sHeight = photo.width / slotRatio;
            sy = (photo.height - sHeight) / 2;
          }
          
          ctx.drawImage(photo, sx, sy, sWidth, sHeight, 0, 0, drawW, drawH);
          ctx.restore();
          
          // White border OUTSIDE image — skip for circular masks
          if (slot.maskType === 'none') {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((slot.rotation * Math.PI) / 180);
            ctx.translate(-drawW/2, -drawH/2);
            const brd = Math.max(8, POSTER_W * 0.01);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = brd;
            ctx.strokeRect(-brd/2, -brd/2, drawW + brd, drawH + brd);
            ctx.restore();
          }
        } catch {
          // Omitir fotos que fallen
        }
      }

      // CAPA 3: Sticky Notes
      for (const note of notes) {
        if (!note.text) continue;
        const noteX = note.x * POSTER_W;
        const noteY = note.y * POSTER_H;
        const noteSize = POSTER_W * 0.15 * note.scale; // 15% width as base
        
        ctx.save();
        ctx.translate(noteX, noteY);
        ctx.rotate((note.rotation * Math.PI) / 180);
        
        // Post-it bg shadow
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 15;
        ctx.shadowOffsetY = 15;
        ctx.fillStyle = note.color;
        ctx.fillRect(-noteSize/2, -noteSize/2, noteSize, noteSize);

        ctx.shadowColor = 'transparent'; // clear shadow for text
        ctx.fillStyle = note.color === '#000000' ? '#ffffff' : '#000000';
        const fsMap: Record<string, string> = { 'montserrat': 'Montserrat', 'festive': 'Mountains of Christmas', 'lobster': 'Lobster', 'script': 'Pinyon Script' };
        const realFont = fsMap[note.fontFamily] || 'Montserrat';
        ctx.font = `bold ${baseFontSize}px "${realFont}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = note.text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          if (ctx.measureText(currentLine + " " + w).width < noteSize * 0.8) {
            currentLine += " " + w;
          } else {
            lines.push(currentLine);
            currentLine = w;
          }
        }
        lines.push(currentLine);
        
        const lineHeight = baseFontSize * 1.33;
        const startY = -(lines.length - 1) * lineHeight / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, 0, startY + (i * lineHeight));
        });
        
        ctx.restore();
      }

      // Generar PDF
      // 50cm x 60cm en mm = 500mm x 600mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [500, 600],
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 500, 600);
      pdf.save(`Poster_${experience?.title || 'FanFest'}_${Date.now()}.pdf`);

    } catch (err: any) {
      console.error('Error exportando PDF:', err);
      setExportError(err.message || 'Error al generar PDF');
      // Fallback: exportar como imagen JPG
      try {
        const canvas = document.createElement('canvas');
        canvas.width = POSTER_W;
        canvas.height = POSTER_H;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, POSTER_W, POSTER_H);

          // Dibujar fotos directamente
          const slotW = POSTER_W / 5;
          const slotH = POSTER_H * 0.25;
          for (const slot of slots) {
            if (!slot.dataUrl) continue;
            const photo = new window.Image();
            photo.src = slot.dataUrl;
            await new Promise(r => { photo.onload = r; photo.onerror = r; });
            const cX = slot.x * POSTER_W;
            const cY = slot.y * POSTER_H;
            const dW = slotW * slot.scale;
            const dH = slotH * slot.scale;

            ctx.save();
            ctx.translate(cX, cY);
            ctx.rotate((slot.rotation * Math.PI) / 180);
            ctx.translate(-dW/2, -dH/2);
            drawMaskToCanvas(ctx, slot.maskType, dW, dH);
            ctx.clip();
            
            const imgRatio = photo.width / photo.height;
            const slotRatio = dW / dH;
            let sx = 0, sy = 0, sWidth = photo.width, sHeight = photo.height;
            if (imgRatio > slotRatio) {
              sWidth = photo.height * slotRatio;
              sx = (photo.width - sWidth) / 2;
            } else {
              sHeight = photo.width / slotRatio;
              sy = (photo.height - sHeight) / 2;
            }
            
            ctx.drawImage(photo, sx, sy, sWidth, sHeight, 0, 0, dW, dH);
            ctx.restore();
          }

          const link = document.createElement('a');
          link.download = `Poster_${Date.now()}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
        }
      } catch {
        // Ignorar segundo error
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!experience) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">
        {t.atlantis.posterNotFound}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* HEADER */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/90 backdrop-blur-md shrink-0">
        <button
          onClick={onBack}
          className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all active:scale-90 shadow-lg text-white flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> {t.atlantis.back}
        </button>
        <div className="flex items-center gap-2">
          <FileImage size={16} className="text-yellow-400" />
          <span className="font-black text-[11px] tracking-[0.3em] uppercase text-yellow-400">
            {t.atlantis.posterTitle}
          </span>
        </div>
        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">
          {filledCount}/{slots.length}
        </div>
      </header>

      {/* CANVAS PREVIEW */}
      <div 
        className="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-0 p-2"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingNote(null)}
        onPointerLeave={() => setDraggingNote(null)}
      >
        <div
          ref={canvasPreviewRef}
          className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
          style={{ aspectRatio: ASPECT, maxHeight: '100%', maxWidth: '100%', width: '100%', touchAction: 'none' }}
          onPointerDown={() => {
            setActiveSlot(null);
            setActiveNote(null);
          }}
        >
          {/* Capa 1: Fondo */}
          {backgroundUrl && (
            <img
              src={backgroundUrl}
              className="absolute inset-0 w-full h-full object-fill z-10"
              alt="Fondo"
            />
          )}

          {/* Capa 2: Fotos del usuario en slots */}
          <div className="absolute inset-0 z-20">
            {slots.map(slot => (
              <div
                key={slot.id}
                onPointerDown={(e) => { e.stopPropagation(); handleSlotClick(slot.id); }}
                className={`absolute cursor-pointer transition-all duration-200 ${
                  activeSlot === slot.id ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''
                }`}
                  style={{
                    left: `${(slot.x - slot.widthPct/2) * 100}%`,
                    top: `${(slot.y - slot.heightPct/2) * 100}%`,
                    width: `${slot.widthPct * 100}%`,
                    height: `${slot.heightPct * 100}%`,
                    ringColor: activeSlot === slot.id ? sc : 'transparent',
                  }}
              >
                {slot.dataUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="overflow-hidden"
                    style={{
                      ...(slot.maskType === 'circle'
                        ? { width: '100%', aspectRatio: '1/1' }
                        : { width: '100%', height: '100%' }),
                      ...getMaskCSS(slot.maskType)
                    }}
                  >
                    <img
                      src={slot.dataUrl}
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ 
                        transform: `scale(${slot.scale}) rotate(${slot.rotation}deg)`,
                        ...(slot.maskType === 'none' ? { border: '4px solid white', boxSizing: 'border-box' } : {})
                      }}
                      alt={`Foto ${slot.id + 1}`}
                    />
                  </div>
                </div>
                ) : (
                  <div className="w-full h-full rounded-md border-2 border-dashed border-white/50 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors">
                    <Plus size={16} className="text-white/70" />
                    <span className="text-[6px] font-black text-white/60 uppercase mt-0.5">{slot.id + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Capa 3: Notas Float */}
          <div className="absolute inset-0 z-40 pointer-events-none">
            {notes.map(note => (
              <div
                key={note.id}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setActiveSlot(null); setActiveNote(note.id); setDraggingNote(note.id);
                }}
                className={`absolute flex items-center justify-center shadow-lg p-2 text-center break-words pointer-events-auto cursor-grab active:cursor-grabbing ${
                  activeNote === note.id ? 'ring-2 ring-white/80' : ''
                }`}
                style={{
                  left: `${note.x * 100}%`,
                  top: `${note.y * 100}%`,
                  width: '15%',
                  aspectRatio: '1/1',
                  transform: `translate(-50%, -50%) rotate(${note.rotation}deg) scale(${note.scale})`,
                  backgroundColor: note.color,
                  color: note.color === '#000000' ? '#ffffff' : '#000000',
                  fontSize: `calc((2px + 1vw) * ${note.fontSizeScale || 1})`,
                  fontWeight: 'bold',
                  fontFamily: note.fontFamily === 'festive' ? '"Mountains of Christmas", cursive' : note.fontFamily === 'lobster' ? 'Lobster, cursive' : note.fontFamily === 'script' ? '"Pinyon Script", cursive' : 'Montserrat, sans-serif',
                }}
              >
                {note.text}
              </div>
            ))}
          </div>
        </div>


      </div>

      <div className="text-center text-xs pb-1 pt-1 shrink-0 bg-black font-semibold" style={{ color: sc }}>
        {t.home?.editorHelper}
      </div>
      {/* CONTROLES */}
      <footer className="bg-black border-t border-white/10 flex flex-col items-center justify-center py-3 px-4 z-[120] shrink-0 min-h-[5rem]">
        {/* Slot Controls */}
        {activeSlot !== null && slots[activeSlot]?.dataUrl && (
          <div className="flex flex-col items-center gap-2 w-full max-w-md animate-fade-in">
            {/* Fila 1: Máscaras */}
            <div className="flex items-center justify-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
              {[
                { t: 'none', i: <Square size={12}/> },
                { t: 'circle', i: <Circle size={12}/> },
                { t: 'heart', i: <Heart size={12}/> },
                { t: 'star', i: <Star size={12}/> },
                { t: 'diamond', i: <div className="w-3 h-3 border-2 border-current rotate-45"/> },
                { t: 'flower', i: <span className="text-[10px]">🌸</span> },
                { t: 'splash', i: <Droplet size={12}/> }
              ].map(m => (
                <button
                  key={m.t}
                  onClick={() => changeMask(activeSlot, m.t as MaskType)}
                  className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                    slots[activeSlot].maskType === m.t 
                      ? 'bg-yellow-500 text-slate-950 border-yellow-500' 
                      : 'bg-white/5 border-white/10 text-white/50 active:bg-yellow-500/20'
                  }`}
                >
                  {m.i}
                </button>
              ))}
            </div>
            
            {/* Fila 2: Escala, Rotación y Basura */}
            <div className="flex items-center gap-2 w-full justify-center">
              <button onClick={() => rotatePhoto(activeSlot, -15)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => adjustScale(activeSlot, -0.15)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <ZoomOut size={16} />
              </button>
              <span className="text-[8px] font-black text-white/50 uppercase tracking-widest w-12 text-center">
                {Math.round(slots[activeSlot].scale * 100)}%
              </span>
              <button onClick={() => adjustScale(activeSlot, 0.15)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <ZoomIn size={16} />
              </button>
              <button onClick={() => rotatePhoto(activeSlot, 15)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <RotateCw size={16} />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button onClick={() => setActiveSlot(null)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => removePhoto(activeSlot)} className="w-9 h-9 rounded-xl bg-gray-900 border border-red-500/30 text-red-400 flex items-center justify-center active:bg-red-600 active:text-white">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Note Controls */}
        {activeNote !== null && (
          <div className="flex flex-col gap-2 w-full max-w-md animate-fade-in">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={notes.find(n => n.id === activeNote)?.text || ''}
                onChange={(e) => updateNote(activeNote, { text: e.target.value })}
                className="flex-1 bg-gray-900 border border-white/20 rounded p-2 text-white text-xs font-bold"
                placeholder={t.atlantis.writeSomething}
                maxLength={100}
              />
              <button onClick={() => setActiveNote(null)} className="w-10 rounded bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20 active:bg-yellow-500 active:text-slate-950">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => removeNote(activeNote)} className="w-10 rounded bg-red-500/20 text-red-500 flex items-center justify-center">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-1.5">
                  {['#FFF59D', '#FFAB91', '#81D4FA', '#A5D6A7', '#F48FB1', '#FFFFFF', '#000000'].map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateNote(activeNote, { color })} 
                      className={`w-6 h-6 rounded-full border shadow-sm ${notes.find(n => n.id === activeNote)?.color === color ? 'border-2 border-white scale-110' : 'border-white/10'}`} 
                      style={{ backgroundColor: color }} 
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateNote(activeNote, { rotation: (notes.find(n => n.id === activeNote)?.rotation || 0) - 15 })} className="p-1.5 bg-yellow-500/10 rounded text-yellow-400"><RotateCcw size={14}/></button>
                  <button onClick={() => updateNote(activeNote, { scale: Math.max(0.5, (notes.find(n => n.id === activeNote)?.scale || 1) - 0.2) })} className="p-1.5 bg-yellow-500/10 rounded text-yellow-400"><ZoomOut size={14}/></button>
                  <button onClick={() => updateNote(activeNote, { scale: Math.min(2, (notes.find(n => n.id === activeNote)?.scale || 1) + 0.2) })} className="p-1.5 bg-yellow-500/10 rounded text-yellow-400"><ZoomIn size={14}/></button>
                  <button onClick={() => updateNote(activeNote, { rotation: (notes.find(n => n.id === activeNote)?.rotation || 0) + 15 })} className="p-1.5 bg-yellow-500/10 rounded text-yellow-400"><RotateCw size={14}/></button>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                  {[
                    { id: 'montserrat', name: '1', style: 'Montserrat, sans-serif' },
                    { id: 'festive', name: '2', style: '"Mountains of Christmas", cursive' },
                    { id: 'lobster', name: '3', style: 'Lobster, cursive' },
                    { id: 'script', name: '4', style: '"Pinyon Script", cursive' }
                  ].map(font => (
                    <button 
                      key={font.id} 
                      onClick={() => updateNote(activeNote, { fontFamily: font.id })} 
                      className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-[10px] border ${notes.find(n => n.id === activeNote)?.fontFamily === font.id || (!notes.find(n => n.id === activeNote)?.fontFamily && font.id === 'montserrat') ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-white/10 text-white border-transparent'}`} 
                      style={{ fontFamily: font.style }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => updateNote(activeNote, { fontSizeScale: Math.max(0.5, (notes.find(n => n.id === activeNote)?.fontSizeScale || 1) - 0.2) })} className="px-2 py-1 bg-yellow-500/10 rounded text-yellow-400 text-xs font-bold">A-</button>
                  <button onClick={() => updateNote(activeNote, { fontSizeScale: Math.min(2.5, (notes.find(n => n.id === activeNote)?.fontSizeScale || 1) + 0.2) })} className="px-2 py-1 bg-yellow-500/10 rounded text-yellow-400 text-xs font-bold">A+</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones principales */}
        {activeSlot === null && activeNote === null && !showLayouts && (
          <div className="flex items-center gap-2 w-full max-w-md animate-fade-in">
            <button
              onClick={resetAll}
              className="w-11 h-11 rounded-xl bg-gray-900 border border-white/10 text-white/40 flex items-center justify-center active:bg-red-600 active:text-white shrink-0"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={addNote}
              disabled={notes.length >= 4}
              className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex flex-col items-center justify-center active:bg-yellow-500 active:text-slate-950 shrink-0 disabled:opacity-30"
            >
              <MessageSquare size={18} />
              <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.note}</span>
            </button>

            <button
              onClick={exportPDF}
              disabled={isExporting || filledCount === 0}
              className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 border border-yellow-500 bg-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all active:scale-95 disabled:opacity-30"
            >
              {isExporting ? <><Loader2 className="animate-spin" size={16} /> PDF...</> : <><Download size={16} /> PDF</>}
            </button>
            
            <button
              onClick={() => setShowLayouts(true)}
              className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex flex-col items-center justify-center active:bg-yellow-500 active:text-slate-950 shrink-0"
            >
              <LayoutTemplate size={18} />
              <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.layout}</span>
            </button>
          </div>
        )}

        {/* Layout Picker */}
        {showLayouts && (
          <div className="flex flex-col gap-2 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{t.atlantis.chooseTemplate}</span>
              <button onClick={() => setShowLayouts(false)} className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950 shrink-0"><ChevronLeft size={16}/></button>
            </div>
            <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar pb-2">
              {(['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-round-single'] as PosterLayoutId[]).map((lid, idx) => (
                <button
                  key={lid}
                  onClick={() => {
                    setCurrentLayoutId(lid);
                    setSlots(prev => generateSlots(lid, prev));
                  }}
                  className={`flex-shrink-0 w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-lg ${currentLayoutId === lid ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' : 'border-white/20 text-white/40'}`}
                >
                  {lid === 'layout-round-single' ? <Circle size={24} /> : idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error toast */}
      {exportError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} className="text-red-600" /> {exportError}
        </div>
      )}
    </div>
  );
};
