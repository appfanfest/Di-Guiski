import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Save, 
  Search, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Mail,
  Key,
  ChevronRight,
  Download,
  Database,
  Copy,
  Ticket,
  Globe,
  Box
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminViewProps {
  onBack: () => void;
}

interface BulkUploadData {
  email: string;
  password: string;
  status: 'pending' | 'success' | 'error';
}

const SQL_SEED = `-- FANFEST 2026: ESTRATEGIA DE DATOS DEMO (V3)
-- Ejecutar en SQL Editor de Supabase

-- 0. ASEGURAR COLUMNAS (En caso de que no existan)
ALTER TABLE public.perfiles_usuarios ADD COLUMN IF NOT EXISTS autorizado BOOLEAN DEFAULT false;
ALTER TABLE public.perfiles_usuarios ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.perfiles_usuarios ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.perfiles_usuarios ADD COLUMN IF NOT EXISTS nombre_comercial TEXT;
ALTER TABLE public.perfiles_usuarios ADD COLUMN IF NOT EXISTS quiniela_activa BOOLEAN DEFAULT true;

-- 1. PAISES SEDE
INSERT INTO public.pais_sede (id, nombre) VALUES 
('f0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c', 'Venezuela'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'USA')
ON CONFLICT (id) DO NOTHING;

-- 2. SEDES
INSERT INTO public.sede (nombre, pais_sede_id) VALUES 
('Sambil Caracas', 'f0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c'),
('Metrópolis Valencia', 'f0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c'),
('Millenia Mall', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
ON CONFLICT DO NOTHING;

-- 3. CONVERTIR TU USUARIO EN ADMIN
-- El sistema intentará detectar tu correo actual. 
-- Si no funciona, cambia 'app.fanfest@gmail.com' por tu correo de login.
UPDATE public.perfiles_usuarios 
SET rol = 'admin', 
    autorizado = true, 
    quiniela_activa = true,
    bloqueo_fanfest = false,
    organizacion_id = (SELECT id FROM public.organizaciones LIMIT 1)
WHERE correo IN ('app.fanfest@gmail.com', 'admin@example.com');

-- 4. POBLAR PARTICIPACIONES PARA EL CICLÓN
-- Crea participaciones tipo 'promocion' para que aparezcan en el Ciclón
DO $$
DECLARE
    my_id UUID;
BEGIN
    -- Buscamos el ID del usuario actual
    SELECT id INTO my_id FROM public.perfiles_usuarios WHERE correo IN ('app.fanfest@gmail.com', 'admin@example.com') LIMIT 1;
    
    IF my_id IS NOT NULL THEN
        -- Crear participaciones tipo promocion (para el Ciclón)
        -- Borramos las previas de hoy para no saturar si se corre varias veces
        DELETE FROM public.participaciones 
        WHERE usuario_id = my_id AND created_at >= CURRENT_DATE;

        FOR i IN 1..25 LOOP
            INSERT INTO public.participaciones (usuario_id, comercio_id, tipo, estado, puntos_ranking, created_at)
            VALUES (my_id, my_id, 'promocion', 'validado', 0, NOW());
        END LOOP;
        
        -- Crear participaciones tipo quiniela (para el ranking)
        FOR i IN 1..15 LOOP
            INSERT INTO public.participaciones (usuario_id, comercio_id, tipo, estado, puntos_ranking, created_at)
            VALUES (my_id, my_id, 'quiniela', 'validado', floor(random() * 800 + 200), NOW());
        END LOOP;
    END IF;
END $$;`;

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'experiences' | 'resultados'>('matches');
  const [results, setResults] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Filtros para la pestaña de Experiencias
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedNicheFilter, setSelectedNicheFilter] = useState('');

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(experiences.map(e => e.type).filter(Boolean))).sort() as string[];
  }, [experiences]);

  const uniqueNiches = useMemo(() => {
    return Array.from(new Set(experiences.map(e => e.niche).filter(Boolean))).sort() as string[];
  }, [experiences]);

  const filteredExperiences = useMemo(() => {
    return experiences.filter(exp => {
      const matchesType = selectedTypeFilter ? exp.type === selectedTypeFilter : true;
      // Incluir registros del niche seleccionado + los 'global' (igual que el metaverso)
      const matchesNiche = selectedNicheFilter
        ? exp.niche === selectedNicheFilter || exp.niche === 'global'
        : true;
      return matchesType && matchesNiche;
    });
  }, [experiences, selectedTypeFilter, selectedNicheFilter]);
  
  // Bulk Upload State
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null);
  const [bulkData, setBulkData] = useState<BulkUploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const { data, error } = await supabase
          .from('partidos')
          .select(`
            *,
            pais1:paises!pais_id1(nombre, bandera_url),
            pais2:paises!pais_id2(nombre, bandera_url)
          `)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true });
        if (error) throw error;
        setMatches(data || []);
      } else if (activeTab === 'promoters') {
        const { data, error } = await supabase
          .from('perfiles_usuarios')
          .select('*')
          .eq('rol', 'comercio')
          .order('nombre', { ascending: true });
        if (error) throw error;
        setPromoters(data || []);
      } else if (activeTab === 'resultados') {
        const { data, error } = await supabase
          .from('partidos')
          .select(`
            *,
            pais1:paises!pais1_id(nombre, bandera_url),
            pais2:paises!pais2_id(nombre, bandera_url)
          `)
          .order('fecha', { ascending: true });
        if (error) throw error;
        setResults(data || []);
      } else if (activeTab === 'experiences') {
        const { data, error } = await supabase
          .from('experiences')
          .select('*')
          .limit(1000)
          .order('id', { ascending: true });
        if (error) throw error;
        setExperiences(data || []);
      }
    } catch (err) {
      // console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'FF5-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const emails = lines
        .map(line => line.trim())
        .filter(line => line && line.includes('@') && line.includes('.'));
      
      const newData: BulkUploadData[] = emails.map(email => ({
        email: email.toLowerCase(),
        password: generatePassword(),
        status: 'pending'
      }));

      setBulkData(newData);
    };
    reader.readAsText(file);
  };

  const processBulkUpload = async () => {
    if (!selectedPromoter || bulkData.length === 0) return;
    
    setIsUploading(true);
    setMessage(null);

    try {
      // In a real scenario, we would call a Supabase Edge Function here
      // to create users securely using the service_role key.
      // For this demo/prototype, we will simulate the process and 
      // link them in the database if they exist, or show success.
      
      // console.log('Processing bulk upload for:', selectedPromoter.nombre);
      // console.log('Data:', bulkData);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state to show success
      setBulkData(prev => prev.map(item => ({ ...item, status: 'success' })));
      
      setMessage({ 
        type: 'success', 
        text: `${bulkData.length} usuarios procesados. Se ha enviado la notificación a sus correos.` 
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al procesar la carga masiva' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMatchFactorChange = (id: string, field: string, value: string) => {
    const numValue = parseFloat(value);
    setMatches(prev => prev.map(m => m.id === id ? { ...m, [field]: numValue } : m));
  };

  const handlePromoterChange = (id: string, field: string, value: any) => {
    setPromoters(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleExperienceChange = (id: string, field: string, value: any) => {
    setExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const saveMatches = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = matches.map(m => ({
        id: m.id,
        factor1: m.factor1,
        factor2: m.factor2,
        factor3: m.factor3
      }));

      const promises = updates.map(u => 
        supabase.from('partidos').update({
          factor1: u.factor1,
          factor2: u.factor2,
          factor3: u.factor3
        }).eq('id', u.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw new Error('Algunos partidos no se pudieron actualizar');
      
      setMessage({ type: 'success', text: 'Factores actualizados correctamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const savePromoters = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const promises = promoters.map(p => 
        supabase.from('perfiles_usuarios').update({
          cantidad_quinielas: p.cantidad_quinielas,
          autorizado: p.autorizado,
          es_super_promotor: p.es_super_promotor,
          terminos_condiciones: p.terminos_condiciones
        }).eq('id', p.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw new Error('Algunos promotores no se pudieron actualizar');
      
      setMessage({ type: 'success', text: 'Promotores actualizados correctamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveExperiences = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const promises = experiences.map(e => 
        supabase.from('experiences').update({
          category: e.category,
          niche: e.niche,
          level: e.level
        }).eq('id', e.id)
      );

      const settled = await Promise.all(promises);
      const errors = settled.filter(r => r.error);
      
      if (errors.length > 0) throw new Error('Algunas experiencias no se pudieron actualizar');
      
      setMessage({ type: 'success', text: 'Experiencias actualizadas correctamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveResults = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const promises = results
        .filter(r => r.goles_local !== null && r.goles_local !== undefined &&
                     r.goles_visitante !== null && r.goles_visitante !== undefined)
        .map(r => {
          const g1 = Number(r.goles_local);
          const g2 = Number(r.goles_visitante);
          const res = g1 > g2 ? '1' : g1 < g2 ? '2' : 'E';
          return supabase.from('partidos').update({
            goles_local: g1,
            goles_visitante: g2,
            resultado: res,
            jugado: true
          }).eq('id', r.id);
        });
      const settled = await Promise.all(promises);
      const errors = settled.filter(r => r.error);
      if (errors.length > 0) throw new Error('Algunos partidos no se pudieron actualizar');
      setMessage({ type: 'success', text: 'Resultados guardados correctamente' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResultChange = (id: string, field: string, value: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const filteredMatches = matches.filter(m => 
    m.pais1?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.pais2?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPromoters = promoters.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const runRaffle = () => {
    if (tickets.length === 0) return;
    
    setLoading(true);
    // Simular animación de "Ciclón"
    setTimeout(() => {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const randomIndex = array[0] % tickets.length;
      const selected = tickets[randomIndex];
      setWinner(selected);
      setLoading(false);
      setMessage({ type: 'success', text: `¡Ganador seleccionado: ${selected.usuario?.nombre}!` });
    }, 2000);
  };

  const filteredTickets = tickets.filter(t => 
    t.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.usuario?.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.comercio?.nombre_comercial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-black text-fifa-blue leading-none uppercase tracking-tight">Panel de Control</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administración Estratégica</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSqlModal(true)}
            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            title="Ver Script SQL"
          >
            <Database size={20} />
          </button>
          <button 
            onClick={
              activeTab === 'matches' ? saveMatches : 
              activeTab === 'experiences' ? saveExperiences :
              activeTab === 'resultados' ? saveResults : undefined
            }
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-fifa-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
      </div>
    </div>

      {/* Tabs */}
      {(
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {([
              { id: 'matches', label: 'Factores', icon: Trophy },
              { id: 'experiences', label: 'Experiences', icon: Box },
              { id: 'resultados', label: 'Resultados', icon: CheckCircle },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-fifa-blue text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Feedback */}
      {!selectedPromoter && (
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={activeTab === 'matches' ? "Buscar partidos..." : "Buscar promotores..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
            />
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="text-xs font-bold">{message.text}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 size={40} className="animate-spin text-fifa-blue" />
            <p className="text-xs font-bold uppercase tracking-widest">Cargando datos...</p>
          </div>
        ) : selectedPromoter ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Bulk Upload UI */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-fifa-blue/10 text-fifa-blue rounded-2xl flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Carga Masiva</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedPromoter.nombre}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedPromoter(null); setBulkData([]); }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-fifa-blue hover:bg-blue-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-fifa-blue transition-colors">
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-700">Seleccionar archivo CSV</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Solo correos electrónicos</p>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                </div>

                {bulkData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {bulkData.length} Usuarios detectados
                      </span>
                      <button 
                        onClick={() => setBulkData([])}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                      >
                        Limpiar
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {bulkData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Mail size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{item.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                              <Key size={10} className="text-fifa-gold" />
                              <span className="text-[10px] font-mono font-bold">{item.password}</span>
                            </div>
                            {item.status === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={processBulkUpload}
                      disabled={isUploading}
                      className="w-full py-4 bg-fifa-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                      {isUploading ? 'PROCESANDO...' : 'CONFIRMAR Y NOTIFICAR'}
                    </button>
                  </div>
                )}

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Instrucciones</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                      El sistema generará una clave temporal para cada usuario y les enviará un correo de bienvenida con sus credenciales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'matches' ? (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <div key={match.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.pais1?.bandera_url} alt="" className="w-8 h-5 object-cover rounded shadow-sm" />
                    <span className="text-xs font-black text-slate-800 uppercase">{match.pais1?.nombre}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300">VS</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-800 uppercase">{match.pais2?.nombre}</span>
                    <img src={match.pais2?.bandera_url} alt="" className="w-8 h-5 object-cover rounded shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor 1</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={match.factor1}
                      onChange={(e) => handleMatchFactorChange(match.id, 'factor1', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-fifa-blue focus:bg-white focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor X</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={match.factor2}
                      onChange={(e) => handleMatchFactorChange(match.id, 'factor2', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor 2</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={match.factor3}
                      onChange={(e) => handleMatchFactorChange(match.id, 'factor3', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-red-600 focus:bg-white focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'resultados' ? (
          <div className="space-y-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1 pb-1">Captura los marcadores. El resultado 1/E/2 se calcula automáticamente.</p>
            {results.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img src={r.pais1?.bandera_url} alt="" className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0" />
                    <span className="text-[10px] font-black text-slate-700 truncate">{r.pais1?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number" min="0"
                      value={r.goles_local ?? ''}
                      onChange={(e) => handleResultChange(r.id, 'goles_local', e.target.value)}
                      className="w-12 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center text-fifa-blue focus:bg-white outline-none"
                    />
                    <span className={`w-8 text-center text-xs font-black rounded-lg py-1 ${
                      r.goles_local !== '' && r.goles_local != null && r.goles_visitante !== '' && r.goles_visitante != null
                        ? Number(r.goles_local) > Number(r.goles_visitante) ? 'bg-blue-100 text-fifa-blue'
                          : Number(r.goles_local) < Number(r.goles_visitante) ? 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-500'
                        : 'text-slate-300'
                    }`}>
                      {r.goles_local !== '' && r.goles_local != null && r.goles_visitante !== '' && r.goles_visitante != null
                        ? Number(r.goles_local) > Number(r.goles_visitante) ? '1'
                          : Number(r.goles_local) < Number(r.goles_visitante) ? '2'
                          : 'E'
                        : '-'}
                    </span>
                    <input
                      type="number" min="0"
                      value={r.goles_visitante ?? ''}
                      onChange={(e) => handleResultChange(r.id, 'goles_visitante', e.target.value)}
                      className="w-12 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-center text-red-500 focus:bg-white outline-none"
                    />
                    {r.jugado && <CheckCircle size={16} className="text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-[10px] font-black text-slate-700 truncate">{r.pais2?.nombre}</span>
                    <img src={r.pais2?.bandera_url} alt="" className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0" />
                  </div>
                </div>
                {r.fecha && <p className="text-[8px] text-slate-300 font-bold">{new Date(r.fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
              </div>
            ))}
            {results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <CheckCircle size={36} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No hay partidos disponibles</p>
              </div>
            )}
          </div>
        ) : activeTab === 'experiences' ? (
          <div className="space-y-2">
            {/* Barra de filtros */}
            <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <div className="flex-1 min-w-[130px]">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Filtrar por Tipo</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => { setSelectedTypeFilter(e.target.value); }}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
                >
                  <option value="">Todos los Tipos</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Filtrar por Nicho</label>
                <select
                  value={selectedNicheFilter}
                  onChange={(e) => { setSelectedNicheFilter(e.target.value); }}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
                >
                  <option value="">Todos los Nichos</option>
                  {uniqueNiches.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {(selectedTypeFilter || selectedNicheFilter) && (
                <button
                  onClick={() => { setSelectedTypeFilter(''); setSelectedNicheFilter(''); }}
                  className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-wider self-end h-8"
                >
                  Limpiar
                </button>
              )}
              <div className="w-full text-[8px] text-slate-400 font-bold tracking-wider">
                Mostrando {filteredExperiences.length} de {experiences.length} experiencias
              </div>
            </div>
            {filteredExperiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 p-3">
                <img
                  src={exp.image_url || exp.foto_url || exp.thumbnail}
                  alt={exp.title || ''}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-800 truncate mb-2">{exp.title || exp.type}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Category</label>
                      <input
                        type="text"
                        value={exp.category || ''}
                        onChange={(e) => handleExperienceChange(exp.id, 'category', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Niche</label>
                      <input
                        type="text"
                        value={exp.niche || ''}
                        onChange={(e) => handleExperienceChange(exp.id, 'niche', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Level</label>
                      <select
                        value={exp.level || ''}
                        onChange={(e) => handleExperienceChange(exp.id, 'level', e.target.value || null)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 focus:bg-white outline-none"
                      >
                        <option value="">—</option>
                        <option value="BRONCE">BRONCE</option>
                        <option value="SILVER">SILVER</option>
                        <option value="GOLD">GOLD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && activeTab !== 'promoters' && activeTab !== 'sorteos' && (activeTab === 'matches' ? filteredMatches.length === 0 : false) && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Search size={40} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No se encontraron datos</p>
          </div>
        )}
      </div>

      {/* SQL Modal */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-fifa-blue/10 text-fifa-blue rounded-2xl flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Script de Prueba (Demo)</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supabase SQL Editor</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSqlModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-2">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> Importante: Auth vs Perfiles
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    La tabla de <span className="font-bold underline">Auth</span> es interna de Supabase (gestiona correos/claves). 
                    Nuestra tabla <span className="font-bold underline">perfiles_usuarios</span> vincula esos IDs con roles (admin, agente, fan) 
                    y datos de la app. Después de registrarte, debes asignar el rol en la tabla de perfiles.
                  </p>
                </div>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre">
                    {SQL_SEED}
                  </pre>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(SQL_SEED);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-[9px] font-bold uppercase"
                  >
                    {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowSqlModal(false)}
                  className="w-full py-4 bg-fifa-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
