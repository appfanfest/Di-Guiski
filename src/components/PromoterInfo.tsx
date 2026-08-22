import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  BarChart3, 
  Users2, 
  Zap, 
  Globe2, 
  Trophy, 
  QrCode, 
  Layout, 
  Database,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface PromoterInfoProps {
  onContactClick: () => void;
}

export const PromoterInfo: React.FC<PromoterInfoProps> = ({ onContactClick }) => {
  const [copied, setCopied] = React.useState(false);

  const copyProposal = () => {
    const text = `
FANFEST QUINIELA 2026 - PROPUESTA PARA PROMOTORES COMERCIALES

1. CARACTERÍSTICAS CLAVE:
- Branding Personalizado: Integre su identidad visual en la app.
- Base de Datos Propia: Leads calificados (nombres, correos, teléfonos).
- Cupones QR Inteligentes: Tráfico real a su local comercial.
- Analítica en Tiempo Real: Monitoreo de engagement y conversión.

2. ALTERNATIVAS COMERCIALES:
- Patrocinio Tradicional: Presencia en Home y banners rotativos.
- Promotor Local Físico: Cupones de canje y validación presencial QR.
- Quiniela Privada (Corporate): Grupos exclusivos para empleados o clientes VIP.

3. PRESENCIA INTERNACIONAL:
- Oficinas en Caracas (Venezuela), Miami, Cincinnati y Texas (EE.UU.).

Contáctanos para una demo personalizada.
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const characteristics = [
    {
      icon: <Layout className="text-blue-500" />,
      title: "Branding Personalizado",
      desc: "Integre su identidad visual: logos, colores corporativos y banners exclusivos en la interfaz de la quiniela."
    },
    {
      icon: <Database className="text-emerald-500" />,
      title: "Base de Datos Propia",
      desc: "Obtenga leads calificados con nombres, correos y teléfonos de sus participantes para sus campañas de marketing."
    },
    {
      icon: <QrCode className="text-purple-500" />,
      title: "Cupones QR Inteligentes",
      desc: "Genere tráfico a su local físico validando la participación mediante escaneo de códigos QR únicos."
    },
    {
      icon: <BarChart3 className="text-orange-500" />,
      title: "Analítica en Tiempo Real",
      desc: "Monitoree el engagement de sus promociones, cantidad de usuarios activos y efectividad de sus convocatorias."
    }
  ];

  const alternatives = [
    {
      title: "Patrocinio Tradicional",
      items: [
        "Presencia de marca en el Home",
        "Mención en correos transaccionales",
        "Banner rotativo en sección de resultados"
      ]
    },
    {
      title: "Promotor de Local Físico",
      items: [
        "Generación de cupones de canje",
        "Validación presencial vía QR",
        "Aumento comprobable de foot-traffic"
      ]
    },
    {
      title: "Quiniela Privada (Corporate)",
      items: [
        "Grupos exclusivos para empleados o selectos",
        "Ranking privado con premios específicos",
        "Entorno cerrado y seguro"
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fifa-blue/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
              <Building2 size={24} className="text-fifa-gold" />
            </div>
            <button 
              onClick={copyProposal}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/10"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar Texto Com'}
            </button>
          </div>
          <h2 className="text-3xl font-black mb-4 leading-tight">Potencie su marca con la Pasión del Fútbol</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            FanFest Quiniela ofrece soluciones tecnológicas para que marcas y comercios conviertan la emoción deportiva en resultados comerciales medibles.
          </p>
        </div>
      </div>

      {/* Características Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characteristics.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Alternativas de Participación */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 px-2 flex items-center gap-2">
          <Zap size={20} className="text-fifa-gold" />
          Alternativas Comerciales
        </h3>
        {alternatives.map((alt, i) => (
          <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50">
            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-fifa-blue mb-4">{alt.title}</h4>
            <ul className="space-y-3">
              {alt.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Presencia Global */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-6">
          <Globe2 size={32} className="text-fifa-blue" />
          <div>
            <h4 className="font-black text-slate-800">Soporte Local e Internacional</h4>
            <p className="text-xs text-slate-500">Operaciones en tiempo real para sus campañas.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estados Unidos</p>
            <p className="text-sm font-bold text-slate-700">Miami, Texas, Cincinnati</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latinoamérica</p>
            <p className="text-sm font-bold text-slate-700">Caracas, Venezuela (Central)</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-fifa-blue text-white p-8 rounded-[2rem] text-center">
        <Trophy size={48} className="mx-auto mb-4 text-fifa-gold" />
        <h3 className="text-xl font-black mb-2">¿Listo para ser un Promotor?</h3>
        <p className="text-sm opacity-80 mb-6">Contáctenos hoy mismo para diseñar un paquete a la medida de su presupuesto y objetivos.</p>
        <button 
          onClick={onContactClick}
          className="w-full py-4 bg-white text-fifa-blue rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg"
        >
          SOLICITAR DEMO / CONTACTO
        </button>
      </div>
    </div>
  );
};
