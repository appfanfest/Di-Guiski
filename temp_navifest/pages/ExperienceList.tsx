
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ExperienceCard } from '../components/ExperienceCard';
import { ChevronLeft, Search, Loader2, Snowflake, Filter } from 'lucide-react';
import { Experience } from '../types';

export const ExperienceList: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const { experiences, loading, nicheConfig } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const decodedType = useMemo(() => decodeURIComponent(type || '').trim().toLowerCase(), [type]);

  // Filtro Inteligente: Busca en el campo TYPE y en el campo CATEGORY
  // Esto soluciona el problema de si el usuario cargó "Hora Loca Hats" en la columna equivocada.
  const typeFiltered = useMemo(() => {
    return experiences.filter(exp => {
        const expType = String(exp.type || '').trim().toLowerCase();
        const expCategory = String(exp.category || '').trim().toLowerCase();
        
        // Coincide si el Tipo es igual al de la URL O si la Categoría es igual al de la URL
        return expType === decodedType || expCategory === decodedType;
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

  const primaryColor = nicheConfig?.primary_color || '#FF2D31';

  return (
    <div className="animate-fade-in pb-20 px-2">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="p-2.5 rounded-xl backdrop-blur-md border text-white active:scale-90 transition-all shadow-lg"
            style={{ 
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}30`
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: primaryColor }} />
          </Link>
          <h2 className="text-xl font-black text-white font-display uppercase tracking-tighter truncate">{type}</h2>
        </div>
        
        {/* Barra de Búsqueda y Filtro - Esquema Amarillo Permanente */}
        <div className="flex gap-2">
            <div className="relative flex-1 h-11">
                <Search className="absolute left-3.5 top-3 text-navifest-gold" size={16} />
                <input 
                    type="text" 
                    className="w-full h-full pl-10 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-navifest-gold/30" 
                    placeholder="Buscar" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            <div className="relative h-11">
                <Filter className="absolute left-3 top-3.5 text-navifest-gold pointer-events-none" size={14} />
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="bg-white/5 border border-navifest-gold/40 rounded-xl pl-9 pr-3 text-[9px] font-black uppercase text-navifest-gold outline-none h-full appearance-none"
                >
                    <option value="" className="bg-black text-navifest-gold">Filtrar</option>
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
                <div key={category} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-white/5"></div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5">
                            <Snowflake size={10} style={{ color: primaryColor }} />
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/60">{category}</h3>
                        </div>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {grouped[category].map(exp => <ExperienceCard key={exp.id} experience={exp} />)}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
