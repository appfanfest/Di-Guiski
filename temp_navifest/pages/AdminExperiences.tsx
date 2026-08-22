
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { Experience, ExperienceType, AccessLevel, SocialNetwork, NicheType, NicheTypeEnum } from '../types';
import { ChevronLeft, Save, Trash2, Edit, Plus, X, CheckCircle, Loader2, Image as ImageIcon, Link as LinkIcon, Copy, Users, RefreshCw, Hash, Globe, Layers } from 'lucide-react';

const INITIAL_FORM = {
    title: '',
    description: '',
    type: ExperienceType.HORA_LOCA_HATS,
    level: AccessLevel.BRONZE,
    socialNetwork: SocialNetwork.TIKTOK,
    imageUrl: '',
    activationLink: '',
    demoLink: '',
    category: 'General',
    isMultiUser: false,
    niche: NicheTypeEnum.NAVIFEST
};

export const AdminExperiences: React.FC = () => {
    const navigate = useNavigate();
    const { experiences, fetchExperiences, addExperience, updateExperience, deleteExperience, duplicateExperience, loading, currentNiche } = useAppContext();
    
    // UI States
    const [view, setView] = useState<'list' | 'form'>('list');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [dbNiches, setDbNiches] = useState<{id: string, name: string}[]>([]);
    
    // Form Data
    const [formData, setFormData] = useState({ ...INITIAL_FORM, niche: currentNiche });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar nichos disponibles desde la DB para el formulario (usando 'niches' plural)
    useEffect(() => {
        const loadNiches = async () => {
            try {
                const { data, error } = await supabase.from('niches').select('id, name').order('name');
                if (error) throw error;
                if (data) setDbNiches(data);
            } catch (e: any) {
                console.error("Error loading niches list:", e?.message || e);
            }
        };
        loadNiches();
    }, []);

    // Sugerencias de categorías dinámicas basadas en lo que ya existe
    const existingCategories = useMemo(() => {
        return Array.from(new Set(experiences.map(e => e.category || 'General'))).sort();
    }, [experiences]);

    const handleCreateNew = () => {
        setFormData({ ...INITIAL_FORM, niche: currentNiche });
        setEditingId(null);
        setFeedback(null);
        setView('form');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchExperiences();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleEdit = (exp: Experience) => {
        setFormData({
            title: exp.title,
            description: exp.description || '',
            type: exp.type,
            level: exp.level,
            socialNetwork: exp.socialNetwork,
            imageUrl: exp.imageUrl,
            activationLink: exp.activationLink,
            demoLink: exp.demoLink,
            category: exp.category || 'General',
            isMultiUser: exp.isMultiUser,
            niche: exp.niche
        });
        setEditingId(exp.id);
        setFeedback(null);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDuplicate = (id: string) => {
        duplicateExperience(id);
        setFeedback({ type: 'success', msg: '¡Duplicado!' });
        setTimeout(() => setFeedback(null), 2000);
    };

    const handleDelete = (id: string) => {
        if(!window.confirm("¿Estás seguro de eliminar esta experiencia?")) return;
        deleteExperience(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!formData.title.trim()) { setFeedback({type:'error', msg:'El título es obligatorio'}); return; }
        if(!formData.imageUrl.trim()) { setFeedback({type:'error', msg:'La URL de imagen es obligatoria'}); return; }
        if(!formData.activationLink.trim()) { setFeedback({type:'error', msg:'El Link de activación es obligatorio'}); return; }

        setIsSubmitting(true);
        setFeedback(null);

        // Limpiar el ID del nicho antes de enviar (minúsculas y sin espacios)
        const cleanNiche = formData.niche.toLowerCase().replace(/\s+/g, '').trim();
        const dataToSubmit = { ...formData, niche: cleanNiche };

        if(editingId) {
            updateExperience({ ...dataToSubmit, id: editingId } as Experience);
        } else {
            addExperience(dataToSubmit);
        }

        setFeedback({ type: 'success', msg: editingId ? 'Guardado' : 'Creado' });
        setTimeout(() => {
            setView('list');
            setFormData({ ...INITIAL_FORM, niche: currentNiche });
            setEditingId(null);
            setFeedback(null);
            setIsSubmitting(false);
        }, 500);
    };

    const filteredList = experiences.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                <button 
                    onClick={() => view === 'form' ? setView('list') : navigate('/admin')}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white font-display">
                        {view === 'list' ? 'Gestión de Catálogo' : (editingId ? 'Editar' : 'Nueva Experiencia')}
                    </h1>
                    {view === 'list' && <p className="text-xs text-gray-500">{filteredList.length} items en nicho: {currentNiche}</p>}
                </div>
            </div>

            {/* --- LIST VIEW --- */}
            {view === 'list' && (
                <div className="space-y-6">
                    {feedback && (
                        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
                             <CheckCircle size={16} /> {feedback.msg}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-between sticky top-16 bg-black/90 backdrop-blur-md p-2 z-40 border-b border-gray-800">
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-navifest-gold w-full sm:w-64"
                        />
                        <div className="flex gap-2">
                             <button 
                                onClick={handleRefresh}
                                className={`bg-gray-800 text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors flex items-center justify-center shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}
                                title="Refrescar Datos"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button 
                                onClick={handleCreateNew}
                                className="bg-navifest-gold text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Nueva</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            Cargando...
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed text-gray-500">
                            Sin resultados en este nicho.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredList.map(exp => (
                                <div key={exp.id} className="relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden group hover:border-gray-500 transition-all flex flex-col">
                                    <div className="relative aspect-[9/16] bg-gray-800">
                                        <img src={exp.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40"></div>
                                        <div className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            exp.level === 'Gold' ? 'bg-yellow-500 text-black' : 
                                            exp.level === 'Silver' ? 'bg-gray-300 text-black' : 'bg-orange-800 text-white'
                                        }`}>
                                            {exp.level}
                                        </div>
                                        
                                        {/* Niche Badge */}
                                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[7px] px-1 py-0.5 rounded border border-white/10 uppercase font-black">
                                            {exp.niche}
                                        </div>

                                        <div className="absolute bottom-10 left-0 right-0 p-2">
                                            <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight">{exp.title}</h3>
                                            <p className="text-[9px] text-gray-400 truncate mt-0.5">{exp.category}</p>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                            <button onClick={() => handleEdit(exp)} className="w-full bg-white text-black py-1.5 rounded text-xs font-bold hover:bg-gray-200">Editar</button>
                                            <div className="flex w-full gap-2">
                                                <button onClick={() => handleDuplicate(exp.id)} className="flex-1 bg-blue-600/20 text-blue-400 py-1.5 rounded border border-blue-600/50 flex justify-center"><Copy size={14} /></button>
                                                <button onClick={() => handleDelete(exp.id)} className="flex-1 bg-red-600/20 text-red-500 py-1.5 rounded border border-red-600/50 flex justify-center"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- FORM VIEW --- */}
            {view === 'form' && (
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900/80 p-6 rounded-2xl border border-gray-800 shadow-2xl">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 pb-2">Información Básica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Título</label>
                                    <input className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-navifest-gold outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><Hash size={10}/> Categoría</label>
                                    <input list="category-suggestions" className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-navifest-gold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Escribe o selecciona..." />
                                    <datalist id="category-suggestions">
                                        {existingCategories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                                
                                {/* Niche Selector Dinámico */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><Layers size={10}/> Nicho de Mercado (Tenant)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Opción Global siempre presente */}
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({...formData, niche: 'global'})}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${formData.niche === 'global' ? 'bg-white text-black border-white' : 'bg-black text-gray-500 border-gray-800'}`}
                                        >
                                            Global
                                        </button>
                                        
                                        {/* Opciones dinámicas de la DB */}
                                        {dbNiches.map(n => (
                                            <button 
                                                key={n.id} 
                                                type="button" 
                                                onClick={() => setFormData({...formData, niche: n.id})}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${formData.niche === n.id ? 'bg-navifest-red text-white border-navifest-red' : 'bg-black text-gray-500 border-gray-800'}`}
                                            >
                                                {n.name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-2 italic">* El sistema normaliza automáticamente a minúsculas y sin espacios al guardar.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Nivel de Acceso</label>
                                    <select className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white outline-none" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as AccessLevel})}>
                                        {Object.values(AccessLevel).filter(l => l !== 'Admin').map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Red Social</label>
                                    <select className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white outline-none" value={formData.socialNetwork} onChange={e => setFormData({...formData, socialNetwork: e.target.value as SocialNetwork})}>
                                        {Object.values(SocialNetwork).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setView('list')} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 rounded-xl font-bold text-black bg-navifest-gold shadow-lg flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {editingId ? 'Guardar Cambios' : 'Crear Experiencia'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
