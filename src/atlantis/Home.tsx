
import React, { useState, useMemo, useEffect } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Zap, ChevronRight, Loader2, PlayCircle, Globe, X, Smartphone, DownloadCloud, ChevronLeft, Sparkles, Camera, Smile, Mail, Image, LayoutGrid, Heart, Star, PartyPopper, FileImage, BookOpen, Printer } from 'lucide-react';
import { cn } from '../lib/utils';

// Diccionario de Iconos Disponibles (Seguro para Build)
const LUCIDE_ICONS: Record<string, any> = {
  'Zap': Zap,
  'Camera': Camera,
  'Smile': Smile,
  'Mail': Mail,
  'Image': Image,
  'Globe': Globe,
  'Sparkles': Sparkles,
  'Heart': Heart,
  'Star': Star,
  'PartyPopper': PartyPopper,
  'LayoutGrid': LayoutGrid,
  'FileImage': FileImage,
  'BookOpen': BookOpen,
  'Printer': Printer
};

const IconRenderer = ({ icon, size = 64 }: { icon?: string, size?: number }) => {
  if (!icon) return <LayoutGrid size={size} strokeWidth={1.2} />;
  
  // Si es una URL (contiene http o /)
  if (icon.includes('http') || icon.startsWith('/')) {
    return <img src={icon} alt="icon" style={{ width: size, height: size, objectFit: 'contain' }} />;
  }

  // Si es un nombre de Lucide
  const IconComp = LUCIDE_ICONS[icon] || LUCIDE_ICONS['LayoutGrid'];
  return <IconComp size={size} strokeWidth={1.2} />;
};

// Eliminado MandatoryLegalFootnote para usar footer global del FanFest

const ColorizedTitle = ({ title, primaryColor }: { title: string, primaryColor: string }) => {
  if (!title) return null;
  const words = title.trim().split(/\s+/);
  if (words.length > 1) {
    return (
      <div className="flex flex-wrap justify-center gap-x-[0.2em] w-full">
        <span style={{ color: primaryColor }}>{words[0]}</span>
        <span className="text-white">{words.slice(1).join(' ')}</span>
      </div>
    );
  } else {
    const splitIndex = title.length <= 3 ? 1 : Math.ceil(title.length / 2);
    const firstPart = title.substring(0, splitIndex);
    const secondPart = title.substring(splitIndex);
    return (
      <div className="flex justify-center w-full">
        <span style={{ color: primaryColor }}>{firstPart}</span>
        <span className="text-white">{secondPart}</span>
      </div>
    );
  }
};

interface AtlantisHomeProps {
  onNavigate: (path: string) => void;
}

export const AtlantisHome: React.FC<AtlantisHomeProps> = ({ onNavigate }) => {
  const navigate = onNavigate;
  const { nicheConfig, loading, unlockedNiches, setCurrentNiche, allNiches, metaversos, activeMetaverso, setActiveMetaverso, mode } = useAtlantis() as any;
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIdx, setOnboardingIdx] = useState(0);

  const dynamicCategories = useMemo(() => {
    if (!nicheConfig?.category_configs) return [];
    
    const CATEGORY_ORDER = [
      "Hora Loca Hats",
      "Face Glam",
      "Photo Booth",
      "Postales Wassap",
      "Marcos Pro",
      "Fondos Inmersivos",
      "Posters",
      "Mi Album",
      "Postales",
      "Postales Dobladas",
      "Papercraft Caja",
      "Papercraft Cajita Feliz",
      "Papercraft Domo",
      "Papercraft Carrusel"
    ];

    const isDigital = (type: string) => ["Hora Loca Hats", "Face Glam", "Photo Booth", "Postales Wassap", "Marcos Pro", "Fondos Inmersivos"].includes(type);
    const isPrint = (type: string) => ["Posters", "Mi Album", "Postales", "Postales Dobladas", "Papercraft Caja", "Papercraft Cajita Feliz", "Papercraft Domo", "Papercraft Carrusel"].includes(type);

    return CATEGORY_ORDER.filter(type => mode === 'impresion' ? isPrint(type) : isDigital(type)).map(type => {
      const cfg = nicheConfig.category_configs[type];
      if (!cfg) return null;
      
      const categoryKey = type as keyof typeof t.categories;
      const localizedLabel = t.categories?.[categoryKey] || cfg.label || type;

      return { 
        type, 
        label: localizedLabel, 
        img: cfg.img, 
        icon: cfg.icon || cfg.img // Usar img como icono si el campo icon está ausente
      };
    }).filter(Boolean);
  }, [nicheConfig, mode, t.categories]);

  const activeMetaverseData = metaversos?.find((m: any) => m.nombre === activeMetaverso);
  const primaryColor = activeMetaverseData?.secondary_color || '#FF2D31';
  
  const onboardingImages = useMemo(() => {
    const imgs = nicheConfig?.onboarding_images || [];
    return imgs.filter(img => img && typeof img === 'string' && img.trim() !== '');
  }, [nicheConfig]);

  const handleNextOnboarding = () => {
    if (onboardingIdx < onboardingImages.length - 1) {
      setOnboardingIdx(prev => prev + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handlePrevOnboarding = () => {
    if (onboardingIdx > 0) {
      setOnboardingIdx(prev => prev - 1);
    }
  };

  const handleOpenOnboarding = () => {
    if (onboardingImages.length > 0) {
      setOnboardingIdx(0);
      setShowOnboarding(true);
    }
  };

  const handleDeleteSaved = (e: React.MouseEvent, accessId: string) => {
    e.stopPropagation();
    if (window.confirm("¿Deseas eliminar este metaverso?")) console.log('removeAccess not implemented', accessId);
  };

  const titleText = nicheConfig?.title || 'NAVIFEST AR';
  const titleLength = titleText.length;
  const preferredSize = titleLength > 20 ? '6vw' : titleLength > 12 ? '8vw' : '13vw';
  const fluidFontSize = `clamp(1.8rem, ${preferredSize}, 6rem)`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48 gap-6 animate-pulse">
        <Loader2 className="animate-spin text-navifest-red" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.metaverse?.syncing ?? "Sincronizando Multiverso..."}</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      

      
      {/* MODAL ONBOARDING - FIEL AL DISEÑO PREMIUM */}
      {showOnboarding && onboardingImages.length > 0 && (
        <div className="fixed inset-0 z-[1000] bg-black animate-fade-in overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0">
            <img 
              src={onboardingImages[onboardingIdx]} 
              className="w-full h-full object-cover blur-[120px] opacity-40 scale-110 transition-all duration-700" 
              alt="Ambient Glow"
            />
          </div>
          <div className="relative z-10 flex-1 flex flex-col h-full w-full">
            <div className="p-5 flex justify-end shrink-0">
              <button 
                onClick={() => setShowOnboarding(false)} 
                className="p-3 bg-black/40 backdrop-blur-2xl rounded-full text-white/80 border border-white/10 active:scale-90 transition-all shadow-xl"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-start px-2 relative overflow-hidden">
                <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] border border-white/5">
                  <img 
                    key={onboardingIdx}
                    src={onboardingImages[onboardingIdx]} 
                    className="w-full h-full object-contain animate-slide-in select-none" 
                    alt={`Paso ${onboardingIdx + 1}`} 
                  />
                  <div className="absolute inset-0 flex z-20">
                    <div onClick={handlePrevOnboarding} className="flex-1 h-full cursor-pointer active:bg-white/5 transition-colors"></div>
                    <div onClick={handleNextOnboarding} className="flex-1 h-full cursor-pointer active:bg-white/5 transition-colors"></div>
                  </div>
                </div>
            </div>
            <div className="p-8 pt-4 pb-12 space-y-6 flex flex-col items-center shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="flex justify-center gap-2.5">
                  {onboardingImages.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-700 ${onboardingIdx === i ? 'w-10' : 'w-2.5 opacity-20 bg-white'}`}
                      style={{ backgroundColor: onboardingIdx === i ? primaryColor : '' }}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNextOnboarding}
                  className="w-full max-w-xs py-5 rounded-[2.2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all border border-white/10 text-white flex items-center justify-center gap-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  {onboardingIdx < onboardingImages.length - 1 ? (t.metaverse?.next ?? 'Siguiente') : (t.metaverse?.start ?? 'Comenzar')}
                  <ChevronRight size={18} />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative px-2 pt-4">
        <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-100 flex items-center justify-center">
          {/* Placeholder logo shown until hero image loads */}
          <img
            src="https://i.ibb.co/8GTYTt1/SAY-LUCY-LOGO.png"
            alt="Say Lucy"
            className="absolute inset-0 m-auto w-24 h-24 object-contain opacity-20 z-0"
          />
          <img
            src={mode === 'impresion'
              ? (nicheConfig?.hero_print || nicheConfig?.hero_url || 'https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg')
              : (nicheConfig?.hero_url || 'https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg')}
            className="relative w-full h-full object-cover z-10"
            alt="Hero"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CATÁLOGO AR - COMPACTADO */}
      <div className="px-4">

        <div className="grid grid-cols-2 gap-4">
          {dynamicCategories.length > 0 ? dynamicCategories.map((card: any, idx) => {
            return (
              <div 
                key={idx} 
                onClick={() => navigate(`/list/${encodeURIComponent(card.type)}`)} 
                className="aspect-[1/1.2] rounded-[2.2rem] overflow-hidden border border-white/10 bg-white/5 relative active:scale-95 transition-all shadow-xl group flex flex-col items-center justify-center p-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <div className="mb-2 group-hover:scale-110 transition-transform duration-500">
                  <IconRenderer icon={card.icon} />
                </div>
                
                <h3 
                  className="text-[12px] font-black uppercase tracking-widest truncate max-w-full drop-shadow-sm" 
                  style={{ color: primaryColor }}
                >
                  {card.label}
                </h3>

                <div className="absolute top-5 right-5 bg-white/20 p-2 rounded-full group-hover:bg-white transition-all text-white">
                  <ChevronRight size={14} style={{ color: primaryColor }} />
                </div>
              </div>
            );
          }) : (
            <div className="col-span-2 text-center py-24 text-gray-500 text-[10px] font-black uppercase border border-dashed border-white/10 rounded-[3rem] tracking-[0.3em]">
              {t.metaverse?.noExperiences ?? "No hay experiencias disponibles en este metaverso"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
