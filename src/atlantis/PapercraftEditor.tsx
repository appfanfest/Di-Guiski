import React, { useState, useRef } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, Plus, Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw, Trash2 } from 'lucide-react';
import { ExperienceType } from './types';
import { MaskType, getMaskCSS, drawMaskToCanvas } from './maskUtils';

const TOTAL_ASPECT = 1; // Las plantillas de papercraft son cuadradas (1:1)

type PapercraftType = 'CAJA_ABIERTA' | 'CAJITA_FELIZ' | 'DOMO' | 'CARRUSEL';

interface PhotoSlot {
  id: number;
  dataUrl: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  autoRotation: number; // rotación fija aplicada al exportar PDF para que la foto quede correcta al armar
  maskType: MaskType;
  widthPct: number;
  heightPct: number;
}

interface SectionState {
  id: string;
  label: string;
  bgUrl: string;
  slots: PhotoSlot[];
}

const generateSlots = (type: PapercraftType, sectionId: string): PhotoSlot[] => {
  const slots: PhotoSlot[] = [];
  let id = 0;
  // autoRotation: grados fijos que se suman al exportar el PDF para que la foto
  // aparezca correctamente orientada una vez cortado y armado el papercraft.
  const addSlot = (cx: number, cy: number, w: number, h: number, m: MaskType = 'circle', autoRotation: number = 0) => {
    slots.push({ id: id++, x: cx, y: cy, widthPct: w, heightPct: h, dataUrl: null, scale: 1, rotation: 0, autoRotation, maskType: m });
  };

  if (type === 'CAJA_ABIERTA') {
    // Plantilla en cruz sobre canvas 1:1 (cuadrado)
    // Slots de 0.11x0.11, perfectamente centrados en 0.26 y 0.74
    addSlot(0.50, 0.26, 0.11, 0.11, 'circle',   0);  // FRONT
    addSlot(0.50, 0.50, 0.11, 0.11, 'circle',   0);  // BASE
    addSlot(0.50, 0.74, 0.11, 0.11, 'circle', 180);  // BACK
    addSlot(0.26, 0.50, 0.11, 0.11, 'circle', -90);  // LEFT SIDE
    addSlot(0.74, 0.50, 0.11, 0.11, 'circle',  90);  // RIGHT SIDE
  } else if (type === 'CAJITA_FELIZ') {
    // Cajita Feliz: 7 slots en total (incluyendo 1 slot adicional por cada lado de la tapa/roof)
    // Los slots del roof (tapa) son más pequeños (0.08x0.08)
    // La tapa del BACK (TAPA BACK) debe rotar 180° en el PDF igual que el BACK panel
    addSlot(0.50, 0.08, 0.08, 0.08, 'circle',   0);  // TAPA FRONT (arriba) - tamaño 0.08
    addSlot(0.50, 0.26, 0.11, 0.11, 'circle',   0);  // FRONT
    addSlot(0.50, 0.50, 0.11, 0.11, 'circle',   0);  // BASE
    addSlot(0.50, 0.74, 0.11, 0.11, 'circle', 180);  // BACK
    addSlot(0.50, 0.92, 0.08, 0.08, 'circle', 180);  // TAPA BACK (abajo) - tamaño 0.08 y rotación 180°
    addSlot(0.26, 0.50, 0.11, 0.11, 'circle', -90);  // LEFT SIDE
    addSlot(0.74, 0.50, 0.11, 0.11, 'circle',  90);  // RIGHT SIDE
  } else if (type === 'DOMO') {
    // Domo Geodésico para Niños: 6 slots en total (1 centro/techo y 5 paneles alrededor en flor)
    addSlot(0.50, 0.50, 0.11, 0.11, 'circle',   0);  // CENTRO / TECHO
    addSlot(0.50, 0.28, 0.10, 0.10, 'circle',   0);  // PANEL SUPERIOR
    addSlot(0.71, 0.43, 0.10, 0.10, 'circle',  72);  // PANEL DERECHO SUPERIOR
    addSlot(0.63, 0.68, 0.10, 0.10, 'circle', 144);  // PANEL DERECHO INFERIOR
    addSlot(0.37, 0.68, 0.10, 0.10, 'circle', -144); // PANEL IZQUIERDO INFERIOR
    addSlot(0.29, 0.43, 0.10, 0.10, 'circle',  -72); // PANEL IZQUIERDO SUPERIOR
  } else if (type === 'CARRUSEL') {
    if (sectionId === 'base') {
      // 3 slots rectangulares horizontales 16:9
      addSlot(0.20, 0.50, 0.20, 0.11, 'none', 0);
      addSlot(0.50, 0.50, 0.20, 0.11, 'none', 0);
      addSlot(0.80, 0.50, 0.20, 0.11, 'none', 0);
    } else if (sectionId === 'caballitos') {
      // 2 slots cuadrados 1:1
      addSlot(0.30, 0.50, 0.20, 0.20, 'none', 0);
      addSlot(0.70, 0.50, 0.20, 0.20, 'none', 0);
    } else if (sectionId === 'techo') {
      // Tira recta (borde del techo) con 3 slots 16:9 horizontales (Arte del cono independiente)
      addSlot(0.20, 0.35, 0.20, 0.11, 'none', 0);
      addSlot(0.50, 0.35, 0.20, 0.11, 'none', 0);
      addSlot(0.80, 0.35, 0.20, 0.11, 'none', 0);
    }
  }
  return slots;
};

interface Props {
  experienceId: string;
  onBack: () => void;
}

export const PapercraftEditor: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';

  const determineType = (): PapercraftType => {
    if (experience?.type === ExperienceType.PAPERCRAFT_CAJITA_FELIZ) return 'CAJITA_FELIZ';
    if (experience?.type === ExperienceType.PAPERCRAFT_DOMO) return 'DOMO';
    if (experience?.type === ExperienceType.PAPERCRAFT_CARRUSEL) return 'CARRUSEL';
    return 'CAJA_ABIERTA';
  };

  const pType = determineType();

  const [sections, setSections] = useState<SectionState[]>(() => {
    if (pType === 'CARRUSEL') {
      return [
        { id: 'base', label: 'Base', bgUrl: experience?.activationLink || '', slots: generateSlots(pType, 'base') },
        { id: 'caballitos', label: 'Caballitos', bgUrl: experience?.demoLink || '', slots: generateSlots(pType, 'caballitos') },
        { id: 'techo', label: 'Techo', bgUrl: experience?.photoboothLink3 || '', slots: generateSlots(pType, 'techo') }
      ];
    }
    return [
      { id: 'main', label: 'Diseño', bgUrl: experience?.activationLink || '', slots: generateSlots(pType, 'main') }
    ];
  });
  
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasPreviewRef = useRef<HTMLDivElement>(null);

  const activeSection = sections[activeSectionIdx];

  const updateActiveSectionSlots = (newSlots: PhotoSlot[]) => {
    setSections(prev => prev.map((sec, idx) => idx === activeSectionIdx ? { ...sec, slots: newSlots } : sec));
  };

  const handleSlotClick = (slotId: number) => {
    const slot = activeSection.slots.find(s => s.id === slotId);
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
      updateActiveSectionSlots(activeSection.slots.map(s => s.id === activeSlot ? { ...s, dataUrl } : s));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const changeSlot = (slotId: number, changes: Partial<PhotoSlot>) => {
    updateActiveSectionSlots(activeSection.slots.map(s => s.id === slotId ? { ...s, ...changes } : s));
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 210] }); // PDF cuadrado para template 1:1
      
      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Error image'));
          img.src = src;
        });

      for (let i = 0; i < sections.length; i++) {
        if (i > 0) pdf.addPage();
        const sec = sections[i];
        
        const canvas = document.createElement('canvas');
        canvas.width = 2480;
        canvas.height = 2480; // canvas cuadrado (template 1:1)
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 2480, 2480);
        
        if (sec.bgUrl) {
          try {
            const bgImg = await loadImg(sec.bgUrl);
            ctx.drawImage(bgImg, 0, 0, 2480, 2480);
          } catch {}
        }
        
        for (const slot of sec.slots) {
          if (!slot.dataUrl) continue;
          try {
            const photo = await loadImg(slot.dataUrl);
            const centerX = slot.x * 2480;
            const centerY = slot.y * 2480; // canvas cuadrado
            const drawW = slot.widthPct * 2480 * slot.scale;
            const drawH = slot.heightPct * 2480 * slot.scale; // canvas cuadrado
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(((slot.rotation + slot.autoRotation) * Math.PI) / 180); // incluye autoRotación del panel
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
            
            // Draw border
            if (slot.maskType === 'none') {
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(((slot.rotation + slot.autoRotation) * Math.PI) / 180); // incluye autoRotación del panel
              ctx.translate(-drawW/2, -drawH/2);
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 15;
              ctx.strokeRect(-7.5, -7.5, drawW + 15, drawH + 15);
              ctx.restore();
            }
          } catch {}
        }
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 210); // PDF cuadrado
      }

      // Stickers page: se agrega como hoja SEPARADA al final del PDF
      // No se superpone sobre ninguna otra página; es una hoja aparte para
      // que el usuario la imprima y personalice su papercraft.
      if (experience?.photoboothLink4) {
        try {
          pdf.addPage();
          const stCanvas = document.createElement('canvas');
          stCanvas.width = 2480;
          stCanvas.height = 2480; // stickers también en formato cuadrado
          const stCtx = stCanvas.getContext('2d');
          if (stCtx) {
            stCtx.fillStyle = '#ffffff';
            stCtx.fillRect(0, 0, 2480, 2480);
            const stickersImg = await loadImg(experience.photoboothLink4);
            stCtx.drawImage(stickersImg, 0, 0, 2480, 2480);
            pdf.addImage(stCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 210);
          }
        } catch {}
      }

      pdf.save(`Papercraft_${experience?.title || 'FanFest'}_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!experience) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button onClick={onBack} className="py-1 px-2.5 bg-white/10 rounded-lg text-white flex gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14} /> Volver</button>
        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-yellow-400">Papercraft: {pType.replace('_', ' ')}</span>
      </header>

      {sections.length > 1 && (
        <div className="flex bg-gray-900 border-b border-white/10">
          {sections.map((sec, idx) => (
            <button key={sec.id} onClick={() => { setActiveSectionIdx(idx); setActiveSlot(null); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest ${idx === activeSectionIdx ? 'bg-yellow-500 text-slate-900' : 'text-white/50 hover:bg-white/5'}`}>
              {sec.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center p-1.5 min-h-0 bg-black">
        <div className="flex-1 w-full flex justify-center min-h-0">
          <div ref={canvasPreviewRef} className="relative bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-2xl flex flex-col shrink-0" style={{ aspectRatio: '1/1', maxHeight: '100%', maxWidth: '100%', width: 'auto', height: '100%', touchAction: 'none' }} onPointerDown={() => setActiveSlot(null)}>
            
            <div className="relative flex-1 cursor-pointer ring-1 ring-inset ring-white/20">
              {activeSection.bgUrl && <img src={activeSection.bgUrl} className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none" alt="Plantilla" />}
              <div className="absolute inset-0 z-20">
                {activeSection.slots.map(slot => (
                  <div key={slot.id} onPointerDown={(e) => { e.stopPropagation(); handleSlotClick(slot.id); }} className={`absolute cursor-pointer ${activeSlot === slot.id ? 'ring-2' : ''}`} style={{ left: `${(slot.x - slot.widthPct/2)*100}%`, top: `${(slot.y - slot.heightPct/2)*100}%`, width: `${slot.widthPct*100}%`, height: `${slot.heightPct*100}%`, ringColor: activeSlot === slot.id ? sc : 'transparent' }}>
                    {slot.dataUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full h-full overflow-hidden" style={getMaskCSS(slot.maskType)}>
                          <img src={slot.dataUrl} className="w-full h-full object-cover" style={{ transform: `scale(${slot.scale}) rotate(${slot.rotation}deg)`, ...(slot.maskType === 'none' ? { border: '2px solid white', boxSizing: 'border-box' } : {}) }} alt="Slot" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full border border-dashed border-white/40 bg-black/40 flex items-center justify-center"><Plus className="text-white/60" size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <footer className="bg-black border-t border-white/10 py-2 px-3 shrink-0 z-50">
        <div className="text-center text-[8px] font-bold pb-1 text-white/40 uppercase tracking-wider">
          Editando {activeSection.label}
        </div>
        {activeSlot !== null && activeSection.slots.find(s => s.id === activeSlot)?.dataUrl ? (
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => changeSlot(activeSlot, { rotation: (activeSection.slots.find(s=>s.id===activeSlot)?.rotation||0) - 15 })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><RotateCcw size={14} /></button>
              <button onClick={() => changeSlot(activeSlot, { scale: Math.max(0.5, (activeSection.slots.find(s=>s.id===activeSlot)?.scale||1) - 0.1) })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ZoomOut size={14} /></button>
              <button onClick={() => changeSlot(activeSlot, { scale: Math.min(2, (activeSection.slots.find(s=>s.id===activeSlot)?.scale||1) + 0.1) })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ZoomIn size={14} /></button>
              <button onClick={() => changeSlot(activeSlot, { rotation: (activeSection.slots.find(s=>s.id===activeSlot)?.rotation||0) + 15 })} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><RotateCw size={14} /></button>
              <button onClick={() => setActiveSlot(null)} className="p-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400"><ChevronLeft size={14} /></button>
              <button onClick={() => changeSlot(activeSlot, { dataUrl: null })} className="p-1.5 bg-gray-900 border border-red-500/30 rounded-lg text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1 border-t border-white/5 pt-1.5">
              {(['circle', 'star', 'heart', 'none'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => changeSlot(activeSlot, { maskType: m })}
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border transition-all ${
                    activeSection.slots.find(s => s.id === activeSlot)?.maskType === m
                      ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.3)]'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {m === 'circle' ? 'Círculo' : m === 'star' ? 'Estrella' : m === 'heart' ? 'Corazón' : 'Cuadrado'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <button onClick={exportPDF} disabled={isExporting} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 border border-yellow-500 bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all active:scale-95 disabled:opacity-30">
              {isExporting ? <><Loader2 className="animate-spin" size={16} /> PDF...</> : <><Download size={16} /> PDF</>}
            </button>
          </div>
        )}
      </footer>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};
