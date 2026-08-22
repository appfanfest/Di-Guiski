import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, ChevronRight, Download, Trash2, Plus, Loader2, ZoomIn, ZoomOut, BookOpen, AlertCircle, RotateCw, RotateCcw, Circle, Heart, Star, Droplet, Square, MessageSquare, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { MaskType, getMaskCSS, drawMaskToCanvas } from './maskUtils';

// Dimensiones de página Tamaño Carta (Portrait) a 300dpi
const PAGE_W = 2550;
const PAGE_H = 2550;
const ASPECT = PAGE_W / PAGE_H; // 1

export interface AlbumPhoto {
  id: number;
  pageIndex: number;
  dataUrl: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  maskType: MaskType;
  widthPct: number;
  heightPct: number;
}

export type AlbumLayoutId = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-round-single';

const generateAlbumSlotsForPages = (startPage: number, endPage: number, layoutId: AlbumLayoutId = 'layout-1', prevSlots: AlbumPhoto[] = []): AlbumPhoto[] => {
  const slots: AlbumPhoto[] = [];
  let idCounter = Date.now() + startPage * 1000;
  
  for (let p = startPage; p < endPage; p++) {
    const pagePrevSlots = prevSlots.filter(s => s.pageIndex === p);
    let pageSlotIndex = 0;
    
    const addSlot = (x: number, y: number, w: number, h: number, m: MaskType = 'none') => {
      const prev = pagePrevSlots[pageSlotIndex];
      slots.push({
        id: prev ? prev.id : idCounter++,
        pageIndex: p,
        dataUrl: prev ? prev.dataUrl : null,
        x, y,
        scale: prev ? prev.scale : 1,
        rotation: prev ? prev.rotation : 0,
        maskType: m !== 'none' ? m : (prev ? prev.maskType : 'none'),
        widthPct: w,
        heightPct: h
      });
      pageSlotIndex++;
    };

    if (layoutId === 'layout-1') {
      addSlot(0.5, 0.18, 0.8, 0.25);
      addSlot(0.28, 0.53, 0.36, 0.35);
      addSlot(0.72, 0.53, 0.36, 0.35);
      addSlot(0.5, 0.88, 0.8, 0.25);
    } else if (layoutId === 'layout-2') {
      addSlot(0.5, 0.28, 0.8, 0.4);
      addSlot(0.5, 0.72, 0.8, 0.4);
    } else if (layoutId === 'layout-3') {
      addSlot(0.28, 0.28, 0.36, 0.4);
      addSlot(0.72, 0.28, 0.36, 0.4);
      addSlot(0.28, 0.72, 0.36, 0.4);
      addSlot(0.72, 0.72, 0.36, 0.4);
    } else if (layoutId === 'layout-4') {
      addSlot(0.5, 0.5, 0.8, 0.8);
    } else if (layoutId === 'layout-round-single') {
      addSlot(0.5, 0.5, 0.8, 0.8, 'circle');
    }
  }
  return slots;
};

export interface AlbumNote {
  id: number;
  pageIndex: number;
  text: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontFamily: string;
  fontSizeScale: number;
}

interface Props {
  experienceId: string;
  onBack: () => void;
}

export const AlbumEditor: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';

    const [totalPages, setTotalPages] = useState(6); // Portada + 4 interiores + Contraportada
  const [currentLayoutId, setCurrentLayoutId] = useState<AlbumLayoutId>('layout-1');
  const [showLayouts, setShowLayouts] = useState(false);
  const [photos, setPhotos] = useState<AlbumPhoto[]>(() => generateAlbumSlotsForPages(0, 6, 'layout-1'));
  const [notes, setNotes] = useState<AlbumNote[]>([]);
  
  const [activePage, setActivePage] = useState(0);
  
  const [activeElement, setActiveElement] = useState<{ id: number, type: 'photo' | 'note' } | null>(null);
  const [dragging, setDragging] = useState<{ id: number, type: 'photo'|'note' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasPreviewRef = useRef<HTMLDivElement>(null);

  // URLs de fondo

  const bgPortada = experience?.activationLink || experience?.activation_link || '';
  const bgContraportada = experience?.demoLink || (experience as any)?.demo_link || '';
  const bgInternas = (experience as any)?.photoboothLink3 || (experience as any)?.photobooth_link3 || '';

  // Debug URLs al cargar la experiencia
  useEffect(() => {
    if (experience) {
      console.log('[AlbumEditor] experience:', experience.id, experience.title);
      console.log('[AlbumEditor] bgPortada:', bgPortada);
      console.log('[AlbumEditor] bgInternas:', bgInternas);
      console.log('[AlbumEditor] bgContraportada:', bgContraportada);
    }
  }, [experience?.id]);

  // ResizeObserver: calcula el tamaño exacto en px del spread para que siempre sea visible



  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !canvasPreviewRef.current) return;

    const rect = canvasPreviewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (dragging.type === 'note') {
      setNotes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) } : n));
    }
  };

  const handlePointerUp = () => setDragging(null);

  // --- ACTIONS ---
  const addLeaf = () => {
    setTotalPages(prev => {
      const newTotal = prev + 2;
      setPhotos(current => [...current, ...generateAlbumSlotsForPages(prev, newTotal, currentLayoutId)]);
      return newTotal;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeElement?.type !== 'photo') return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotos(prev => prev.map(p => p.id === activeElement.id ? { ...p, dataUrl } : p));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addNote = () => {
    const newId = Date.now();
    setNotes(prev => [...prev, {
      id: newId, pageIndex: activePage, text: 'Nota', color: '#FFF59D', x: 0.5, y: 0.5, scale: 1, rotation: 0, fontFamily: 'sans-serif', fontSizeScale: 1
    }]);
    setActiveElement({ id: newId, type: 'note' });
  };

  const removeElement = () => {
    if (!activeElement) return;
    if (activeElement.type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === activeElement.id ? { ...p, dataUrl: null, scale: 1, rotation: 0, maskType: 'none' } : p));
    } else {
      setNotes(prev => prev.filter(n => n.id !== activeElement.id));
    }
    setActiveElement(null);
  };

  const updateActivePhoto = (updater: (p: AlbumPhoto) => AlbumPhoto) => {
    if (activeElement?.type !== 'photo') return;
    setPhotos(prev => prev.map(p => p.id === activeElement.id ? updater(p) : p));
  };

  const updateActiveNote = (updater: (n: AlbumNote) => AlbumNote) => {
    if (activeElement?.type !== 'note') return;
    setNotes(prev => prev.map(n => n.id === activeElement.id ? updater(n) : n));
  };

  const getBackgroundForPage = (index: number) => {
    if (index === 0) return bgPortada;
    if (index === totalPages - 1) return bgContraportada;
    return bgInternas;
  };

  const getLabelForPage = (index: number) => {
    if (index === 0) return t.atlantis.cover;
    if (index === totalPages - 1) return t.atlantis.backCover;
    return `Pág ${index}`;
  };

  // --- PDF EXPORT ---
  const exportPDF = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const { default: jsPDF } = await import('jspdf');
      await document.fonts.ready;
      
      // PDF Cuadrado (215.9 x 215.9 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215.9, 215.9],
      });

      const pageWmm = 215.9;
      const pageHmm = 215.9;

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Image not loaded'));
          img.src = src;
        });

      const renderPageToCanvas = async (pageNum: number): Promise<string> => {
        const canvas = document.createElement('canvas');
        canvas.width = PAGE_W;
        canvas.height = PAGE_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error(t.atlantis.camUnavailable || 'Canvas no disponible');

        // 1. Fondo
        const bgUrl = getBackgroundForPage(pageNum);
        if (bgUrl) {
          try {
            const bgImg = await loadImg(bgUrl);
            ctx.drawImage(bgImg, 0, 0, PAGE_W, PAGE_H);
          } catch {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, PAGE_W, PAGE_H);
          }
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        }

        // 2. Fotos
        const pagePhotos = photos.filter(p => p.pageIndex === pageNum);
        for (const photo of pagePhotos) {
          if (!photo.dataUrl) continue;
          try {
            const img = await loadImg(photo.dataUrl);
            const centerX = photo.x * PAGE_W;
            const centerY = photo.y * PAGE_H;
            const drawW = PAGE_W * photo.widthPct * photo.scale;
            const drawH = PAGE_H * photo.heightPct * photo.scale;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((photo.rotation * Math.PI) / 180);
            ctx.translate(-drawW/2, -drawH/2);
            
            drawMaskToCanvas(ctx, photo.maskType, drawW, drawH);
            ctx.clip();

            // object-fit: cover
            const imgRatio = img.width / img.height;
            const slotRatio = drawW / drawH;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
            if (imgRatio > slotRatio) {
              sWidth = img.height * slotRatio;
              sx = (img.width - sWidth) / 2;
            } else {
              sHeight = img.width / slotRatio;
              sy = (img.height - sHeight) / 2;
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, drawW, drawH);
            ctx.restore();

            // White border OUTSIDE image (drawn after restore, so not clipped)
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((photo.rotation * Math.PI) / 180);
            ctx.translate(-drawW/2, -drawH/2);
            const brd = Math.max(8, PAGE_W * 0.015);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = brd;
            ctx.strokeRect(-brd/2, -brd/2, drawW + brd, drawH + brd);
            ctx.restore();
          } catch {
            // Ignorar errores de carga individuales
          }
        }

        // 3. Notas
        const pageNotes = notes.filter(n => n.pageIndex === pageNum);
        for (const note of pageNotes) {
          if (!note.text) continue;
          const noteX = note.x * PAGE_W;
          const noteY = note.y * PAGE_H;
          const noteSize = PAGE_W * 0.25 * note.scale; // 25% width
          
          ctx.save();
          ctx.translate(noteX, noteY);
          ctx.rotate((note.rotation * Math.PI) / 180);
          
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetX = 15;
          ctx.shadowOffsetY = 15;
          ctx.fillStyle = note.color;
          ctx.fillRect(-noteSize/2, -noteSize/2, noteSize, noteSize);

          ctx.shadowColor = 'transparent'; 
          ctx.fillStyle = note.color === '#000000' ? '#ffffff' : '#000000';
          const baseFontSize = PAGE_W * 0.025 * (note.fontSizeScale || 1);
          const fsMap: Record<string, string> = { 'montserrat': 'Montserrat', 'festive': 'Mountains of Christmas', 'lobster': 'Lobster', 'script': 'Pinyon Script' };
          const realFont = fsMap[note.fontFamily] || 'Montserrat';
          ctx.font = `bold ${baseFontSize}px "${realFont}"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
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

        return canvas.toDataURL('image/jpeg', 0.92);
      };

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) pdf.addPage();
        const imgData = await renderPageToCanvas(p);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWmm, pageHmm);
      }

      pdf.save(`Album_${experience?.title || 'FanFest'}_${Date.now()}.pdf`);

    } catch (err: any) {
      console.error('Error exportando álbum PDF:', err);
      setExportError(err.message || 'Error al generar PDF del álbum');
    } finally {
      setIsExporting(false);
    }
  };

  if (!experience) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* HEADER */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button onClick={onBack} className="py-1 px-2.5 bg-white/10 rounded-lg text-white flex gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14} /> {t.atlantis.back}</button>
        <div className="flex flex-col items-center">
          <span className="font-black text-[10px] uppercase tracking-[0.2em] text-yellow-400">{t.atlantis.albumTitle}</span>
        </div>
        <div className="text-[9px] font-black text-white/50 bg-white/10 px-2 py-1 rounded-md uppercase">
          {totalPages} Págs
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center p-1.5 min-h-0 bg-black">
        <div className="flex gap-1 w-full max-w-sm mb-1.5 overflow-x-auto hide-scrollbar shrink-0">
          {[0, totalPages - 1, ...Array.from({ length: totalPages - 2 }).map((_, i) => i + 1)].map((i) => (
            <button key={i} onClick={() => { setActivePage(i); setActiveElement(null); }} className={`flex-shrink-0 min-w-[70px] py-1.5 px-2 rounded-md font-black text-[8px] uppercase tracking-wider ${activePage === i ? 'bg-yellow-500 text-slate-950' : 'bg-white/10 text-white/50'}`}>
              {getLabelForPage(i)}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full flex justify-center items-center min-h-0" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
          <div ref={canvasPreviewRef} className="relative bg-white rounded-lg overflow-hidden border border-white/10 shadow-2xl shrink-0" style={{ aspectRatio: '1/1', maxHeight: '100%', maxWidth: '100%', width: 'auto', height: '100%', touchAction: 'none' }} onPointerDown={() => { setActiveElement(null); }}>
            {getBackgroundForPage(activePage) && <img src={getBackgroundForPage(activePage)} className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" alt="Fondo" />}
            
            {activePage === 0 && !getBackgroundForPage(activePage) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <h2 className="text-2xl font-black text-black/20 uppercase">{t.atlantis.cover}</h2>
              </div>
            )}

            <div className="absolute inset-0 z-20">
              {photos.filter(p => p.pageIndex === activePage).map(photo => {
                const isActive = activeElement?.type === 'photo' && activeElement.id === photo.id;
                return (
                  <div
                    key={photo.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveElement({ id: photo.id, type: 'photo' });
                      if (!photo.dataUrl) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`absolute cursor-pointer ${isActive ? 'ring-2 z-50' : 'z-20'}`}
                    style={{
                      left: `${(photo.x - photo.widthPct/2)*100}%`,
                      top: `${(photo.y - photo.heightPct/2)*100}%`,
                      width: `${photo.widthPct*100}%`,
                      height: `${photo.heightPct*100}%`,
                      ringColor: isActive ? sc : 'transparent'
                    }}
                  >
                    {photo.dataUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="overflow-hidden" style={{
                          ...(photo.maskType === 'circle'
                            ? { width: '100%', aspectRatio: '1/1' }
                            : { width: '100%', height: '100%' }),
                          ...getMaskCSS(photo.maskType)
                        }}>
                          <img src={photo.dataUrl} className="w-full h-full object-cover" style={{ transform: `scale(${photo.scale}) rotate(${photo.rotation}deg)`, ...(photo.maskType === 'none' ? { border: '4px solid white', boxSizing: 'border-box' } : {}) }} alt="Slot" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full border border-dashed border-white/40 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"><Plus className="text-white/60" size={16} /></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-0 z-40 pointer-events-none">
              {notes.filter(n => n.pageIndex === activePage).map(note => {
                const isActive = activeElement?.type === 'note' && activeElement.id === note.id;
                return (
                  <div
                    key={note.id}
                    onPointerDown={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setActiveElement({ id: note.id, type: 'note' });
                      setDragging({ id: note.id, type: 'note' });
                    }}
                    className={`absolute flex items-center justify-center shadow-lg p-1 pointer-events-auto cursor-grab active:cursor-grabbing ${isActive ? 'ring-2 ring-white/80 z-50' : 'z-30'}`}
                    style={{
                      left: `${note.x*100}%`, top: `${note.y*100}%`, width: '25%', aspectRatio: '1/1',
                      transform: `translate(-50%, -50%) rotate(${note.rotation}deg) scale(${note.scale})`,
                      backgroundColor: note.color, color: note.color === '#000000' ? '#ffffff' : '#000000',
                      fontSize: `calc((3px + 1.2vw) * ${note.fontSizeScale})`, fontWeight: 'bold',
                      fontFamily: note.fontFamily === 'festive' ? '"Mountains of Christmas", cursive' : note.fontFamily === 'lobster' ? 'Lobster, cursive' : note.fontFamily === 'script' ? '"Pinyon Script", cursive' : 'Montserrat, sans-serif',
                      touchAction: 'none'
                    }}
                  >
                    {note.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <footer className="bg-black border-t border-white/10 flex flex-col items-center justify-center py-3 px-4 z-[120] shrink-0 min-h-[5rem]">
        {/* ACTIVE PHOTO */}
        {activeElement?.type === 'photo' && (
          <div className="flex flex-col gap-2 w-full max-w-md animate-fade-in mb-2">
            <div className="flex items-center justify-between gap-1 w-full overflow-x-auto hide-scrollbar">
              {[
                { t: 'none', i: <Square size={12}/> },
                { t: 'circle', i: <Circle size={12}/> },
                { t: 'heart', i: <Heart size={12}/> },
                { t: 'star', i: <Star size={12}/> },
                { t: 'splash', i: <Droplet size={12}/> }
              ].map(m => (
                <button
                  key={m.t}
                  onClick={() => updateActivePhoto(p => ({ ...p, maskType: m.t as MaskType }))}
                  className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                    photos.find(p => p.id === activeElement.id)?.maskType === m.t ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-white/5 border-white/10 text-white/50 active:bg-yellow-500/20'
                  }`}
                >
                  {m.i}
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button onClick={() => updateActivePhoto(p => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))} className="w-8 h-8 rounded text-yellow-400 bg-yellow-500/10"><ZoomOut size={14}/></button>
              <button onClick={() => updateActivePhoto(p => ({ ...p, scale: Math.min(2, p.scale + 0.1) }))} className="w-8 h-8 rounded text-yellow-400 bg-yellow-500/10"><ZoomIn size={14}/></button>
              <button onClick={() => updateActivePhoto(p => ({ ...p, rotation: p.rotation - 15 }))} className="w-8 h-8 rounded text-yellow-400 bg-yellow-500/10"><RotateCcw size={14}/></button>
              <button onClick={() => updateActivePhoto(p => ({ ...p, rotation: p.rotation + 15 }))} className="w-8 h-8 rounded text-yellow-400 bg-yellow-500/10"><RotateCw size={14}/></button>
              <button onClick={() => setActiveElement(null)} className="w-8 h-8 rounded text-yellow-400 bg-yellow-500/10"><ChevronLeft size={14}/></button>
              <button onClick={removeElement} className="w-8 h-8 rounded text-red-400 bg-red-500/10"><Trash2 size={14}/></button>
            </div>
          </div>
        )}

        {/* ACTIVE NOTE */}
        {activeElement?.type === 'note' && (
          <div className="flex flex-col gap-2 w-full max-w-md animate-fade-in mb-2">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={notes.find(n => n.id === activeElement.id)?.text || ''}
                onChange={(e) => updateActiveNote(n => ({ ...n, text: e.target.value }))}
                className="flex-1 bg-gray-900 border border-white/20 rounded p-2 text-white text-xs font-bold"
                placeholder={t.atlantis.writeSomething}
              />
              <button onClick={() => setActiveElement(null)} className="w-10 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center"><ChevronLeft size={16} /></button>
              <button onClick={removeElement} className="w-10 rounded bg-red-500/20 text-red-500 flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'montserrat', name: '1', style: 'Montserrat, sans-serif' },
                  { id: 'festive', name: '2', style: '"Mountains of Christmas", cursive' },
                  { id: 'lobster', name: '3', style: 'Lobster, cursive' },
                  { id: 'script', name: '4', style: '"Pinyon Script", cursive' }
                ].map(font => (
                  <button key={font.id} onClick={() => updateActiveNote(n => ({ ...n, fontFamily: font.id }))} className={`w-5 h-5 shrink-0 rounded flex items-center justify-center text-[9px] border ${notes.find(n => n.id === activeElement.id)?.fontFamily === font.id || (!notes.find(n => n.id === activeElement.id)?.fontFamily && font.id === 'montserrat') ? 'bg-yellow-500 text-slate-950 border-yellow-500' : 'bg-white/10 text-white border-transparent'}`} style={{ fontFamily: font.style }}>{font.name}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-1">
                {['#FFF59D', '#FFAB91', '#81D4FA', '#FFFFFF', '#000000'].map(c => (
                  <button key={c} onClick={() => updateActiveNote(n => ({ ...n, color: c }))} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => updateActiveNote(n => ({ ...n, scale: Math.max(0.5, n.scale - 0.1) }))} className="px-1.5 py-1 bg-yellow-500/10 rounded text-yellow-400"><ZoomOut size={12}/></button>
                <button onClick={() => updateActiveNote(n => ({ ...n, scale: Math.min(2, n.scale + 0.1) }))} className="px-1.5 py-1 bg-yellow-500/10 rounded text-yellow-400"><ZoomIn size={12}/></button>
                <button onClick={() => updateActiveNote(n => ({ ...n, fontSizeScale: Math.max(0.5, n.fontSizeScale - 0.2) }))} className="px-1.5 py-1 bg-yellow-500/10 rounded text-yellow-400 text-[10px] font-bold">A-</button>
                <button onClick={() => updateActiveNote(n => ({ ...n, fontSizeScale: Math.min(2.5, n.fontSizeScale + 0.2) }))} className="px-1.5 py-1 bg-yellow-500/10 rounded text-yellow-400 text-[10px] font-bold">A+</button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN ACTIONS */}
        {!activeElement && !showLayouts && (
          <div className="flex items-center justify-between gap-2 w-full max-w-md animate-fade-in">
            <div className="flex gap-2">
              <button onClick={addNote} className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex flex-col items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <MessageSquare size={18} />
                <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.note}</span>
              </button>
              <button onClick={addLeaf} className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex flex-col items-center justify-center active:bg-yellow-500 active:text-slate-950">
                <Plus size={18} />
                <span className="text-[8px] uppercase font-black mt-1">{t.atlantis.addPage}</span>
              </button>
            </div>

            <button
              onClick={exportPDF}
              disabled={isExporting}
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
            <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
              {(['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-round-single'] as AlbumLayoutId[]).map((lid, idx) => (
                <button
                  key={lid}
                  onClick={() => {
                    setCurrentLayoutId(lid);
                    setPhotos(prev => {
                      const otherPages = prev.filter(p => p.pageIndex !== activePage);
                      const newActivePageSlots = generateAlbumSlotsForPages(activePage, activePage + 1, lid, prev);
                      return [...otherPages, ...newActivePageSlots];
                    });
                  }}
                  className={`flex-shrink-0 w-14 h-16 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${currentLayoutId === lid ? 'border-white text-white' : 'border-white/20 text-white/40'}`}
                >
                  {lid === 'layout-round-single' ? <Circle size={20} /> : idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>

      {/* Input oculto */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Error */}
      {exportError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} className="text-red-600" /> {exportError}
        </div>
      )}
    </div>
  );
};
