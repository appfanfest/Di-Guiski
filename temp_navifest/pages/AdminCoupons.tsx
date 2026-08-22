
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Coupon } from '../types';
import { ChevronLeft, Plus, Trash2, Ticket, CheckCircle, X, Loader2, RefreshCw } from 'lucide-react';

export const AdminCoupons: React.FC = () => {
    const navigate = useNavigate();
    const { fetchCoupons, addCoupon, deleteCoupon } = useAppContext();
    
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newPercent, setNewPercent] = useState('10');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchCoupons();
        setCoupons(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleAddCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode.trim()) return;

        setIsSubmitting(true);
        const result = await addCoupon({
            code: newCode.trim().toUpperCase(),
            discount_percent: parseFloat(newPercent) / 100,
            is_active: true
        });
        setIsSubmitting(false);

        if (result.success) {
            setNewCode('');
            setShowForm(false);
            loadData();
        } else {
            alert("Error: " + result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Eliminar este cupón?")) return;
        const res = await deleteCoupon(id);
        if (res.success) loadData();
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20 animate-fade-in">
             {/* Header */}
             <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
                <button 
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Cupones de Descuento</h1>
                    <p className="text-xs text-gray-500">Códigos promocionales dinámicos</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => setShowForm(true)}
                    className="bg-navifest-red text-white font-bold px-6 py-3 rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus size={20} /> Crear Cupón
                </button>
                <button 
                    onClick={handleRefresh}
                    className={`bg-gray-800 p-3 rounded-xl border border-gray-700 text-white ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-navifest-red" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.map(coupon => (
                        <div key={coupon.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-navifest-red/10 text-navifest-red rounded-xl flex items-center justify-center border border-navifest-red/20">
                                    <Ticket size={24} />
                                </div>
                                <div>
                                    <p className="text-white font-black text-lg tracking-widest">{coupon.code}</p>
                                    <p className="text-navifest-green font-bold text-xs">{(coupon.discount_percent * 100).toFixed(0)}% DESCUENTO</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(coupon.id)}
                                className="p-3 bg-red-900/10 text-red-500 rounded-xl border border-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {coupons.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 italic">No hay cupones creados.</div>
                    )}
                </div>
            )}

            {/* Modal de Creación */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
                    <div className="relative bg-navifest-gray border border-gray-700 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Ticket className="text-navifest-red" size={20} /> Nuevo Cupón
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleAddCoupon} className="space-y-6">
                            <div>
                                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Código del Cupón</label>
                                <input 
                                    autoFocus
                                    className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white font-black uppercase tracking-widest focus:border-navifest-red outline-none"
                                    placeholder="EJ: NAVIDAD50"
                                    value={newCode}
                                    onChange={e => setNewCode(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Porcentaje de Descuento</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['10', '20', '30', '50'].map(val => (
                                        <button 
                                            key={val}
                                            type="button"
                                            onClick={() => setNewPercent(val)}
                                            className={`py-3 rounded-xl font-bold text-xs border transition-all ${newPercent === val ? 'bg-navifest-red border-navifest-red text-white' : 'bg-black border-gray-700 text-gray-500'}`}
                                        >
                                            {val}%
                                        </button>
                                    ))}
                                </div>
                                <input 
                                    type="number" 
                                    className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white mt-3 font-bold text-sm focus:border-navifest-red outline-none"
                                    placeholder="Otro %"
                                    value={newPercent}
                                    onChange={e => setNewPercent(e.target.value)}
                                    min="1"
                                    max="100"
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-navifest-green text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                {isSubmitting ? 'Guardando...' : 'Crear Código'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
