import React, { useState, useMemo, useEffect } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ExperienceCard } from './ExperienceCard';
import { ChevronLeft, Search, Loader2, Filter } from 'lucide-react';
import { Experience } from './types';

interface Props {
  type: string;
  onNavigate: (path: string) => void;
}

export const ExperienceList: React.FC<Props> = ({ type, onNavigate }) => {
  const { experiences, loading, metaversos, activeMetaverso } = useAtlantis() as any;
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fix #3: Scroll al top al entrar en cualquier categoría
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [type]);

  const decodedType = useMemo(() => decodeURIComponent(type || '').trim().toLowerCase(), [type]);

  const typeFiltered = useMemo(() => {
    return experiences.filter(exp => {
      const normalize = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const expType = normalize(exp.type);
      const expCategory = normalize(exp.category);
      const target = normalize(decodedType);
      
      // Validaciones estrictas para categorías de Postales (evita colisión por subcadenas)
      if (target === 'postaleswassap' || target === 'postales_wassap') {
        return exp.photofiestas_postal === true || exp.photofiestas_postal === 'true' || expType === 'postaleswassap';
      }
      if (target === 'postales') {
        return exp.postal_pdf === true || exp.postal_pdf === 'true' || expType === 'postales';
      }
      if (target === 'postalesdobladas' || target === 'postales_dobladas') {
        return exp.postaldoblada_pdf === true || exp.postaldoblada_pdf === 'true' || expType === 'postalesdobladas';
      }

      // Validamos únicamente contra el campo type con igualdad estricta
      return expType === target;
    });
  }, [experiences, decodedType]);

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(typeFiltered.map(e => e.category || 'General'))) as string[];
    return cats.sort((a, b) => a.localeCompare(b));
  }, [typeFiltered]);

  const finalFiltered = useMemo(() => {
    return typeFiltered.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? exp.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [typeFiltered, searchTerm, selectedCategory]);

  const grouped = useMemo(() => {
    return finalFiltered.reduce((acc, exp) => {
      const cat = exp.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(exp);
      return acc;
    }, {} as Record<string, Experience[]>);
  }, [finalFiltered]);

  const activeMetaverseData = metaversos?.find((m: any) => m.nombre === activeMetaverso);
  const primaryColor = activeMetaverseData?.secondary_color || '#10b981';

  return (
    <div className="animate-fade-in pb-20 px-2">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="p-2.5 rounded-xl backdrop-blur-md border text-white active:scale-90 transition-all shadow-lg"
            style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: primaryColor }} />
          </button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter truncate">
            {t.categories?.[decodeURIComponent(type) as keyof typeof t.categories] || decodeURIComponent(type)}
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 h-11">
            <Search className="absolute left-3.5 top-3" size={16} style={{ color: primaryColor }} />
            <input
              type="text"
              className="w-full h-full pl-10 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none"
              style={{ '--tw-border-opacity': '1', color: primaryColor } as any}
              placeholder={t.forms?.search || "Buscar..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative h-11">
            <Filter className="absolute left-3 top-3.5 pointer-events-none" size={14} style={{ color: primaryColor }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border rounded-xl pl-9 pr-3 text-[9px] font-black uppercase outline-none h-full appearance-none"
              style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
            >
              <option value="" className="bg-black text-white">{t.menu?.filter || 'Filtrar'}</option>
              {dynamicCategories.map(cat => <option key={cat} value={cat} className="bg-black text-white">{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin" size={32} style={{ color: primaryColor }} />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Conectando...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-dashed border-white/10 mx-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sin coincidencias.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped).sort().map(category => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <div className="flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <h3 className="text-[13px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>— {category} —</h3>
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {grouped[category].map(exp => (
                  <ExperienceCard key={exp.id} experience={exp} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
