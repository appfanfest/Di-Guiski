import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Loader2, AlertCircle, X, Calendar, Users, ChevronDown, ChevronUp, FileDown, Trophy } from 'lucide-react';
import { PDFService } from '../lib/pdf-service';

interface GestorMiembrosProps {
  profile: any;
  onBack: () => void;
}

interface Miembro {
  id: string;
  user_id: string;
  quiniela_id: string;
  id_interno_validado: string | null;
  suscrito_en: string;
  perfiles_usuarios: {
    nombre: string;
    email?: string;
  };
}

interface QuinielaConMiembros {
  id: string;
  nombre: string;
  tipo: string;
  activa: boolean;
  notificacion: string | null;
  miembros: Miembro[];
  expanded: boolean;
}

export const GestorMiembros: React.FC<GestorMiembrosProps> = ({ profile, onBack }) => {
  const [quinielas, setQuinielas] = useState<QuinielaConMiembros[]>([]);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardandoNotif, setGuardandoNotif] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ miembro: Miembro, quinielaNombre: string, totalMiembros: number } | null>(null);

  const handleUpdateNotificacion = async (quiniela_id: string, text: string) => {
    setGuardandoNotif(quiniela_id);
    setError(null);

    const { error: updateError } = await supabase
      .from('quinielas_instancias')
      .update({ notificacion: text })
      .eq('id', quiniela_id);

    setGuardandoNotif(null);

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la notificación');
      return;
    }

    // Actualizar localmente
    setQuinielas(prev => prev.map(q => q.id === quiniela_id ? { ...q, notificacion: text } : q));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!profile?.id) {
      setLoading(false);
      setError("No se pudo identificar al promotor");
      return;
    }

    setLoading(true);
    try {
      // Obtener todas las quinielas del promotor
      const { data: instancias, error: instError } = await supabase
        .from('quinielas_instancias')
        .select('id, nombre, tipo, activa, notificacion')
        .eq('gestor_id', profile.id)
        .eq('activa', true)
        .order('created_at', { ascending: false });

      if (instError) throw instError;
      if (!instancias) { setLoading(false); return; }

      // Por cada quiniela, obtener sus miembros activos
      const quinielasConMiembros = await Promise.all(
        instancias.map(async (q) => {
          const { data: miembros, error: mError } = await supabase
            .from('quiniela_suscripciones')
            .select(`
              id, user_id, quiniela_id, id_interno_validado, suscrito_en,
              perfiles_usuarios (nombre, identificacion)
            `)
            .eq('quiniela_id', q.id)
            .eq('estado', 'activa')
            .order('suscrito_en', { ascending: false });

          if (mError) console.error(`Error loading members for ${q.id}:`, mError);

          return {
            ...q,
            miembros: (miembros || []) as any,
            expanded: false,
          };
        })
      );

      setQuinielas(quinielasConMiembros);
    } catch (err: any) {
      console.error('FetchData error:', err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setQuinielas(prev => prev.map(q => q.id === id ? { ...q, expanded: !q.expanded } : q));
  };

  const handleAnular = async (quiniela_id: string, user_id: string) => {
    const key = `${quiniela_id}-${user_id}`;
    setAnulando(key);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('anular_suscripcion', {
      p_quiniela_id: quiniela_id,
      p_user_id: user_id,
      p_anulado_por: 'promotor',
    });

    setAnulando(null);

    if (rpcError || !data?.ok) {
      setError(data?.error || 'No se pudo anular');
      return;
    }

    // Actualizar lista local
    setQuinielas(prev => prev.map(q => {
      if (q.id !== quiniela_id) return q;
      return { ...q, miembros: q.miembros.filter(m => m.user_id !== user_id) };
    }));
  };

  const handleExportPDF = (q: QuinielaConMiembros) => {
    PDFService.generatePromoterParticipantReport(
      { nombre: q.nombre },
      q.miembros.map(m => ({
        perfil: m.perfiles_usuarios,
        id_interno_validado: m.id_interno_validado,
        created_at: m.suscrito_en
      }))
    );
  };

  const handleExportDetailed = async (q: QuinielaConMiembros) => {
    setLoading(true);
    try {
      // 1. Obtener Partidos
      const { data: matches } = await supabase.from('partidos').select('*, pais1:pais_id1(*), pais2:pais_id2(*)').order('fecha');
      
      // 2. Obtener Predicciones de todos los miembros
      const userIds = q.miembros.map(m => m.user_id);
      const { data: allPreds } = await supabase
        .from('quinielas')
        .select('*')
        .in('usuario_id', userIds)
        .order('created_at', { ascending: true });

      await PDFService.generatePromoterDetailedReport(
        { nombre: q.nombre },
        q.miembros.map(m => ({ perfil: m.perfiles_usuarios, user_id: m.user_id })),
        matches || [],
        allPreds || []
      );
    } catch (err) {
      console.error(err);
      setError("Error al generar reporte detallado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}
          className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 text-slate-600 font-black text-[11px] uppercase group active:scale-95 transition-all">
          <X size={16} className="text-slate-400" />
          Cerrar
        </button>
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Promotor</p>
          <h1 className="text-xl font-black uppercase italic leading-none">Gestión de Miembros</h1>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 text-red-600">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p className="text-[11px] font-black uppercase">{error}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-[11px] font-bold uppercase">Cargando...</span>
        </div>
      ) : quinielas.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-[11px] text-slate-400 font-bold uppercase">No tienes quinielas activas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quinielas.map((q) => (
            <div key={q.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              {/* Quiniela header */}
              <button
                onClick={() => toggleExpand(q.id)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{q.tipo}</p>
                  <h3 className="text-base font-black uppercase italic leading-tight">{q.nombre}</h3>
                  <div className="flex items-center gap-1 mt-1 text-slate-400">
                    <Users size={10} />
                    <span className="text-[10px] font-bold">{q.miembros.length} miembro{q.miembros.length !== 1 ? 's' : ''} activo{q.miembros.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleExportPDF(q); }}
              className="px-4 h-12 bg-white text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all group"
              title="Descargar PDF de Participantes"
            >
              <FileDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Reporte PDF</span>
            </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleExportDetailed(q); }}
                    className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                    title="Exportar Detalle de Jugadas"
                  >
                    <Trophy size={18} />
                  </button>
                  {q.expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {/* Members list */}
              {q.expanded && (
                <div className="border-t border-slate-50">
                  {/* Edición de Notificación */}
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      📢 Comunicado o Notificación para los Participantes
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={q.notificacion || ''}
                        id={`notif-input-${q.id}`}
                        placeholder="Ej: ¡Este sábado tendremos sorteo de gorras oficiales a las 6 PM!..."
                        className="flex-1 rounded-xl px-4 py-2 border-2 border-slate-100 bg-white focus:outline-none focus:border-emerald-500 font-bold text-[12px]"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`notif-input-${q.id}`) as HTMLInputElement;
                          if (input) handleUpdateNotificacion(q.id, input.value.trim());
                        }}
                        disabled={guardandoNotif === q.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50 shrink-0"
                      >
                        {guardandoNotif === q.id ? <Loader2 size={12} className="animate-spin" /> : 'Publicar'}
                      </button>
                    </div>
                  </div>

                  {q.miembros.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-[10px] text-slate-300 font-bold uppercase">Sin miembros aún</p>
                    </div>
                  ) : (
                    q.miembros.map((m, idx) => {
                      const key = `${q.id}-${m.user_id}`;
                      const isAnulando = anulando === key;

                      return (
                        <div key={m.id}
                          onClick={() => setSelectedMember({ miembro: m, quinielaNombre: q.nombre, totalMiembros: q.miembros.length })}
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${idx < q.miembros.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black uppercase truncate">{m.perfiles_usuarios?.nombre || 'Usuario'}</p>
                            {m.id_interno_validado && (
                              <p className="text-[9px] text-slate-400 font-bold truncate">ID: {m.id_interno_validado}</p>
                            )}
                            <div className="flex items-center gap-1 mt-0.5 text-slate-300">
                              <Calendar size={9} />
                              <span className="text-[9px] font-bold">
                                {new Date(m.suscrito_en).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAnular(q.id, m.user_id); }}
                            disabled={isAnulando}
                            className="shrink-0 w-8 h-8 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all disabled:opacity-50 ml-3"
                            title="Anular membresía"
                          >
                            {isAnulando ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden relative">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black italic uppercase text-slate-800 leading-none">{selectedMember.miembro.perfiles_usuarios?.nombre}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalle del Miembro</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="w-8 h-8 bg-white rounded-xl shadow-sm text-slate-400 flex items-center justify-center border border-slate-100"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fifa-blue/10 rounded-xl flex items-center justify-center text-fifa-blue">
                  <Trophy size={18} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Quiniela</p>
                  <p className="text-sm font-bold text-slate-800">{selectedMember.quinielaNombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Inscritos</p>
                  <p className="text-sm font-bold text-slate-800">{selectedMember.totalMiembros} miembros activos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Fecha de Inscripción</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedMember.miembro.suscrito_en).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              {selectedMember.miembro.id_interno_validado && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID Validado</p>
                  <p className="text-base font-black text-slate-800">{selectedMember.miembro.id_interno_validado}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
