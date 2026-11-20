import React, { useState } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, Download, Loader2, Printer } from 'lucide-react';

interface Props {
  experienceId: string;
  onBack: () => void;
}

export const HappyMealViewer: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';

  const [isExporting, setIsExporting] = useState(false);

  if (!experience) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">
        No encontrada.
      </div>
    );
  }

  const coverUrl = experience.imageUrl || '';
  const printUrl = experience.activationLink || experience.activation_link || '';

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      if (!printUrl) {
        alert('No hay imagen disponible para imprimir.');
        return;
      }

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Error cargando imagen'));
          img.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
        });

      const printImg = await loadImg(printUrl);
      const imgW = printImg.naturalWidth || 2480;
      const imgH = printImg.naturalHeight || 2480;

      // Create canvas matching the image dimensions
      const canvas = document.createElement('canvas');
      canvas.width = imgW;
      canvas.height = imgH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, imgW, imgH);
      ctx.drawImage(printImg, 0, 0, imgW, imgH);

      // Determine PDF orientation based on aspect ratio
      const isLandscape = imgW > imgH;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfW = isLandscape ? 297 : 210;
      const pdfH = isLandscape ? 210 : 297;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`CajitaFeliz_${experience.title || 'FanFest'}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      {/* Header */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button
          onClick={onBack}
          className="py-1 px-2.5 bg-white/10 rounded-lg text-white flex gap-1 font-black text-[9px] uppercase tracking-widest"
        >
          <ChevronLeft size={14} /> {t.atlantis?.back || 'Atrás'}
        </button>
        <span className="font-black text-[10px] uppercase tracking-[0.2em]" style={{ color: sc }}>
          CAJITA FELIZ
        </span>
        <button
          onClick={exportPDF}
          disabled={isExporting || !printUrl}
          className="py-1 px-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-1 disabled:opacity-30"
          style={{ backgroundColor: pc, color: '#000' }}
        >
          {isExporting
            ? <><Loader2 size={12} className="animate-spin" /> PDF...</>
            : <><Printer size={12} /> PDF</>}
        </button>
      </header>

      {/* Cover image */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={experience.title}
            className="h-28 object-contain rounded-xl border border-white/10 shadow-lg"
          />
        ) : (
          <div
            className="h-28 w-28 rounded-xl border border-white/10 flex items-center justify-center text-white/30 text-[9px] uppercase tracking-widest font-black"
          >
            Sin imagen
          </div>
        )}
        <div className="ml-4 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
            {experience.category || 'Cajita Feliz'}
          </p>
          <h2 className="text-base font-black uppercase tracking-tighter leading-tight text-white line-clamp-3">
            {experience.title}
          </h2>
          {experience.description ? (
            <p className="mt-1 text-[9px] text-white/50 leading-relaxed line-clamp-2">
              {experience.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Template image viewer (direct single file: activation_link) */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-2">
        {printUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={printUrl}
              alt={experience.title}
              className="max-w-full max-h-full object-contain rounded-xl border border-white/10 shadow-2xl animate-fade-in"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-white/30">
            <Download size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Sin plantilla disponible
            </p>
          </div>
        )}
      </div>

      {/* Footer: print instructions + download button */}
      <footer className="bg-black border-t border-white/10 py-3 px-4 shrink-0 z-50">
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <p className="flex-1 text-[9px] text-white/40 leading-relaxed">
            {t.atlantis?.happymeal_print_hint ||
              'Descarga el PDF e imprímelo en papel grueso. Recorta, dobla y arma tu Cajita Feliz.'}
          </p>
          <button
            onClick={exportPDF}
            disabled={isExporting || !printUrl}
            className="h-12 px-5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border transition-all active:scale-95 disabled:opacity-30 shrink-0"
            style={{ backgroundColor: pc, borderColor: pc, color: '#000' }}
          >
            {isExporting
              ? <><Loader2 size={16} className="animate-spin" /> PDF...</>
              : <><Download size={16} /> Imprimir</>}
          </button>
        </div>
      </footer>
    </div>
  );
};
