
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Experience, AccessLevel, ExperienceType, SocialNetwork, AppContextType, NicheType, NicheConfig, UserAccess } from '../types';
import { supabase } from '../services/supabaseClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeId = (id: any): string => {
    if (!id) return 'navifest';
    const s = String(id).trim();
    if (s.startsWith('http')) return s;
    return s.toLowerCase().replace(/\s+/g, '');
};

const getUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const DEFAULT_CATEGORY_CONFIGS = {
  "Hora Loca Hats": { label: "Hora Loca Hats", img: "https://i.ibb.co/L7FpxX4L/CARNAVAL-HATS.jpg" },
  "Face Glam": { label: "Face Glam", img: "https://i.ibb.co/fzhXy00K/LOVE-GLOW-FACE.jpg" },
  "Photo Booth": { label: "Photo Booth", img: "https://i.ibb.co/hR0Jq7Wq/COUPLE-BOOTH.jpg" },
  "Postales Wassap": { label: "Postales Wassap", img: "https://i.ibb.co/5XZM0wPz/LOVE-POSTALES.jpg" },
  "Marcos Pro": { label: "Marcos Pro", img: "https://i.ibb.co/k2xQjM9Y/CARNAVAL-FRAMES.jpg" },
  "Fondos Inmersivos": { label: "Fondos Inmersivos", img: "https://i.ibb.co/Pz6D6n0b/PARTY-WORLDS.jpg" }
};

const mapExperienceFromDB = (item: any): Experience => ({
    id: item.id || getUUID(),
    title: item.title || 'Sin Título',
    description: item.description || '',
    type: (item.type as ExperienceType) || ExperienceType.HORA_LOCA_HATS,
    level: (item.level as AccessLevel) || AccessLevel.BRONZE,
    socialNetwork: (item.social_network as SocialNetwork) || SocialNetwork.TIKTOK,
    imageUrl: item.image_url || 'https://via.placeholder.com/300x500?text=No+Image',
    activation_link: item.activation_link || '#', // Se mantiene compatible con DB
    activationLink: item.activation_link || '#',
    demoLink: item.demo_link || '', 
    photoboothLink3: item.photobooth_link3 || '',
    photoboothLink4: item.photobooth_link4 || '',
    category: item.category || 'General',
    isMultiUser: item.is_multi_user || false,
    photofiestas_postal: item.photofiestas_postal || false,
    niche: item.niche
} as any);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [nicheConfig, setNicheConfig] = useState<NicheConfig | null>(null);
  const [allNiches, setAllNiches] = useState<{ id: NicheType; name: string; logo_url: string; is_commercial?: boolean }[]>([]);
  const [unlockedNiches, setUnlockedNiches] = useState<UserAccess[]>([]);
  
  const [currentNiche, setCurrentNicheState] = useState<NicheType>(() => {
    const getParam = (name: string) => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(name)) return urlParams.get(name);
        return null;
    };
    const detected = getParam('activate') || getParam('niche');
    if (detected) return detected;
    return localStorage.getItem('atlantis_current_niche_v5') || 'atlantis-global';
  });

  const saveNicheLocally = (niche: { id: NicheType, name: string, logo_url: string, title?: string }) => {
    try {
        const saved = JSON.parse(localStorage.getItem('atlantis_saved_niches_v5') || '[]');
        const exists = saved.find((s: any) => String(s.id) === String(niche.id));
        if (!exists) {
            const newList = [niche, ...saved].slice(0, 10);
            localStorage.setItem('atlantis_saved_niches_v5', JSON.stringify(newList));
            if (!user) {
                setUnlockedNiches(newList.map((n: any) => ({
                    id: getUUID(),
                    user_id: 'local',
                    niche_id: n.id,
                    unlocked_at: new Date().toISOString(),
                    niche_data: { name: n.name, logo_url: n.logo_url, title: n.title }
                })));
            }
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
    
    if (data) {
      setUnlockedNiches(data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        niche_id: item.niche_id,
        unlocked_at: item.unlocked_at,
        niche_data: item.niche_data
      })));
    }
  };

  const loadAppData = async () => {
    setLoading(true);
    try {
      const nid = currentNiche;
      const { data: nichesList } = await supabase.from('niches').select('id, name, logo_url, is_commercial');
      if (nichesList) setAllNiches(nichesList);

      let nicheQuery = supabase.from('niches').select('*');
      if (/^\d+$/.test(String(nid))) nicheQuery = nicheQuery.eq('id', nid);
      else nicheQuery = nicheQuery.ilike('name', String(nid).trim());
      
      const { data: nicheData } = await nicheQuery.maybeSingle();
      
      let resolvedId = normalizeId(nid);
      let resolvedName = String(nid).toLowerCase().trim();

      if (nicheData) {
        resolvedId = nicheData.id;
        resolvedName = nicheData.name.toLowerCase().trim();
        if (nicheData.is_commercial) saveNicheLocally({ id: nicheData.id, name: nicheData.name, logo_url: nicheData.logo_url, title: nicheData.title });

        const mergedCategories = { ...DEFAULT_CATEGORY_CONFIGS, ...(nicheData.category_configs || {}) };
        setNicheConfig({
          id: nicheData.id, name: nicheData.name, title: nicheData.title || nicheData.name, slogan: nicheData.slogan || 'El Metaverso de Navidad & Año Nuevo',
          logo_url: nicheData.logo_url, hero_url: nicheData.hero_url, onboarding_images: nicheData.onboarding_images || [],
          primary_color: nicheData.primary_color || '#FF2D31', secondary_color: nicheData.secondary_color || '#FFD700', base_color: nicheData.base_color || '#000000', 
          category_configs: mergedCategories, faq_configs: nicheData.faq_configs || [], is_commercial: nicheData.is_commercial
        });
      } else {
        // Fallback default config if niche not found
        setNicheConfig({
          id: 'navifest', name: 'NaviFest', title: 'NAVIFEST AR', slogan: 'Vive la magia de la navidad en Realidad Aumentada.',
          logo_url: 'https://i.ibb.co/9kRPY80z/LOGO-NAVIFEST-FEST-OK.png', hero_url: 'https://i.ibb.co/S49kXbDL/NUEVO-YEAR-MARGARITA.jpg', onboarding_images: [],
          primary_color: '#FF2D31', secondary_color: '#FFD700', base_color: '#000000', 
          category_configs: DEFAULT_CATEGORY_CONFIGS, faq_configs: [], is_commercial: false
        });
      }

      const { data: expData } = await supabase.from('experiences')
        .select('*')
        .or(`niche.eq.${resolvedId},niche.ilike.${resolvedName},niche.eq.global`)
        .limit(2000);
      
      if (expData) setExperiences(expData.map(mapExperienceFromDB));

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profile) {
              setUser({ id: session.user.id, email: session.user.email || '', level: profile.level as AccessLevel, isAdmin: profile.is_admin || profile.level === 'Admin', name: profile.full_name, thumbUrl: profile.avatar_url });
              await loadUnlockedNiches(session.user.id);
          }
      } else {
          await loadUnlockedNiches('local');
      }

    } catch (err) { console.error("Error loadAppData:", err); } finally { setLoading(false); }
  };

  useEffect(() => { loadAppData(); }, [currentNiche]);

  return (
    <AppContext.Provider value={{ 
      user, experiences, payments: [], allProfiles: [], allNiches, unlockedNiches, currentNiche, nicheConfig, setCurrentNiche,
      login: async (e, p) => { const { data, error } = await supabase.auth.signInWithPassword({email: e, password: p}); return error ? {success: false, message: error.message} : {success: true}; },
      loginWithGoogle: async () => ({success: true}), 
      logout: async () => { setUser(null); setExperiences([]); setUnlockedNiches([]); await supabase.auth.signOut(); localStorage.removeItem('atlantis_saved_niches_v5'); }, 
      registerUser: async (e, p) => (await supabase.auth.signUp({email:e, password:p})).error ? {success:false} : {success:true},
      fetchExperiences: async () => loadAppData(),
      addExperience: async (e) => { const { error } = await supabase.from('experiences').insert([{ title: e.title, description: e.description, type: e.type, level: e.level, social_network: e.social_network, image_url: e.image_url, activation_link: e.activationLink, demo_link: e.demoLink, category: e.category, is_multi_user: e.isMultiUser, niche: String(e.niche).toLowerCase().trim() }]); return error ? {success:false, error: error.message} : {success:true}; },
      updateExperience: async (e) => { const { error } = await supabase.from('experiences').update({ title: e.title, description: e.description, type: e.type, level: e.level, social_network: e.socialNetwork, image_url: e.imageUrl, activation_link: e.activationLink, demo_link: e.demoLink, category: e.category, is_multi_user: e.isMultiUser, niche: String(e.niche).toLowerCase().trim() }).eq('id', e.id); return error ? {success:false, error: error.message} : {success:true}; },
      deleteExperience: async (id) => { const { error } = await supabase.from('experiences').delete().eq('id', id); return error ? {success:false, error: error.message} : {success:true}; }, 
      duplicateExperience: async (id) => ({success: true}), addPayment: async (p) => ({success: true}), updatePaymentStatus: async (id, s) => ({success: true}),
      fetchAllProfiles: async () => {}, updateUserPlan: async (email, plan) => ({success: true}), fetchSystemConfig: async () => null,
      validateCoupon: async () => ({success: false}), fetchCoupons: async () => [], addCoupon: async (c) => ({success: true}), deleteCoupon: async (id) => ({success: true}),
      removeAccess: async (id) => {
          const saved = JSON.parse(localStorage.getItem('atlantis_saved_niches_v5') || '[]');
          const accessToRemove = unlockedNiches.find(u => u.id === id);
          if (!accessToRemove) return;
          const newList = saved.filter((s: any) => String(s.id) !== String(accessToRemove.niche_id));
          localStorage.setItem('atlantis_saved_niches_v5', JSON.stringify(newList));
          loadUnlockedNiches(user ? user.id : 'local');
      },
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext');
  return context;
};
