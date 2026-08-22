import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'motion/react';
import { Building2, Share2, Download, QrCode, CheckCircle2 } from 'lucide-react';

interface PromoterQRProps {
  profile: any;
}

export const PromoterQR: React.FC<PromoterQRProps> = ({ profile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = React.useState(false);

  const qrValue = JSON.stringify({
    comercio_id: profile.id,
    nombre: profile.nombre_comercial || profile.nombre,
    type: 'fanfest_promoter_2026'
  });

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QR-FanFest-${profile.nombre_comercial || profile.nombre}.png`;
    link.href = url;
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
      if (!blob) return;

      const file = new File([blob], 'qr-fanfest.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'QR FanFest 2026',
          text: `¡Participa en la Quiniela FanFest 2026 en ${profile.nombre_comercial || profile.nombre}!`,
        });
      } else {
        // Fallback: Copy to clipboard or just alert
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-fifa-blue">QR de Establecimiento</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Muestra este código a tus clientes para que vinculen su participación a tu local.
        </p>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="p-8 bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-fifa-blue/5 relative z-10">
          <QRCodeCanvas 
            ref={canvasRef}
            value={qrValue} 
            size={240}
            level="H"
            includeMargin={true}
            imageSettings={profile.foto_logo ? {
              src: profile.foto_logo,
              x: undefined,
              y: undefined,
              height: 50,
              width: 50,
              excavate: true,
            } : undefined}
          />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-fifa-gold/10 rounded-full blur-2xl -z-0"></div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-fifa-blue/10 rounded-full blur-2xl -z-0"></div>
      </motion.div>

      <div className="w-full max-w-sm bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            {profile.foto_logo ? (
              <img src={profile.foto_logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="text-fifa-blue" size={28} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promotor Oficial</p>
            <h3 className="text-lg font-black text-slate-800 leading-tight">
              {profile.nombre_comercial || profile.nombre}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-500" />
                Copiado
              </>
            ) : (
              <>
                <Share2 size={16} />
                Compartir
              </>
            )}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-3 bg-fifa-blue text-white rounded-xl text-xs font-bold hover:bg-fifa-blue/90 transition-colors"
          >
            <Download size={16} />
            Descargar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 max-w-sm">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-fifa-blue shadow-sm shrink-0">
          <QrCode size={20} />
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          **Tip**: Imprime este código y colócalo en un lugar visible (caja, mesas) para facilitar la participación.
        </p>
      </div>
    </div>
  );
};
