import React, { useState, useEffect } from 'react';
import { AtlantisAppProvider, useAtlantis } from './AppContext';
import { AtlantisLayout } from './Layout';
import { AtlantisHome } from './Home';
import { ExperienceList } from './ExperienceList';
import { EditorPage } from './EditorPage';
import { MarcosPro } from './MarcosPro';
import { PhotoBooth } from './PhotoBooth';
import { PosterEditor } from './PosterEditor';
import { AlbumEditor } from './AlbumEditor';
import { PostalesEditor } from './PostalesEditor';
import { PostalesDobladasEditor } from './PostalesDobladasEditor';
import { PapercraftEditor } from './PapercraftEditor';
import PlansPage from './PlansPage';
import { ARHoraLoca } from '../metaverse/ar/ARHoraLoca';
import { ARFaceGlam } from '../metaverse/ar/ARFaceGlam';
import { ARFondosInmersivos } from '../metaverse/ar/ARFondosInmersivos';


const FAQPage = ({ pc }: { pc: string }) => (
  <div className="py-20 text-center space-y-4">
    <h2 className="text-4xl font-black uppercase tracking-tighter">Preguntas <span style={{ color: pc }}>Frecuentes</span></h2>
    <p className="text-white/40 text-sm max-w-xs mx-auto">¿Tienes dudas? Escríbenos al chat de soporte.</p>
  </div>
);

interface AtlantisAppProps {
  onBack?: () => void;
  initialMode?: 'fotos' | 'impresion';
}

const ARWrapper = ({ experienceId, Component, fallbackType, onNavigate }: { experienceId: string, Component: React.FC<any>, fallbackType: string, onNavigate: (path: string) => void }) => {
  const { experiences } = useAtlantis();
  const exp = experiences.find(e => e.id === experienceId);
  if (!exp) return null;
  return <Component experience={exp} onBack={() => onNavigate(`/list/${fallbackType}`)} />;
};

const AtlantisRouter: React.FC<AtlantisAppProps> = ({ onBack }) => {
  const { nicheConfig, currentNiche, experiences } = useAtlantis();
  const [currentPath, setCurrentPath] = useState(() => sessionStorage.getItem('atlantisPath') || '/');
  const [prevNiche, setPrevNiche] = useState(currentNiche);

  const navigate = (path: string) => {
    setCurrentPath(path);
    sessionStorage.setItem('atlantisPath', path);
  };

  // Reset al home del metaverso cada vez que cambia el niche
  useEffect(() => {
    if (currentNiche !== prevNiche) {
      navigate('/');
      setPrevNiche(currentNiche);
    }
  }, [currentNiche, prevNiche]);

  const getBackPath = (id: string, fallback: string) => {
    const exp = experiences.find(e => e.id === id);
    return exp?.type ? `/list/${exp.type}` : `/list/${fallback}`;
  };

  // Páginas de herramientas nativas (fullscreen, sin Layout)
  if (currentPath.startsWith('/editor/')) {
    const id = currentPath.replace('/editor/', '');
    return <EditorPage experienceId={id} onBack={() => navigate(getBackPath(id, 'POSTALES_WASSAP'))} />;
  }
  if (currentPath.startsWith('/marcos-pro/')) {
    const id = currentPath.replace('/marcos-pro/', '');
    return <MarcosPro experienceId={id} onBack={() => navigate(getBackPath(id, 'MARCOS_PRO'))} />;
  }
  if (currentPath.startsWith('/photobooth/')) {
    const id = currentPath.replace('/photobooth/', '');
    return <PhotoBooth experienceId={id} onBack={() => navigate(getBackPath(id, 'PHOTO_BOOTH'))} />;
  }
  if (currentPath.startsWith('/poster/')) {
    const id = currentPath.replace('/poster/', '');
    return <PosterEditor experienceId={id} onBack={() => navigate('/list/POSTERS')} />;
  }
  if (currentPath.startsWith('/postales/')) {
    const id = currentPath.replace('/postales/', '');
    return <PostalesEditor experienceId={id} onBack={() => navigate('/list/POSTALES')} />;
  }
  if (currentPath.startsWith('/postales-dobladas/')) {
    const id = currentPath.replace('/postales-dobladas/', '');
    return <PostalesDobladasEditor experienceId={id} onBack={() => navigate('/list/POSTALES_DOBLADAS')} />;
  }
  if (currentPath.startsWith('/papercraft/')) {
    const id = currentPath.replace('/papercraft/', '');
    const exp = experiences.find(e => e.id === id);
    return <PapercraftEditor experienceId={id} onBack={() => navigate(exp ? `/list/${exp.type}` : '/')} />;
  }
  if (currentPath.startsWith('/album/')) {
    const id = currentPath.replace('/album/', '');
    return <AlbumEditor experienceId={id} onBack={() => navigate('/list/MI_ALBUM')} />;
  }
  if (currentPath.startsWith('/ar-hora-loca/')) {
    const id = currentPath.replace('/ar-hora-loca/', '');
    return <ARWrapper experienceId={id} Component={ARHoraLoca} fallbackType="HORA_LOCA_HATS" onNavigate={navigate} />;
  }
  if (currentPath.startsWith('/ar-face-glam/')) {
    const id = currentPath.replace('/ar-face-glam/', '');
    return <ARWrapper experienceId={id} Component={ARFaceGlam} fallbackType="FACE_GLAM" onNavigate={navigate} />;
  }
  if (currentPath.startsWith('/ar-fondos/')) {
    const id = currentPath.replace('/ar-fondos/', '');
    return <ARWrapper experienceId={id} Component={ARFondosInmersivos} fallbackType="FONDOS_INMERSIVOS" onNavigate={navigate} />;
  }

  // Páginas normales (con Layout + Bottom Nav)
  const renderPage = () => {
    if (currentPath === '/') return <AtlantisHome onNavigate={navigate} />;
    if (currentPath.startsWith('/list/')) {
      const type = currentPath.replace('/list/', '');
      return <ExperienceList type={type} onNavigate={navigate} />;
    }
    if (currentPath === '/plans') return <PlansPage pc={nicheConfig?.primary_color || "#10b981"} onNavigate={navigate} org={(nicheConfig as any)?.organizacion} />;
    if (currentPath === '/faq') return <FAQPage pc="#10b981" />;
    return <AtlantisHome onNavigate={navigate} />;
  };

  return (
    <AtlantisLayout currentPath={currentPath} onNavigate={navigate} onBack={onBack}>
      {renderPage()}
    </AtlantisLayout>
  );
};

export const AtlantisApp: React.FC<AtlantisAppProps> = ({ onBack, initialMode }) => (
  <AtlantisAppProvider initialMode={initialMode}>
    <AtlantisRouter onBack={onBack} />
  </AtlantisAppProvider>
);
