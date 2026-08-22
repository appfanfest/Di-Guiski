import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Trophy, QrCode, ClipboardList, ShieldCheck, Sparkles, Box, Award, BookOpen, Scale, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
  icon: React.ReactNode;
  highlight?: boolean;
  theme?: 'amber' | 'emerald';
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, icon, highlight, theme = 'amber' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const themeColors = {
    amber: {
      border: '#f59e0b',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
      shadow: 'rgba(245,158,11,0.15)',
      icon: '#d97706',
      text: '#78350f',
      chevron: '#fbbf24'
    },
    emerald: {
      border: '#10b981',
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
      shadow: 'rgba(16,185,129,0.15)',
      icon: '#059669',
      text: '#064e3b',
      chevron: '#34d399'
    }
  };

  const colors = themeColors[theme];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: highlight ? `2px solid ${colors.border}` : '1px solid #f1f5f9',
        background: highlight ? colors.bg : '#ffffff',
        boxShadow: highlight ? `0 8px 32px ${colors.shadow}` : undefined,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div style={{ color: highlight ? colors.icon : undefined }} className={highlight ? '' : 'text-fifa-blue'}>
            {icon}
          </div>
          <span
            className="text-sm font-bold leading-snug"
            style={{ color: highlight ? colors.text : '#1e293b' }}
          >
            {question}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: highlight ? colors.chevron : '#cbd5e1' }}>
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-xs text-slate-500 leading-relaxed border-t border-slate-100">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Respuestas enriquecidas ──────────────────────────────────────────
const GlosarioAnswer = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 pt-1">
      {[
        { term: t.faq_scoring?.aciertoTerm || 'Acierto', def: t.faq_scoring?.aciertoDef || 'Pronosticar correctamente el resultado final de un partido (Gana Local "1", Empate "E" o Gana Visitante "2").' },
        { term: t.faq_scoring?.quinielaTerm || 'Quiniela', def: t.faq_scoring?.quinielaDef || 'Conjunto de 3 formularios por participante. Cada formulario compite de forma individual en el ranking.' },
        { term: t.faq_scoring?.rondaTerm || 'Ronda', def: t.faq_scoring?.rondaDef || 'Fase del torneo (Grupos, Dieciseisavos, Octavos…) que determina el valor en puntos del acierto.' },
        { term: t.faq_scoring?.valoracionTerm || 'Valoración del Resultado', def: t.faq_scoring?.valoracionDef || 'Peso técnico de cada resultado según su probabilidad estadística. Se acumula y sirve como criterio de desempate.' },
        { term: t.faq_scoring?.cierreTerm || 'Cierre', def: t.faq_scoring?.cierreDef || 'Fecha y hora límite para actualizar pronósticos. Pasado el cierre, los registros quedan bloqueados definitivamente.' },
      ].map((item, i) => (
        <div key={i} className="border-l-2 border-fifa-blue pl-3 py-0.5">
          <p className="font-black text-slate-700 text-[11px] uppercase tracking-wide">{item.term}</p>
          <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{item.def}</p>
        </div>
      ))}
    </div>
  );
};

const PuntosAnswer = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs text-slate-500">
        {t.faq_scoring?.pointsDesc || 'Cada acierto vale según la fase en que se logra. Los puntos se acumulan durante todo el torneo:'}
      </p>
      <div className="rounded-xl overflow-hidden border border-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#1e293b', color: '#fff' }}>
              <th className="text-left p-2.5 font-black text-[10px] uppercase tracking-wider">{t.faq_scoring?.rondaHeader || 'Ronda'}</th>
              <th className="text-center p-2.5 font-black text-[10px] uppercase tracking-wider">{t.faq_scoring?.puntosHeader || 'Puntos'}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { ronda: t.faq_scoring?.faseGrupos || 'Fase de Grupos', pts: '1.00' },
              { ronda: t.faq_scoring?.dieciseisavos || 'Dieciseisavos de Final', pts: '1.25' },
              { ronda: t.faq_scoring?.octavos || 'Octavos de Final', pts: '1.50' },
              { ronda: t.faq_scoring?.cuartos || 'Cuartos de Final', pts: '1.75' },
              { ronda: t.faq_scoring?.semifinales || 'Semifinales', pts: '2.00' },
              { ronda: t.faq_scoring?.tercerPuesto || '3er y 4to Puesto', pts: '2.25' },
              { ronda: t.faq_scoring?.final || 'Gran Final (Campeón)', pts: '2.50' },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td className="p-2.5 font-medium text-slate-600">{row.ronda}</td>
                <td className="p-2.5 text-center">
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {row.pts} {t.faq_scoring?.pts || 'pts'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400 italic">
        {t.faq_scoring?.pointsAsterisk || '* La valoración técnica de cada resultado acertado también se acumula y actúa como desempate automático.'}
      </p>
    </div>
  );
};

const DesempateAnswer = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs text-slate-500">
        {t.faq_scoring?.tieDesc1 || 'Si 2 o más formularios empatan en puntos al finalizar la Gran Final, se aplican estos criterios'}{' '}
        <strong className="text-slate-700">{t.faq_scoring?.tieDesc2 || 'en orden estricto'}</strong> {t.faq_scoring?.tieDesc3 || 'hasta obtener un único ganador:'}
      </p>
      <div className="space-y-2">
        {[
          { n: '1', text: t.faq_scoring?.tieRule1 || 'Mayor cantidad de puntos de valoración acumulados en todo el torneo.' },
          { n: '2', text: t.faq_scoring?.tieRule2 || 'Mayor cantidad de puntos de valoración obtenidos en un solo partido.' },
          { n: '3', text: t.faq_scoring?.tieRule3 || 'Haber participado en la mayor cantidad de rondas del torneo.' },
          { n: '4', text: t.faq_scoring?.tieRule4 || 'Haber pronosticado en la mayor cantidad de partidos.' },
          { n: '5', text: t.faq_scoring?.tieRule5 || 'Sorteo aleatorio con la tecnología encriptada certificada del FanFest 5.0.' },
        ].map((item) => (
          <div key={item.n} className="flex items-start gap-3">
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-white"
              style={{ background: item.n === '5' ? '#059669' : '#1e293b' }}
            >
              {item.n}
            </span>
            <p className="text-xs text-slate-600 pt-0.5">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
        <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
          {t.faq_scoring?.tieSecurePrefix || '🔐 El sorteo final usa'}{' '}
          <code className="font-mono bg-emerald-100 px-1 rounded">window.crypto.getRandomValues</code>{' '}
          {t.faq_scoring?.tieSecureSuffix || '— algoritmo criptográfico demostrable que garantiza imparcialidad absoluta.'}
        </p>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────
export const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const faqs: FAQItemProps[] = [
    {
      question: t.faq?.q1 || '¿Cómo participo en la quiniela?',
      answer: t.faq?.a1 || 'Es muy sencillo. La quiniela abarca todos los partidos desde la fase de grupos hasta la gran final.',
      icon: <ClipboardList size={20} className="text-fifa-blue" />,
    },
    {
      question: t.faq?.q2 || '¿Qué es el Bingo VAR Mundialista?',
      answer: t.faq?.a2 || 'Es una dinámica interactiva en tiempo real.',
      icon: <Sparkles size={20} className="text-orange-500" />,
    },
    {
      question: t.faq?.q3 || '¿Qué es el Ciclón Mundialista?',
      answer: t.faq?.a3 || 'Es nuestro innovador sistema de sorteos en vivo.',
      icon: <Sparkles size={20} className="text-emerald-500" />,
    },
    {
      question: t.faq?.q4 || '¿Existen Quinielas Privadas?',
      answer: t.faq?.a4 || '¡Absolutamente!',
      icon: <Users size={20} className="text-indigo-500" />,
    },
    {
      question: t.faq?.q5 || '¿Existen Quinielas Privadas para Empresas?',
      answer: t.faq?.a5 || 'Sí, las marcas y corporaciones pueden activar ecosistemas privados.',
      icon: <ShieldCheck size={20} className="text-red-500" />,
    },
    {
      question: t.faq?.q6 || '¿Puedo empezar a promocionar si el torneo ya inició?',
      answer: t.faq?.a6 || '¡Un rotundo SÍ!',
      icon: <QrCode size={20} className="text-cyan-500" />,
    },
    {
      question: t.faq?.q7 || '¿Cómo se calculan los puntos?',
      answer: t.faq?.a7 || 'Obtienes puntos por cada acierto en el resultado final.',
      icon: <Trophy size={20} className="text-fifa-gold" />,
    },
    {
      question: t.faq?.q8 || '¿Qué es el Metaverso Interactivo FanFest 5.0?',
      answer: t.faq?.a8 || 'El Metaverso FanFest es un ecosistema de experiencias inmersivas.',
      icon: <Box size={20} className="text-purple-500" />,
    },
    // ── BLOQUE DE PUNTUACIÓN (Se renderizará después del badge) ──────
    {
      question: t.faq_scoring?.glossaryTitle || '📖 Glosario Oficial de Términos',
      answer: <GlosarioAnswer />,
      icon: <BookOpen size={20} className="text-slate-600" />,
      highlight: false,
    },
    {
      question: t.faq_scoring?.pointsTitle || '🏅 Tabla de Puntos por Ronda — Mecánica Oficial',
      answer: <PuntosAnswer />,
      icon: <Award size={22} className="text-emerald-600" />,
      highlight: true,
      theme: 'emerald'
    },
    {
      question: t.faq_scoring?.tieTitle || '⚖️ ¿Cómo se resuelven los empates? — Política Oficial',
      answer: <DesempateAnswer />,
      icon: <Scale size={22} className="text-emerald-600" />,
      highlight: true,
      theme: 'emerald'
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">{t.faq?.title || '¿Cómo Funciona?'}</h2>
        <p className="text-sm text-slate-500">{t.faq?.subtitle || 'Todo lo que necesitas saber para ganar en FanFest.'}</p>
      </div>

      <div className="space-y-3">
        {/* Renderizamos las primeras 8 preguntas (Generales + Metaverso) */}
        {faqs.slice(0, 8).map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}

        {/* Badge indicador insertado justo antes de la mecánica de puntos */}
        <div className="flex items-center gap-3 px-1 py-4">
          <div className="flex-1 h-px bg-emerald-200" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full">
            {t.faq?.officialMechanics || '❖ Mecánica Oficial de Puntuación'}
          </span>
          <div className="flex-1 h-px bg-emerald-200" />
        </div>

        {/* Renderizamos las últimas 3 preguntas (La mecánica oficial) */}
        {faqs.slice(8).map((faq, index) => (
          <FAQItem key={index + 8} {...faq} />
        ))}
      </div>

      <div className="p-6 bg-slate-100 rounded-3xl text-center">
        <p className="text-xs text-slate-500 font-medium">
          {t.faq?.stillHaveDuoubts || '¿Aún tienes dudas?'} <br />
          {t.faq?.contactViaMenu || 'Contáctanos directamente a través del menú de soporte.'}
        </p>
      </div>
    </div>
  );
};
