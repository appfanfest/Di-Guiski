import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AtlantisUser, Experience, AccessLevel, ExperienceType, SocialNetwork, AppContextType, NicheType, NicheConfig, UserAccess } from './types';
import { supabase } from '../lib/supabase';

// Extending AppContextType locally to avoid touching types.ts if not strictly needed
export interface Metaverso {
  id: string;
  nombre: string;
  icono?: string;
  title?: string;
  slogan?: string;
  logo_url?: string;
  hero_url?: string;
  hero_print?: string;
  primary_color?: string;
  secondary_color?: string;
  base_color?: string;
}

export interface ExtendedAppContextType extends AppContextType {
  metaversos: Metaverso[];
  activeMetaverso: string;
  setActiveMetaverso: (val: string) => void;
  mode: 'fotos' | 'impresion';
  setMode: (mode: 'fotos' | 'impresion') => void;
}

const AppContext = createContext<ExtendedAppContextType | undefined>(undefined);

const normalizeId = (id: any): string => {
  if (!id) return '2026 fanfest';
  const s = String(id).trim();
  if (s.startsWith('http')) return s;
  return s.toLowerCase(); // removed replace(/\s+/g, '') so we can match '2026 fanfest'
};

const getUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Imágenes y Iconos de categorías por defecto — Mundial 5.0
const DEFAULT_CATEGORY_CONFIGS: Record<string, { label: string, img: string, icon: string }> = {
  "Hora Loca Hats": { label: "Hora Loca Hats", img: "https://i.ibb.co/L7FpxX4L/CARNAVAL-HATS.jpg", icon: "PartyPopper" },
  "Face Glam": { label: "Face Glam", img: "https://i.ibb.co/fzhXy00K/LOVE-GLOW-FACE.jpg", icon: "Smile" },
  "Photo Booth": { label: "Photo Booth", img: "https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg", icon: "Camera" },
  "Postales Wassap": { label: "Postales Wassap", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "Mail" },
  "Marcos Pro": { label: "Marcos Pro", img: "https://i.ibb.co/k2xQjM9Y/CARNAVAL-FRAMES.jpg", icon: "Image" },
  "Fondos Inmersivos": { label: "Fondos Inmersivos", img: "https://i.ibb.co/Pz6D6n0b/PARTY-WORLDS.jpg", icon: "Globe" },
  "Posters": { label: "Posters", img: "https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg", icon: "FileImage" },
  "Mi Album": { label: "Mi Álbum", img: "https://i.ibb.co/L7FpxX4L/CARNAVAL-HATS.jpg", icon: "BookOpen" },
  "Postales": { label: "Postales", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "FileImage" },
  "Postales Dobladas": { label: "Postales Dobladas", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "Printer" },
  "Papercraft Caja": { label: "Papercraft Caja", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "Box" },
  "Papercraft Cajita Feliz": { label: "Papercraft Cajita Feliz", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "Package" },
  "Papercraft Domo": { label: "Papercraft Domo", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "CircleDot" },
  "Papercraft Carrusel": { label: "Papercraft Carrusel", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg", icon: "FerrisWheel" }
};

const mapExperienceFromDB = (item: any): Experience => {
  const isPostal = !!item.photofiestas_postal;
  
  // Asignar el tipo: Prioridad al valor exacto del DB (CSV)
  let experienceType = (item.type as ExperienceType);

  // Forzar el tipo si los booleanos están marcados en BD (ignora lo que diga la columna type)
  // EXCEPCIÓN: si es_papercraft está en true, el tipo del campo type tiene prioridad absoluta
  if (item.es_papercraft === true || item.es_papercraft === 'true') {
    // Mantener el tipo tal como viene del campo type (Papercraft Caja, Cajita Feliz, etc.)
    // No hacer override con ningún otro booleano
  } else if (item.postal_pdf === true || item.postal_pdf === 'true') {
    experienceType = ExperienceType.POSTALES;
  } else if (item.postaldoblada_pdf === true || item.postaldoblada_pdf === 'true') {
    experienceType = ExperienceType.POSTALES_DOBLADAS;
  } else if (item.es_poster === true || item.es_poster === 'true') {
    experienceType = ExperienceType.POSTERS;
  } else if (item.es_album === true || item.es_album === 'true') {
    experienceType = ExperienceType.MI_ALBUM;
  }
  // Si es postal pero el tipo no está definido, forzarlo
  if (isPostal && !experienceType) experienceType = ExperienceType.POSTALES_WASSAP;
  
  // Si sigue siendo nulo, intentar derivar de la categoría o usar el default
  if (!experienceType) {
    const cat = String(item.category || '').toLowerCase();
    if (cat.includes('postal')) experienceType = ExperienceType.POSTALES_WASSAP;
    else if (cat.includes('marco') || cat.includes('frame')) experienceType = ExperienceType.MARCOS_PRO;
    else if (cat.includes('booth')) experienceType = ExperienceType.PHOTO_BOOTH;
    else if (cat.includes('glam')) experienceType = ExperienceType.FACE_GLAM;
    else if (cat.includes('fondo') || cat.includes('background')) experienceType = ExperienceType.FONDOS_INMERSIVOS;
    else if (cat.includes('poster')) experienceType = ExperienceType.POSTERS;
    else if (cat.includes('album') || cat.includes('álbum')) experienceType = ExperienceType.MI_ALBUM;
    else experienceType = ExperienceType.HORA_LOCA_HATS;
  }

  return {
    id: item.id || getUUID(),
    title: item.title || 'Sin Título',
    description: item.description || '',
    type: experienceType,
    level: (item.level as AccessLevel) || AccessLevel.BRONZE,
    socialNetwork: (item.social_network as SocialNetwork) || SocialNetwork.TIKTOK,
    imageUrl: item.image_url || 'https://via.placeholder.com/300x500?text=No+Image',
    activation_link: item.activation_link || '#',
    activationLink: item.activation_link || '#',
    demoLink: item.demo_link || '',
    photoboothLink3: item.photobooth_link3 || '',
    photoboothLink4: item.photobooth_link4 || '',
    category: item.category || 'General',
    isMultiUser: !!item.is_multi_user,
    photofiestas_postal: isPostal,
    es_papercraft: !!item.es_papercraft,
    niche: item.niche
  } as Experience;
};

// ----------- MIS METAVERSOS (localStorage, sin Supabase) -----------
const MIS_METAVERSOS_KEY = 'fanfest_mis_metaversos_v1';
const BRONCE_LIMIT = 3;

export const getMisMetaversoIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(MIS_METAVERSOS_KEY) || '[]'); } catch { return []; }
};
// -------------------------------------------------------------------

export const AtlantisAppProvider: React.FC<{ children: React.ReactNode, initialMode?: 'fotos' | 'impresion' }> = ({ children, initialMode = 'fotos' }) => {
  const [user, setUser] = useState<AtlantisUser | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [nicheConfig, setNicheConfig] = useState<NicheConfig | null>(null);
  const [allNiches, setAllNiches] = useState<any[]>([]);
  const [unlockedNiches, setUnlockedNiches] = useState<UserAccess[]>([]);
  const [metaversos, setMetaversos] = useState<Metaverso[]>([]);
  const [activeMetaverso, setActiveMetaversoState] = useState(() => {
    return localStorage.getItem('saylucy_higher_metaverse') || 'Festividades';
  });

  // MIS METAVERSOS: lista de IDs activos guardados localmente
  const [misMetaversoIds, setMisMetaversoIds] = useState<string[]>(getMisMetaversoIds);

  const toggleMisMetaverso = useCallback((nicheId: string) => {
    setMisMetaversoIds(prev => {
      const id = String(nicheId);
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        localStorage.setItem(MIS_METAVERSOS_KEY, JSON.stringify(next));
        return next;
      }
      // Check limit for BRONCE users (others are unlimited)
      const isBronce = !user || user.level === AccessLevel.BRONZE;
      if (isBronce && prev.length >= BRONCE_LIMIT) return prev; // caller handles paywall
      const next = [...prev, id];
      localStorage.setItem(MIS_METAVERSOS_KEY, JSON.stringify(next));
      return next;
    });
  }, [user]);

  const [mode, setModeState] = useState<'fotos' | 'impresion'>(initialMode);

  useEffect(() => {
    if (initialMode) setModeState(initialMode);
  }, [initialMode]);

  const setActiveMetaverso = useCallback((nombre: string) => {
    setActiveMetaversoState(nombre);
    localStorage.setItem('saylucy_higher_metaverse', nombre);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const [currentNiche, setCurrentNicheState] = useState<NicheType>(() => {
    const params = new URLSearchParams(window.location.search);
    const detected = params.get('activate') || params.get('niche');
    if (detected) return detected;
    return localStorage.getItem('atlantis_current_niche_v5') || '2026 fanfest';
  });

  const saveNicheLocally = (niche: { id: NicheType, name: string, logo_url: string, title?: string }) => {
    try {
      const saved = JSON.parse(localStorage.getItem('atlantis_saved_niches_v5') || '[]');
      const exists = saved.find((s: any) => String(s.id) === String(niche.id));
      if (!exists) {
        const newList = [niche, ...saved].slice(0, 10);
        localStorage.setItem('atlantis_saved_niches_v5', JSON.stringify(newList));
        setUnlockedNiches(newList.map((n: any) => ({
          id: getUUID(),
          user_id: 'local',
          niche_id: n.id,
          unlocked_at: new Date().toISOString(),
          niche_data: { name: n.name, logo_url: n.logo_url, title: n.title }
        })));
      }
    } catch (e) { console.error("Error saving niche locally", e); }
  };

  const setCurrentNiche = useCallback((id: NicheType) => {
    setCurrentNicheState(id);
    localStorage.setItem('atlantis_current_niche_v5', String(id));
  }, []);

  const loadUnlockedNiches = async (userId: string) => {
    if (userId === 'local') {
      const saved = JSON.parse(localStorage.getItem('atlantis_saved_niches_v5') || '[]');
      setUnlockedNiches(saved.map((n: any) => ({
        id: getUUID(),
        user_id: 'local',
        niche_id: n.id,
        unlocked_at: new Date().toISOString(),
        niche_data: { name: n.name, logo_url: n.logo_url, title: n.title }
      })));
      return;
    }
    const { data } = await supabase
      .from('user_access')
      .select('*, niche_data:niches(name, logo_url, title)')
      .eq('user_id', userId);
    if (data) setUnlockedNiches(data as any);
  };

  const loadAppData = async () => {
    setLoading(true);
    try {
      const { data: metaversosList } = await supabase
        .from('metaversos')
        .select('id, nombre, icono, title, slogan, logo_url, hero_url, primary_color, secondary_color, base_color')
        .eq('is_active', true)
        .order('orden', { ascending: true });
      if (metaversosList) setMetaversos(metaversosList);

      const nid = currentNiche;
      const { data: nichesList } = await supabase
        .from('niches')
        .select('id, name, logo_url, is_commercial, nivel_orden, metaverso_id')
        .order('is_commercial', { ascending: true })
        .order('nivel_orden', { ascending: true })
        .order('name', { ascending: true });
      if (nichesList) setAllNiches(nichesList as any);

      let nicheQuery = supabase.from('niches').select('*');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(nid));
      
      if (isUuid || /^\d+$/.test(String(nid))) {
        nicheQuery = nicheQuery.eq('id', nid);
      } else {
        nicheQuery = nicheQuery.ilike('name', String(nid).trim());
      }

      const { data: nicheData } = await nicheQuery.maybeSingle();

      let resolvedId = normalizeId(nid);
      let resolvedName = String(nid).toLowerCase().trim();

      const { data: orgData } = await supabase.from('organizacion').select('categories_phone, categories_print').limit(1).single();
      
      const mappedPrintCategories: any = {};
      if (orgData?.categories_print) {
        const p = orgData.categories_print;
        if (p['Caja']) mappedPrintCategories['Papercraft Caja'] = p['Caja'];
        if (p['Cajita Feliz']) mappedPrintCategories['Papercraft Cajita Feliz'] = p['Cajita Feliz'];
        if (p['Domo']) mappedPrintCategories['Papercraft Domo'] = p['Domo'];
        if (p['Carrusel']) mappedPrintCategories['Papercraft Carrusel'] = p['Carrusel'];
        if (p['Poster']) mappedPrintCategories['Posters'] = p['Poster'];
        if (p['Mi Album']) mappedPrintCategories['Mi Album'] = p['Mi Album'];
        if (p['Postales']) mappedPrintCategories['Postales'] = p['Postales'];
        if (p['Postales Dobladas']) mappedPrintCategories['Postales Dobladas'] = p['Postales Dobladas'];
      }
      
      const orgCategories = { ...(orgData?.categories_phone || {}), ...mappedPrintCategories };

      if (nicheData) {
        resolvedId = nicheData.id;
        resolvedName = nicheData.name.toLowerCase().trim();
        if (nicheData.is_commercial) saveNicheLocally({ id: nicheData.id, name: nicheData.name, logo_url: nicheData.logo_url, title: nicheData.title });

        const mergedCategories = { ...DEFAULT_CATEGORY_CONFIGS, ...orgCategories };
        setNicheConfig({
          id: nicheData.id,
          name: nicheData.name,
          title: nicheData.title || nicheData.name,
          slogan: nicheData.slogan || 'El Metaverso Oficial del Mundial 5.0',
          logo_url: nicheData.logo_url,
          hero_url: nicheData.hero_url,
          hero_print: nicheData.hero_print || null,
          onboarding_images: nicheData.onboarding_images || [],
          primary_color: nicheData.primary_color || '#10b981',
          secondary_color: nicheData.secondary_color || '#3b82f6',
          base_color: nicheData.base_color || '#000000',
          category_configs: mergedCategories,
          faq_configs: nicheData.faq_configs || [],
          is_commercial: nicheData.is_commercial
        });
      } else if (nid === 'empty_metaverse') {
        setNicheConfig({
          id: 'empty_metaverse',
          name: 'Metaverso Vacío',
          title: 'MUNDO VACÍO',
          slogan: '',
          logo_url: '',
          hero_url: '',
          onboarding_images: [],
          primary_color: '#10b981',
          secondary_color: '#3b82f6',
          base_color: '#000000',
          category_configs: {},
          faq_configs: [],
          is_commercial: false
        });
      } else {
        // Fallback: FanFest Q26
        setNicheConfig({
          id: '2026 fanfest',
          name: 'FanFest 5.0',
          title: 'FANFEST 5.0',
          slogan: 'Inmortaliza tu pasión en el Metaverso del Mundial.',
          logo_url: 'https://i.ibb.co/9kRPY80z/LOGO-NAVIFEST-FEST-OK.png', // Or empty string, but keep if it is FanFest logo
          hero_url: '', // Remove Atlantis fallback image
          onboarding_images: [],
          primary_color: '#10b981',
          secondary_color: '#3b82f6',
          base_color: '#000000',
          category_configs: { ...DEFAULT_CATEGORY_CONFIGS, ...orgCategories },
          faq_configs: [],
          is_commercial: false
        });
      }

      const { data: expData } = await supabase.from('experiences')
        .select('*')
        .or(`niche.eq.${resolvedId},niche.ilike.${resolvedName}`)
        .limit(2000);

      if (expData) setExperiences(expData.map(mapExperienceFromDB));

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('perfiles_usuarios').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) {
          setUser({ id: session.user.id, email: session.user.email || '', level: profile.level as AccessLevel, isAdmin: profile.is_admin || profile.level === 'Admin', name: profile.nombre, thumbUrl: profile.foto_logo });
          await loadUnlockedNiches(session.user.id);
        }
      } else {
        await loadUnlockedNiches('local');
      }
    } catch (err) { console.error("Error loadAppData:", err); } finally { setLoading(false); }
  };

  useEffect(() => { 
    loadAppData(); 
  }, [currentNiche]);

  useEffect(() => {
    // When activeMetaverso changes, ensure currentNiche belongs to it
    if (metaversos.length > 0 && allNiches.length > 0) {
      const activeMetaversoId = metaversos.find(m => m.nombre === activeMetaverso)?.id;
      if (activeMetaversoId) {
        const nicheBelongs = allNiches.find(n => String(n.id) === String(currentNiche) && n.metaverso_id === activeMetaversoId);
        if (!nicheBelongs) {
          // Find first niche for this metaverse
          const firstNiche = allNiches.find(n => n.metaverso_id === activeMetaversoId && !n.is_commercial);
          if (firstNiche) {
            setCurrentNiche(firstNiche.id);
          } else {
            setCurrentNiche('empty_metaverse');
          }
        }
      }
    }
  }, [activeMetaverso, metaversos, allNiches, currentNiche, setCurrentNiche]);

  // Inyección de variables CSS para colores dinámicos
  useEffect(() => {
    if (nicheConfig) {
      document.documentElement.style.setProperty('--atlantis-primary', nicheConfig.primary_color || '#10b981');
      document.documentElement.style.setProperty('--atlantis-secondary', nicheConfig.secondary_color || '#3b82f6');
      document.documentElement.style.setProperty('--atlantis-base', nicheConfig.base_color || '#000000');
    }
  }, [nicheConfig]);

  const logout = async () => {
    setUser(null);
    setExperiences([]);
    setUnlockedNiches([]);
    await supabase.auth.signOut();
    localStorage.removeItem('atlantis_saved_niches_v5');
  };

  return (
    <AppContext.Provider value={{ user, experiences, allNiches, unlockedNiches, currentNiche, nicheConfig, setCurrentNiche, loading, logout, metaversos, activeMetaverso, setActiveMetaverso, mode, setMode: setModeState, misMetaversoIds, toggleMisMetaverso } as any}>
      {children}
    </AppContext.Provider>
  );
};

export const useAtlantis = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAtlantis must be used within AtlantisAppProvider');
  return context;
};
