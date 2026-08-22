import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { X, Box, Globe, Star, StarOff, Lock } from 'lucide-react';

const MIS_METAVERSOS_KEY = 'fanfest_mis_metaversos_v1';
const BRONCE_LIMIT = 3;

interface GlobalMetaverseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isBronce?: boolean;
  onNavigatePlans?: () => void;
}

export const GlobalMetaverseSelector: React.FC<GlobalMetaverseSelectorProps> = ({ 
  isOpen, onClose, isBronce = true, onNavigatePlans 
}) => {
  const [metaversos, setMetaversos] = useState<any[]>([]);
  const [activeMetaverso, setActiveMetaverso] = useState(() => {
    return localStorage.getItem('saylucy_higher_metaverse') || 'Festividades';
  });
  const [activeTab, setActiveTab] = useState<'todos' | 'mis'>('todos');
  const [showPaywall, setShowPaywall] = useState(false);
  
  const [misMetaversoIds, setMisMetaversoIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchMetaversos = async () => {
        const { data } = await supabase
          .from('metaversos')
          .select('id, nombre, title, slogan, logo_url, hero_url, primary_color, secondary_color, base_color')
          .eq('is_active', true)
          .order('orden', { ascending: true });
        if (data) setMetaversos(data);
      };
      fetchMetaversos();
      setActiveMetaverso(localStorage.getItem('saylucy_higher_metaverse') || 'Festividades');
      
      try {
        const stored = JSON.parse(localStorage.getItem(MIS_METAVERSOS_KEY) || '[]');
        setMisMetaversoIds(stored);
      } catch {
        setMisMetaversoIds([]);
      }
    }
  }, [isOpen]);

  const limit = isBronce ? BRONCE_LIMIT : Infinity;
  const activeCount = misMetaversoIds.length;

  const handleToggleMisMetaverso = (metaversoId: string) => {
    const idStr = String(metaversoId);
    setMisMetaversoIds(prev => {
      const isActive = prev.includes(idStr);
      if (!isActive && activeCount >= limit) {
        setShowPaywall(true);
        return prev;
      }
      
      let next;
      if (isActive) {
        next = prev.filter(x => x !== idStr);
      } else {
        next = [...prev, idStr];
      }
      localStorage.setItem(MIS_METAVERSOS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSelect = (nombre: string) => {
    setActiveMetaverso(nombre);
    localStorage.setItem('saylucy_higher_metaverse', nombre);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('active_metaverse_changed'));
    onClose();
  };

  const misMetaversosFiltered = metaversos.filter(m => misMetaversoIds.includes(String(m.id)));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-slate-50 flex flex-col p-6 overflow-y-auto"
        >
          {/* Paywall overlay */}
          <AnimatePresence>
            {showPaywall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-sm"
              >
                <div className="bg-white rounded-[2rem] p-8 max-w-xs w-full text-center shadow-2xl space-y-5">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <Lock size={32} className="text-amber-600" />
                  </div>
                  <h3 className="text-slate-900 font-black text-lg uppercase tracking-tight">Límite de Plan Bronce</h3>
                  <p className="text-slate-700 text-sm">
                    Tu plan <strong>Bronce</strong> permite hasta <strong>{BRONCE_LIMIT} Mundos</strong> en tu selección personal.
                  </p>
                  <p className="text-slate-500 text-xs">Quita uno para agregar otro, o mejora a <strong>Silver / Gold</strong> para mundos ilimitados.</p>
                  <div className="flex flex-col gap-2 pt-2">
                    {onNavigatePlans && (
                      <button
                        onClick={() => { setShowPaywall(false); onNavigatePlans(); }}
                        className="w-full py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] text-white shadow-lg bg-emerald-500 hover:bg-emerald-600"
                      >
                        Ver Planes
                      </button>
                    )}
                    <button
                      onClick={() => setShowPaywall(false)}
                      className="w-full py-3 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] text-slate-700 border border-slate-200"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button top-right */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-11 h-11 bg-slate-200/50 hover:bg-slate-300/50 border border-slate-300/50 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all text-slate-600"
          >
            <X size={22} />
          </button>

          {/* Header */}
          <div className="text-center mt-10 mb-6">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic drop-shadow-sm">
              Metaversos
            </h2>
          </div>

          {/* Tabs: TODOS (metaversos) | MIS MUNDOS (favorited metaversos) */}
          <div className="flex rounded-[1.5rem] bg-white border border-slate-200 p-1 mb-6 gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('todos')}
              className={`flex-1 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'todos' ? 'bg-slate-100 shadow-inner text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Globe size={12} className="inline mr-1" />
              Todos
            </button>
            <button
              onClick={() => setActiveTab('mis')}
              className={`flex-1 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'mis' ? 'bg-slate-100 shadow-inner text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Star size={12} className="inline mr-1" />
              Mis Mundos
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow bg-emerald-500">
                  {activeCount}
                </span>
              )}
              {isBronce && (
                <span className="ml-1 text-[8px] text-amber-600 font-bold">({activeCount}/{BRONCE_LIMIT})</span>
              )}
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {activeTab === 'todos' && (
              <div className="grid grid-cols-2 gap-4">
                {metaversos?.map((metaverso: any) => {
                  const isSelected = activeMetaverso === metaverso.nombre;
                  const isInMis = misMetaversoIds.includes(String(metaverso.id));
                  const pColor = metaverso.primary_color || '#10b981';
                  
                  return (
                    <button
                      key={metaverso.id}
                      onClick={() => handleSelect(metaverso.nombre)}
                      className={`aspect-[4/5] rounded-[2rem] p-4 flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-md ${
                        isSelected
                          ? 'border-2'
                          : 'bg-white border border-slate-200 hover:bg-slate-100/50'
                      }`}
                      style={{ 
                        borderColor: isSelected ? pColor : undefined,
                        backgroundColor: isSelected ? `${pColor}20` : undefined,
                        boxShadow: isSelected ? `0 0 20px ${pColor}40` : undefined
                      }}
                    >
                      {metaverso.hero_url && (
                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
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
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest text-center leading-tight">
                          {metaverso.nombre}
                        </span>
                        {metaverso.slogan && (
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center">
                            {metaverso.slogan}
                          </span>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: pColor, color: pColor }} />
                      )}

                      {/* Star toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleMisMetaverso(metaverso.id); }}
                        className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow z-20 ${isInMis ? 'bg-yellow-400 text-white' : 'bg-white/80 text-slate-400 border border-slate-200 hover:bg-white'}`}
                      >
                        {isInMis ? <Star size={14} fill="white" /> : <StarOff size={14} />}
                      </button>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'mis' && (
              <>
                {isBronce && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[1.2rem] px-4 py-3 mb-4">
                    <Lock size={14} className="text-amber-600 shrink-0" />
                    <p className="text-amber-700 text-[10px] font-bold uppercase tracking-wide">
                      Plan Bronce: {activeCount} de {BRONCE_LIMIT} mundos favoritos
                    </p>
                  </div>
                )}

                {misMetaversosFiltered.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {misMetaversosFiltered.map((metaverso: any) => {
                      const isSelected = activeMetaverso === metaverso.nombre;
                      const pColor = metaverso.primary_color || '#10b981';
                      
                      return (
                        <div key={metaverso.id} className="relative">
                          <button
                            onClick={() => handleSelect(metaverso.nombre)}
                            className={`w-full aspect-[4/5] rounded-[2rem] p-4 flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-md ${
                              isSelected
                                ? 'border-2'
                                : 'bg-white border border-slate-200 hover:bg-slate-100/50'
                            }`}
                            style={{ 
                              borderColor: isSelected ? pColor : undefined,
                              backgroundColor: isSelected ? `${pColor}20` : undefined,
                              boxShadow: isSelected ? `0 0 20px ${pColor}40` : undefined
                            }}
                          >
                            {metaverso.hero_url && (
                              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
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
                              <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest text-center leading-tight">
                                {metaverso.nombre}
                              </span>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: pColor, color: pColor }} />
                            )}

                            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow z-20">
                              <Star size={14} fill="white" className="text-white" />
                            </div>
                          </button>
                          
                          {/* Remove from Mis Mundos */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleMisMetaverso(metaverso.id); }}
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg z-20 active:scale-90 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] p-10 text-center space-y-3 mt-4">
                    <Star size={36} className="text-slate-300 mx-auto" />
                    <p className="text-slate-700 text-[11px] uppercase font-black tracking-widest">Sin mundos favoritos</p>
                    <p className="text-slate-500 text-[10px]">
                      Toca la ⭐ en un Metaverso de la pestaña "Todos" para guardarlo aquí.
                      {isBronce ? ` (máx. ${BRONCE_LIMIT})` : ' (ilimitados)'}
                    </p>
                    <button
                      onClick={() => setActiveTab('todos')}
                      className="mt-3 px-6 py-3 rounded-[1.5rem] text-white text-[10px] font-black uppercase tracking-widest shadow bg-slate-800 hover:bg-slate-900"
                    >
                      Ir a Todos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-10 pb-8">
            <button
              onClick={onClose}
              className="w-full py-5 bg-slate-800 hover:bg-slate-900 border border-slate-700 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
