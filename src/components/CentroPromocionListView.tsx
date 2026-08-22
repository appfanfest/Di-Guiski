import React, { useEffect, useState } from 'react';
import { Store, Plus, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CentroPromocionListViewProps {
  profile: any;
  onCreateNew: () => void;
  isGuest?: boolean;
}

export const CentroPromocionListView: React.FC<CentroPromocionListViewProps> = ({ profile, onCreateNew, isGuest }) => {
  const handleDownloadQR = async (url: string, nombre: string) => {
    if (isGuest) {
      alert("En modo demo no se pueden descargar archivos. ¡Regístrate para activar tu centro!");
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_${nombre.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading QR:', err);
      // Fallback
      window.open(url, '_blank');
    }
  };
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest) {
      setCentros([{
        id: 'c1',
        nombre_centro: 'Mi Negocio Local (Demo)',
        estado_geografico: 'Estado Miranda',
        direccion_detallada: 'Av. Principal Local 5',
        qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=demo-niche'
      }]);
      setLoading(false);
    } else {
      fetchCentros();
    }
  }, [profile.id, isGuest]);

  const fetchCentros = async () => {
    if (isGuest) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('centros_promocion')
        .select('*')
        .eq('promotor_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCentros(data || []);
    } catch (err: any) {
      console.error('Error fetching centros:', err);
      setError('Error al cargar tus Centros de Promoción.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100">
        <AlertCircle className="shrink-0 mt-0.5" size={18} />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between px-2 pt-2 mb-6">
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-800">MIS CENTROS</h2>
        <button 
          onClick={onCreateNew}
          className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {centros.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Sin Centros Activos</h3>
          <p className="text-sm text-slate-500 font-medium">
            Crea tu primer Centro de Promoción para obtener tu código QR y permitir que tus clientes participen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {centros.map(centro => (
            <div key={centro.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-tight">{centro.nombre_centro}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{centro.estado_geografico}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 font-medium">{centro.direccion_detallada}</p>
              </div>
              
              <div className="w-full md:w-auto shrink-0 bg-slate-50 p-4 rounded-2xl flex flex-col items-center">
                <img src={centro.qr_code_url} alt="QR Code" className="w-24 h-24 rounded-lg bg-white mb-3 shadow-sm border border-slate-100" />
                <button onClick={() => handleDownloadQR(centro.qr_code_url, centro.nombre_centro)} className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">
                  Descargar QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
