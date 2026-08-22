import React from 'react';
import { Experience, AccessLevel, SocialNetwork, ExperienceType } from './types';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Lock, Share2, Camera, Edit3, Film, Frame, Ticket, FileImage, BookOpen, Crown, Shield, Sparkles } from 'lucide-react';

interface Props {
  experience: Experience;
  onNavigate: (path: string) => void;
}

export const ExperienceCard: React.FC<Props> = ({ experience, onNavigate }) => {
  const { t } = useLanguage();
  const { user, metaversos, activeMetaverso } = useAtlantis() as any;
  const activeMetaverseData = metaversos?.find((m: any) => m.nombre === activeMetaverso);
  const primaryColor = activeMetaverseData?.secondary_color || '#10b981';

  const isPapercraft = 
    experience.type === ExperienceType.PAPERCRAFT_CAJA ||
    experience.type === ExperienceType.PAPERCRAFT_CAJITA_FELIZ ||
    experience.type === ExperienceType.PAPERCRAFT_DOMO ||
    experience.type === ExperienceType.PAPERCRAFT_CARRUSEL;

  const isInternalTool = experience.photofiestas_postal ||
    experience.type === ExperienceType.PHOTO_BOOTH ||
    experience.type === ExperienceType.MARCOS_PRO ||
    experience.type === ExperienceType.POSTERS ||
    experience.type === ExperienceType.MI_ALBUM ||
    experience.type === ExperienceType.HORA_LOCA_HATS ||
    experience.type === ExperienceType.FACE_GLAM ||
    experience.type === ExperienceType.FONDOS_INMERSIVOS ||
    experience.type === ExperienceType.POSTALES ||
    experience.type === ExperienceType.POSTALES_DOBLADAS ||
    isPapercraft;

  const getSocialStyle = (network: SocialNetwork) => {
    switch (network) {
      case SocialNetwork.TIKTOK: return 'bg-black text-white border-white/20';
      case SocialNetwork.SNAPCHAT: return 'bg-[#FFFC00] text-black border-black/10';
      case SocialNetwork.CANVA: return 'bg-[#00C4CC] text-white border-white/10';
      case SocialNetwork.GEMINI: return 'bg-[#1a73e8] text-white border-white/10';
      case SocialNetwork.FANFEST: return 'bg-emerald-500 text-white border-white/10';
      default: return 'bg-white/10 text-white border-white/10';
    }
  };

  // Level hierarchy: Bronce(1) < Silver(2) < Gold(3) < Admin(99)
  const LEVEL_WEIGHT: Record<string, number> = {
    [AccessLevel.BRONZE]: 1,
    [AccessLevel.SILVER]: 2,
    [AccessLevel.GOLD]: 3,
    [AccessLevel.ADMIN]: 99,
  };

  const userWeight = LEVEL_WEIGHT[user?.level ?? ''] ?? 1; // No session = Bronce (1) — free tier
  const requiredWeight = LEVEL_WEIGHT[experience.level] ?? 1;

  const isAccessible = (): boolean => {
    // Admin always has access
    if (user?.isAdmin) return true;
    // Bronce is free — unauthenticated users can access it
    return userWeight >= requiredWeight;
  };

  const accessible = isAccessible();

  const handleActivate = () => {
    if (accessible) {
      if (experience.photofiestas_postal) {
        onNavigate(`/editor/${experience.id}`);
      } else if (experience.type === ExperienceType.PHOTO_BOOTH) {
        onNavigate(`/photobooth/${experience.id}`);
      } else if (experience.type === ExperienceType.MARCOS_PRO) {
        onNavigate(`/marcos-pro/${experience.id}`);
      } else if (experience.type === ExperienceType.POSTERS) {
        onNavigate(`/poster/${experience.id}`);
      } else if (experience.type === ExperienceType.POSTALES) {
        onNavigate(`/postales/${experience.id}`);
      } else if (experience.type === ExperienceType.POSTALES_DOBLADAS) {
        onNavigate(`/postales-dobladas/${experience.id}`);
      } else if (isPapercraft) {
        onNavigate(`/papercraft/${experience.id}`);
      } else if (experience.type === ExperienceType.MI_ALBUM) {
        onNavigate(`/album/${experience.id}`);
      } else if (experience.socialNetwork === SocialNetwork.FANFEST) {
        if (experience.type === ExperienceType.HORA_LOCA_HATS) {
          onNavigate(`/ar-hora-loca/${experience.id}`);
        } else if (experience.type === ExperienceType.FACE_GLAM) {
          onNavigate(`/ar-face-glam/${experience.id}`);
        } else if (experience.type === ExperienceType.FONDOS_INMERSIVOS) {
          onNavigate(`/ar-fondos/${experience.id}`);
        } else {
          window.open(experience.activationLink, '_blank');
        }
      } else {
        window.open(experience.activationLink, '_blank');
      }
    } else {
      onNavigate('/plans');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    let shareUrl = experience.demoLink || experience.activationLink;
    if (experience.photofiestas_postal) shareUrl = `${window.location.origin}/#/editor/${experience.id}`;
    else if (experience.type === ExperienceType.PHOTO_BOOTH) shareUrl = `${window.location.origin}/#/photobooth/${experience.id}`;
    else if (experience.type === ExperienceType.MARCOS_PRO) shareUrl = `${window.location.origin}/#/marcos-pro/${experience.id}`;
    else if (experience.type === ExperienceType.POSTERS) shareUrl = `${window.location.origin}/#/poster/${experience.id}`;
    else if (experience.type === ExperienceType.POSTALES) shareUrl = `${window.location.origin}/#/postales/${experience.id}`;
    else if (experience.type === ExperienceType.POSTALES_DOBLADAS) shareUrl = `${window.location.origin}/#/postales-dobladas/${experience.id}`;
    else if (isPapercraft) shareUrl = `${window.location.origin}/#/papercraft/${experience.id}`;
    else if (experience.type === ExperienceType.MI_ALBUM) shareUrl = `${window.location.origin}/#/album/${experience.id}`;
    else if (experience.type === ExperienceType.HORA_LOCA_HATS) shareUrl = `${window.location.origin}/#/ar-hora-loca/${experience.id}`;
    else if (experience.type === ExperienceType.FACE_GLAM) shareUrl = `${window.location.origin}/#/ar-face-glam/${experience.id}`;
    else if (experience.type === ExperienceType.FONDOS_INMERSIVOS) shareUrl = `${window.location.origin}/#/ar-fondos/${experience.id}`;
    const msg = `¡Mira esta experiencia en ${activeMetaverseData?.nombre || 'FanFest 5.0'}! ✨\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getButtonContent = () => {
    if (!accessible) return { icon: <Ticket size={10} />, label: 'VER PLANES' };
    if (experience.type === ExperienceType.PHOTO_BOOTH) return { icon: <Film size={10} />, label: 'BOOTH' };
    if (experience.type === ExperienceType.MARCOS_PRO) return { icon: <Frame size={10} />, label: 'MARCOS' };
    if (experience.type === ExperienceType.POSTERS) return { icon: <FileImage size={10} />, label: 'POSTER' };
    if (experience.type === ExperienceType.POSTALES) return { icon: <FileImage size={10} />, label: 'POSTALES' };
    if (experience.type === ExperienceType.POSTALES_DOBLADAS) return { icon: <FileImage size={10} />, label: 'POSTALES' };
    if (isPapercraft) return { icon: <FileImage size={10} />, label: 'PAPERCRAFT' };
    if (experience.type === ExperienceType.MI_ALBUM) return { icon: <BookOpen size={10} />, label: 'ÁLBUM' };
    if (experience.photofiestas_postal) return { icon: <Edit3 size={10} />, label: 'EDITOR' };
    return { icon: <Camera size={10} />, label: 'ACTIVAR' };
  };

  const btn = getButtonContent();
  const socialStyle = getSocialStyle(experience.socialNetwork);

  return (
    <div className="bg-white/5 rounded-[1.2rem] p-0.5 border border-white/5 flex flex-col h-full shadow-xl active:scale-[0.98] transition-all duration-200 overflow-hidden group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black mb-1">
        <img
          src={experience.imageUrl}
          alt={experience.title}
          className="relative w-full h-full object-contain z-10 p-1 rounded-lg"
          loading="lazy"
        />
        {/* Plan badge */}
        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-wider border shadow-lg z-20 flex items-center gap-0.5
          ${experience.level === AccessLevel.GOLD ? 'text-black border-yellow-300' : experience.level === AccessLevel.SILVER ? 'text-white border-slate-300/40 bg-slate-600/60' : 'text-white border-amber-700/40 bg-amber-900/60'}`}
          style={experience.level === AccessLevel.GOLD ? { backgroundColor: '#FFD700', color: '#000' } : {}}>
          {experience.level === AccessLevel.GOLD ? <Crown size={7} /> : experience.level === AccessLevel.SILVER ? <Shield size={7} /> : <Sparkles size={7} />}
          {experience.level}
        </div>

        {/* Lock overlay for inaccessible content — 10% opacity so content is still visible */}
        {!accessible && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.10)' }}>
            <div className="bg-black/60 rounded-xl px-3 py-2 flex flex-col items-center gap-1">
              <Lock size={18} className="text-white/90" />
              <span className="text-[7px] font-black text-white/90 uppercase tracking-widest text-center">
                {experience.level === AccessLevel.GOLD ? 'Plan Gold' : experience.level === AccessLevel.SILVER ? 'Plan Silver' : 'Plan Bronce'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-1 pb-1">
        <div className="mb-1">
          <span className={`text-[6px] px-2 py-0.5 rounded-[4px] font-black uppercase tracking-widest border opacity-90 shadow-sm ${socialStyle}`}>
            {experience.socialNetwork}
          </span>
        </div>
        <h3 className="text-[9px] font-bold leading-tight mb-1.5 line-clamp-2 h-5 uppercase tracking-tighter" style={{ color: primaryColor }}>{experience.title}</h3>
        <div className="mt-auto flex flex-col gap-1">
          <button
            onClick={handleActivate}
            className={`w-full py-2 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border ${accessible ? 'text-white border-white/30 active:scale-95' : 'bg-white/5 text-gray-700 border-white/5'}`}
            style={{
              backgroundColor: accessible ? `${primaryColor}40` : '',
              borderColor: accessible ? `${primaryColor}70` : '',
              boxShadow: accessible ? `0 0 15px ${primaryColor}50` : 'none',
            }}
          >
            {btn.icon} {btn.label}
          </button>
          <div className="flex gap-1">
            <button onClick={handleShare} className="flex-1 h-7 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 active:bg-white transition-colors gap-2" style={{ color: primaryColor }}>
              <Share2 size={10} />
              {isInternalTool && <span className="text-[7px] font-black uppercase tracking-widest">{t.atlantis?.share || 'COMPARTIR'}</span>}
            </button>
            {experience.demoLink && (
              <button onClick={() => window.open(experience.demoLink, '_blank')} className="flex-[2.5] h-7 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 active:bg-white transition-colors font-black text-[8px] uppercase tracking-widest" style={{ color: primaryColor }}>{t.atlantis?.demo || 'DEMO'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
