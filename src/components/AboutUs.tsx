import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Youtube, Play, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AboutUsProps {
  onPromotersClick: () => void;
  org?: any;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onPromotersClick, org }) => {
  const { t, lang } = useLanguage();

  // Extract YouTube ID for thumbnail
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoUrl = lang === 'en' ? (org?.video_nosotros_en || org?.video_nosotros) : lang === 'fr' ? (org?.video_nosotros_fr || org?.video_nosotros) : org?.video_nosotros;
  const videoId = videoUrl ? getYoutubeId(videoUrl) : null;
  const thumbnailUrl = videoId 
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` 
    : "https://picsum.photos/seed/nosotros/800/1200";

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-fifa-blue/10 text-fifa-blue rounded-2xl flex items-center justify-center mx-auto mb-2">
          <Trophy size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{t.about.title}</h2>
        <p className="text-sm text-slate-500 font-medium max-w-[280px] mx-auto">
          {t.about.subtitle}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => videoUrl && window.open(videoUrl, '_blank')}
        className="relative aspect-[9/16] max-h-[500px] mx-auto bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer border-8 border-white"
      >
        <img 
          src={thumbnailUrl} 
          alt={t.about.videoAlt} 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-2xl">
            <Play size={40} className="text-white fill-white/20 ml-1" />
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Youtube size={16} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.about.youtubeShort}</span>
          </div>
          <p className="text-xl font-black uppercase tracking-tight leading-none">{t.about.fanfestStory}</p>
        </div>
      </motion.div>

      <div className="text-center px-8">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t.about.footer}</p>
      </div>
    </div>
  );
};
