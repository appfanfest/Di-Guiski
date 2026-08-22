import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, MapPin, Search, Check, ChevronRight, X, Sparkles, Zap, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GuestCountryModalProps {
  onSelect: (country: any) => void;
}

export const GuestCountryModal: React.FC<GuestCountryModalProps> = ({ onSelect }) => {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    try {
      setLoading(true);
      // Fetch countries from pais_sede (Hosts) + potentially add common ones
      const { data, error } = await supabase
        .from('pais_sede')
        .select('*')
        .order('nombre');

      if (error) throw error;
      
      // If Venezuela is not in pais_sede (because it's not a host), we can fetch it from paises table 
      // or just assume we want it for the directory.
      // For this demo/requirement, I'll ensure we have a good list.
      const { data: allCountries } = await supabase
        .from('paises')
        .select('id, nombre, bandera_url')
        .in('nombre', ['Venezuela', 'Colombia', 'Argentina', 'España', 'Chile']);

      const merged = [...(data || []), ...(allCountries || [])];
      // Remove duplicates by name
      const unique = merged.filter((v, i, a) => a.findIndex(t => (t.nombre === v.nombre)) === i);
      
      setCountries(unique);
    } catch (err) {
      console.error('Error fetching countries for guest:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = countries.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl relative"
      >
        <div className="bg-gradient-to-br from-emerald-600 to-green-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 text-center space-y-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 mb-4">
              <Globe size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Bienvenido a FanFest</h2>
            <p className="text-emerald-50 text-[11px] font-medium opacity-80 max-w-[200px] mx-auto uppercase tracking-widest">
              Selecciona tu país para mostrarte las mejores quinielas cerca de ti
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar mi país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="animate-spin text-emerald-600" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando Regiones...</p>
              </div>
            ) : filtered.map((country) => (
              <button
                key={country.id}
                onClick={() => onSelect(country)}
                className="w-full p-4 bg-white border border-slate-50 rounded-2xl flex items-center justify-between group hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-7 rounded-md overflow-hidden border border-slate-100 shadow-sm shrink-0">
                    <img src={country.bandera_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-slate-700 text-sm">{country.nombre}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center gap-3 text-emerald-600/60">
            <Sparkles size={16} />
            <p className="text-[9px] font-black uppercase tracking-widest">Esto personalizará tu experiencia</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
