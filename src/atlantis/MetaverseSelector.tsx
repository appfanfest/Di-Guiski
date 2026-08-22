import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Globe, Sparkles } from 'lucide-react';

interface MetaverseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetaverseSelector: React.FC<MetaverseSelectorProps> = ({ isOpen, onClose }) => {
  const { allNiches, unlockedNiches, currentNiche, setCurrentNiche, nicheConfig, metaversos, activeMetaverso } = useAtlantis() as any;
  const { t } = useLanguage();

  const primaryColor = nicheConfig?.primary_color || '#10b981';

  const activeMetaversoId = metaversos?.find((m: any) => m.nombre === activeMetaverso)?.id;
  const generalNiches = [...allNiches].filter((n: any) => !n.is_commercial && (!activeMetaversoId || n.metaverso_id === activeMetaversoId));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex flex-col p-6 overflow-y-auto"
        >
          {/* Close button top-right */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-11 h-11 bg-white/80 hover:bg-white border border-emerald-200 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <X size={22} className="text-emerald-800" />
          </button>

          {/* Header */}
          <div className="text-center mt-8 mb-10">
            <h2 className="text-4xl font-black text-emerald-900 uppercase tracking-tighter italic drop-shadow-sm">
              {t.metaverse?.title ?? "MULTIVERSOS"}
            </h2>
          </div>

          <div className="space-y-6 flex-1">
            {/* Mis Multiversos (Commercial) */}
            <div className="flex items-center gap-3 border-l-4 pl-4 py-1" style={{ borderColor: '#eab308' }}>
              <h3 className="text-emerald-900 text-[12px] font-black uppercase tracking-widest">
                {t.metaverse?.myMetaverses ?? "MIS MULTIVERSOS"}
              </h3>
            </div>

            {unlockedNiches.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {unlockedNiches.map((access: any) => {
                  const isSelected = String(currentNiche) === String(access.niche_id);
                  return (
                    <button
                      key={access.id}
                      onClick={() => {
                        setCurrentNiche(access.niche_id);
                        onClose();
                      }}
                      className={`aspect-square rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group shadow-md ${
                        isSelected
                          ? 'bg-white border-2 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                          : 'bg-white/70 border border-emerald-200 hover:bg-white'
                      }`}
                      style={{ borderColor: isSelected ? '#eab308' : undefined }}
                    >
                      {access.niche_data?.logo_url ? (
                        <img src={access.niche_data.logo_url} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform" alt={access.niche_data.name} />
                      ) : (
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Sparkles size={32} className="text-emerald-500" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest text-center leading-tight">
                        {access.niche_data?.name || 'Comercio'}
                      </span>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse bg-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/60 border border-dashed border-emerald-200 rounded-[2rem] p-6 text-center">
                <span className="text-emerald-700 text-[10px] uppercase font-bold">{t.metaverse?.noCommercial ?? "Aún no tienes multiversos comerciales"}</span>
              </div>
            )}

            {/* General Metaverses */}
            <div className="flex items-center gap-3 border-l-4 pl-4 py-1 mt-10" style={{ borderColor: primaryColor }}>
              <h3 className="text-emerald-900 text-[12px] font-black uppercase tracking-widest">
                {t.metaverse?.general ?? "GENERAL"}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {generalNiches.map((niche: any) => {
                const isSelected = String(currentNiche) === String(niche.id);
                return (
                  <button
                    key={niche.id}
                    onClick={() => {
                      setCurrentNiche(niche.id);
                      onClose();
                    }}
                    className={`aspect-square rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group shadow-md ${
                      isSelected
                        ? 'bg-white border-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-white/70 border border-emerald-200 hover:bg-white'
                    }`}
                    style={{ borderColor: isSelected ? primaryColor : undefined }}
                  >
                    {niche.logo_url ? (
                      <img src={niche.logo_url} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform" alt={niche.name} />
                    ) : (
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Globe size={32} className="text-emerald-500" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest text-center leading-tight">
                      {niche.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
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
              className="w-full py-5 bg-emerald-700 hover:bg-emerald-800 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 shadow-lg"
            >
              {t.metaverse?.close ?? "Cerrar"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
