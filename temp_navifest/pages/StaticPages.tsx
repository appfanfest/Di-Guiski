
import React, { useState, useEffect, useMemo } from 'react';
import { VENEZUELAN_BANKS } from '../constants';
import { useAppContext } from '../context/AppContext';
import { AccessLevel, SystemConfig, UserProfile, Coupon, FAQItem } from '../types';
import { 
  Play, Check, Star, Crown, Sparkles, X, 
  Mail, DollarSign, Smartphone, 
  Download, Loader2, Landmark, Phone, CheckCircle,
  Instagram, Copy, Info, MessageSquare, Ticket, Shield, Scale, FileText, Lock, Zap, MapPin, Globe, Share2, MoreVertical, Plus, ArrowDown, ChevronRight, Target, Rocket, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

export const MandatoryLegalFootnote: React.FC = () => (
    <div className="text-center pt-10 border-t border-white/5 mt-10">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">Atlantis 5.0 Metaverse Infrastructure</p>
        <p className="text-gray-700 text-[9px] font-mono mt-2">RIF: J-507150585 • Atlantis 5.0 Smart Apps • Municipio Maneiro, Estado Nueva Esparta, Venezuela</p>
    </div>
);

const ColorizedTitle = ({ title, primaryColor }: { title: string, primaryColor: string }) => {
  if (!title) return null;
  const words = title.trim().split(/\s+/);
  if (words.length > 1) {
    return (
      <div className="flex flex-wrap justify-center gap-x-[0.2em] w-full">
        <span style={{ color: primaryColor }}>{words[0]}</span>
        <span className="text-white">{words.slice(1).join(' ')}</span>
      </div>
    );
  } else {
    const splitIndex = title.length <= 3 ? 1 : Math.ceil(title.length / 2);
    const firstPart = title.substring(0, splitIndex);
    const secondPart = title.substring(splitIndex);
    return (
      <div className="flex justify-center w-full">
        <span style={{ color: primaryColor }}>{firstPart}</span>
        <span className="text-white">{secondPart}</span>
      </div>
    );
  }
};

const DEFAULT_FAQ_CARDS: FAQItem[] = [
    { title: "El poder de la RA + IA", img: "https://i.ibb.co/Kxsxy3t3/INFOGRAFIA-AYUDA-07.webp", description: "Potenciando la navidad con IA avanzada para experiencias inolvidables." },
    { title: "Snapchat – Plataforma Única", img: "https://i.ibb.co/Q3Nzgc7Z/INFOGRAFIA-AYUDA-08.webp", description: "Nuestra base tecnológica de vanguardia explicada a detalle." },
    { title: "El Puente Digital", img: "https://i.ibb.co/3mnX4sTs/INFOGRAFIA-AYUDA-03.webp", description: "Conectando mundos digitales de forma fluida y rápida." },
    { title: "Tutorial de Activación", img: "https://i.ibb.co/nqgf5jgP/INFOGRAFIA-AYUDA-05.webp", description: "Paso a paso para activar tus experiencias en redes sociales." }
];

export const FAQ: React.FC = () => {
  const { nicheConfig } = useAppContext();
  const [downloading, setDownloading] = useState(false);

  const faqItems = useMemo(() => {
    return nicheConfig?.faq_configs && nicheConfig.faq_configs.length > 0 
      ? nicheConfig.faq_configs 
      : DEFAULT_FAQ_CARDS;
  }, [nicheConfig]);

  const handleDownloadAll = async () => {
    setDownloading(true);
    const zip = new JSZip();
    const folderName = `Atlantis_Guias_${nicheConfig?.name || 'SmartApps'}`;
    const folder = zip.folder(folderName);
    
    try {
      const promises = faqItems.map(async (card, idx) => {
        try {
            const response = await fetch(card.img);
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();
            folder?.file(`Guia_${idx + 1}.webp`, blob);
        } catch (e) {
            console.warn(`Could not fetch image for ZIP: ${card.img}`, e);
        }
      });
      
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, `${folderName}.zip`);
    } catch (err) {
      console.error("Error al descargar el kit:", err);
      alert("Error al generar el archivo.");
    } finally {
      setDownloading(false);
    }
  };

  const primaryColor = nicheConfig?.primary_color || '#FF2D31';

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-12 pb-28 animate-fade-in">
      <div className="text-center space-y-4">
        <div 
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.4em] shadow-sm"
            style={{ 
                backgroundColor: `${primaryColor}10`, 
                color: primaryColor, 
                borderColor: `${primaryColor}30` 
            }}
        >
            Centro de Ayuda
        </div>
        <h1 className="text-6xl md:text-9xl font-black text-white font-display leading-none text-center">
            <span style={{ color: primaryColor }}>F</span>AQ
        </h1>
        <p className="text-gray-400 font-medium text-sm max-w-lg mx-auto">Domina la Realidad Aumentada en {nicheConfig?.name}.</p>
      </div>

      <div 
        className="rounded-[2.5rem] p-8 border flex flex-col md:flex-row items-center gap-6 shadow-2xl animate-fade-in bg-white/5"
        style={{ borderColor: `${primaryColor}40` }}
      >
        <div 
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
        >
          <Download size={28} />
        </div>
        <div className="text-center md:text-left flex-1 space-y-1">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Manual de Marca</h3>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Descarga las infografías de {nicheConfig?.name} en un ZIP</p>
        </div>
        <button 
          onClick={handleDownloadAll}
          disabled={downloading}
          className="w-full md:w-auto text-black font-black px-12 py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {downloading ? <Loader2 className="animate-spin" /> : 'Descargar Kit'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faqItems.map((card, idx) => (
          <div key={idx} className="group relative bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col hover:border-white/30 transition-all duration-500">
            <div className="aspect-video bg-black relative overflow-hidden border-b border-white/5">
               <img src={card.img} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000" alt={card.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-8 flex flex-col gap-3 text-left">
              <h3 
                className="text-white font-black text-base uppercase tracking-tight leading-tight border-l-4 pl-4"
                style={{ borderColor: primaryColor }}
              >
                {card.title}
              </h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const About: React.FC = () => {
    const { nicheConfig } = useAppContext();
    const primaryColor = nicheConfig?.primary_color || '#FF2D31';
    
    // Aplicando la fórmula de la Home para el título responsivo
    const titleText = "Sobre Nosotros";
    const titleLength = titleText.length;
    const preferredSize = titleLength > 20 ? '6vw' : titleLength > 12 ? '8vw' : '13vw';
    const fluidFontSize = `clamp(2rem, ${preferredSize}, 8rem)`;

    return (
        <div className="flex flex-col items-center space-y-16 animate-fade-in max-w-7xl mx-auto py-16 px-4 text-center pb-32 overflow-hidden">
            <div className="space-y-8 w-full">
                <div className="inline-flex items-center gap-2 bg-navifest-gold/10 text-navifest-gold px-8 py-3 rounded-full border border-navifest-gold/20 text-[12px] font-black uppercase tracking-[0.5em] shadow-lg">Nuestra Identidad</div>
                
                <h1 
                  className="font-black text-white font-display uppercase tracking-tighter leading-[0.85] w-full text-center break-words overflow-visible px-2"
                  style={{ 
                    fontSize: fluidFontSize,
                    textWrap: 'balance' as any 
                  }}
                >
                  <ColorizedTitle title={titleText} primaryColor={primaryColor} />
                </h1>

                <p 
                    className="text-gray-400 text-lg md:text-2xl max-w-4xl mx-auto font-medium leading-relaxed"
                    style={{ textWrap: 'balance' as any }}
                >
                    Nacimos con la visión de transformar la interacción humana a través de la Realidad Aumentada, creando puentes digitales que conectan marcas con sus audiencias de forma mágica.
                </p>
            </div>

            {/* Video en Formato 9:16 con Visibilidad Total (Sin Blur, Sin Hovers) */}
            <div className="w-full space-y-12">
                <p className="text-white font-bold text-sm md:text-xl uppercase tracking-[0.3em] max-w-3xl mx-auto leading-relaxed px-4">
                    Te invitamos a conocer nuestro Camino a <span style={{ color: primaryColor }}>ATLANTIS</span> en este corto video de solo 1+ minuto
                </p>
                
                <div className="relative max-w-md mx-auto">
                    {/* Glow efecto estático para enfoque Mobile First */}
                    <div className="absolute -inset-10 bg-gradient-to-r from-navifest-red/20 to-navifest-gold/20 blur-[100px] opacity-30"></div>
                    
                    <a href="https://youtube.com/shorts/ZCVg2xMp4dc" target="_blank" rel="noreferrer" className="relative block w-full aspect-[9/16] rounded-[4rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[6px] border-white/10 bg-black active:scale-[0.98] transition-all duration-300">
                        {/* Opacidad ajustada para que el rostro sea visible incluso sin play */}
                        <img src="https://img.youtube.com/vi/ZCVg2xMp4dc/maxresdefault.jpg" className="w-full h-full object-cover opacity-70" alt="Video Historia" />
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-transparent via-transparent to-black/40">
                            {/* Botón de Play Minimalista: Sin Fondo, Sin Blur, Borde Fino */}
                            <div className="w-28 h-28 bg-transparent rounded-full flex items-center justify-center border-2 border-white/40 shadow-2xl">
                                <Play className="text-white fill-current ml-2" size={44} />
                            </div>
                            <div className="text-center">
                                <span className="block text-white font-black text-xl uppercase tracking-[0.4em] drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">Camino a Atlantis</span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Misión y Visión Mantenidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full text-left pt-20">
                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 space-y-6 hover:border-white/20 transition-all shadow-xl">
                    <h3 className="text-white font-black uppercase text-3xl flex items-center gap-4">
                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        Misión
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">Llevar la tecnología de Realidad Aumentada de vanguardia a cada rincón, facilitando herramientas de expresión creativa y marketing inmersivo accesibles para todos.</p>
                </div>
                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 space-y-6 hover:border-white/20 transition-all shadow-xl">
                    <h3 className="text-white font-black uppercase text-3xl flex items-center gap-4">
                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        Visión
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">Convertirnos en la infraestructura de multiversos digitales líder en Latinoamérica, donde la innovación y el diseño convergen para redefinir la industria de los eventos y el retail.</p>
                </div>
            </div>

            <MandatoryLegalFootnote />
        </div>
    );
};

export const MarketingDigital: React.FC = () => {
    const { nicheConfig } = useAppContext();
    const primaryColor = nicheConfig?.primary_color || '#FF2D31';

    const marketingBlocks = [
        {
            title: "Sinergia Phygital",
            icon: Target,
            desc: "Convertimos tus puntos de contacto físicos (stands, impulsadoras, degustaciones) en portales de activación digital masiva."
        },
        {
            title: "Escalabilidad 5.0",
            icon: Rocket,
            desc: "Un solo diseño digital puede ser utilizado por miles de personas simultáneamente sin los costos de logística del cotillón tradicional."
        },
        {
            title: "Flexibilidad Estacional",
            icon: Layers,
            desc: "Adapta tu campaña de Navidad a San Valentín o Carnaval en minutos, no en semanas. Actualizaciones en la nube sin costo de materiales."
        }
    ];

    return (
        <div className="flex flex-col items-center space-y-16 animate-fade-in max-w-6xl mx-auto py-12 px-4 text-center pb-32">
            
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-navifest-red/10 text-navifest-red px-6 py-2 rounded-full border border-navifest-red/20 text-[10px] font-black uppercase tracking-[0.4em]">Propuesta B2B</div>
                <h1 className="text-5xl md:text-8xl font-black text-white font-display leading-[0.9] uppercase tracking-tighter">
                    Marketing <span style={{ color: primaryColor }}>Interactivo</span> Digital
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-4xl mx-auto font-medium leading-relaxed">
                    Nuestra propuesta del Marketing interactivo Digital no busca sustituir el marketing tradicional o estático, busca enriquecer las opciones que tiene nuestros clientes para enriquecer las experiencias de sus propios clientes.
                </p>
            </div>

            {/* Marketing Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {marketingBlocks.map((block, idx) => (
                    <div key={idx} className="p-10 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col items-center gap-6 group hover:border-white/30 transition-all shadow-xl">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 bg-black text-white group-hover:scale-110 transition-transform" style={{ color: primaryColor }}>
                            <block.icon size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-black text-lg uppercase tracking-tight">{block.title}</h3>
                            <p className="text-gray-500 text-xs font-medium leading-relaxed">{block.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full p-12 rounded-[4rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 space-y-8 text-left shadow-2xl">
                <h3 className="text-3xl font-black text-white font-display uppercase tracking-tighter">Valor Estratégico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Zap className="text-navifest-gold" size={24} />
                            <h4 className="text-white font-black uppercase text-sm">Ubicuidad de Marca</h4>
                        </div>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed">Tus activaciones ya no se quedan en el stand. Tu marca viaja en el bolsillo del cliente, lista para ser compartida globalmente en redes sociales.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Globe className="text-navifest-green" size={24} />
                            <h4 className="text-white font-black uppercase text-sm">Metaverso Integrado</h4>
                        </div>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed">Tu experiencia interactiva convive en el ecosistema Atlantis donde miles de usuarios interactúan diariamente, potenciando el descubrimiento orgánico.</p>
                    </div>
                </div>
            </div>

            <MandatoryLegalFootnote />
        </div>
    );
};

export const AtlantisGuide: React.FC = () => {
  const { nicheConfig } = useAppContext();
  const primaryColor = nicheConfig?.primary_color || '#FF2D31';

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-fade-in pb-32">
        <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-navifest-red/10 text-navifest-red px-6 py-2 rounded-full border border-navifest-red/20 text-[10px] font-black uppercase tracking-[0.4em]">Guía de Instalación</div>
            <h1 className="text-5xl md:text-7xl font-black text-white font-display uppercase tracking-tighter leading-[0.9]">
                Instala tu <span style={{ color: primaryColor }}>App</span>
            </h1>
            <p className="text-gray-400 font-bold text-sm max-w-lg mx-auto uppercase tracking-widest leading-relaxed">
                Transforma la web en una aplicación nativa para iPhone y Android.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* GUÍA ANDROID */}
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-navifest-green/20 flex items-center justify-center text-navifest-green">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Android</h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Chrome Browser</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                        <p className="text-gray-400 text-sm font-medium">Pulsa los <b>tres puntos</b> <MoreVertical className="inline-block" size={14}/> en la esquina superior derecha de Chrome.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                        <p className="text-gray-400 text-sm font-medium">Selecciona la opción <b>"Instalar aplicación"</b> o <b>"Añadir a pantalla de inicio"</b>.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                        <p className="text-gray-400 text-sm font-medium">Confirma en el botón <b>"Instalar"</b> y Atlantis aparecerá en tu menú de apps.</p>
                    </div>
                </div>
            </div>

            {/* GUÍA IOS */}
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">iOS (iPhone)</h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Safari Browser</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                        <p className="text-gray-400 text-sm font-medium">Pulsa el botón de <b>Compartir</b> <Share2 className="inline-block text-blue-400" size={14}/> en la barra inferior de Safari.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                        <p className="text-gray-400 text-sm font-medium">Desliza hacia abajo y elige <b>"Añadir a pantalla de inicio"</b> <Plus className="inline-block" size={14}/>.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                        <p className="text-gray-400 text-sm font-medium">Pulsa <b>"Añadir"</b> en la esquina superior derecha para finalizar.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-center space-y-4">
            <Zap className="mx-auto text-navifest-gold" size={32} />
            <h3 className="text-lg font-black text-white uppercase tracking-widest">¿Por qué instalarla?</h3>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto font-medium">
                Al instalar la Smart App, disfrutarás de un mejor rendimiento, acceso instantáneo desde tu escritorio y una navegación inmersiva sin barras de distracción.
            </p>
        </div>

        <MandatoryLegalFootnote />
    </div>
  );
};

export const Contact: React.FC = () => {
    const { nicheConfig } = useAppContext();
    const primaryColor = nicheConfig?.primary_color || '#FF2D31';

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 space-y-16 animate-fade-in max-w-5xl mx-auto text-center">
            <div className="space-y-6">
                <h1 className="text-6xl md:text-9xl font-black text-white font-display leading-none uppercase tracking-tighter">Contacto <span style={{ color: primaryColor }}>Pro</span></h1>
                <p className="text-white text-lg md:text-xl font-bold max-w-3xl mx-auto leading-relaxed">
                  Nuestra familia está creciendo. Si quieres ser un aliado comercial y comercializar la plataforma en tu región o ciudad, contáctanos y con gusto te mostraremos lo fácil y rentable que puede ser para ti esta asociación.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                <a href="https://wa.me/584127251325" target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col items-center gap-6 group hover:border-navifest-green transition-all shadow-2xl active:scale-95">
                    <div className="w-16 h-16 bg-navifest-green text-black rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
                        <Smartphone size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold text-lg uppercase tracking-tight">WhatsApp</h3>
                        <p className="text-navifest-green font-bold text-xl md:text-2xl uppercase tracking-wider mt-1">+58 412 725 13 25</p>
                    </div>
                </a>

                <a href="https://instagram.com/riospedroluis" target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col items-center gap-6 group hover:border-purple-500 transition-all shadow-2xl active:scale-95">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-all">
                        <Instagram size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold text-lg uppercase tracking-tight">Instagram</h3>
                        <p className="text-purple-400 font-bold text-xl md:text-2xl uppercase tracking-wider mt-1">@riospedroluis</p>
                    </div>
                </a>
            </div>
            <MandatoryLegalFootnote />
        </div>
    );
};

export const Terms: React.FC = () => {
    const { nicheConfig } = useAppContext();
    const primaryColor = nicheConfig?.primary_color || '#FF2D31';

    return (
        <div className="max-w-4xl mx-auto py-16 px-6 space-y-12 animate-fade-in text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white font-display uppercase tracking-tighter leading-none text-center">Términos y <span style={{ color: primaryColor }}>Condiciones</span></h1>
            <section className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
                <div className="space-y-6 text-gray-400 text-sm leading-relaxed font-medium">
                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">1. Aceptación de los Términos</h3>
                        <p>Al acceder y utilizar este servicio operado bajo Atlantis 5.0 para {nicheConfig?.name}, el usuario acepta cumplir con los presentes términos y condiciones en su totalidad. El uso continuado del servicio después de la publicación de cambios constituye la aceptación de dichas modificaciones. Si no está de acuerdo con alguna de las disposiciones, debe abstenerse de utilizar el servicio inmediatamente.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">2. Uso de Realidad Aumentada y Privacidad</h3>
                        <p>Esta aplicación requiere acceso técnico a la cámara de su dispositivo exclusivamente para ejecutar experiencias de Realidad Aumentada en tiempo real. No almacenamos, compartimos ni procesamos imágenes o vídeos personales en nuestros servidores sin su consentimiento explícito previo. Al utilizar filtros integrados con redes sociales de terceros (TikTok, Snapchat, Instagram, Meta), el usuario acepta y se sujeta también a las políticas de privacidad y términos de servicio de dichas plataformas.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">3. Propiedad Intelectual y Derechos de Autor</h3>
                        <p>Todos los diseños, modelos 3D, filtros, algoritmos, interfaces y códigos fuente contenidos en esta infraestructura son propiedad intelectual exclusiva de Atlantis 5.0 Smart Apps y sus respectivos licenciantes. El uso de estas herramientas se otorga bajo una licencia personal, no transferible y limitada para fines creative y de entretenimiento. Queda terminantemente prohibida la reproducción total o parcial, ingeniería inversa o uso comercial no autorizado de los activos digitales.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">4. Pagos, Suscripciones y Política de Reembolsos</h3>
                        <p>Las suscripciones a los planes Silver y Gold otorgan acceso a capacidades avanzadas y contenidos premium por el periodo contratado. Debido a la naturaleza digital e intangible del servicio, que ofrece acceso instantáneo a activos de software, los pagos realizados no son reembolsables bajo ninguna circunstancia una vez procesada la activación del plan en la cuenta del usuario.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">5. Limitación de Responsabilidad</h3>
                        <p>Atlantis 5.0 no se hace responsable por interrupciones del servicio, fallos técnicos derivados de la compatibilidad del hardware del usuario, conectividad a internet o cambios imprevistos en las APIs de plataformas de terceros que impidan la ejecución de las experiencias de RA. El usuario utiliza el servicio bajo su propio riesgo y responsabilidad.</p>
                    </div>

                    <div>
                        <h3 className="text-white font-black uppercase text-lg mb-2">6. Jurisdicción y Ley Aplicable</h3>
                        <p>Estos términos se rigen por las leyes vigentes en la República Bolivariana de Venezuela. Cualquier controversia será resuelta ante los tribunales competentes del Estado Nueva Esparta.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export const Plans: React.FC = () => {
    const { nicheConfig } = useAppContext();
    const primaryColor = nicheConfig?.primary_color || '#FF2D31';

    const tiers = [
        { 
            name: AccessLevel.BRONZE, 
            price: 'Gratis', 
            features: ['Experiencias Básicas', 'Acceso a Redes Sociales', 'Uso Ilimitado'],
            icon: Sparkles,
            color: 'text-orange-400',
            bg: 'bg-orange-900/10'
        },
        { 
            name: AccessLevel.SILVER, 
            price: 'Próximamente', 
            features: ['Filtros Exclusivos', 'Editor de Postales', 'Sin Anuncios', 'Soporte Prioritario'],
            icon: Star,
            color: 'text-gray-300',
            bg: 'bg-gray-700/10',
            highlight: false
        },
        { 
            name: AccessLevel.GOLD, 
            price: 'Próximamente', 
            features: ['Todo en Silver', 'Photo Booth Pro', 'Marcos Personalizados', 'Experiencias Multiusuario', 'Acceso Anticipado'],
            icon: Crown,
            color: 'text-navifest-gold',
            bg: 'bg-yellow-900/20',
            highlight: true
        }
    ];

    return (
        <div className="max-w-6xl mx-auto py-16 px-4 space-y-16 animate-fade-in text-center pb-32">
            <div className="space-y-4">
                <h1 className="text-5xl md:text-8xl font-black text-white font-display uppercase tracking-tighter">
                    Planes de <span style={{ color: primaryColor }}>Afiliación</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">Potencia tu creatividad con acceso exclusivo a lo mejor de {nicheConfig?.name}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => (
                    <div 
                        key={tier.name} 
                        className={`relative p-8 rounded-[3rem] border flex flex-col items-center gap-6 transition-all duration-500 hover:scale-[1.05] shadow-2xl ${tier.highlight ? 'bg-black border-navifest-gold' : 'bg-white/5 border-white/10'}`}
                    >
                        {tier.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-navifest-gold text-black px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                                Recomendado
                            </div>
                        )}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tier.bg} ${tier.color} border border-white/5`}>
                            <tier.icon size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{tier.name}</h3>
                            <p className="text-2xl font-black" style={{ color: tier.highlight ? '#FFD700' : 'white' }}>{tier.price}</p>
                        </div>
                        <ul className="space-y-3 w-full text-left">
                            {tier.features.map(f => (
                                <li key={f} className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                    <Check size={14} className="text-navifest-green" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button 
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 mt-auto ${tier.highlight ? 'bg-navifest-gold text-black' : 'bg-white/10 text-white'}`}
                        >
                            Comenzar Ahora
                        </button>
                    </div>
                ))}
            </div>
            <MandatoryLegalFootnote />
        </div>
    );
};

export const PaymentRegister = Plans;
