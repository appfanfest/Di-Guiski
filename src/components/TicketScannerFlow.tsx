import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, ShieldCheck, QrCode, Store, Sparkles, Loader2, PlayCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';


interface TicketScannerFlowProps {
  profile: any;
  centroId: string; // The ID scanned from the QR
  onBack: () => void;
}

export const TicketScannerFlow: React.FC<TicketScannerFlowProps> = ({ profile, centroId, onBack }) => {
  const [centro, setCentro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validLocation, setValidLocation] = useState<boolean | null>(null);
  const [showBingo, setShowBingo] = useState(false);

  useEffect(() => {
    fetchCentroData();
  }, [centroId]);

  const fetchCentroData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Centro details
      const { data: centroData, error: centroError } = await supabase
        .from('centros_promocion')
        .select('*')
        .eq('id', centroId)
        .single();

      if (centroError) throw new Error(`Error BD: ${centroError.message} (ID Buscado: ${centroId})`);
      if (!centroData) throw new Error(`Centro no encontrado (ID: ${centroId}). Revisa las políticas RLS.`);
      if (!centroData.activo) throw new Error('Este Centro de Promoción actualmente no está activo.');

      setCentro(centroData);

      // Validate Geo Location
      if (!profile?.estado_residencia) {
        setValidLocation(false);
        setError('Tu perfil no tiene un estado/región configurado. Actualiza tu perfil para participar.');
      } else if (profile.estado_residencia !== centroData.estado_geografico) {
        setValidLocation(false);
        setError(`Este código QR solo es válido para usuarios en ${centroData.estado_geografico}. Tu perfil indica que estás en ${profile.estado_residencia}.`);
      } else {
        setValidLocation(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar el centro.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Validando QR...</p>
      </div>
    );
  }

  if (showBingo) {
    return (
      <div className="p-4 md:p-8">
        <button 
          onClick={() => setShowBingo(false)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Volver al Local</span>
        </button>
        
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-12">
      <div className="bg-slate-900 px-6 pt-12 pb-24 text-white relative overflow-hidden rounded-b-[3rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <button 
          onClick={onBack}
          className="relative z-10 flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Atrás</span>
        </button>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10">
            <Store size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">
            {centro?.nombre_centro || 'Centro de Promoción'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-widest">
            <MapPin size={16} />
            <span>{centro?.estado_geografico}</span>
          </div>
        </div>
      </div>

      <div className="-mt-16 px-6 relative z-20">
        <AnimatePresence mode="wait">
          {!validLocation || error ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-red-100 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic mb-3">Acceso Denegado</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                {error}
              </p>
              <button 
                onClick={onBack}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Validation Success Box */}
              <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200 flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                  <ShieldCheck size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-lg leading-tight mb-1">Ubicación Validada</h4>
                  <p className="text-xs font-medium text-emerald-100 leading-relaxed">
                    Te encuentras en la región correcta. Estás habilitado para participar en los sorteos de este local.
                  </p>
                </div>
              </div>

              {/* Rules Box */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reglas del Local</h5>
                <p className="text-sm font-medium text-slate-700 italic">
                  "{centro?.reglas_sorteo}"
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2">
                <button 
                  onClick={() => setShowBingo(true)}
                  className="w-full bg-fifa-gold text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-100/50"
                >
                  <Sparkles size={24} />
                  Jugar Bingo Mundialista
                </button>

                <button 
                  className="w-full bg-white text-slate-700 border-2 border-slate-200 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <QrCode size={24} />
                  Generar Ticket Estándar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

