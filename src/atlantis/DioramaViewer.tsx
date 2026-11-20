import React, { useState } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';

interface Props {
  experienceId: string;
  onBack: () => void;
}

type TabType = 'cara1' | 'cara2';

export const DioramaViewer: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);

  const [activeTab, setActiveTab] = useState<TabType>('cara1');
  const [isExporting, setIsExporting] = useState(false);

  if (!experience) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">
        No encontrada.
      </div>
    );
  }

  const tab1Url = experience.activationLink || experience.activation_link || '';
  const tab2Url = experience.demoLink || '';

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const printUrl = activeTab === 'cara1' ? tab1Url : tab2Url;
      if (!printUrl) {
        alert('No hay imagen disponible para imprimir en esta pestaña.');
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

      const canvas = document.createElement('canvas');
      canvas.width = imgW;
      canvas.height = imgH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, imgW, imgH);
      ctx.drawImage(printImg, 0, 0, imgW, imgH);

      const isLandscape = imgW > imgH;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfW = isLandscape ? 297 : 210;
      const pdfH = isLandscape ? 210 : 297;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`Diorama_${experience.title || 'FanFest'}_${activeTab === 'cara1' ? 'Cara1' : 'Cara2'}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const tabLabel = (tab: TabType) =>
    tab === 'cara1'
      ? (t.atlantis?.diorama_tab1 || 'CARA 1')
      : (t.atlantis?.diorama_tab2 || 'CARA 2');

  const activeUrl = activeTab === 'cara1' ? tab1Url : tab2Url;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      {/* Header */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button
          onClick={onBack}
          className="py-1 px-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 flex items-center gap-1 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
        >
          <ChevronLeft size={14} /> {t.atlantis?.back || 'Atrás'}
        </button>
        <span className="font-black text-[11px] uppercase tracking-[0.2em] text-yellow-400 truncate max-w-[50vw]">
          {experience.title || 'DIORAMA'}
        </span>
        <button
          onClick={exportPDF}
          disabled={isExporting || !activeUrl}
          className="py-1.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 border border-yellow-500 bg-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.4)] active:scale-95 disabled:opacity-30 transition-all"
        >
          {isExporting
            ? <><Loader2 size={14} className="animate-spin" /> PDF...</>
            : <><Download size={14} /> PDF</>}
        </button>
      </header>

      {/* Tabs */}
      <div className="shrink-0 flex gap-2 px-4 pt-3 pb-2">
        {(['cara1', 'cara2'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
              activeTab === tab
                ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Template image viewer */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-2">
        {activeUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              key={activeTab}
              src={activeUrl}
              alt={tabLabel(activeTab)}
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
            {t.atlantis?.diorama_print_hint ||
              'Descarga el PDF e imprímelo en papel grueso. Recorta, dobla y arma tu diorama.'}
          </p>
          <button
            onClick={exportPDF}
            disabled={isExporting || !activeUrl}
            className="h-12 px-5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-yellow-500 bg-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all active:scale-95 disabled:opacity-30 shrink-0"
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
