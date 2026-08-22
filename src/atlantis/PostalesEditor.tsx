import React, { useState, useRef } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, Download, Trash2, Plus, Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw, FileImage, Circle, Heart, Star, Droplet, Square, MessageSquare, LayoutTemplate } from 'lucide-react';
import { MaskType, getMaskCSS, drawMaskToCanvas } from './maskUtils';

// Dimensiones de impresión: A4 Landscape (297 x 210 mm) a 300dpi = 3508 x 2480
// Cada cara es A5 Portrait (148.5 x 210 mm) = 1754 x 2480
const FACE_W = 1754;
const FACE_H = 2480;
const ASPECT = FACE_W / FACE_H;

type FaceType = 'portada' | 'contraportada' | 'interna1' | 'interna2';
type LayoutId = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-round-single';

interface PhotoSlot {
  id: number;
  dataUrl: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  maskType: MaskType;
  widthPct: number;
  heightPct: number;
}

interface StickyNote {
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

const generateSlots = (layoutId: LayoutId, prevSlots: PhotoSlot[] = []): PhotoSlot[] => {
  const slots: PhotoSlot[] = [];
  let id = 0;

  const addSlot = (cx: number, cy: number, w: number, h: number, m: MaskType = 'none') => {
    const prev = prevSlots[id];
    slots.push({
      id: id++, x: cx, y: cy, widthPct: w, heightPct: h,
      dataUrl: prev?.dataUrl || null, scale: prev?.scale || 1, rotation: prev?.rotation || 0, maskType: m !== 'none' ? m : (prev?.maskType || 'none'),
    });
  };

  if (layoutId === 'layout-1') {
    // 2 pequeñas arriba, 1 grande abajo (Inversa a la layout-3 original)
    addSlot(0.28, 0.32, 0.38, 0.34);
    addSlot(0.72, 0.32, 0.38, 0.34);
    addSlot(0.5, 0.72, 0.82, 0.38);
  } else if (layoutId === 'layout-2') {
    // 2 áreas horizontales con bastante espacio y padding
    addSlot(0.5, 0.32, 0.82, 0.34);
    addSlot(0.5, 0.72, 0.82, 0.34);
  } else if (layoutId === 'layout-3') {
    // 1 grande arriba, 2 pequeñas abajo
    addSlot(0.5, 0.32, 0.82, 0.38);
    addSlot(0.28, 0.72, 0.38, 0.34);
    addSlot(0.72, 0.72, 0.38, 0.34);
  } else if (layoutId === 'layout-4') {
    // 4 cuadrantes pequeños
    addSlot(0.28, 0.28, 0.38, 0.32);
    addSlot(0.72, 0.28, 0.38, 0.32);
    addSlot(0.28, 0.72, 0.38, 0.32);
    addSlot(0.72, 0.72, 0.38, 0.32);
  } else if (layoutId === 'layout-round-single') {
    addSlot(0.5, 0.5, 0.8, 0.8, 'circle');
  }
  return slots;
};

interface Props {
  experienceId: string;
  onBack: () => void;
}

interface FaceState {
  layoutId: LayoutId;
  slots: PhotoSlot[];
  notes: StickyNote[];
}

export const PostalesEditor: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';

  const [faces, setFaces] = useState<Record<FaceType, FaceState>>({
    portada: { layoutId: 'layout-1', slots: generateSlots('layout-1'), notes: [] },
    contraportada: { layoutId: 'layout-1', slots: generateSlots('layout-1'), notes: [] },
    interna1: { layoutId: 'layout-1', slots: generateSlots('layout-1'), notes: [] },
    interna2: { layoutId: 'layout-1', slots: generateSlots('layout-1'), notes: [] }
  });
  const [activeFace, setActiveFace] = useState<FaceType>('portada');
  const [showLayouts, setShowLayouts] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [draggingNote, setDraggingNote] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasPreviewRef = useRef<HTMLDivElement>(null);

  const bg: Record<FaceType, string> = {
    portada: experience?.activationLink || experience?.activation_link || '',
    contraportada: experience?.demoLink || '',
    interna1: experience?.photoboothLink3 || '',
    interna2: experience?.photoboothLink4 || '',
  };

  const updateFace = (updates: Partial<FaceState>) => {
    setFaces(prev => ({ ...prev, [activeFace]: { ...prev[activeFace], ...updates } }));
  };

  const currentFace = faces[activeFace];
  const { slots, notes, layoutId } = currentFace;

  const handleSlotClick = (slotId: number) => {
    setActiveNote(null);
    if (slots.find(s => s.id === slotId)?.dataUrl) {
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
      updateFace({ slots: slots.map(s => s.id === activeSlot ? { ...s, dataUrl } : s) });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const changeSlot = (slotId: number, changes: Partial<PhotoSlot>) => {
    updateFace({ slots: slots.map(s => s.id === slotId ? { ...s, ...changes } : s) });
  };

  const addNote = () => {
    if (notes.length >= 4) return;
    const newId = Date.now();
    updateFace({ notes: [...notes, {
      id: newId, text: 'Nota', color: '#FFF59D', x: 0.5, y: 0.5, scale: 1, rotation: 0, fontFamily: 'sans-serif', fontSizeScale: 1
    }] });
    setActiveSlot(null); setActiveNote(newId);
  };

  const updateNote = (id: number, field: Partial<StickyNote>) => {
    updateFace({ notes: notes.map(n => n.id === id ? { ...n, ...field } : n) });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNote === null || !canvasPreviewRef.current) return;
    e.preventDefault();
    const rect = canvasPreviewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    updateNote(draggingNote, { x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) });
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      canvas.width = 3508;
      canvas.height = 2480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Error image'));
          img.src = src;
        });

      const drawFace = async (fType: FaceType, isLeft: boolean) => {
        const halfW = 1754;
        const xOffset = isLeft ? 0 : halfW;
        ctx.save();
        ctx.translate(xOffset, 0);

        // Fondo
        if (bg[fType]) {
          try {
            const bgImg = await loadImg(bg[fType]);
            ctx.drawImage(bgImg, 0, 0, halfW, 2480);
          } catch {}
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, halfW, 2480);
        }

        // Slots
        for (const slot of faces[fType].slots) {
          if (!slot.dataUrl) continue;
          try {
            const photo = await loadImg(slot.dataUrl);
            const centerX = slot.x * halfW;
            const centerY = slot.y * 2480;
            const drawW = slot.widthPct * halfW * slot.scale;
            const drawH = slot.heightPct * 2480 * slot.scale;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((slot.rotation * Math.PI) / 180);
            ctx.translate(-drawW/2, -drawH/2);
            drawMaskToCanvas(ctx, slot.maskType, drawW, drawH);
            ctx.clip();
            
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
            
            // Borde
            if (slot.maskType === 'none') {
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate((slot.rotation * Math.PI) / 180);
              ctx.translate(-drawW/2, -drawH/2);
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 15;
              ctx.strokeRect(-7.5, -7.5, drawW + 15, drawH + 15);
              ctx.restore();
            }
          } catch {}
        }

        // Notas
        for (const note of faces[fType].notes) {
          if (!note.text) continue;
          const noteX = note.x * halfW;
          const noteY = note.y * 2480;
          const noteSize = halfW * 0.15 * note.scale;
          ctx.save();
          ctx.translate(noteX, noteY);
          ctx.rotate((note.rotation * Math.PI) / 180);
          ctx.fillStyle = note.color;
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 40;
          ctx.fillRect(-noteSize/2, -noteSize/2, noteSize, noteSize);
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = note.color === '#000000' ? '#ffffff' : '#000000';
          const baseFontSize = halfW * 0.015 * (note.fontSizeScale || 1);
          const fsMap: Record<string, string> = { 'montserrat': 'Montserrat', 'festive': 'Mountains of Christmas', 'lobster': 'Lobster', 'script': 'Pinyon Script' };
          const realFont = fsMap[note.fontFamily] || 'Montserrat';
          ctx.font = `bold ${baseFontSize}px "${realFont}"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.text, 0, 0);
          ctx.restore();
        }
        ctx.restore();
      };

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // PAGINA 1
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 3508, 2480);
      await drawFace('contraportada', true);
      await drawFace('portada', false);
      ctx.beginPath(); ctx.setLineDash([20, 20]); ctx.moveTo(1754, 0); ctx.lineTo(1754, 2480); ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 4; ctx.stroke();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

      // PAGINA 2
      pdf.addPage();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 3508, 2480);
      await drawFace('interna1', true);
      await drawFace('interna2', false);
      ctx.beginPath(); ctx.setLineDash([20, 20]); ctx.moveTo(1754, 0); ctx.lineTo(1754, 2480); ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 4; ctx.stroke();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

      pdf.save(`Postal_${experience?.title || 'FanFest'}_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!experience) return null;

  const faceLabels: Record<FaceType, string> = {
    portada: t.atlantis.cover, contraportada: t.atlantis.backCover, interna1: t.atlantis.innerLeft, interna2: t.atlantis.innerRight
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button onClick={onBack} className="py-1 px-2.5 bg-white/10 rounded-lg text-white flex gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14} /> {t.atlantis.back}</button>
        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-yellow-400">{t.atlantis.postalesTitle}</span>
      </header>

      <div className="flex-1 flex flex-col items-center p-1.5 min-h-0 bg-black">
        <div className="flex gap-1 w-full max-w-sm mb-1.5 overflow-x-auto hide-scrollbar shrink-0">
          {(Object.keys(faceLabels) as FaceType[]).map(face => (
            <button key={face} onClick={() => { setActiveFace(face); setActiveSlot(null); setActiveNote(null); }} className={`flex-1 py-1.5 rounded-md font-black text-[8px] uppercase tracking-wider ${activeFace === face ? 'bg-yellow-500 text-slate-950' : 'bg-white/10 text-white/50'}`}>
              {faceLabels[face]}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full flex justify-center min-h-0" onPointerMove={handlePointerMove} onPointerUp={() => setDraggingNote(null)} onPointerLeave={() => setDraggingNote(null)}>
          <div ref={canvasPreviewRef} className="relative bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-2xl" style={{ aspectRatio: ASPECT, maxHeight: '100%', touchAction: 'none' }} onPointerDown={() => { setActiveSlot(null); setActiveNote(null); }}>
            {bg[activeFace] && <img src={bg[activeFace]} className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none" alt="Fondo" />}
            
            <div className="absolute inset-0 z-20">
              {slots.map(slot => (
                <div key={slot.id} onPointerDown={(e) => { e.stopPropagation(); handleSlotClick(slot.id); }} className={`absolute cursor-pointer ${activeSlot === slot.id ? 'ring-2' : ''}`} style={{ left: `${(slot.x - slot.widthPct/2)*100}%`, top: `${(slot.y - slot.heightPct/2)*100}%`, width: `${slot.widthPct*100}%`, height: `${slot.heightPct*100}%`, ringColor: activeSlot === slot.id ? sc : 'transparent' }}>
                  {slot.dataUrl ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="overflow-hidden" style={{
                        ...(slot.maskType === 'circle'
                          ? { width: '100%', aspectRatio: '1/1' }
                          : { width: '100%', height: '100%' }),
                        ...getMaskCSS(slot.maskType)
                      }}>
                        <img src={slot.dataUrl} className="w-full h-full object-cover" style={{ transform: `scale(${slot.scale}) rotate(${slot.rotation}deg)`, ...(slot.maskType === 'none' ? { border: '2px solid white', boxSizing: 'border-box' } : {}) }} alt="Slot" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full border border-dashed border-white/40 bg-black/40 flex items-center justify-center"><Plus className="text-white/60" size={16} /></div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 z-40 pointer-events-none">
              {notes.map(note => (
                <div key={note.id} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlot(null); setActiveNote(note.id); setDraggingNote(note.id); }} className={`absolute flex items-center justify-center shadow-lg p-1 pointer-events-auto cursor-grab active:cursor-grabbing ${activeNote === note.id ? 'ring-2 ring-white/80' : ''}`} style={{ left: `${note.x*100}%`, top: `${note.y*100}%`, width: '18%', aspectRatio: '1/1', transform: `translate(-50%, -50%) rotate(${note.rotation}deg) scale(${note.scale})`, backgroundColor: note.color, color: note.color === '#000000' ? '#ffffff' : '#000000', fontSize: `calc((3px + 0.8vw) * ${note.fontSizeScale})`, fontWeight: 'bold', fontFamily: note.fontFamily === 'festive' ? '"Mountains of Christmas", cursive' : note.fontFamily === 'lobster' ? 'Lobster, cursive' : note.fontFamily === 'script' ? '"Pinyon Script", cursive' : 'Montserrat, sans-serif', touchAction: 'none' }}>
                  {note.text}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <footer className="bg-black border-t border-white/10 py-2 px-3 shrink-0 z-50">
        {activeSlot !== null && slots.find(s => s.id === activeSlot)?.dataUrl ? (
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <button onClick={() => changeSlot(activeSlot, { rotation: (slots.find(s=>s.id===activeSlot)?.rotation||0) - 15 })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><RotateCcw size={14} /></button>
            <button onClick={() => changeSlot(activeSlot, { scale: Math.max(0.5, (slots.find(s=>s.id===activeSlot)?.scale||1) - 0.1) })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ZoomOut size={14} /></button>
            <button onClick={() => changeSlot(activeSlot, { scale: Math.min(2, (slots.find(s=>s.id===activeSlot)?.scale||1) + 0.1) })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ZoomIn size={14} /></button>
            <button onClick={() => changeSlot(activeSlot, { rotation: (slots.find(s=>s.id===activeSlot)?.rotation||0) + 15 })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><RotateCw size={14} /></button>
            <button onClick={() => setActiveSlot(null)} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ChevronLeft size={14} /></button>
            <button onClick={() => changeSlot(activeSlot, { dataUrl: null })} className="p-1.5 bg-gray-900 border border-red-500/30 rounded-lg text-red-400"><Trash2 size={14} /></button>
          </div>
        ) : activeNote !== null ? (
          <div className="flex flex-col gap-1.5 max-w-sm mx-auto">
             <div className="flex gap-2">
               <input type="text" value={notes.find(n=>n.id===activeNote)?.text||''} onChange={e => updateNote(activeNote, { text: e.target.value })} className="flex-1 bg-gray-900 text-white text-xs p-1.5 rounded border border-white/10" maxLength={100} />
               <button onClick={() => setActiveNote(null)} className="p-1.5 bg-yellow-500/10 rounded text-yellow-400 border border-yellow-500/20"><ChevronLeft size={14} /></button>
               <button onClick={() => updateFace({ notes: notes.filter(n=>n.id!==activeNote) })} className="p-1.5 bg-red-950/40 rounded text-red-400 border border-red-500/20"><Trash2 size={14} /></button>
             </div>
               <div className="flex gap-1">
                  {[
                    { id: 'montserrat', name: '1', style: 'Montserrat, sans-serif' },
                    { id: 'festive', name: '2', style: '"Mountains of Christmas", cursive' },
                    { id: 'lobster', name: '3', style: 'Lobster, cursive' },
                    { id: 'script', name: '4', style: '"Pinyon Script", cursive' }
                  ].map(font => (
                    <button key={font.id} onClick={() => updateNote(activeNote, { fontFamily: font.id })} className={`w-5 h-5 shrink-0 rounded flex items-center justify-center text-[9px] border ${notes.find(n => n.id === activeNote)?.fontFamily === font.id || (!notes.find(n => n.id === activeNote)?.fontFamily && font.id === 'montserrat') ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-white/10 text-white border-transparent'}`} style={{ fontFamily: font.style }}>{font.name}</button>
                  ))}
               </div>
               <div className="flex justify-between items-center w-full">
                 <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                   {['#FFF59D', '#FFAB91', '#81D4FA', '#A5D6A7', '#F48FB1', '#FFFFFF', '#000000'].map(c => <button key={c} onClick={() => updateNote(activeNote, { color: c })} className={`w-4 h-4 rounded-full shrink-0 border border-white/10 ${notes.find(n=>n.id===activeNote)?.color === c ? 'ring-1 ring-white scale-110' : ''}`} style={{ backgroundColor: c }} />)}
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => updateNote(activeNote, { fontSizeScale: Math.max(0.6, (notes.find(n=>n.id===activeNote)?.fontSizeScale||1) - 0.2) })} className="px-1.5 py-0.5 bg-yellow-500/10 rounded text-yellow-400 text-[9px] font-bold">A-</button>
                    <button onClick={() => updateNote(activeNote, { fontSizeScale: Math.min(2.0, (notes.find(n=>n.id===activeNote)?.fontSizeScale||1) + 0.2) })} className="px-1.5 py-0.5 bg-yellow-500/10 rounded text-yellow-400 text-[9px] font-bold">A+</button>
                    <button onClick={() => updateNote(activeNote, { rotation: (notes.find(n=>n.id===activeNote)?.rotation||0) - 15 })} className="px-1.5 py-0.5 bg-yellow-500/10 rounded text-yellow-400"><RotateCcw size={12} /></button>
                    <button onClick={() => updateNote(activeNote, { rotation: (notes.find(n=>n.id===activeNote)?.rotation||0) + 15 })} className="px-1.5 py-0.5 bg-yellow-500/10 rounded text-yellow-400"><RotateCw size={12} /></button>
                 </div>
               </div>
          </div>
        ) : showLayouts ? (
          <div className="flex items-center justify-center gap-1.5 max-w-sm mx-auto">
            {(['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-round-single'] as LayoutId[]).map((lid, idx) => (
              <button key={lid} onClick={() => { updateFace({ layoutId: lid, slots: generateSlots(lid, slots) }); }} className={`h-10 w-10 rounded-lg border-2 shrink-0 flex flex-col items-center justify-center text-[10px] font-black ${layoutId === lid ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' : 'border-white/20 text-white/40'}`}>
                {lid === 'layout-round-single' ? <Circle size={16} /> : idx + 1}
              </button>
            ))}
            <button onClick={() => setShowLayouts(false)} className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center active:bg-yellow-500 active:text-slate-950 shrink-0"><ChevronLeft size={16}/></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <button onClick={addNote} className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center text-yellow-400 active:bg-yellow-500 active:text-slate-950 shrink-0">
              <MessageSquare size={18} />
              <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.note}</span>
            </button>
            <button onClick={() => setShowLayouts(true)} className="h-12 w-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center text-yellow-400 active:bg-yellow-500 active:text-slate-950 shrink-0">
              <LayoutTemplate size={18} />
              <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.layout}</span>
            </button>
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 border border-yellow-500 bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all active:scale-95 disabled:opacity-30"
            >
              {isExporting ? <><Loader2 className="animate-spin" size={16} /> PDF...</> : <><Download size={16} /> PDF</>}
            </button>
          </div>
        )}
      </footer>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};
