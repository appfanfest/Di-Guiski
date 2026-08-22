import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Camera, Smartphone, 
  Loader2, ExternalLink, Info, Search, ChevronLeft, Share2, Lock, Crown, Star,
  LayoutGrid, Send, User, Box, Filter
} from 'lucide-react';
import { Experience, ExperienceType, SocialNetwork, AccessLevel } from './types';
import { PostcardEditor } from './PostcardEditor';
import { MarcosPro } from './MarcosPro';
import { PhotoBooth } from './PhotoBooth';
import { ARHoraLoca } from './ar/ARHoraLoca';
import { ARFaceGlam } from './ar/ARFaceGlam';
import { ARFondosInmersivos } from './ar/ARFondosInmersivos';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useNiche } from './NicheContext';

export const MetaverseHub: React.FC = () => {
  const { currentNiche, nicheConfig } = useNiche();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExp, setActiveExp] = useState<Experience | null>(null);
  const [selectedType, setSelectedType] = useState<ExperienceType | null>(() => {
    const saved = sessionStorage.getItem('metaverse_selected_type');
    return saved ? (saved as ExperienceType) : null;
  });


  useEffect(() => {
    if (selectedType) {
      sessionStorage.setItem('metaverse_selected_type', selectedType);
    } else {
      sessionStorage.removeItem('metaverse_selected_type');
    }
  }, [selectedType]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExperiences();
  }, [currentNiche]);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .or(`niche.eq.${currentNiche},niche.eq.global`)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mapped = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as ExperienceType,
          socialNetwork: item.social_network as SocialNetwork,
          activationLink: item.activation_link,
          demoLink: item.demo_link,
          imageUrl: item.image_url,
          category: item.category,
          isMultiUser: item.is_multi_user,
          promotor_id: item.niche,
          level: (item.level as AccessLevel) || AccessLevel.FREE,
          ar_config: item.ar_config || undefined,
        }));
        setExperiences(mapped);
      }
    } catch (err) {
      console.error('Error fetching experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExps = experiences.filter(exp => {
    const matchesType = selectedType ? exp.type === selectedType : true;
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleActivate = (exp: Experience) => {
    // Native FanFest experiences → open AR component in-app
    // All other networks (Snapchat, TikTok, Instagram) → open external link
    if (exp.socialNetwork === SocialNetwork.FANFEST) {
      setActiveExp(exp);
    } else {
      window.open(exp.activationLink, '_blank');
    }
  };

  const primaryColor = nicheConfig?.primary_color || '#10b981';

  // VISTA INTERNA (Editor, Booth o AR)
  if (activeExp) {
    if (activeExp.type === ExperienceType.POSTALES_WASSAP)    return <PostcardEditor experience={activeExp} onBack={() => setActiveExp(null)} />;
    if (activeExp.type === ExperienceType.MARCOS_PRO)         return <MarcosPro experience={activeExp} onBack={() => setActiveExp(null)} />;
    if (activeExp.type === ExperienceType.PHOTO_BOOTH)        return <PhotoBooth experience={activeExp} onBack={() => setActiveExp(null)} />;
    if (activeExp.type === ExperienceType.HORA_LOCA_HATS)     return <ARHoraLoca experience={activeExp} onBack={() => setActiveExp(null)} />;
    if (activeExp.type === ExperienceType.FACE_GLAM)          return <ARFaceGlam experience={activeExp} onBack={() => setActiveExp(null)} />;
    if (activeExp.type === ExperienceType.FONDOS_INMERSIVOS)  return <ARFondosInmersivos experience={activeExp} onBack={() => setActiveExp(null)} />;
  }

  // VISTA 1: CATÁLOGO DE CATEGORÍAS (Lobby de Herramientas)
  if (!selectedType) {
    return (
      <div className="p-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {Object.values(ExperienceType).map((type) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(type)}
              className="aspect-square bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-6 relative overflow-hidden group hover:bg-white/10 transition-all"
            >
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <ChevronLeft size={16} className="rotate-180" style={{ color: primaryColor }} />
                </div>
                
                <div className="mb-4 text-white/30 group-hover:scale-110 transition-transform duration-500" style={{ groupHover: { color: primaryColor } } as any}>
                    {type === ExperienceType.HORA_LOCA_HATS && <User size={44} strokeWidth={1.5} />}
                    {type === ExperienceType.FACE_GLAM && <Sparkles size={44} strokeWidth={1.5} />}
                    {type === ExperienceType.PHOTO_BOOTH && <LayoutGrid size={44} strokeWidth={1.5} />}
                    {type === ExperienceType.POSTALES_WASSAP && <Send size={44} strokeWidth={1.5} />}
                    {type === ExperienceType.MARCOS_PRO && <Camera size={44} strokeWidth={1.5} />}
                    {type === ExperienceType.FONDOS_INMERSIVOS && <Box size={44} strokeWidth={1.5} />}
                </div>

                <span className="text-[9px] font-black uppercase tracking-widest text-center px-2 leading-tight text-white/60 group-hover:text-white">
                    {type}
                </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // VISTA 2: LISTADO DE EXPERIENCIAS (Por categoría)
  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-6 space-y-6">
        {/* Barra de Título y Botón Volver */}
        <div className="flex items-center justify-between">
           <button 
              onClick={() => setSelectedType(null)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
           >
              <ChevronLeft size={16} /> Volver a categorías
           </button>
           <span style={{ color: primaryColor }} className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {filteredExps.length} Experiencias
           </span>
        </div>

        {/* Buscador Mini */}
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
                type="text"
                placeholder="Buscar experiencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-[10px] font-bold outline-none"
            />
        </div>

        {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin" style={{ color: primaryColor }} size={32} />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {filteredExps.map((exp) => (
                    <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-3"
                    >
                        <div className="aspect-[3/4] bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 relative group">
                            <img src={exp.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={exp.title} />
                            
                            <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                                <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest text-white/60">
                                    {exp.socialNetwork}
                                </div>
                                <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${exp.level === AccessLevel.FREE ? 'bg-white text-slate-950' : 'bg-yellow-500 text-slate-950'}`}>
                                    {exp.level}
                                </div>
                            </div>

                            {exp.level !== AccessLevel.FREE && (
                                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <Lock size={20} className="text-white/20" />
                                </div>
                            )}
                        </div>

                        <div className="px-1">
                            <h3 className="text-[9px] font-black uppercase tracking-tight text-white/90 truncate mb-3">{exp.title}</h3>
                            
                            <div className="space-y-2">
                                <button 
                                    onClick={() => handleActivate(exp)}
                                    className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest group-active:scale-95 transition-all text-slate-950"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Camera size={14} /> {exp.type === ExperienceType.PHOTO_BOOTH ? 'BOOTH' : 'ACTIVAR'}
                                </button>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => window.open(exp.demoLink || '#', '_blank')}
                                        className="h-10 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40"
                                    >
                                        DEMO
                                    </button>
                                    <button className="h-10 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 flex items-center justify-center">
                                        <Share2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
