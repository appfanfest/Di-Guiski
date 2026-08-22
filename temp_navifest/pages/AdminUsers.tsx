import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { AccessLevel, UserProfile } from '../types';
import { ChevronLeft, Search, RefreshCw, Edit, CheckCircle, Loader2, X, Users, Filter } from 'lucide-react';

export const AdminUsers: React.FC = () => {
    const navigate = useNavigate();
    const { allProfiles, fetchAllProfiles, updateUserPlan } = useAppContext();
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Modal State for Edit
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [newPlan, setNewPlan] = useState<AccessLevel>(AccessLevel.BRONZE);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAllProfiles();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAllProfiles();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleEditClick = (user: UserProfile) => {
        setEditingUser(user);
        setNewPlan(user.level);
    };

    const handleSavePlan = async () => {
        if (!editingUser) return;
        setIsSubmitting(true);
        const result = await updateUserPlan(editingUser.email, newPlan);
        setIsSubmitting(false);

        if (result.success) {
            alert(`Plan actualizado a ${newPlan}`);
            setEditingUser(null);
            fetchAllProfiles(); // Refresh list
        } else {
            alert("Error: " + result.error);
        }
    };

    // Filters
    const filteredUsers = allProfiles.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPlan = filterPlan === 'ALL' ? true : u.level === filterPlan;
        return matchesSearch && matchesPlan;
    });

    return (
        <div className="max-w-5xl mx-auto p-4 pb-20 animate-fade-in">
             {/* Header */}
             <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
                <button 
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Usuarios y Planes</h1>
                    <p className="text-xs text-gray-500">Gestión de accesos y pagos</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por email o nombre..."
                        className="w-full bg-black border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <select 
                        className="w-full bg-black border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white appearance-none cursor-pointer focus:border-blue-500 outline-none"
                        value={filterPlan}
                        onChange={(e) => setFilterPlan(e.target.value)}
                    >
                        <option value="ALL">Todos</option>
                        <option value={AccessLevel.BRONZE}>Bronce</option>
                        <option value={AccessLevel.SILVER}>Silver</option>
                        <option value={AccessLevel.GOLD}>Gold</option>
                    </select>
                </div>
                <button 
                    onClick={handleRefresh}
                    className={`bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-700 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500">Total Usuarios</p>
                    <p className="text-xl font-bold text-white">{allProfiles.length}</p>
                </div>
                <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-800/30">
                    <p className="text-xs text-yellow-500">Gold</p>
                    <p className="text-xl font-bold text-yellow-400">{allProfiles.filter(u => u.level === AccessLevel.GOLD).length}</p>
                </div>
                <div className="bg-gray-700/20 p-3 rounded-lg border border-gray-600/30">
                    <p className="text-xs text-gray-400">Silver</p>
                    <p className="text-xl font-bold text-gray-300">{allProfiles.filter(u => u.level === AccessLevel.SILVER).length}</p>
                </div>
                <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-800/30">
                    <p className="text-xs text-orange-500">Bronce</p>
                    <p className="text-xl font-bold text-orange-400">{allProfiles.filter(u => u.level === AccessLevel.BRONZE).length}</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(profile => (
                        <div key={profile.id} className="bg-gray-900 hover:bg-gray-800 transition-colors p-4 rounded-xl border border-gray-800 flex items-center justify-between gap-4 group">
                            
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-300 font-bold overflow-hidden border border-gray-600">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        profile.email.substring(0,2).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{profile.email}</p>
                                    <p className="text-xs text-gray-500 truncate">{profile.full_name || 'Sin nombre'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                <span className={`px-2 py-1 rounded text-xs font-bold w-16 text-center ${
                                    profile.level === AccessLevel.GOLD ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                                    profile.level === AccessLevel.SILVER ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50' :
                                    'bg-orange-900/20 text-orange-400 border border-orange-900/50'
                                }`}>
                                    {profile.level}
                                </span>
                                
                                <button 
                                    onClick={() => handleEditClick(profile)}
                                    className="p-2 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-400 rounded-lg transition-colors border border-gray-700"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500">No se encontraron usuarios.</div>
                )}
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
                    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="text-navifest-gold" size={20} />
                                Editar Plan
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-500">Usuario</p>
                                <p className="text-white font-mono text-sm">{editingUser.email}</p>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Seleccionar Nuevo Plan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(AccessLevel).filter(l => l !== 'Admin').map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setNewPlan(level)}
                                            className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                                                newPlan === level 
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleSavePlan}
                                disabled={isSubmitting}
                                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
