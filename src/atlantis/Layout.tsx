import React, { useState } from 'react';
import { useAtlantis } from './AppContext';
import { QRScanner } from './QRScanner';
import { MetaverseSelector } from './MetaverseSelector';
import { Globe, ArrowLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onBack?: () => void;
  isFullScreen?: boolean;
}

export const AtlantisLayout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate, onBack, isFullScreen }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const { nicheConfig, allNiches, setCurrentNiche, metaversos, activeMetaverso, misMetaversoIds } = useAtlantis() as any;
  const activeCount: number = (misMetaversoIds as string[])?.length ?? 0;

  const primaryColor = nicheConfig?.primary_color || '#10b981';
  const baseColor = nicheConfig?.base_color || '#00205B'; // Ajustado a un tono azul profundo como fallback
  const activeMetaverseData = metaversos?.find((m: any) => m.nombre === activeMetaverso);
  const secondaryColor = activeMetaverseData?.secondary_color || '#1e293b';

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    let detectedNicheId = result;
    if (result.startsWith('http')) {
      try {
        const url = new URL(result);
        const searchId = url.searchParams.get('activate') || url.searchParams.get('niche');
        let hashId = null;
        if (url.hash.includes('?')) {
          const hashSearchParams = new URLSearchParams(url.hash.split('?')[1]);
          hashId = hashSearchParams.get('activate') || hashSearchParams.get('niche');
        }
        detectedNicheId = searchId || hashId || detectedNicheId;
      } catch (e) { console.warn("Error parsing scanned URL:", e); }
    }
    const found = allNiches.find(n =>
      String(n.id).toLowerCase() === String(detectedNicheId).toLowerCase() ||
      n.name.toLowerCase() === String(detectedNicheId).toLowerCase()
    );
    if (found) {
      setCurrentNiche(found.id);
      onNavigate('/');
    } else if (result.startsWith('http')) {
      if (window.confirm("Este código redirige a un recurso externo. ¿Deseas abrirlo?")) window.open(result, '_blank');
    } else {
      alert("Código no reconocido por la red Atlantis.");
    }
  };

  if (isFullScreen) {
    return <div style={{ backgroundColor: baseColor }} className="min-h-screen text-white font-sans">{children}</div>;
  }

  return (
    <div 
      className="w-full text-white flex flex-col font-sans relative overflow-x-hidden transition-colors duration-1000 min-h-screen overflow-y-auto" 
      style={{ backgroundColor: 'var(--atlantis-base, #000)' }}
    >
      {showScanner && <QRScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} primaryColor={primaryColor} />}
      <MetaverseSelector isOpen={showSelector} onClose={() => setShowSelector(false)} />

      {/* HEADER GLOBAL (Fiel a la Referencia) */}
      {!isFullScreen && (
        <header className="sticky top-0 z-[100] px-6 py-5 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm">
          <button 
            onClick={onBack} 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg border border-white/20"
            style={{ backgroundColor: secondaryColor }}
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex-1 flex justify-center">
            <div className="w-14 h-14 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 overflow-hidden bg-white">
              {nicheConfig?.logo_url ? (
                <img src={nicheConfig.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[8px] font-black uppercase text-center leading-none">
                  Fan<br/>Fest
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setShowSelector(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg border border-white/20 relative"
            style={{ backgroundColor: secondaryColor }}
          >
            <Globe size={22} />
          </button>
        </header>
      )}

      <main className="flex-1 w-full relative z-10 px-4 pb-4">
        {children}
      </main>
    </div>
  );
};
