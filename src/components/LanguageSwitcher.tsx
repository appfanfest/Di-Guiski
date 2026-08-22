import React from 'react';
import { useLanguage, Language } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const FLAGS: Record<Language, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  fr: '🇫🇷',
};

const LABELS: Record<Language, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
};

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {(['es', 'en', 'fr'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`relative px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            lang === l
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={l === 'es' ? 'Español' : l === 'en' ? 'English' : 'Français'}
        >
          {FLAGS[l]} {LABELS[l]}
        </button>
      ))}
    </div>
  );
};
