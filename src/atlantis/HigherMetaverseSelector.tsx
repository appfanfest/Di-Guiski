import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Sparkles, Box } from 'lucide-react';

interface HigherMetaverseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HigherMetaverseSelector: React.FC<HigherMetaverseSelectorProps> = ({ isOpen, onClose }) => {
  const { metaversos, activeMetaverso, setActiveMetaverso } = useAtlantis() as any;
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col p-6 overflow-y-auto"
        >
          {/* Close button top-right */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all text-white"
          >
            <X size={22} />
          </button>

          {/* Header */}
          <div className="text-center mt-8 mb-10">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic drop-shadow-sm">
              Selecciona tu Metaverso
            </h2>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {metaversos?.map((metaverso: any) => {
                const isSelected = activeMetaverso === metaverso.nombre;
                const pColor = metaverso.primary_color || '#10b981';
                
                return (
                  <button
                    key={metaverso.id}
                    onClick={() => {
                      setActiveMetaverso(metaverso.nombre);
                      onClose();
                    }}
                    className={`aspect-[4/5] rounded-[2rem] p-4 flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-md ${
                      isSelected
                        ? 'border-2'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    style={{ 
                      borderColor: isSelected ? pColor : undefined,
                      backgroundColor: isSelected ? `${pColor}20` : undefined,
                      boxShadow: isSelected ? `0 0 20px ${pColor}40` : undefined
                    }}
                  >
                    {/* Background Hero (dimmed) */}
                    {metaverso.hero_url && (
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                         <img src={metaverso.hero_url} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    
                    {metaverso.logo_url ? (
                      <img src={metaverso.logo_url} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform relative z-10" alt={metaverso.nombre} />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: `${pColor}40` }}>
                        <Box size={32} color={pColor} />
                      </div>
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <span className="text-[12px] font-black text-white uppercase tracking-widest text-center leading-tight">
                        {metaverso.nombre}
                      </span>
                      {metaverso.slogan && (
                        <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest text-center">
                          {metaverso.slogan}
                        </span>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: pColor, color: pColor }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-10 pb-8">
            <button
              onClick={onClose}
              className="w-full py-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
