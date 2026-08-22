
import React from 'react';
import { Experience, AccessLevel, SocialNetwork, ExperienceType } from '../types';
import { useAppContext } from '../context/AppContext';
import { Lock, Share2, Camera, Edit3, Film, Frame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  experience: Experience;
}

export const ExperienceCard: React.FC<Props> = ({ experience }) => {
  const { user, nicheConfig } = useAppContext();
  const navigate = useNavigate();

  const primaryColor = nicheConfig?.primary_color || '#FF2D31';
  const isInternalTool = experience.photofiestas_postal || 
                         experience.type === ExperienceType.PHOTO_BOOTH || 
                         experience.type === ExperienceType.MARCOS_PRO;

  const getSocialStyle = (network: SocialNetwork) => {
    switch (network) {
      case SocialNetwork.TIKTOK:
        return 'bg-black text-white border-white/20';
      case SocialNetwork.SNAPCHAT:
        return 'bg-[#FFFC00] text-black border-black/10';
      case SocialNetwork.CANVA:
        return 'bg-[#00C4CC] text-white border-white/10';
      case SocialNetwork.GEMINI:
        return 'bg-[#1a73e8] text-white border-white/10';
      default:
        return 'bg-white/10 text-white border-white/10';
    }
  };

  const isAccessible = (): boolean => {
    if (experience.level === AccessLevel.BRONZE) return true;
    if (!user) return false;
    if (user.isAdmin) return true;
    if (user.level === AccessLevel.GOLD) return true;
    if (user.level === AccessLevel.SILVER && experience.level === AccessLevel.SILVER) return true;
    return false;
  };

  const accessible = isAccessible();

  const handleActivate = () => {
    if (accessible) {
      if (experience.photofiestas_postal) {
        navigate(`/editor/${experience.id}`);
      } else if (experience.type === ExperienceType.PHOTO_BOOTH) {
        navigate(`/photobooth/${experience.id}`);
      } else if (experience.type === ExperienceType.MARCOS_PRO) {
        navigate(`/marcos-pro/${experience.id}`);
      } else {
        window.open(experience.activationLink, '_blank');
      }
    } else {
      alert(`Acceso denegado. Se requiere plan ${experience.level}.`);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    let shareUrl = experience.demoLink || experience.activationLink;
    if (experience.photofiestas_postal) shareUrl = `${window.location.origin}/#/editor/${experience.id}`;
    else if (experience.type === ExperienceType.PHOTO_BOOTH) shareUrl = `${window.location.origin}/#/photobooth/${experience.id}`;
    else if (experience.type === ExperienceType.MARCOS_PRO) shareUrl = `${window.location.origin}/#/marcos-pro/${experience.id}`;

    const msg = `¡Mira esta experiencia en ${nicheConfig?.name || 'Atlantis'}! ✨\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getButtonContent = () => {
    if (!accessible) return { icon: <Lock size={10} />, label: 'BLOQUEADO' };
    if (experience.type === ExperienceType.PHOTO_BOOTH) return { icon: <Film size={10} />, label: 'BOOTH' };
    if (experience.type === ExperienceType.MARCOS_PRO) return { icon: <Frame size={10} />, label: 'MARCOS' };
    if (experience.photofiestas_postal) return { icon: <Edit3 size={10} />, label: 'EDITOR' };
    return { icon: <Camera size={10} />, label: 'ACTIVAR' };
  };

  const btn = getButtonContent();
  const socialStyle = getSocialStyle(experience.socialNetwork);

  return (
    <div className="bg-white/5 rounded-[1.2rem] p-0.5 border border-white/5 flex flex-col h-full shadow-xl active:scale-[0.98] transition-all duration-200 overflow-hidden group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black mb-1">
        <img src={experience.imageUrl} alt={experience.title} className="relative w-full h-full object-contain z-10 p-1 rounded-lg" loading="lazy" />
        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-wider border shadow-lg z-20 backdrop-blur-md ${experience.level === AccessLevel.GOLD ? 'bg-navifest-gold text-black border-white' : 'bg-black/40 text-white border-white/10'}`}>{experience.level}</div>
        
        {/* Overlay de Bloqueo: Sin blur y con candado más grande para motivar conversión */}
        {!accessible && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center z-30 transition-all group-hover:bg-black/20">
            <Lock className="text-white drop-shadow-[0_0_15px_rgba(0,0,0,1)] mb-1" size={32} />
            <p className="text-[7px] font-black text-white uppercase tracking-[0.2em] bg-black/60 px-2 py-0.5 rounded-full border border-white/20">
              PLAN {experience.level}
            </p>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col px-1 pb-1">
        <div className="mb-1">
            <span className={`text-[6px] px-2 py-0.5 rounded-[4px] font-black uppercase tracking-widest border opacity-90 shadow-sm ${socialStyle}`}>{experience.socialNetwork}</span>
        </div>
        <h3 className="text-[9px] font-bold text-white/80 leading-tight mb-1.5 line-clamp-2 h-5 font-display uppercase tracking-tighter">{experience.title}</h3>
        <div className="mt-auto flex flex-col gap-1">
            <button onClick={handleActivate} className={`w-full py-2 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border backdrop-blur-xl ${accessible ? 'text-white border-white/30 active:scale-95' : 'bg-white/5 text-gray-700 border-white/5'}`} style={{ backgroundColor: accessible ? `${primaryColor}40` : '', borderColor: accessible ? `${primaryColor}70` : '', boxShadow: accessible ? `0 0 15px ${primaryColor}50` : 'none', filter: accessible ? 'brightness(1.15)' : 'none' }}>{btn.icon} {btn.label}</button>
            <div className="flex gap-1">
                <button onClick={handleShare} className="flex-1 h-7 bg-white/5 text-gray-500 rounded-lg flex items-center justify-center border border-white/5 active:bg-white active:text-black transition-colors gap-2"><Share2 size={10} />{isInternalTool && <span className="text-[7px] font-black uppercase tracking-widest">Compartir</span>}</button>
                {experience.demoLink && !isInternalTool && (
                    <button onClick={() => window.open(experience.demoLink, '_blank')} className="flex-[2.5] h-7 bg-white/5 text-gray-400 rounded-lg flex items-center justify-center border border-white/5 active:bg-white active:text-black transition-colors font-black text-[8px] uppercase tracking-widest">DEMO</button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
