import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface NicheConfig {
  id: string;
  name: string;
  title: string;
  logo_url: string;
  hero_url: string;
  primary_color: string;
  secondary_color: string;
  base_color: string;
}

interface NicheContextType {
  currentHigherMetaverse: string;
  setHigherMetaverse: (metaverse: string) => void;
  currentNiche: string;
  nicheConfig: NicheConfig | null;
  loading: boolean;
  setNiche: (nicheName: string) => void;
}

const NicheContext = createContext<NicheContextType | undefined>(undefined);

export const NicheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentHigherMetaverse, setCurrentHigherMetaverse] = useState<string>(() => {
    return localStorage.getItem('saylucy_higher_metaverse') || 'Festividades';
  });

  const [currentNiche, setCurrentNicheState] = useState<string>(() => {
    // Detectar desde URL
    const params = new URLSearchParams(window.location.search);
    const nicheParam = params.get('niche') || params.get('activate');
    if (nicheParam) {
      localStorage.setItem('saylucy_current_niche', nicheParam);
      return nicheParam;
    }
    return localStorage.getItem('saylucy_current_niche') || 'global';
  });

  const [nicheConfig, setNicheConfig] = useState<NicheConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNicheConfig = useCallback(async (name: string) => {
    setLoading(true);
    try {
      if (name === 'global') {
        setNicheConfig({
          id: 'global',
          name: 'global',
          title: 'Say Lucy! Mundo',
          logo_url: 'https://i.ibb.co/S49kXbDL/NUEVO-YEAR-MARGARITA.jpg', // Placeholder
          hero_url: 'https://i.ibb.co/S49kXbDL/NUEVO-YEAR-MARGARITA.jpg',
          primary_color: '#10b981', // Emerald
          secondary_color: '#3b82f6', // Blue
          base_color: '#020617'
        });
        return;
      }

      const { data, error } = await supabase
        .from('niches')
        .select('*')
        .ilike('name', name)
        .maybeSingle();

      if (!error && data) {
        setNicheConfig({
          id: data.id,
          name: data.name,
          title: data.title || data.name,
          logo_url: data.logo_url,
          hero_url: data.hero_url,
          primary_color: data.primary_color || '#10b981',
          secondary_color: data.secondary_color || '#3b82f6',
          base_color: data.base_color || '#020617'
        });
      } else {
        // Fallback si no existe
        setCurrentNicheState('global');
      }
    } catch (err) {
      console.error('Error fetching niche config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNicheConfig(currentNiche);
  }, [currentNiche, fetchNicheConfig]);

  const setNiche = (name: string) => {
    setCurrentNicheState(name);
    localStorage.setItem('saylucy_current_niche', name);
  };

  const setHigherMetaverse = (name: string) => {
    setCurrentHigherMetaverse(name);
    localStorage.setItem('saylucy_higher_metaverse', name);
  };

  return (
    <NicheContext.Provider value={{ currentHigherMetaverse, setHigherMetaverse, currentNiche, nicheConfig, loading, setNiche }}>
      {children}
    </NicheContext.Provider>
  );
};

export const useNiche = () => {
  const context = useContext(NicheContext);
  if (!context) throw new Error('useNiche must be used within a NicheProvider');
  return context;
};
