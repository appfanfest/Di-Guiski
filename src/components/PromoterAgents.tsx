import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  UserPlus, 
  Loader2,
  Lock,
  Smartphone,
  QrCode,
  Scan,
  Power,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Agent {
  id: string;
  nombre: string;
  correo: string;
  nombre_punto: string;
  agente_activo?: boolean;
}

interface PromoterAgentsProps {
  masterProfile: any;
}

export const PromoterAgents: React.FC<PromoterAgentsProps> = ({ masterProfile }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAgent, setScannedAgent] = useState<{ uid: string, name: string, email: string } | null>(null);
  const [newAgent, setNewAgent] = useState({ 
    nombre: '', 
    correo: '', 
    password: '', 
    nombre_punto: '' 
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (isScanning && !scannedAgent) {
      const scanner = new Html5QrcodeScanner(
        "agent-scanner",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.type === 'fanfest_agent_identity' && data.uid) {
            setScannedAgent({
              uid: data.uid,
              name: data.name,
              email: data.email
            });
            setNewAgent(prev => ({ ...prev, correo: data.email }));
            scanner.clear();
          }
        } catch (e) {
          console.error("Invalid QR", e);
        }
      }, (err) => {});

      return () => {
        scanner.clear().catch(e => {});
      };
    }
  }, [isScanning, scannedAgent]);

  async function fetchAgents() {
    try {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('id, nombre, correo, nombre_punto, agente_activo')
        .eq('parent_id', masterProfile.id);
      
      if (error) throw error;
      setAgents(data || []);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAgentActive(agentId: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('perfiles_usuarios')
        .update({ agente_activo: !currentState })
        .eq('id', agentId);
      
      if (error) throw error;
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, agente_activo: !currentState } : a));
    } catch (err: any) {
      console.error('Error toggling agent:', err);
    }
  }

  async function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Create user in Auth (This requires a specialized setup or letting the admin do it)
      // Since we are in a demo/client-side environment, we'll use a simplified flow:
      // In a real app, this would call a Edge Function to create an auth user without logging out the current one.
      // For this implementation, we assume the commerce manually creates the user or we use a "Linking Code" flow.
      
      // ALTERNATIVE: The commerce provides the email of an ALREADY REGISTERED user to link them.
      const { data: targetUser, error: findError } = await supabase
        .from('perfiles_usuarios')
        .select('id, rol')
        .eq('correo', newAgent.correo)
        .single();

      if (findError) throw new Error('El correo no está registrado en la plataforma. El operador debe crear una cuenta primero.');

      if (targetUser.rol !== 'jugador' && targetUser.rol !== 'comercio') {
         throw new Error('Este usuario tiene un rol que no permite ser agente.');
      }

      // Update the target user to be an agent of this master
      const { error: updateError } = await supabase
        .from('perfiles_usuarios')
        .update({
          parent_id: masterProfile.id,
          nombre_punto: newAgent.nombre_punto,
          rol: 'comercio' // Force commerce role for scanner access
        })
        .eq('id', targetUser.id);

      if (updateError) throw updateError;

      setStatus({ type: 'success', message: '¡Agente vinculado con éxito!' });
      setNewAgent({ nombre: '', correo: '', password: '', nombre_punto: '' });
      setIsAdding(false);
      setIsScanning(false);
      setScannedAgent(null);
      fetchAgents();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function unlinkAgent(agentId: string) {
    if (!confirm('¿Seguro que deseas desvincular este punto de escaneo?')) return;
    
    try {
      const { error } = await supabase
        .from('perfiles_usuarios')
        .update({ parent_id: null, nombre_punto: null })
        .eq('id', agentId);
      
      if (error) throw error;
      fetchAgents();
    } catch (err: any) {
      console.error('Error unlinking agent:', err);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fifa-gold/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/10">
            <Smartphone size={28} className="text-fifa-gold" />
          </div>
          <h2 className="text-3xl font-black mb-2 leading-tight">Puntos de Captura</h2>
          <p className="text-slate-400 text-sm">Gestiona múltiples dispositivos de escaneo vinculados a tu local.</p>
        </div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 text-sm font-bold",
            status.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}
        >
          {status.type === 'success' ? <ShieldCheck size={20} /> : <Lock size={20} />}
          {status.message}
        </motion.div>
      )}

      {isAdding ? (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <button 
            onClick={() => { setIsAdding(false); setIsScanning(false); setScannedAgent(null); }}
            className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-fifa-blue" />
            Vincular Punto de Escaneo
          </h3>

          {!isScanning && !scannedAgent ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setIsScanning(true)}
                className="flex flex-col items-center justify-center p-6 bg-blue-50 border-2 border-fifa-blue/10 rounded-2xl gap-3 hover:bg-blue-100 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-fifa-blue group-hover:scale-110 transition-transform">
                  <Scan size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-fifa-blue text-center">Escanear QR de Agente</span>
              </button>
              <button 
                className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl gap-3 grayscale opacity-60"
                disabled
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                  <UserPlus size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Ingreso Manual (Deshabilitado)</span>
              </button>
            </div>
          ) : isScanning && !scannedAgent ? (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative border-4 border-slate-100">
                <div id="agent-scanner" className="w-full h-full"></div>
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                   <p className="bg-black/60 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">Escaneando Identidad de Agente...</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScanning(false)}
                className="w-full py-3 text-slate-500 font-bold text-xs uppercase"
              >
                Cancelar Escaneo
              </button>
            </div>
          ) : scannedAgent && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Agente Detectado</p>
                  <p className="text-sm font-black text-slate-800">{scannedAgent.name}</p>
                  <p className="text-[10px] text-slate-500">{scannedAgent.email}</p>
                </div>
              </div>

              <form onSubmit={handleAddAgent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Ubicación</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={newAgent.nombre_punto}
                    onChange={e => setNewAgent({...newAgent, nombre_punto: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-fifa-blue/20 outline-none transition-all"
                    placeholder="Ej: Puerta Norte, Stand 2, Seguridad"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-fifa-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-fifa-blue/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <Smartphone size={18} />
                      Vincular Dispositivo Ahora
                    </>
                  )}
                </button>
                <button 
                   type="button" 
                   onClick={() => setScannedAgent(null)}
                   className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
                >
                  Escatear otro QR
                </button>
              </form>
            </motion.div>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-6 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:border-fifa-blue/30 hover:text-fifa-blue transition-all group"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Scan size={24} />
          </div>
          <span className="text-sm">Escanear Nuevo Agente</span>
          <p className="text-[9px] text-slate-300 font-medium uppercase tracking-[0.2em]">Rápido & Seguro</p>
        </button>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Puntos Activos ({agents.length})</h3>
          <button onClick={fetchAgents} className="p-1 hover:rotate-180 transition-all duration-500">
            <RefreshCw size={14} className="text-slate-300" />
          </button>
        </div>
        
        {loading && agents.length === 0 ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-slate-200" size={32} />
          </div>
        ) : agents.length > 0 ? (
          agents.map(agent => (
            <div key={agent.id} className={cn(
              "bg-white p-5 rounded-3xl border flex items-center justify-between shadow-sm transition-all",
              agent.agente_activo === false ? "opacity-60 border-slate-100 grayscale" : "border-slate-100"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  agent.agente_activo === false ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-500"
                )}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {agent.nombre_punto}
                    {agent.agente_activo === false && (
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[8px] rounded uppercase">Inactivo</span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{agent.nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleAgentActive(agent.id, agent.agente_activo !== false)}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    agent.agente_activo === false ? "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500" : "text-emerald-500 hover:bg-red-50 hover:text-red-500"
                  )}
                  title={agent.agente_activo === false ? "Activar" : "Desactivar"}
                >
                  <Power size={18} />
                </button>
                <button 
                  onClick={() => unlinkAgent(agent.id)}
                  className="p-3 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : !isAdding && (
          <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <Users size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">No hay agentes vinculados aún.</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
          <ShieldCheck size={14} />
          Nota de Seguridad
        </h4>
        <p className="text-[11px] text-amber-700/80 leading-relaxed">
          Los puntos de captura solo tendrán acceso al escáner. No podrán ver tus estadísticas, balance o base de datos. Puedes revocarlos en cualquier momento.
        </p>
      </div>
    </div>
  );
};
