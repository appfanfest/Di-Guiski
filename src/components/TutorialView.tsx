import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Play, Sparkles, Trophy, Target } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TutorialViewProps {
  onClose: () => void;
  videoUrl?: string;
  org?: any;
}

export const TutorialView: React.FC<TutorialViewProps> = ({ onClose, videoUrl, org }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const slides = [
    {
      title: t.tutorial?.slide1Title || "PRONÓSTICOS 5.0",
      subtitle: t.tutorial?.slide1Sub || "Tu pasión, tus reglas",
      description: t.tutorial?.slide1Desc || "Crea tus pronósticos maestros y planos estratégicos para dominar todas las quinielas del Mundial.",
      video: org?.tutorial_img1 || videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      icon: <Target className="text-fifa-gold" size={24} />
    },
    {
      title: t.tutorial?.slide2Title || "PROMOCIONES INTERACTIVAS",
      subtitle: t.tutorial?.slide2Sub || "Gana mientras disfrutas",
      description: t.tutorial?.slide2Desc || "Participa en el Bingo VAR y Ciclón Mundialista en tiempo real desde tus locales favoritos.",
      video: org?.tutorial_img2 || videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      icon: <Trophy className="text-fifa-gold" size={24} />
    },
    {
      title: t.tutorial?.slide3Title || "METAVERSO ATLANTIS",
      subtitle: t.tutorial?.slide3Sub || "Vive el mundial en RA",
      description: t.tutorial?.slide3Desc || "Entra a la realidad aumentada, interactúa con marcas y conviértete en el cromo dorado del mundial.",
      video: org?.tutorial_img3 || videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      icon: <Sparkles className="text-fifa-gold" size={24} />
    }
  ];

  const next = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[360px] aspect-[9/16] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10"
      >
        {/* Progress Bar */}
        <div className="absolute top-6 left-8 right-8 z-50 flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: i <= currentSlide ? '100%' : '0%' }}
                className="h-full bg-fifa-gold"
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-10 right-6 z-50 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-colors"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0"
          >
            {/* Video Background */}
            <div className="absolute inset-0 bg-slate-900">
              <video 
                src={slides[currentSlide].video}
                className="w-full h-full object-cover opacity-60"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-10 pb-16 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  {slides[currentSlide].icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-fifa-gold uppercase tracking-[0.2em]">{slides[currentSlide].subtitle}</p>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{slides[currentSlide].title}</h2>
                </div>
              </div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-10 left-8 right-8 z-50 flex justify-between items-center">
          <button 
            onClick={prev}
            className="w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={currentSlide === slides.length - 1 ? onClose : next}
            className="px-8 h-12 bg-fifa-gold text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all active:scale-95"
          >
            {currentSlide === slides.length - 1 ? (t.tutorial?.btnStart || "EMPEZAR") : (t.tutorial?.btnNext || "SIGUIENTE")}
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
