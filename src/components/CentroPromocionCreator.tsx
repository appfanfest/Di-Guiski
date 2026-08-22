import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, MapPin, QrCode, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStatesForCountry } from '../lib/geography';

interface CentroPromocionCreatorProps {
  profile: any;
  onBack: () => void;
  onSuccess: () => void;
  isGuest?: boolean;
  onRegister?: () => void;
}

export const CentroPromocionCreator: React.FC<CentroPromocionCreatorProps> = ({ profile, onBack, onSuccess, isGuest, onRegister }) => {
  const [formData, setFormData] = useState({
    nombre_centro: profile.nombre_comercial || '',
    estado_geografico: profile.estado_geografico || '',
    direccion_detallada: profile.direccion_fisica || '',
    reglas_sorteo: 'Sube una foto etiquetando a @NuestroLocal para validar tu ticket.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar el país del promotor o por defecto usar el de residencia
  const countryForStates = (profile.pais_residencia || profile.pais_operativo_id || 'Venezuela').trim();
  const availableStates = getStatesForCountry(countryForStates);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest && onRegister) {
      onRegister();
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Asegurar que el perfil tiene el estado_geografico configurado
      if (!profile.estado_geografico) {
        await supabase
          .from('perfiles_usuarios')
          .update({ estado_geografico: formData.estado_geografico })
          .eq('id', profile.id);
      }

      // 2. Insertar el Centro sin ID para que Supabase lo genere, y sin qr_code_url temporalmente
      const { data: newCentro, error: insertError } = await supabase
        .from('centros_promocion')
        .insert({
          promotor_id: profile.id,
          nombre_centro: formData.nombre_centro,
          estado_geografico: formData.estado_geografico,
          direccion_detallada: formData.direccion_detallada,
          reglas_sorteo: formData.reglas_sorteo,
          qr_code_url: '' // temporal
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!newCentro) throw new Error('No se pudo obtener el ID del centro creado.');

      // 3. Generar el QR con el ID real de la base de datos
      const qrData = `https://app.mundialquiniela.com/centro/${newCentro.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;

      // 4. Actualizar el registro con el QR definitivo
      const { error: updateError } = await supabase
        .from('centros_promocion')
        .update({ qr_code_url: qrUrl })
        .eq('id', newCentro.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al crear el centro de promoción.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-bold uppercase tracking-widest">Volver</span>
      </button>

      <div className="mb-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
          <Store size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">
          Crear Centro de Promociones
        </h2>
        <p className="text-slate-500 font-medium">
          Registra tu local para generar un código QR y permitir que los usuarios generen sus tickets digitales desde allí.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Centro/Local</label>
          <input 
            type="text" 
            required
            value={formData.nombre_centro}
            onChange={(e) => setFormData({...formData, nombre_centro: e.target.value})}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            placeholder="Ej. Sports Bar El Campeón"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estado / Región</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                required
                value={formData.estado_geografico}
                onChange={(e) => setFormData({...formData, estado_geografico: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-11 pr-4 py-3 font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors appearance-none"
              >
                <option value="">Selecciona tu estado/región</option>
                {availableStates.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-2">Los usuarios deberán estar en este estado para participar.</p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Dirección Detallada</label>
            <input 
              type="text" 
              required
              value={formData.direccion_detallada}
              onChange={(e) => setFormData({...formData, direccion_detallada: e.target.value})}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              placeholder="Ej. C.C. Sambil, Nivel Feria"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reglas para Validar Ticket</label>
          <textarea 
            required
            rows={3}
            value={formData.reglas_sorteo}
            onChange={(e) => setFormData({...formData, reglas_sorteo: e.target.value})}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <QrCode size={20} />
              Crear Centro y Generar QR
            </>
          )}
        </button>
      </form>
    </div>
  );
};
