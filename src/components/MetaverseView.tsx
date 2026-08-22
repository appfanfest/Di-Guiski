import React from 'react';
import { AtlantisApp } from '../atlantis/AtlantisApp';

interface MetaverseViewProps {
  onBack: () => void;
  atlantisDir?: string;
  videoYoutube?: string;
  mode?: 'fotos' | 'impresion';
}

/**
 * MetaverseView — Tercer Pilar de FanFest Digital
 * Monta el motor completo de Atlantis 5.0 como módulo independiente.
 * Todo el branding, nichos, QR y experiencias son manejados por AtlantisApp.
 */
export const MetaverseView: React.FC<MetaverseViewProps> = ({ onBack, mode }) => {
  return (
    <div className="w-full animate-fade-in">
      <AtlantisApp key={`atlantis-v5-force-${mode || 'fotos'}`} onBack={onBack} initialMode={mode} />
    </div>
  );
};
