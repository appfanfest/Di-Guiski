import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  org?: any;
}

export const Countdown: React.FC<CountdownProps> = ({ org }) => {
  const targetDate = new Date('2026-06-11T00:00:00').getTime();
  
  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-black text-white tracking-tighter leading-none">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mt-0.5">
        {label}
      </div>
    </div>
  );

  const showCountdown = false;

  if (!showCountdown) return null;

  return (
    <div className="px-3">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-green-800 p-5 shadow-lg border border-white/20"
      >
        {/* Subtle Background Elements */}
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col items-center text-center space-y-4">
          <div className="space-y-3 w-full">
            <h3 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.25em] drop-shadow-sm">
              LA FIESTA COMIENZA EN...
            </h3>
            
            <div className="flex items-center justify-center gap-6 bg-black/20 backdrop-blur-sm py-3 px-6 rounded-2xl border border-white/5 mx-auto w-fit">
              <TimeUnit value={timeLeft.days} label="Días" />
              <div className="w-px h-6 bg-white/10" />
              <TimeUnit value={timeLeft.hours} label="Hrs" />
              <div className="w-px h-6 bg-white/10" />
              <TimeUnit value={timeLeft.minutes} label="Min" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-[2rem] border border-white/15 w-full max-w-[340px] shadow-inner flex flex-col gap-3">
            <div className="text-center w-full">
              <span className="text-yellow-300 font-black text-[10px] tracking-[0.15em] uppercase block animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                ¡NO PIERDAS LA OPORTUNIDAD!
              </span>
            </div>
            
            <div className="flex items-center gap-4 w-full">
              <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-lg">
                <img 
                  src={org?.arbitro_amarilla || "file:///C:/Users/windows8/.gemini/antigravity/brain/15d5ae81-aa8e-4f4f-8802-91b9c48c24bf/referee_yellow_card_1777584495558.png"} 
                  alt="Árbitro" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] font-bold text-white text-left leading-snug flex-1">
                Regístrate Hoy y activa TODO el poder de la app.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
