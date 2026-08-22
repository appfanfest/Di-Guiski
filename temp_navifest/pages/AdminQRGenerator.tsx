
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, Download, QrCode, ExternalLink, Printer, Copy, Check } from 'lucide-react';

export const AdminQRGenerator: React.FC = () => {
    const navigate = useNavigate();
    const { allNiches } = useAppContext();
    const [selectedNicheId, setSelectedNicheId] = useState<string | number | null>(null);
    const [copied, setCopied] = useState(false);

    const commercialNiches = useMemo(() => {
        return allNiches.filter(n => n.is_commercial);
    }, [allNiches]);

    const activeNiche = useMemo(() => {
        return commercialNiches.find(n => n.id === selectedNicheId);
    }, [commercialNiches, selectedNicheId]);

    const activationUrl = useMemo(() => {
        if (!selectedNicheId) return '';
        // CRÍTICO: Los parámetros deben ir ANTES del hash para que los navegadores móviles los pasen correctamente a la app
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?activate=${selectedNicheId}#/`;
    }, [selectedNicheId]);

    const qrUrl = useMemo(() => {
        if (!activationUrl) return '';
        return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(activationUrl)}&color=000000&bgcolor=FFFFFF&margin=2`;
    }, [activationUrl]);

    const handleCopy = () => {
        navigator.clipboard.writeText(activationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && activeNiche) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR Atlantis - ${activeNiche.name}</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 50px; background: white; color: black; }
                            .container { border: 2px solid #000; padding: 40px; border-radius: 40px; display: inline-block; max-width: 500px; }
                            img.qr { width: 400px; height: 400px; margin: 20px 0; }
                            h1 { font-size: 28px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; }
                            p { font-size: 14px; color: #444; font-weight: 600; margin-bottom: 20px; }
                            .logo { height: 80px; margin-bottom: 20px; object-fit: contain; }
                            .footer { margin-top: 30px; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; color: #888; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img src="${activeNiche.logo_url}" class="logo" />
                            <h1>ACTIVA TU EXPERIENCIA</h1>
                            <p>Escanea para desbloquear el menú de AR de<br/><b>${activeNiche.name}</b></p>
                            <img src="${qrUrl}" class="qr" />
                            <div class="footer">ATLANTIS 5.0 METAVERSE INFRASTRUCTURE</div>
                        </div>
                        <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20 animate-fade-in text-left">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
                <button 
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Generador de QR Comercial</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Activación Deep Link para Clientes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List of Commercial Niches */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest px-2">Clientes Comerciales</h3>
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] no-scrollbar">
                        {commercialNiches.length > 0 ? commercialNiches.map(n => (
                            <button 
                                key={n.id} 
                                onClick={() => setSelectedNicheId(n.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedNicheId === n.id ? 'bg-navifest-green/10 border-navifest-green' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-black p-1 border border-white/10 shrink-0">
                                    <img src={n.logo_url} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-white font-bold truncate">{n.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">ID: {n.id}</p>
                                </div>
                                {selectedNicheId === n.id && <QrCode className="text-navifest-green" size={20} />}
                            </button>
                        )) : (
                            <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                No hay nichos comerciales configurados.
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Generation Area */}
                <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden">
                    {!selectedNicheId ? (
                        <div className="space-y-4 opacity-40">
                            <QrCode size={80} className="mx-auto text-gray-500" />
                            <p className="text-sm font-bold text-gray-500">Selecciona un cliente para generar su código de activación.</p>
                        </div>
                    ) : (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-navifest-green"></div>
                            <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                <img src={qrUrl} className="w-64 h-64" alt="QR Code" />
                            </div>
                            
                            <div className="space-y-2 w-full">
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter">{activeNiche?.name}</h4>
                                <div className="flex items-center gap-2 bg-black/60 p-3 rounded-xl border border-white/5">
                                    <p className="flex-1 text-[10px] font-mono text-gray-400 truncate text-left">{activationUrl}</p>
                                    <button onClick={handleCopy} className="text-navifest-green hover:text-white transition-colors">
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <a 
                                    href={qrUrl} 
                                    download={`${activeNiche?.name}_QR.png`}
                                    className="flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                >
                                    <Download size={16} /> Descargar
                                </a>
                                <button 
                                    onClick={handlePrint}
                                    className="flex items-center justify-center gap-2 py-4 bg-gray-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 shadow-xl active:scale-95 transition-all"
                                >
                                    <Printer size={16} /> Imprimir
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3">
                    <ExternalLink className="text-navifest-green" size={20} />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">¿Cómo funciona?</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    El código QR contiene un <b>Deep Link</b> que activa automáticamente el entorno comercial del cliente. Al escanearlo, la app registra el acceso en la cuenta del usuario y cambia instantáneamente el tema visual y el catálogo disponible.
                </p>
                <ul className="text-xs space-y-2 text-gray-500 font-medium">
                    <li className="flex items-start gap-2">
                        <span className="text-navifest-green font-black">•</span>
                        El usuario escanea el código impreso en el establecimiento.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-navifest-green font-black">•</span>
                        La app detecta el parámetro <code className="text-navifest-gold">activate=ID</code> en la URL nativa.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-navifest-green font-black">•</span>
                        Se desbloquea la persistencia comercial y se carga el branding del cliente sin intervención manual.
                    </li>
                </ul>
            </div>
        </div>
    );
};
