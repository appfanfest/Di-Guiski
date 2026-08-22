import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Payment, AccessLevel } from '../types';
import { ChevronLeft, Search, Filter, Calendar, CreditCard, CheckCircle, XCircle, Clock, Smartphone, DollarSign, Eye, X, Copy, Download, Loader2, ArrowUpRight, Users } from 'lucide-react';

export const AdminPayments: React.FC = () => {
    const navigate = useNavigate();
    const { payments, updatePaymentStatus, allProfiles, fetchAllProfiles } = useAppContext();

    // -- STATE --
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [methodFilter, setMethodFilter] = useState<'all' | 'Zelle' | 'Pago Movil'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial data load if needed
    useEffect(() => {
        if(allProfiles.length === 0) fetchAllProfiles();
    }, []);

    // -- FILTERS --
    const filteredPayments = payments.filter(p => {
        // Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            p.userEmail.toLowerCase().includes(searchLower) ||
            p.reference.toLowerCase().includes(searchLower) ||
            p.beneficiaryEmail.toLowerCase().includes(searchLower);

        // Status
        const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;

        // Method
        const matchesMethod = methodFilter === 'all' ? true : p.paymentMethod === methodFilter;

        // Date Range
        let matchesDate = true;
        if (startDate && endDate) {
            const pDate = new Date(p.dateTime).getTime();
            const sDate = new Date(startDate).getTime();
            const eDate = new Date(endDate).getTime() + 86400000; // Include end day
            matchesDate = pDate >= sDate && pDate <= eDate;
        }

        return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });

    // -- KPI CALCS --
    const totalUSD = filteredPayments.filter(p => p.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
    const totalVES = filteredPayments.filter(p => p.status === 'approved' && p.amountVes).reduce((acc, curr) => acc + (curr.amountVes || 0), 0);
    const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;

    // -- HANDLERS --
    const handleStatusChange = async (status: 'approved' | 'rejected') => {
        if (!selectedPayment) return;
        if (!window.confirm(`¿Estás seguro de marcar este pago como ${status === 'approved' ? 'APROBADO' : 'RECHAZADO'}?`)) return;

        setIsProcessing(true);
        const result = await updatePaymentStatus(selectedPayment.id, status);
        setIsProcessing(false);

        if (result.success) {
            setSelectedPayment(null);
            // Optional: You could allow updating the user plan here directly or rely on the Admin to go to Users page
        } else {
            alert("Error: " + result.error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved': return <span className="flex items-center gap-1 text-green-400 bg-green-900/30 border border-green-800 px-2 py-0.5 rounded text-xs font-bold"><CheckCircle size={12}/> Aprobado</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-red-400 bg-red-900/30 border border-red-800 px-2 py-0.5 rounded text-xs font-bold"><XCircle size={12}/> Rechazado</span>;
            default: return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-900/30 border border-yellow-800 px-2 py-0.5 rounded text-xs font-bold"><Clock size={12}/> Pendiente</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-display">Administración de Pagos</h1>
                        <p className="text-xs text-gray-500">Valida, audita y gestiona las transacciones</p>
                    </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-4">
                    <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 min-w-[120px]">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recaudado (USD)</p>
                        <p className="text-lg font-bold text-navifest-gold">${totalUSD.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 min-w-[120px]">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recaudado (Bs)</p>
                        <p className="text-lg font-bold text-blue-400">Bs. {totalVES.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 min-w-[100px]">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pendientes</p>
                        <p className={`text-lg font-bold ${pendingCount > 0 ? 'text-yellow-500 animate-pulse' : 'text-gray-400'}`}>{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6 flex flex-col xl:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input 
                        type="text"
                        placeholder="Buscar Ref, Email o Usuario..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-navifest-gold outline-none"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <select 
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="w-full sm:w-40 bg-black border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white appearance-none cursor-pointer focus:border-navifest-gold outline-none"
                        >
                            <option value="all">Estatus: Todos</option>
                            <option value="pending">Pendientes</option>
                            <option value="approved">Aprobados</option>
                            <option value="rejected">Rechazados</option>
                        </select>
                    </div>

                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <select 
                            value={methodFilter}
                            onChange={e => setMethodFilter(e.target.value as any)}
                            className="w-full sm:w-40 bg-black border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white appearance-none cursor-pointer focus:border-navifest-gold outline-none"
                        >
                            <option value="all">Método: Todos</option>
                            <option value="Pago Movil">Pago Móvil</option>
                            <option value="Zelle">Zelle</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 items-center bg-black border border-gray-700 rounded-lg px-2 py-1">
                    <Calendar className="text-gray-500" size={16} />
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none"
                    />
                    <span className="text-gray-600">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none"
                    />
                </div>
            </div>

            {/* Payments Table (Desktop) / Cards (Mobile) */}
            <div className="hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-black/50 text-gray-200 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Usuario / Plan</th>
                            <th className="px-6 py-3">Referencia</th>
                            <th className="px-6 py-3">Monto</th>
                            <th className="px-6 py-3">Estatus</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredPayments.map(p => (
                            <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                    {new Date(p.dateTime).toLocaleDateString()} <br/>
                                    {new Date(p.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{p.userEmail}</div>
                                    <div className="text-xs text-gray-500">Plan: <span className="text-navifest-gold">{p.plan}</span></div>
                                </td>
                                <td className="px-6 py-4 font-mono text-white">
                                    {p.reference}
                                    <div className="text-[10px] text-gray-500">{p.paymentMethod}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-white font-bold">${p.amount}</div>
                                    {p.amountVes && <div className="text-xs text-gray-500">Bs. {p.amountVes.toLocaleString()}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(p.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setSelectedPayment(p)}
                                        className="bg-gray-800 hover:bg-white hover:text-black text-gray-300 p-2 rounded-lg transition-colors"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredPayments.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No hay pagos que coincidan con los filtros.</div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                 {filteredPayments.map(p => (
                     <div key={p.id} onClick={() => setSelectedPayment(p)} className="bg-gray-900 border border-gray-800 p-4 rounded-xl active:bg-gray-800">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs text-gray-500 font-mono">{new Date(p.dateTime).toLocaleDateString()}</p>
                                <p className="font-bold text-white text-sm">{p.userEmail}</p>
                            </div>
                            {getStatusBadge(p.status)}
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-400">{p.paymentMethod} • {p.reference}</p>
                                <p className="text-xs text-navifest-gold font-bold mt-1">Plan {p.plan}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-white">${p.amount}</p>
                                {p.amountVes && <p className="text-xs text-gray-500">Bs. {p.amountVes.toLocaleString()}</p>}
                            </div>
                        </div>
                     </div>
                 ))}
            </div>

            {/* DETAIL MODAL */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedPayment(null)}></div>
                    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        
                        <div className="bg-black/50 p-4 flex justify-between items-center border-b border-gray-800">
                            <h3 className="font-bold text-white text-lg font-display">Detalle del Pago</h3>
                            <button onClick={() => setSelectedPayment(null)}><X size={20} className="text-gray-500 hover:text-white" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="flex justify-between items-center bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Monto Total</p>
                                    <p className="text-3xl font-bold text-white">${selectedPayment.amount}</p>
                                </div>
                                {getStatusBadge(selectedPayment.status)}
                            </div>

                            {/* Grid Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Usuario</p>
                                    <p className="text-white truncate" title={selectedPayment.userEmail}>{selectedPayment.userEmail}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Beneficiario(s)</p>
                                    <div className="text-white truncate text-xs" title={selectedPayment.beneficiaryEmail}>
                                        {selectedPayment.beneficiaryEmail.split(',').length > 1 ? (
                                            <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                                <Users size={10} /> Pack Familiar
                                            </span>
                                        ) : selectedPayment.beneficiaryEmail}
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Referencia</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-mono bg-black px-2 py-0.5 rounded">{selectedPayment.reference}</p>
                                        <Copy size={12} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(selectedPayment.reference)} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Método</p>
                                    <p className="text-white flex items-center gap-1">
                                        {selectedPayment.paymentMethod === 'Zelle' ? <DollarSign size={14} className="text-purple-400"/> : <Smartphone size={14} className="text-blue-400"/>}
                                        {selectedPayment.paymentMethod}
                                    </p>
                                </div>

                                {selectedPayment.paymentMethod === 'Pago Movil' && (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Banco Origen</p>
                                            <p className="text-white">{selectedPayment.originBank || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Teléfono Origen</p>
                                            <p className="text-white">{selectedPayment.originPhone || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2 bg-gray-800/30 p-2 rounded-lg border border-gray-800 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Monto en Bolívares:</span>
                                            <span className="text-white font-mono font-bold">Bs. {selectedPayment.amountVes?.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                                <p className="text-xs text-gray-500 italic text-center">
                                    Nota: Aprobar el pago actualizará el registro. Recuerda verificar la transacción en el banco.
                                </p>
                                
                                <div className="flex gap-3 mt-2">
                                    <button 
                                        disabled={isProcessing || selectedPayment.status === 'rejected'}
                                        onClick={() => handleStatusChange('rejected')}
                                        className="flex-1 border border-red-900 text-red-500 hover:bg-red-900/20 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                    <button 
                                        disabled={isProcessing || selectedPayment.status === 'approved'}
                                        onClick={() => handleStatusChange('approved')}
                                        className="flex-[2] bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:bg-gray-700"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                        {selectedPayment.status === 'approved' ? 'Aprobado' : 'Aprobar Pago'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};