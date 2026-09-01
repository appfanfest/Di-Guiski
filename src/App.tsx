import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { OnboardingSlides } from './components/OnboardingSlides';
import { APP_CONFIG, FLAG_FALLBACKS, ORG_FALLBACK } from './lib/constants';
import { ProfileSettings } from './components/ProfileSettings';
import { FAQ } from './components/FAQ';
import PlansPage from './atlantis/PlansPage';
// import { MetaverseView } from './components/MetaverseView'; // Lazy loaded
import { AboutUs } from './components/AboutUs';
import { Contact } from './components/Contact';
import { Terms } from './components/Terms';
import { TutorialView } from './components/TutorialView';
// import CiclonMundialista from './components/CiclonMundialista'; // Lazy loaded
import { GestorMiembros } from './components/GestorMiembros';
import { SayLucyHome } from './components/SayLucyHome';
import { GlobalMetaverseSelector } from './components/GlobalMetaverseSelector';
// Bingo components lazy loaded below
import { 
  Trophy, 
  Menu as MenuIcon, 
  User as UserIcon, 
  QrCode, 
  Home as HomeIcon, 
  ClipboardList, 
  Settings, 
  HelpCircle,
  X,
  LogOut,
  ChevronRight,
  Filter,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  LayoutGrid,
  Search,
  Globe,
  PlayCircle,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info as InfoIcon,
  Camera,
  Zap,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


const MetaverseView = lazy(() => import('./components/MetaverseView').then(m => ({ default: m.MetaverseView })));


const AdminView = lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));
const QRScanner = lazy(() => import('./atlantis/QRScanner').then(m => ({ default: m.QRScanner })));
const SolicitarMetaverso = lazy(() => import('./components/SolicitarMetaverso').then(m => ({ default: m.SolicitarMetaverso })));

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


function App() {
  const { t, lang } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userCountry, setUserCountry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('activate') || params.get('niche')) return 'metaverse';
    return sessionStorage.getItem('fanfest_active_view') || 'home';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestOnboarding, setShowGuestOnboarding] = useState(false);
  const [showUserOnboarding, setShowUserOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [org, setOrg] = useState<any>(null);
  const [filter, setFilter] = useState({ date: '', group: '', sede: '', team: '' });
  const [activeFilterPanel, setActiveFilterPanel] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [showCiclonDemo, setShowCiclonDemo] = useState(false);
  const [showBingoDemo, setShowBingoDemo] = useState(false);
  const [participationFlowType, setParticipationFlowType] = useState<any>('hub');
  const [participationKey, setParticipationKey] = useState(0);
  const [tieBreakerData, setTieBreakerData] = useState<{ participations: any[], title: string } | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isScanningMetaverse, setIsScanningMetaverse] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showGlobalMetaverseSelector, setShowGlobalMetaverseSelector] = useState(false);
  const [activeMetaverseData, setActiveMetaverseData] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const initApp = async () => {
      // Safety Timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Initialization timeout reached. Forcing load.');
          setLoading(false);
        }
      }, APP_CONFIG.INIT_TIMEOUT);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Parallel fetching for performance
        await Promise.all([
          fetchOrgData(),
          fetchMatches(),
          session ? fetchProfile(session.user.id) : Promise.resolve()
        ]);
      } catch (err) {
        console.error('Critical initialization error:', err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        if (!localStorage.getItem('saylucy_guest_onboarding_seen')) {
          setShowGuestOnboarding(true);
        }
      }
    };

    initApp();

    const fetchActiveMetaverse = async () => {
      const isNewUser = !localStorage.getItem('saylucy_guest_onboarding_seen');
      const activeName = localStorage.getItem('saylucy_higher_metaverse');
      try {
        let query = supabase.from('metaversos').select('*').eq('is_active', true);
        if (isNewUser || !activeName) {
          query = query.order('orden', { ascending: true });
        } else {
          query = query.eq('nombre', activeName);
        }
        
        let { data } = await query.limit(1).single();
        
        // Fallback en caso de que el metaverso guardado ya no exista o no esté activo
        if (!data && !isNewUser && activeName) {
          const fallbackQuery = await supabase.from('metaversos').select('*').eq('is_active', true).order('orden', { ascending: true }).limit(1).single();
          data = fallbackQuery.data;
        }

        if (data) {
          setActiveMetaverseData(data);
          if (isNewUser || !activeName || data.nombre !== activeName) {
            localStorage.setItem('saylucy_higher_metaverse', data.nombre);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActiveMetaverse();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saylucy_higher_metaverse') {
        fetchActiveMetaverse();
      }
    };
    const handleMetaverseChange = () => {
      fetchActiveMetaverse();
      setActiveView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatch inside our app
    window.addEventListener('active_metaverse_changed', handleMetaverseChange);
    // Listener for login requests from inside Atlantis/PlansPage
    const handleRequestLogin = () => setActiveView('login');
    window.addEventListener('request_login', handleRequestLogin);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        setIsMenuOpen(false);
        // Only jump to home if user was on the login screen
        setActiveView(prev => prev === 'login' ? 'home' : prev);
      } else {
        setProfile(null);
        setUserCountry(null);
        setIsGuest(false);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('active_metaverse_changed', handleMetaverseChange);
      window.removeEventListener('request_login', handleRequestLogin);
    };
  }, []);

  useEffect(() => {
    if (activeMetaverseData) {
      const { 
        primary_color, 
        secondary_color, 
        base_color, 
        metaverso_font1, 
        metaverso_font2 
      } = activeMetaverseData;

      const root = document.documentElement;

      if (primary_color) root.style.setProperty('--metaverse-primary', primary_color);
      if (secondary_color) root.style.setProperty('--metaverse-secondary', secondary_color);
      if (base_color) root.style.setProperty('--metaverse-base', base_color);

      const fontsToLoad = [];
      if (metaverso_font1) fontsToLoad.push(metaverso_font1);
      if (metaverso_font2 && metaverso_font2 !== metaverso_font1) fontsToLoad.push(metaverso_font2);

      if (fontsToLoad.length > 0) {
        const fontQuery = fontsToLoad.map((f: string) => `family=${f.replace(/ /g, '+')}:wght@400;600;700;800;900`).join('&');
        const linkHref = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
        
        let link = document.getElementById('metaverse-fonts') as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.id = 'metaverse-fonts';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        if (link.href !== linkHref) {
          link.href = linkHref;
        }

        if (metaverso_font1) {
          root.style.setProperty('--metaverse-font-title', `'${metaverso_font1}', "Barlow Condensed", sans-serif`);
        }
        if (metaverso_font2) {
          root.style.setProperty('--metaverse-font-body', `'${metaverso_font2}', "Inter", ui-sans-serif, system-ui, sans-serif`);
        }
      }
    }
  }, [activeMetaverseData]);

  useEffect(() => {
    sessionStorage.setItem('fanfest_active_view', activeView);
    window.scrollTo(0, 0);
  }, [activeView]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // ── Plan expiration check ──────────────────────────────────────────────
      // If the user has a paid plan but its expiration date has passed,
      // automatically downgrade them to BRONZE in the database and locally.
      if (data?.fecha_expiracion_plan && data?.level && data.level !== 'BRONZE') {
        const expiresAt = new Date(data.fecha_expiracion_plan);
        if (expiresAt < new Date()) {
          await supabase
            .from('perfiles_usuarios')
            .update({ level: 'BRONZE', fecha_expiracion_plan: null })
            .eq('id', userId);
          data.level = 'BRONZE';
          data.fecha_expiracion_plan = null;
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      setProfile(data);
      
      if (data?.pais_residencia) {
        fetchCountryData(data.pais_residencia);
      }

      if (!data?.perfil_completado) {
        const seenUserOnboarding = localStorage.getItem(`saylucy_user_onboarding_seen_${userId}`);
        if (!seenUserOnboarding) {
           setShowUserOnboarding(true);
        } else {
           setShowOnboarding(true);
        }
      }
    } catch (err) {
      console.error('Error profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCountryData(countryName: string) {
    const { data: countryData } = await supabase
      .from('paises_operativos')
      .select('*')
      .eq('nombre', countryName)
      .single();
    if (countryData) setUserCountry(countryData);
  }

  async function fetchMatches() {
    try {
      const { data } = await supabase
        .from('partidos')
        .select(`
          *,
          pais1:pais_id1(*),
          pais2:pais_id2(*),
          sede:sede_id(*),
          grupos:id_grupo(*)
        `)
        .order('partido_nro');
      if (data) setMatches(data);
    } catch (err) {
      console.error('Matches error:', err);
    }
  }

  async function fetchOrgData() {
    try {
      const { data } = await supabase.from('organizacion').select('*').limit(1).single();
      if (data) setOrg(data);
    } catch (err) {
      console.error('Org data error:', err);
    }
  }

  const handleGuestEntry = (countryName: string) => {
    setIsGuest(true);
    setProfile({
      nombre: 'Invitado ¡Di Guiski!',
      pais_residencia: countryName,
      rol: 'usuario'
    });
    
    // Immediate local flag update for UX
    const localFlag = FLAG_FALLBACKS[countryName];
    if (localFlag) {
      setUserCountry({ nombre: countryName, bandera_url: localFlag, bandera_pais: localFlag });
    }
    
    fetchCountryData(countryName);
    
    const seenGuestOnboarding = localStorage.getItem('saylucy_guest_onboarding_seen');
    if (!seenGuestOnboarding) {
      setShowGuestOnboarding(true);
    } else {
      setActiveView('metaverse');
    }
  };

  const completeOnboarding = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setShowOnboarding(false);
    if (updatedProfile?.pais_residencia) {
       fetchProfile(session.user.id);
    }
  };

  const forceShowOnboarding = () => {
    if (isGuest || !session) {
      setShowGuestOnboarding(true);
    } else {
      setShowOnboarding(true);
    }
  };

  // 1. Cálculos de Filtros (Memoizados para evitar basura en cada render)
  const getCountryName = (p: any) => {
    if (!p) return undefined;
    const nameKey = lang === 'es' ? 'name' : `name_${lang}`;
    return p[nameKey] || p.name || p.nombre;
  };

  const filteredMatches = useMemo(() => matches.filter(m => {
    const d = !filter.date || m.fecha === filter.date;
    const g = !filter.group || m.grupos?.letra_grupo === filter.group;
    const s = !filter.sede || m.sede?.nombre === filter.sede;
    const t = !filter.team || getCountryName(m.pais1) === filter.team || getCountryName(m.pais2) === filter.team;
    return d && g && s && t;
  }), [matches, filter, lang]);

  const uniqueDates = useMemo(() => Array.from(new Set(matches.map(m => m.fecha))).sort(), [matches]);
  const uniqueGroups = useMemo(() => Array.from(new Set(matches.map(m => m.grupos?.letra_grupo))).filter(Boolean).sort(), [matches]);
  const uniqueSedes = useMemo(() => Array.from(new Set(matches.map(m => m.sede?.nombre))).filter(Boolean).sort(), [matches]);

  const uniqueTeams = useMemo(() => Array.from(new Set([
    ...matches.map(m => getCountryName(m.pais1)),
    ...matches.map(m => getCountryName(m.pais2))
  ])).filter(Boolean).sort(), [matches, lang]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <Settings size={48} className="text-fifa-blue mb-6" />
        <h1 className="text-2xl font-black mb-4 italic uppercase">Configuración</h1>
        <p className="text-sm opacity-70">Verifica variables de entorno.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-6">
        <img
          src="/di-guiski-logo.png"
          alt="¡Di Guiski!"
          className="w-36 h-36 object-contain animate-pulse drop-shadow-xl"
        />
        <div className="w-8 h-8 border-[3px] border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Smile, ¡Di Guiski!</p>
      </div>
    );
  }

  if (showGuestOnboarding) {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-900">
        <OnboardingSlides
          slides={org?.onboarding_visitante?.length > 0 ? org.onboarding_visitante : []}
          onFinish={() => {
            localStorage.setItem('saylucy_guest_onboarding_seen', '1');
            setShowGuestOnboarding(false);
          }}
        />
      </div>
    );
  }

  if (!session && activeView === 'login') {
    return (
      <Auth 
        onGuestEntry={handleGuestEntry} 
        logo={org?.app_logo || ORG_FALLBACK.logo_url || ORG_FALLBACK.hero_image_url} 
        onCancel={() => setActiveView('metaverse')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-slate-900">

      {/* Onboarding Usuario Nuevo — diapositivas + formulario de perfil */}
      {showUserOnboarding && (
        <OnboardingSlides
          slides={org?.onboarding_user?.length > 0 ? org.onboarding_user : []}
          onFinish={() => {
            if (session?.user?.id) {
               localStorage.setItem(`saylucy_user_onboarding_seen_${session.user.id}`, '1');
            }
            setShowUserOnboarding(false);
            if (!profile?.perfil_completado) {
              setShowOnboarding(true);
            }
          }}
        />
      )}

      {showOnboarding && session && !isGuest && (
        <div className="fixed inset-0 z-[2000] bg-white">
          <Onboarding userId={session.user.id} profile={profile} onComplete={completeOnboarding} org={org} />
        </div>
      )}

      {showTutorial && (
        <TutorialView onClose={() => setShowTutorial(false)} videoUrl={org?.video_youtube} org={org} />
      )}

      {/* CICLÓN para Sorteos Reales o Desempates */}
      {(showCiclonDemo || tieBreakerData) && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col">
          <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950">
              <div className="w-12 h-12 border-4 border-fifa-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.toasts?.iniciandoCiclon ?? 'Iniciando Ciclón...'}</p>
            </div>
          }>
            
          </Suspense>
        </div>
      )}

      {/* BINGO VAR para usuarios e invitados */}
      {showBingoDemo && (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          
        </div>
      )}

      {/* ESCÁNER GLOBAL DE METAVERSOS */}
      {isScanningMetaverse && (
        <Suspense fallback={null}>
          <QRScanner 
            onClose={() => setIsScanningMetaverse(false)}
            onScan={(result) => {
              setIsScanningMetaverse(false);
              // Lógica de detección de Nicho (similar a Layout.tsx)
              let detectedId = result;
              if (result.startsWith('http')) {
                try {
                  const url = new URL(result);
                  detectedId = url.searchParams.get('activate') || url.searchParams.get('niche') || result;
                } catch(e) {}
              }
              localStorage.setItem('atlantis_current_niche_v5', detectedId);
              setActiveView('metaverse');
              showToast(t.toasts?.multiversoActivado ?? "¡Multiverso activado con éxito!", "success");
            }}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {showExplainModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExplainModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.8rem] p-8 shadow-2xl border border-slate-100 text-center space-y-5"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider leading-relaxed text-left">
                  {t.gestor.explainText1} <strong className="text-emerald-600">{t.gestor.explainBrand}</strong> {t.gestor.explainText2}
                  <br /><br />
                  {t.gestor.explainText3}
                </p>
              </div>
              
              <button 
                onClick={() => setShowExplainModal(false)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-emerald-700/50 shadow-lg active:scale-95"
              >
                {t.gestor.understood}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlobalMetaverseSelector 
        isOpen={showGlobalMetaverseSelector} 
        onClose={() => setShowGlobalMetaverseSelector(false)} 
        isBronce={!profile || (profile.nivel_acceso !== 'GOLD' && profile.nivel_acceso !== 'SILVER')}
        onNavigatePlans={() => {
          setShowGlobalMetaverseSelector(false);
          navigateTo('/plans');
        }}
      />

      {/* MENU LATERAL */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1500]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white z-[1600] shadow-2xl p-8 flex flex-col">
              <div className="flex flex-col gap-6 mb-10">
                <div className="flex justify-between items-center">
                  <div className="bg-slate-50 p-3 rounded-3xl border border-slate-100 flex items-center gap-4 flex-1 mr-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
                      {profile?.foto_logo ? <img src={profile.foto_logo} alt="" className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-300" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase italic leading-none">{profile?.nombre || (isGuest ? 'Invitado FanFest' : '')}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const countryName = profile?.pais_residencia;
                          const flagUrl = userCountry?.bandera_pais || userCountry?.bandera_url || (countryName ? FLAG_FALLBACKS[countryName] : null);
                          return flagUrl ? <img src={flagUrl} alt="" className="w-3 h-2 object-cover rounded-[1px] shadow-sm" /> : null;
                        })()}
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{profile?.pais_residencia || ''}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0"><X size={20} /></button>
                </div>
              </div>
              
              {/* Selector de idioma en el menú */}
              <div className="pb-4 border-b border-slate-100">
                <LanguageSwitcher />
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {[
                  { id: 'home', label: t.nav?.home ?? 'Inicio', icon: HomeIcon },
                  { id: 'metaverse', label: lang === 'es' ? '¡Sonríe, Di Guiski!' : (lang === 'fr' ? 'Souriez, Di Guiski!' : 'Smile, Di Guiski!'), icon: Camera },
                  { id: 'metaverse_print', label: lang === 'es' ? 'IMPRESOS' : (lang === 'fr' ? 'IMPRIMÉS' : 'PRINTED'), icon: Printer },
                  { id: 'plans', label: t.menu.fanfestPlans, icon: Globe, isMetaPlans: true },
                  { id: 'profile', label: t.menu.myProfile, icon: UserIcon },
                  { id: 'solicitar_metaverso', label: lang === 'es' ? 'Solicita tu Metaverso' : (lang === 'fr' ? 'Demandez votre Metaverse' : 'Request your Metaverse'), icon: LayoutGrid },
                  { id: 'about', label: t.menu.about, icon: Users },
                  { id: 'contact', label: t.menu.contact, icon: MessageSquare },
                ].filter(Boolean).map((item: any) => (
                  <button 
                    key={item.id} 
                    onClick={() => { 
                      if (item.isAction) {
                        if (item.id === 'qr_scanner') setIsScanningMetaverse(true);
                      } else if (item.isExplainModal) {
                        setShowExplainModal(true);
                      } else if (item.isMetaPlans) {
                        setActiveView('plans');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setActiveView(item.id); 
                      }
                      setIsMenuOpen(false); 
                    }} 
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all", 
                      activeView === item.id ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="uppercase text-[10px] tracking-[0.15em]">{item.label}</span>
                  </button>
                ))}

                {/* Ayuda */}
                <button onClick={() => { setActiveView('faq'); setIsMenuOpen(false); }} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all", activeView === 'faq' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50")}>
                  <HelpCircle size={20} />
                  <span className="uppercase text-[10px] tracking-[0.15em]">{t.menu.help}</span>
                </button>

                {/* Panel Admin — visible solo para rol admin */}
                {profile?.rol === 'admin' && (
                  <>
                    <div className="pt-2 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-red-100" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-400 px-1">Admin</span>
                        <div className="flex-1 h-px bg-red-100" />
                      </div>
                    </div>
                    {[
                      { id: 'admin_dashboard', label: 'Panel Principal', icon: Settings },
                      { id: 'bingo_admin', label: t.menu.bingoAdmin, icon: PlayCircle },
                    ].map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border",
                          activeView === item.id
                            ? "bg-red-600 text-white shadow-lg border-red-500"
                            : "text-red-500 hover:bg-red-50 border-red-100"
                        )}
                      >
                        <item.icon size={20} />
                        <span className="uppercase text-[10px] tracking-[0.15em]">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
              
              {!isGuest ? (
                <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all mt-6">
                  <LogOut size={20} />
                  <span className="uppercase text-[10px] tracking-[0.15em]">{t.menu.signOut}</span>
                </button>
              ) : (
                <button 
                  onClick={() => { 
                    setIsGuest(false); 
                    setProfile(null); 
                    setUserCountry(null); 
                    setIsMenuOpen(false);
                    setActiveView('home');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-orange-500 hover:bg-orange-50 transition-all mt-6 border border-orange-100"
                >
                  <LogOut size={20} />
                  <span className="uppercase text-[10px] tracking-[0.15em]">{t.menu.exitGuest}</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER */}
      {activeView !== 'metaverse' && activeView !== 'metaverse_print' && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md max-w-md mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
          <button onClick={() => setIsMenuOpen(true)} className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 text-slate-600 transition-all active:scale-95">
            <MenuIcon size={24} />
          </button>
          
          <div className="flex-1 text-center flex flex-col items-center justify-center px-2 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-emerald-600 leading-none italic uppercase truncate max-w-[150px]">
                {activeMetaverseData?.nombre || (isGuest ? t.header.guestLabel : (profile?.nombre || t.header.defaultName))}
              </h1>
              {(() => {
                const countryName = profile?.pais_residencia;
                const flagUrl = userCountry?.bandera_pais || userCountry?.bandera_url || (countryName ? FLAG_FALLBACKS[countryName] : null);
                return flagUrl ? <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0" /> : null;
              })()}
            </div>
            <LanguageSwitcher />
          </div>

          <button onClick={() => setActiveView(session ? 'profile' : 'login')} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden active:scale-95 shrink-0">
            {profile?.foto_logo ? <img src={profile.foto_logo} alt="P" className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}
          </button>
        </header>
      )}

      {/* MAIN CONTENT */}
      <main className={cn(
        (activeView === 'metaverse' || activeView === 'metaverse_print') ? "w-full min-h-screen" : "max-w-md mx-auto px-6 pt-4 min-h-[70vh] pb-24"
      )}>
        <Suspense fallback={
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-fifa-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.footer.loadingModule}</p>
          </div>
        }>
          <AnimatePresence mode="wait">
          
          {activeView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SayLucyHome
                onOpenMetaverse={() => { setActiveView('metaverse'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onOpenPlans={() => setActiveView('plans')}
                onOpenQR={() => setIsScanningMetaverse(true)}
                onOpenSolicitarMetaverso={() => { setActiveView('solicitar_metaverso'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onOpenOnboarding={forceShowOnboarding}
                onOpenGlobalSelector={() => setShowGlobalMetaverseSelector(true)}
                org={org}
                isGuest={isGuest}
                profile={profile}
                activeMetaverseData={activeMetaverseData}
                onOpenExperienceList={(type) => {
                  sessionStorage.setItem('atlantisPath', `/list/${encodeURIComponent(type)}`);
                  setActiveView('metaverse');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          {activeView === 'plans' && (
            <div id="plans-container" style={{ minHeight: '80vh', position: 'relative', zIndex: 50 }}>
              <PlansPage pc="#10b981" org={org} onNavigate={(path) => setActiveView(path === '/' ? 'home' : (path as any))} />
            </div>
          )}

          {/* Removed Matches, Quinielas, Participate Views */}

          {activeView === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProfileSettings profile={profile} onUpdate={() => fetchProfile(session.user.id)} />
            </motion.div>
          )}

          {activeView === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FAQ />
            </motion.div>
          )}

          {activeView === 'about' && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AboutUs onPromotersClick={() => setActiveView('contact')} org={org} />
            </motion.div>
          )}

          {activeView === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Contact org={org} />
            </motion.div>
          )}

          {/* Removed Directory */}
          {activeView === 'gestor_miembros' && (
            <motion.div key="gestor_miembros" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GestorMiembros profile={profile} onBack={() => setActiveView('gestor')} />
            </motion.div>
          )}

          {/* Removed Quiniela Hub and Subscriptions */}

          {(activeView === 'metaverse' || activeView === 'metaverse_print') && (
            <motion.div key={activeView} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MetaverseView 
                onBack={() => setActiveView('home')} 
                atlantisDir={org?.atlantis_dir} 
                videoYoutube={org?.video_metaverso} 
                mode={activeView === 'metaverse_print' ? 'impresion' : 'fotos'}
              />
            </motion.div>
          )}

          {activeView === 'bingo_admin' && (
            <motion.div key="bingo_admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              
            </motion.div>
          )}

          {activeView === 'admin_dashboard' && (
            <motion.div key="admin_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AdminView 
                onBack={() => setActiveView('home')}
              />
            </motion.div>
          )}

          {activeView === 'solicitar_metaverso' && (
            <motion.div key="solicitar_metaverso" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SolicitarMetaverso 
                onBack={() => setActiveView('home')}
                org={org}
              />
            </motion.div>
          )}

        </AnimatePresence>
        </Suspense>

        {/* GLOBAL FOOTER */}
        {!showOnboarding && (
          <footer className="mt-16 mb-28 text-center space-y-2 opacity-60">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Diseño & Vibe Coding: {APP_CONFIG.VIBE_CODING}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Derechos Reservados 2026
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              RIF: {APP_CONFIG.RIF}
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex flex-col items-center gap-1">
                <img src="https://flagcdn.com/w40/ve.png" alt="Venezuela" className="w-8 h-5 object-cover rounded shadow-md border border-white/20" />
                <span className="text-[7px] font-black text-slate-400">VE</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="https://flagcdn.com/w40/us.png" alt="USA" className="w-8 h-5 object-cover rounded shadow-md border border-white/20" />
                <span className="text-[7px] font-black text-slate-400">USA</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="https://flagcdn.com/w40/es.png" alt="España" className="w-8 h-5 object-cover rounded shadow-md border border-white/20" />
                <span className="text-[7px] font-black text-slate-400">ES</span>
              </div>
            </div>
          </footer>
        )}
      </main>

      {/* BOTTOM NAV */}
      {!showOnboarding && !showCiclonDemo && !showBingoDemo && !tieBreakerData && (
        <nav 
          className="fixed bottom-6 left-6 right-6 px-6 py-4 flex justify-between items-center z-50 rounded-3xl shadow-xl transition-all"
          style={{ 
            backgroundColor: activeMetaverseData?.secondary_color || '#1e293b',
          }}
        >
          
          {/* Inicio */}
          <button 
            onClick={() => { sessionStorage.removeItem('atlantisPath'); setActiveView('home'); }} 
            className={cn("flex flex-col items-center gap-1 transition-all", activeView === 'home' ? "scale-110" : "text-white/70 hover:text-white")}
            style={{ color: activeView === 'home' ? (activeMetaverseData?.primary_color || '#10b981') : undefined }}
          >
            <HomeIcon size={22} strokeWidth={activeView === 'home' ? 2.5 : 2} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{t.nav?.home ?? (lang === 'en' ? 'Home' : lang === 'fr' ? 'Accueil' : 'Inicio')}</span>
          </button>

          {/* Selector de Metaversos */}
          <button onClick={() => setShowGlobalMetaverseSelector(true)} className="flex flex-col items-center gap-1 transition-all text-white/70 hover:text-white hover:scale-110">
            <Globe size={22} strokeWidth={2} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{t.menu?.worlds ?? (lang === 'en' ? 'Worlds' : lang === 'fr' ? 'Mondes' : 'Mundos')}</span>
          </button>

          {/* ¡Di Guiski! — Metaverso */}
          <button
            onClick={() => { sessionStorage.removeItem('atlantisPath'); setActiveView('metaverse'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={cn("flex flex-col items-center gap-1 transition-all", activeView === 'metaverse' ? "scale-110" : "text-white/70 hover:text-white")}
            style={{ color: activeView === 'metaverse' ? (activeMetaverseData?.primary_color || '#10b981') : undefined }}
          >
            <Camera size={22} strokeWidth={activeView === 'metaverse' ? 2.5 : 2} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{lang === 'es' ? '¡Sonríe, Di Guiski!' : (lang === 'fr' ? 'Souriez, Di Guiski!' : 'Smile, Di Guiski!')}</span>
          </button>

          {/* Impresos */}
          <button
            onClick={() => { sessionStorage.removeItem('atlantisPath'); setActiveView('metaverse_print'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={cn("flex flex-col items-center gap-1 transition-all", activeView === 'metaverse_print' ? "scale-110" : "text-white/70 hover:text-white")}
            style={{ color: activeView === 'metaverse_print' ? (activeMetaverseData?.primary_color || '#10b981') : undefined }}
          >
            <Printer size={22} strokeWidth={activeView === 'metaverse_print' ? 2.5 : 2} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{t.menu?.prints ?? (lang === 'en' ? 'Prints' : lang === 'fr' ? 'Impressions' : 'Impresos')}</span>
          </button>

          {/* Perfil */}
          {session && (
            <button
              onClick={() => setActiveView('profile')}
              className={cn("flex flex-col items-center gap-1 transition-all", (activeView === 'profile') ? "scale-110" : "text-white/70 hover:text-white")}
              style={{ color: activeView === 'profile' ? (activeMetaverseData?.primary_color || '#10b981') : undefined }}
            >
              {profile?.foto_logo
                ? <img src={profile.foto_logo} alt="" className={cn("w-6 h-6 rounded-full object-cover border-2", activeView === 'profile' ? "" : "border-transparent")} style={{ borderColor: activeView === 'profile' ? (activeMetaverseData?.primary_color || '#10b981') : 'transparent' }} />
                : <UserIcon size={22} strokeWidth={(activeView === 'profile') ? 2.5 : 2} />
              }
              <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">{t.menu?.myProfile ?? (lang === 'en' ? 'Profile' : lang === 'fr' ? 'Profil' : 'Perfil')}</span>
            </button>
          )}

        </nav>
      )}

      {/* GLOBAL TOASTS */}
      <div className="fixed top-8 left-0 right-0 z-[10000] pointer-events-none flex flex-col items-center gap-3 px-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={cn(
                "px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border backdrop-blur-xl pointer-events-auto min-w-[280px] max-w-sm",
                toast.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" : 
                toast.type === 'error' ? "bg-red-500/90 border-red-400 text-white" : 
                "bg-slate-900/90 border-slate-700 text-white"
              )}
            >
              <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <AlertTriangle size={20} />}
                {toast.type === 'info' && <InfoIcon size={20} />}
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest flex-1">{toast.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;

