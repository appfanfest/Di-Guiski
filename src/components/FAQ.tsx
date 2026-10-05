import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Camera, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface FAQItemProps {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="text-fifa-blue">
            {icon}
          </div>
          <span className="text-sm font-bold leading-snug text-slate-800">
            {question}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-slate-300">
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
            <div className="p-4 pt-0 text-xs text-slate-500 leading-relaxed border-t border-slate-100 mt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const { lang } = useLanguage();
  
  const faqs: FAQItemProps[] = [
    {
      question: lang === 'es' ? '¿Qué es ¡Sonríe, Di Guiski!?' : (lang === 'en' ? 'What is Smile, Di Guiski!?' : 'Qu\'est-ce que Souriez, Di Guiski!?'),
      answer: lang === 'es' 
        ? 'Es nuestra experiencia de cámara interactiva con realidad aumentada (AR) donde puedes usar filtros y marcos divertidos para compartir tus momentos.'
        : (lang === 'en' 
          ? 'It is our interactive camera experience with augmented reality (AR) where you can use fun filters and frames to share your moments.' 
          : 'C\'est notre expérience de caméra interactive avec réalité augmentée (AR) où vous pouvez utiliser des filtres et des cadres amusants pour partager vos moments.'),
      icon: <Camera size={20} />,
    },
    {
      question: lang === 'es' ? '¿Cómo funciona la sección de Impresos?' : (lang === 'en' ? 'How does the Prints section work?' : 'Comment fonctionne la section Impressions?'),
      answer: lang === 'es'
        ? 'Puedes generar y descargar diseños en alta calidad listos para imprimir, como pósters y material promocional para tus eventos y celebraciones.'
        : (lang === 'en'
          ? 'You can generate and download high-quality ready-to-print designs, such as posters and promotional material for your events and celebrations.'
          : 'Vous pouvez générer et télécharger des designs de haute qualité prêts à imprimer, tels que des affiches et du matériel promotionnel pour vos événements et célébrations.'),
      icon: <Printer size={20} />,
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">
          {lang === 'es' ? 'Centro de Ayuda' : (lang === 'en' ? 'Help Center' : 'Centre d\'Aide')}
        </h2>
        <p className="text-sm text-slate-500">
          {lang === 'es' ? 'Resuelve tus dudas sobre las nuevas funciones.' : (lang === 'en' ? 'Solve your doubts about the new features.' : 'Résolvez vos doutes sur les nouvelles fonctionnalités.')}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </div>

      <div className="p-6 bg-slate-100 rounded-3xl text-center mt-8">
        <p className="text-xs text-slate-500 font-medium">
          {lang === 'es' ? '¿Aún tienes dudas?' : (lang === 'en' ? 'Still have doubts?' : 'Encore des doutes ?')} <br />
          {lang === 'es' ? 'Contáctanos a través de nuestras redes sociales.' : (lang === 'en' ? 'Contact us through our social networks.' : 'Contactez-nous via nos réseaux sociaux.')}
        </p>
      </div>
    </div>
  );
};

