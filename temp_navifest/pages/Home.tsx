
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Zap, ChevronRight, Loader2, PlayCircle, Globe, X, Smartphone, DownloadCloud, ChevronLeft, Sparkles } from 'lucide-react';

export const MandatoryLegalFootnote: React.FC = () => (
    <div className="text-center pt-10 border-t border-white/5 mt-10">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">Atlantis 5.0 Metaverse Infrastructure</p>
        <p className="text-gray-700 text-[9px] font-mono mt-2">RIF: J-507150585 • Atlantis 5.0 Smart Apps • Municipio Maneiro, Estado Nueva Esparta, Venezuela</p>
    </div>
);

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

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { nicheConfig, loading, unlockedNiches, setCurrentNiche, allNiches, removeAccess } = useAppContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIdx, setOnboardingIdx] = useState(0);

  const dynamicCategories = useMemo(() => {
    if (!nicheConfig?.category_configs) return [];
    return Object.entries(nicheConfig.category_configs)
      .map(([type, cfg]: [string, any]) => ({ type, label: cfg.label, img: cfg.img }));
  }, [nicheConfig]);

  const primaryColor = nicheConfig?.primary_color || '#FF2D31';
  
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
    if (window.confirm("¿Deseas eliminar este metaverso?")) removeAccess(accessId);
  };

  const titleText = nicheConfig?.title || 'NAVIFEST AR';
  const titleLength = titleText.length;
  const preferredSize = titleLength > 20 ? '6vw' : titleLength > 12 ? '8vw' : '13vw';
  const fluidFontSize = `clamp(1.8rem, ${preferredSize}, 6rem)`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48 gap-6 animate-pulse">
        <Loader2 className="animate-spin text-navifest-red" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sincronizando Multiverso...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 animate-fade-in">
      
      {/* MODAL ONBOARDING - RESTRICCIÓN 9:16 AL TOPE + NAVEGACIÓN POR SWIPE/TAP */}
      {showOnboarding && onboardingImages.length > 0 && (
        <div className="fixed inset-0 z-[1000] bg-black animate-fade-in overflow-hidden flex flex-col">
          
          {/* Capa de Fondo Ambiental */}
          <div className="absolute inset-0 z-0">
            <img 
              src={onboardingImages[onboardingIdx]} 
              className="w-full h-full object-cover blur-[120px] opacity-40 scale-110 transition-all duration-700" 
              alt="Ambient Glow"
            />
          </div>

          {/* Contenido UI */}
          <div className="relative z-10 flex-1 flex flex-col h-full w-full">
            
            {/* Header: Botón Cerrar Minimalista al Top */}
            <div className="p-5 flex justify-end shrink-0">
              <button 
                onClick={() => setShowOnboarding(false)} 
                className="p-3 bg-black/40 backdrop-blur-2xl rounded-full text-white/80 border border-white/10 active:scale-90 transition-all shadow-xl"
              >
                <X size={22} />
              </button>
            </div>

            {/* Visualizador 9:16 Ajustado al TOP */}
            <div className="flex-1 flex flex-col items-center justify-start px-2 relative overflow-hidden">
                <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] border border-white/5">
                  <img 
                    key={onboardingIdx}
                    src={onboardingImages[onboardingIdx]} 
                    className="w-full h-full object-contain animate-slide-in select-none" 
                    alt={`Paso ${onboardingIdx + 1}`} 
                  />
                  
                  {/* Zonas de Tap Invisibles para navegación (Sustituyen a los handles) */}
                  <div className="absolute inset-0 flex z-20">
                    <div onClick={handlePrevOnboarding} className="flex-1 h-full cursor-pointer active:bg-white/5 transition-colors" title="Atrás"></div>
                    <div onClick={handleNextOnboarding} className="flex-1 h-full cursor-pointer active:bg-white/5 transition-colors" title="Siguiente"></div>
                  </div>

                  {/* Feedback visual de que se puede navegar (Opcional, muy sutil) */}
                  <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-20 pointer-events-none">
                    {onboardingIdx > 0 && <ChevronLeft size={16} className="text-white" />}
                  </div>
                  <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-20 pointer-events-none">
                    {onboardingIdx < onboardingImages.length - 1 && <ChevronRight size={16} className="text-white" />}
                  </div>
                </div>
            </div>

            {/* Footer de Controles: Fuera del área de la imagen para evitar solapamientos */}
            <div className="p-8 pt-4 pb-12 space-y-6 flex flex-col items-center shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent">
                {/* Dots de progreso */}
                <div className="flex justify-center gap-2.5">
                  {onboardingImages.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-700 ${onboardingIdx === i ? 'w-10' : 'w-2.5 opacity-20 bg-white'}`}
                      style={{ backgroundColor: onboardingIdx === i ? primaryColor : '' }}
                    />
                  ))}
                </div>

                {/* Botón de acción principal: Posicionado en zona segura */}
                <button 
                  onClick={handleNextOnboarding}
                  className="w-full max-w-xs py-5 rounded-[2.2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all border border-white/10 text-white flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: `${primaryColor}CC`, 
                    backdropFilter: 'blur(16px)',
                    boxShadow: `0 15px 45px ${primaryColor}40`
                  }}
                >
                  {onboardingIdx < onboardingImages.length - 1 ? 'Siguiente' : 'Comenzar'}
                  <ChevronRight size={18} />
                </button>
                
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Atlantis Navigation 5.0</p>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative w-full h-[560px] rounded-[3.5rem] overflow-hidden border-2 border-white/10 shadow-2xl mx-auto group">
        <img src={nicheConfig?.hero_url || "https://i.ibb.co/S49kXbDL/NUEVO-YEAR-MARGARITA.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-between text-center px-4 md:px-10 pt-16 pb-16">
            <h1 
              className="font-black font-display drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] uppercase tracking-tighter leading-[0.85] w-full text-center break-words overflow-visible px-6 md:px-10"
              style={{ 
                fontSize: fluidFontSize,
                textWrap: 'balance' as any 
              }}
            >
              <ColorizedTitle title={titleText} primaryColor={primaryColor} />
            </h1>
            <div className="flex flex-col items-center space-y-8 w-full">
                <p 
                  className="text-gray-100 font-bold max-w-[280px] md:max-w-xs text-sm drop-shadow-md leading-tight opacity-90 text-center"
                  style={{ textWrap: 'balance' as any }}
                >
                  {nicheConfig?.slogan || 'Vive la magia de la navidad en Realidad Aumentada.'}
                </p>
                <div className="flex flex-col gap-4 w-full max-w-[320px]">
                    <button 
                      onClick={() => navigate('/plans')} 
                      className="py-5 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all border border-white/10 shadow-2xl flex items-center justify-center gap-3"
                      style={{ backgroundColor: primaryColor, color: 'white' }}
                    >
                      <Sparkles size={16} /> ¡COMIENZA GRATIS!
                    </button>
                    <button 
                      onClick={handleOpenOnboarding} 
                      className="py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.15em] shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md text-white bg-white/10"
                    >
                      <Globe size={18} /> BIENVENIDOS A ATLANTIS 5.0
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* TUS METAVERSOS ACTIVADOS */}
      {unlockedNiches.length > 0 && (
        <div className="space-y-6 px-2">
          <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] px-2 border-l-2 border-navifest-gold">Mis Metaversos</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {unlockedNiches.map(access => {
                  const fallbackData = allNiches.find(n => String(n.id) === String(access.niche_id));
                  const displayLogo = access.niche_data?.logo_url || fallbackData?.logo_url || 'https://via.placeholder.com/100';
                  const isCurrent = String(nicheConfig?.id) === String(access.niche_id);

                  return (
                    <div 
                        key={access.id} 
                        onClick={() => setCurrentNiche(access.niche_id)}
                        className={`relative flex-shrink-0 w-24 aspect-square rounded-[2rem] border transition-all duration-500 flex items-center justify-center p-4 active:scale-90 cursor-pointer ${isCurrent ? 'bg-navifest-gold/15 border-navifest-gold shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}
                    >
                        <img src={displayLogo} className="w-full h-full object-contain filter drop-shadow-md" alt="Logo" />
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-navifest-gold rounded-full border-2 border-black flex items-center justify-center">
                            <Zap size={8} fill="black" className="text-black" />
                          </div>
                        )}
                        <button 
                          onClick={(e) => handleDeleteSaved(e, access.id)}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full border border-black flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={10} strokeWidth={4} />
                        </button>
                    </div>
                  );
              })}
          </div>
        </div>
      )}

      {/* CATÁLOGO AR */}
      <div className="space-y-8 px-2">
        <h2 className="text-4xl font-black text-white font-display tracking-tighter">Catálogo <span style={{ color: primaryColor }}>AR</span></h2>
        <div className="grid grid-cols-2 gap-5">
            {dynamicCategories.length > 0 ? dynamicCategories.map((card, idx) => (
                <div key={idx} onClick={() => navigate(`/list/${encodeURIComponent(card.type)}`)} className="aspect-[3/4.2] rounded-[2.8rem] overflow-hidden border border-white/5 bg-white/5 relative active:scale-95 transition-all shadow-2xl group">
                    <img src={card.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={card.label} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-7 left-6 right-6 z-10">
                        <h3 className="font-black text-white text-xs leading-tight uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                            {card.label}
                        </h3>
                    </div>
                    <div className="absolute top-5 right-5 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                        <ChevronRight size={16} />
                    </div>
                </div>
            )) : <div className="col-span-2 text-center py-24 text-gray-500 text-[10px] font-black uppercase border border-dashed border-white/10 rounded-[3rem] tracking-[0.3em]">Sincronizando Multiverso...</div>}
        </div>
      </div>

      <MandatoryLegalFootnote />
    </div>
  );
};
