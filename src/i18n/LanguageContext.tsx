import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export type Language = 'es' | 'en' | 'fr';

const LOCALES: Record<Language, typeof es> = { es, en, fr };

const STORAGE_KEY = 'fanfest_lang';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof es;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: es,
});

function detectInitialLang(): Language {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved && LOCALES[saved]) return saved;
  const browser = navigator.language.slice(0, 2).toLowerCase();
  if (browser === 'fr') return 'fr';
  if (browser === 'en') return 'en';
  return 'es';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(detectInitialLang);

  const setLang = useCallback((l: Language) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = LOCALES[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
