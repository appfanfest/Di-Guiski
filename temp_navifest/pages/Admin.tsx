
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Sparkles, Users, LogOut, ChevronRight, CreditCard, Ticket, Github, Layers, Loader2, AlertCircle, QrCode } from 'lucide-react';

export const Admin: React.FC = () => {
    const { user, logout, currentNiche, setCurrentNiche } = useAppContext();
    const navigate = useNavigate();
    const [availableNiches, setAvailableNiches] = useState<{id: any, name: string}[]>([]);
    const [loadingNiches, setLoadingNiches] = useState(false);
    const [nicheError, setNicheError] = useState<string | null>(null);

    const clean = (s: any) => {
        if (s === null || s === undefined) return '';
        return String(s).toLowerCase().replace(/\s+/g, '').trim();
    };

    useEffect(() => {
        const fetchNicheNames = async () => {
            setLoadingNiches(true); setNicheError(null);
            try {
                const { data, error } = await supabase.from('niches').select('id, name').order('name');
                if (error) throw error;
                if (data) setAvailableNiches(data);
            } catch (error: any) { setNicheError(error?.message); }
            finally { setLoadingNiches(false); }
        };
        fetchNicheNames();
    }, []);

    const menuItems = [
        { title: 'Gestionar Experiencias', desc: 'Crear, editar o eliminar filtros y experiencias AR.', icon: Sparkles, color: 'text-navifest-gold', bg: 'bg-yellow-900/20 border-yellow-800', action: () => navigate('/admin/experiences') },
        { title: 'Usuarios y Planes', desc: 'Ver lista de usuarios y gestionar accesos.', icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800', action: () => navigate('/admin/users') },
        { title: 'Gestión de Pagos', desc: 'Auditoría, validación y control de ingresos.', icon: CreditCard, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800', action: () => navigate('/admin/payments') },
        { title: 'Generador de QR', desc: 'Crear códigos QR de activación para clientes comerciales.', icon: QrCode, color: 'text-navifest-green', bg: 'bg-green-900/20 border-green-800', action: () => navigate('/admin/qr-generator') },
        { title: 'Cupones', desc: 'Gestionar códigos de descuento promocionales.', icon: Ticket, color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800', action: () => navigate('/admin/coupons') },
        { title: 'Respaldo GitHub', desc: 'Exportar código fuente y base de datos para GitHub.', icon: Github, color: 'text-navifest-red', bg: 'bg-red-900/20 border-red-800', action: () => navigate('/admin/github') }
    ];

    const handleNicheSwitch = (id: any) => {
        setCurrentNiche(id);
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-4xl">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white font-display uppercase tracking-tighter">Panel de Control</h1>
                        <p className="text-gray-400 mt-2 font-medium">Bienvenido, <span className="text-white">{user?.name || 'Admin'}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-2 mt-6 md:mt-0">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-1"><Layers size={12}/> Cambiar Mundo Atlantis:</span>
                        <div className="flex flex-wrap justify-end gap-1.5 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 shadow-2xl">
                            {loadingNiches ? <div className="px-6 py-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin text-gray-600" /></div> : nicheError ? <div className="px-4 py-2 text-red-500 flex items-center gap-1"><AlertCircle size={12}/></div> : availableNiches.map((n) => (
                                <button key={n.id} onClick={() => handleNicheSwitch(n.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${clean(currentNiche) === clean(n.id) ? 'bg-navifest-red text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}>{n.name}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, idx) => (
                        <div key={idx} onClick={item.action} className={`relative p-8 rounded-[2.5rem] border cursor-pointer group transition-all duration-500 hover:scale-[1.02] ${item.bg} border-gray-800/50 hover:border-gray-500 shadow-2xl overflow-hidden`}>
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-4 rounded-2xl bg-black/40 ${item.color} border border-white/5`}><item.icon size={28} /></div>
                                <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300"><ChevronRight className="text-white" size={20} /></div>
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{item.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-16 flex justify-center">
                    <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-[11px] hover:bg-red-500/10 px-8 py-4 rounded-2xl transition-all">
                        <LogOut size={18} /><span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
