import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Smartphone, ShieldCheck, X } from 'lucide-react';

interface AgentIdentityProps {
  profile: any;
  onClose: () => void;
}

export const AgentIdentity: React.FC<AgentIdentityProps> = ({ profile, onClose }) => {
  const agentData = JSON.stringify({
    type: 'fanfest_agent_identity',
    uid: profile.id,
    name: profile.nombre,
    email: profile.correo,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-fifa-blue/10 text-fifa-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Identidad de Agente</h2>
          <p className="text-sm text-slate-500 mt-1">Muestra este código al promotor para ser vinculado a su punto de captura.</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="p-6 bg-white rounded-[2.5rem] shadow-xl border-8 border-slate-50">
            <QRCodeSVG 
              value={agentData} 
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={profile.foto_logo ? {
                src: profile.foto_logo,
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              } : undefined}
            />
          </div>

          <div className="w-full bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
            <ShieldCheck className="text-emerald-600 mt-1" size={20} />
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Dato Seguro</p>
              <p className="text-[11px] text-emerald-600 leading-tight">
                Este código solo permite que un comercio te asigne como operador de escaneo. No otorga acceso a tus datos privados.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700">{profile.nombre}</p>
            <p className="text-[10px] text-slate-400 font-medium">{profile.correo}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
