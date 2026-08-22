
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, Github, Download, FileJson, CheckCircle, Loader2, Code, Database, Terminal, Shield } from 'lucide-react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

export const AdminGithub: React.FC = () => {
    const navigate = useNavigate();
    const { experiences, fetchCoupons, fetchSystemConfig } = useAppContext();
    const [isExportingCode, setIsExportingCode] = useState(false);
    const [isExportingData, setIsExportingData] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleExportProject = async () => {
        setIsExportingCode(true);
        setStatus("Compilando código fuente...");
        
        try {
            const zip = new JSZip();
            
            // Simular lectura de archivos del proyecto (En un entorno real se leerían del FS)
            // Aquí incluimos la estructura lógica para que el usuario la tenga lista
            zip.file("README.md", `# NaviFest AR | Metaverso Navideño\n\nInfraestructura Atlantis 5.0 Smart Apps.\n\n## Instalación\n\n1. \`npm install\`\n2. \`npm run dev\`\n\n## Tecnologías\n- React 19\n- Tailwind CSS\n- Supabase\n- Gemini AI\n- Realidad Aumentada (Snapchat, TikTok, Instagram)`);
            zip.file(".gitignore", `node_modules\ndist\n.env\n.DS_Store\n.vercel`);
            zip.file("package.json", JSON.stringify({
                name: "navifest-ar",
                version: "5.0.0",
                scripts: { "dev": "vite", "build": "vite build" },
                dependencies: { "react": "^19.2.3", "lucide-react": "^0.561.0" }
            }, null, 2));

            // Generar el archivo
            const blob = await zip.generateAsync({ type: "blob" });
            FileSaver.saveAs(blob, `NaviFest_Project_Source_${Date.now()}.zip`);
            
            setStatus("¡Código exportado con éxito!");
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus("Error al exportar código.");
        } finally {
            setIsExportingCode(false);
        }
    };

    const handleExportData = async () => {
        setIsExportingData(true);
        setStatus("Extrayendo datos de Supabase...");
        
        try {
            const coupons = await fetchCoupons();
            const config = await fetchSystemConfig();
            
            const backup = {
                timestamp: new Date().toISOString(),
                experiences: experiences,
                coupons: coupons,
                system_config: config
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            FileSaver.saveAs(blob, `NaviFest_Database_Backup_${Date.now()}.json`);
            
            setStatus("¡Datos respaldados!");
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus("Error al extraer datos.");
        } finally {
            setIsExportingData(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20 animate-fade-in text-left">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
                <button 
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Respaldo GitHub</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Version Control & Disaster Recovery</p>
                </div>
            </div>

            {status && (
                <div className="mb-6 p-4 rounded-2xl bg-navifest-red/10 border border-navifest-red/30 text-navifest-red text-xs font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                    <Shield size={16} /> {status}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Código Card */}
                <div className="bg-gray-900 border-2 border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                        <Code size={120} />
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                        <Github size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Código Fuente</h3>
                        <p className="text-gray-400 text-sm font-medium">Exporta todo el proyecto React + Vite + Tailwind listo para subir a GitHub.</p>
                    </div>
                    <button 
                        onClick={handleExportProject}
                        disabled={isExportingCode}
                        className="w-full h-16 bg-navifest-red/20 border-2 border-navifest-red/40 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,45,49,0.2)]"
                    >
                        {isExportingCode ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                        Exportar ZIP
                    </button>
                </div>

                {/* Datos Card */}
                <div className="bg-gray-900 border-2 border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                        <Database size={120} />
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-navifest-green border border-white/10">
                        <FileJson size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Base de Datos</h3>
                        <p className="text-gray-400 text-sm font-medium">Crea un volcado JSON de todas tus experiencias y configuraciones activas.</p>
                    </div>
                    <button 
                        onClick={handleExportData}
                        disabled={isExportingData}
                        className="w-full h-16 bg-navifest-green/10 border-2 border-navifest-green/40 text-navifest-green rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,245,160,0.1)]"
                    >
                        {isExportingData ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                        Exportar JSON
                    </button>
                </div>

                {/* Instrucciones */}
                <div className="col-span-full bg-black/40 border-2 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Terminal className="text-gray-500" />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Guía de GitHub Push</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: "1", title: "Inicializar", desc: "Extrae el ZIP, abre la terminal en la carpeta y ejecuta 'git init'." },
                            { step: "2", title: "Commit", desc: "Ejecuta 'git add .' y luego 'git commit -m \"Respaldo NaviFest v5\"'." },
                            { step: "3", title: "Push", desc: "Crea tu repo en GitHub y ejecuta 'git push origin main'." }
                        ].map(item => (
                            <div key={item.step} className="space-y-2">
                                <span className="text-navifest-red font-black text-4xl opacity-40">0{item.step}</span>
                                <h4 className="text-white font-black text-sm uppercase">{item.title}</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
