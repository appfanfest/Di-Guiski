import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

interface OnboardingSlidesProps {
  slides: string[];
  onFinish: () => void;
  requireAcceptance?: boolean;
}

export const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ slides, onFinish, requireAcceptance }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState(false);

  // Pre-load images
  useEffect(() => {
    slides.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [slides]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[3000] bg-black overflow-hidden select-none">
      {/* Progress Bar (Instagram style) */}
      <div className="absolute top-0 inset-x-0 p-4 z-20 flex gap-1 pt-6 bg-gradient-to-b from-black/50 to-transparent">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%' }}
              transition={{ duration: idx === currentIndex ? 5 : 0 }}
              onAnimationComplete={() => {
                if (idx === currentIndex && !isLastSlide) {
                  handleNext();
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button (always for guest, only before last slide for user with acceptance) */}
      {(!requireAcceptance || !isLastSlide) && (
        <button
          onClick={onFinish}
          className="absolute top-10 right-4 z-20 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 active:scale-90"
        >
          <X size={20} />
        </button>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex">
        <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
        <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
      </div>

      {/* Images */}
      <AnimatePresence initial={false} custom={currentIndex}>
        <motion.img
          key={currentIndex}
          src={slides[currentIndex]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Acceptance overlay for last slide */}
      {isLastSlide && (
        <div className="absolute bottom-0 inset-x-0 p-6 z-20 pb-12 flex flex-col items-center">
          {requireAcceptance ? (
            <div className="w-full max-w-sm space-y-4">
              <label className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/20 cursor-pointer active:scale-95 transition-all">
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${accepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/50'}`}>
                  {accepted && <Check size={16} className="text-white" />}
                </div>
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="hidden" />
                <span className="text-xs font-black text-white uppercase tracking-widest leading-tight flex-1 drop-shadow-md">
                  Acepto Términos, Condiciones y Políticas de Privacidad
                </span>
              </label>

              <button
                disabled={!accepted}
                onClick={onFinish}
                className="w-full py-4 px-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-white/30 flex items-center justify-center shadow-xl transition-all active:scale-95 z-30 relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Acepto y Continúo
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
               <button
                onClick={onFinish}
                className="w-full py-4 px-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-white/30 flex items-center justify-center shadow-xl transition-all active:scale-95 z-30 relative"
              >
                ¡Comenzar Experiencia!
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
