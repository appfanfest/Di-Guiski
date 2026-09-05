import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Sparkles, Globe, ChevronRight, QrCode, Users, ExternalLink } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

interface SayLucyHomeProps {
  onOpenMetaverse: () => void;
  onOpenPlans: () => void;
  onOpenQR: () => void;
  onOpenSolicitarMetaverso?: () => void;
  org?: any;
  isGuest?: boolean;
  profile?: any;
  onOpenOnboarding?: () => void;
  onOpenGlobalSelector?: () => void;
  activeMetaverseData?: any;
  onOpenExperienceList?: (type: string) => void;
}

// Contenido del hero por idioma
const HERO_CONTENT: Record<string, { headline: string; subline: string; cta: string; badge: string }> = {
  es: {
    headline: 'Di Lucy!',
    subline: 'Inmortaliza cada momento con magia AR y comparte la emoción en tiempo real.',
    cta: '¡Comenzar Ahora!',
    badge: 'El Metaverso de los Momentos'
  },
  en: {
    headline: 'Di-Guiski!',
    subline: 'Immortalize every moment with AR magic and share the excitement in real time.',
    cta: 'Start Now!',
    badge: 'The Metaverse of Moments'
  },
  fr: {
    headline: 'Dis Lucy!',
    subline: 'Immortalisez chaque moment avec la magie AR et partagez l\'émotion en temps réel.',
    cta: 'Commencer Maintenant!',
    badge: 'Le Métaverse des Moments'
  }
};

// Hero images by language (can be overridden from org DB)
const HERO_IMAGES: Record<string, string> = {
  es: 'https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg',
  en: 'https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg',
  fr: 'https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg',
};

export const SayLucyHome: React.FC<SayLucyHomeProps> = ({
  onOpenMetaverse,
  onOpenPlans,
  onOpenQR,
  onOpenSolicitarMetaverso,
  org,
  isGuest,
  profile,
  onOpenOnboarding,
  onOpenGlobalSelector,
  activeMetaverseData,
  onOpenExperienceList,
}) => {
  const { lang, t } = useLanguage();
  const content = HERO_CONTENT[lang] || HERO_CONTENT['es'];

  // Experiencias en tendencia
  const [trendingExps, setTrendingExps] = useState<any[]>([]);
  const [currentTestimonio, setCurrentTestimonio] = useState(0);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchTrending() {
      try {
        let query = supabase
          .from('experiences')
          .select('*')
          .eq('es_tendencia', true);

        if (activeMetaverseData?.id) {
          const { data: niches, error: nichesErr } = await supabase
            .from('niches')
            .select('id, name')
            .eq('metaverso_id', activeMetaverseData.id);

          if (nichesErr) console.error('Error fetching niches:', nichesErr);

          if (niches && niches.length > 0) {
            const nicheKeys: string[] = [];
            niches.forEach(n => {
              if (n.id) nicheKeys.push(n.id);
              if (n.name) nicheKeys.push(n.name);
            });
            if (nicheKeys.length > 0) {
              query = query.in('niche', nicheKeys);
            } else {
              query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // No results
            }
          } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // No results
          }
        }

        const { data, error } = await query
          .order('impresiones', { ascending: false })
          .limit(10);
        if (error) throw error;
        if (data && isMounted) setTrendingExps(data);
      } catch (err) {
        console.error('Error fetching trending experiences:', err);
      }
    }
    fetchTrending();
    return () => { isMounted = false; };
  }, [activeMetaverseData?.id]);


  useEffect(() => {
    if (trendingExps.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTestimonio(prev => (prev + 1) % trendingExps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trendingExps]);

  // Hero image: prefer selected metaverse, then org-configured image by language, fallback to generic
  const heroImage =
    activeMetaverseData?.hero_url ||
    (lang === 'es' && org?.hero_image_url_es) ||
    (lang === 'en' && org?.hero_image_url_en) ||
    (lang === 'fr' && org?.hero_image_url_fr) ||
    org?.hero_image_url ||
    HERO_IMAGES[lang] ||
    HERO_IMAGES['es'];

  const themeColor = activeMetaverseData?.primary_color || '#10b981';
  const secondaryColor = activeMetaverseData?.secondary_color || themeColor;

  return (
    <div className="space-y-0 pb-10 animate-fade-in">

      {/* ── HERO BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-2 mt-2 rounded-[2.8rem] overflow-hidden shadow-2xl"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Imagen de fondo */}
        <img
          src={heroImage}
          alt="Di-Guiski! Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Texto central-inferior */}
        <div className="absolute inset-x-0 bottom-0 p-8 space-y-5">
          {/* CTA principal */}
          <div className="flex flex-col gap-2">
            {onOpenOnboarding && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenOnboarding}
                className="w-full py-4 px-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-white/30 flex items-center justify-center shadow-xl transition-all"
              >
                {t.home?.howItWorks ?? (lang === 'en' ? 'HOW IT WORKS?' : lang === 'fr' ? 'COMMENT ÇA MARCHE ?' : '¿CÓMO FUNCIONA?')}
              </motion.button>
            )}
            {deferredPrompt && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallClick}
                className="w-full py-4 px-6 bg-emerald-500/80 backdrop-blur-md hover:bg-emerald-600/80 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-emerald-400 flex items-center justify-center shadow-xl transition-all"
              >
                {lang === 'en' ? 'Install App' : lang === 'fr' ? 'Installer l\'App' : 'Instalar App'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>


      {/* ── EN TENDENCIA GLOBAL (Horizontal Scroll) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <div className="mb-4 flex flex-col items-center justify-center text-center">
          <h2 className="text-[16px] font-black uppercase italic tracking-[0.05em] text-[#1a2b4b]">
            {t.trending ?? (lang === 'en' ? 'WORLD TRENDING' : lang === 'fr' ? 'TENDANCE MONDIALE' : 'EN TENDENCIA GLOBAL')}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8b9a] mt-1">
            {t.trendingSubtitle ?? (lang === 'en' ? 'Today We Recommend' : lang === 'fr' ? "Aujourd'hui Nous Vous Recommandons" : 'Hoy te Recomendamos')}
          </p>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide px-4">
          {trendingExps.map((exp: any, index: number) => (
            <div 
              key={exp.id || index}
              className="relative shrink-0 w-[65vw] max-w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden snap-center shadow-xl group cursor-pointer"
              onClick={() => {
                if (onOpenExperienceList && exp.type) onOpenExperienceList(exp.type);
              }}
            >
              {exp.image_url ? (
                <img 
                  src={exp.image_url} 
                  alt={exp.type} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center">
                  <Camera size={40} className="text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10"></div>
              
              <div className="absolute bottom-6 left-5 right-5">
                <div className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded w-max mb-2 uppercase tracking-wider line-clamp-1">
                  {exp.niche || 'EXPERIENCIA'}
                </div>
                <h3 className="text-white text-2xl font-black italic tracking-tight mb-2 drop-shadow-md line-clamp-2">
                  {exp.type || 'Sin título'}
                </h3>
                <p className="text-white/80 text-[10px] line-clamp-2 mb-3 leading-snug">
                  "{exp.niche}"
                </p>
                <div className="flex gap-1 text-yellow-400 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {exp.impresiones > 0 && (
                  <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded w-max uppercase tracking-wider">
                    {Number(exp.impresiones).toLocaleString()} impresiones
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>


      {/* ── PLANES CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mx-4 mt-6 mb-4 rounded-[2rem] overflow-hidden relative shadow-xl"
        style={{
          backgroundColor: themeColor // Uses activeMetaverseData color
        }}
      >
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <div className="p-8 flex flex-col items-center justify-center text-center relative z-10 space-y-4">
          <div>
            <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.3em] mb-2 flex items-center justify-center gap-1.5">
              <Sparkles size={12} />
              {lang === 'es' ? 'Planes Premium' : lang === 'en' ? 'Premium Plans' : 'Plans Premium'}
            </p>
            <p className="text-white font-black text-[22px] leading-tight tracking-tight drop-shadow-md">
              {lang === 'es' ? 'Desbloquea' : lang === 'en' ? 'Unlock the' : 'Débloquez'}<br/>
              {lang === 'es' ? 'Todo el Potencial' : lang === 'en' ? 'Full Potential' : 'Tout le Potentiel'}
            </p>
          </div>
          <button
            onClick={onOpenPlans}
            className="w-full max-w-[220px] py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 border border-white/30 text-white"
            style={{ backgroundColor: secondaryColor }}
          >
            <Globe size={18} />
            {lang === 'es' ? 'Ver Planes' : lang === 'en' ? 'View Plans' : 'Voir Plans'}
          </button>
        </div>
        
        {/* Decorative geometric shapes */}
        <div className="absolute -right-8 -top-8 w-40 h-40 border-[2px] border-white/20 rounded-full" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
      </motion.div>

      {/* ── SOLICITUD METAVERSO CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-4 mt-6 rounded-[2rem] overflow-hidden relative shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
        style={{ aspectRatio: '1/1' }}
        onClick={onOpenSolicitarMetaverso}
      >
        <img
          src={org?.hero_cta_privados || 'https://via.placeholder.com/800x400?text=Crea+Tu+Metaverso'}
          alt="Crea tu Metaverso Privado"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <h3 className="text-white text-lg font-black uppercase italic leading-none drop-shadow-md">
              {lang === 'es' ? 'Crea Tu Metaverso' : lang === 'en' ? 'Create Your Metaverse' : 'Créez Votre Métavers'}
            </h3>
            <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mt-1">
              {lang === 'es' ? 'Para Negocios y Eventos' : lang === 'en' ? 'For Businesses & Events' : 'Pour Entreprises et Événements'}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
            <ChevronRight size={20} />
          </div>
        </div>
      </motion.div>

    </div>
  );
};
