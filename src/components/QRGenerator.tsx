import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  IdCard, 
  Trophy, 
  Ticket, 
  ArrowLeft,
  ScanLine,
  CheckCircle2,
  Building2,
  AlertCircle,
  Loader2,
  ClipboardList,
  ArrowRight,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  sexo: string;
  edad: number;
  nacionalidad?: string;
  cedula_rif?: string;
  foto_logo?: string;
  mi_favorito?: string;
}

interface QRGeneratorProps {
  profile: UserProfile;
  isGuest?: boolean;
  onGoToQuinielas?: () => void;
  org?: any;
}

type Step = 'select_type' | 'scan_promoter' | 'show_ticket';
type TicketType = 'quiniela' | 'promocion';

export const getQuinielaTabs = (t: any) => [
  {
    nombre: t.predictions?.form1 || 'FORMULARIO 1',
    descripcion: t.predictions?.form1Desc || 'Primer formulario de pronósticos. Planifica con lógica.',
    color: 'blue',
  },
  {
    nombre: t.predictions?.form2 || 'FORMULARIO 2',
    descripcion: t.predictions?.form2Desc || 'Segundo formulario de pronósticos. Refina tu estrategia.',
    color: 'purple',
  },
  {
    nombre: t.predictions?.form3 || 'FORMULARIO 3',
    descripcion: t.predictions?.form3Desc || 'Tercer formulario de pronósticos. Completa tu participación.',
    color: 'amber',
  },
];

const PromoterScanner: React.FC<{ onScan: (data: any) => void }> = ({ onScan }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "promoter-scanner",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.type === 'fanfest_promoter_2026' && data.comercio_id) {
          onScan(data);
          scanner.clear();
        }
      } catch (e) {
        console.error("Invalid QR code", e);
      }
    }, (_error) => {
      // ignore scan errors
    });

    return () => {
      scanner.clear().catch(e => console.error("Error clearing scanner", e));
    };
  }, [onScan]);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-square relative border-8 border-white shadow-2xl">
      <div id="promoter-scanner" className="w-full h-full"></div>
      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 flex items-center justify-center">
        <div className="w-full h-full border-2 border-fifa-blue/50 rounded-3xl animate-pulse flex items-center justify-center">
          <ScanLine size={48} className="text-fifa-blue/30" />
        </div>
      </div>
    </div>
  );
};

export const QRGenerator: React.FC<QRGeneratorProps> = ({ profile, isGuest, onGoToQuinielas, org }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('select_type');
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [promoterData, setPromoterData] = useState<any>(null);
  const [guestMessage, setGuestMessage] = useState<string | null>(null);
  const [validatingQuinielas, setValidatingQuinielas] = useState(false);
  const [quinielasError, setQuinielasError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'quinielas' | 'promociones'>('quinielas');

  const handlePromoterScan = (data: any) => {
    setPromoterData(data);
    setStep('show_ticket');
  };

  const handleSelectQuiniela = async () => {
    if (isGuest) {
      setGuestMessage(t.qrGen?.guestWarning || "Este proceso requiere datos de registro reales. Puedes explorar otras áreas o registrarte para activarlo.");
      setTimeout(() => setGuestMessage(null), 5000);
      return;
    }

    setValidatingQuinielas(true);
    setQuinielasError(null);

    try {
      const { data, error } = await supabase
        .from('quinielas')
        .select('id, nombre, predicciones, completada')
        .eq('usuario_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const savedCount = data?.length || 0;
      const allComplete = data?.every(q => q.completada) ?? false;

      if (savedCount < 3 || !allComplete) {
        const missing = 3 - savedCount;
        if (missing > 0) {
          setQuinielasError(t.qrGen?.missingQuinielas || 'Aún te faltan formularios por guardar. Completa los 3 antes de continuar.');
        } else {
          setQuinielasError(t.qrGen?.incompleteQuinielas || 'Tienes quinielas incompletas. Debes llenar todos los pronósticos para continuar.');
        }
        return;
      }

      setTicketType('quiniela');
      setStep('scan_promoter');
    } catch (err: any) {
      setQuinielasError(t.qrGen?.verifyError || 'Error al verificar tus quinielas. Intenta de nuevo.');
      console.error(err);
    } finally {
      setValidatingQuinielas(false);
    }
  };

  const handleSelectPromocion = () => {
    if (isGuest) {
      setGuestMessage(t.qrGen?.guestPromoWarning || "Los cupones para premios reales están disponibles solo para usuarios autenticados.");
      setTimeout(() => setGuestMessage(null), 5000);
      return;
    }
    setTicketType('promocion');
    setStep('scan_promoter');
  };

  const qrValue = JSON.stringify({
    uid: profile?.id,
    comercio_id: promoterData?.comercio_id,
    type: ticketType === 'quiniela' ? 'fanfest_quiniela_ticket' : 'fanfest_promo_ticket',
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-[500px]">
      <AnimatePresence mode="wait">
        {step === 'select_type' && (
          <motion.div 
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-8"
          >
            {/* TABS DE PARTICIPACIÓN */}
            <div className="flex p-1.5 bg-slate-100 rounded-[2rem] border border-slate-200">
              <button
                onClick={() => setActiveMode('quinielas')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  activeMode === 'quinielas' ? "bg-white text-fifa-blue shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t.qrGen?.quinielas || 'Quinielas'}
              </button>
              <button
                onClick={() => setActiveMode('promociones')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  activeMode === 'promociones' ? "bg-white text-fifa-blue shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t.qrGen?.promotions || 'Promociones'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeMode === 'quinielas' ? (
                <motion.div
                  key="quinielas"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Aviso de presencia física */}
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3 shadow-sm">
                    <div className="w-12 h-12 bg-white/80 rounded-xl overflow-hidden flex-shrink-0 border border-orange-200 shadow-inner relative">
                      <img 
                        src={org?.arbitro_amarilla || "file:///C:/Users/windows8/.gemini/antigravity/brain/15d5ae81-aa8e-4f4f-8802-91b9c48c24bf/referee_yellow_card_1777584495558.png"} 
                        alt="Árbitro" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-orange-800 text-left leading-tight">
                      <span className="text-orange-600 block mb-0.5 tracking-widest uppercase">{t.qrGen?.attention || '¡Atención!'}</span>
                      {t.qrGen?.presenceWarning || 'Genera tu ticket de validación solo cuando estés frente al promotor.'}
                    </p>
                  </div>

                  {isGuest && guestMessage && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="text-[10px] font-bold leading-tight">{guestMessage}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button 
                      onClick={handleSelectQuiniela}
                      disabled={validatingQuinielas}
                      className="w-full flex items-center gap-5 px-8 py-8 bg-white rounded-[2.5rem] border-2 border-slate-100 hover:border-fifa-blue transition-all group shadow-sm disabled:opacity-70"
                    >
                      <div className="w-16 h-16 bg-blue-50 text-fifa-blue rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        {validatingQuinielas ? <Loader2 size={32} className="animate-spin" /> : <Trophy size={32} className="opacity-80" />}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.qrGen?.validateQuinielas || 'Validar Mis Quinielas'}</h3>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{t.qrGen?.validateDesc || 'Sincroniza tus 3 formularios con el establecimiento.'}</p>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 shrink-0" />
                    </button>

                    {quinielasError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3">
                        <div className="flex items-start gap-3 text-red-700">
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold leading-tight">{quinielasError}</p>
                        </div>
                        {onGoToQuinielas && (
                          <button
                            onClick={onGoToQuinielas}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-fifa-blue text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-fifa-blue/90 transition-all"
                          >
                            <ClipboardList size={16} />
                            {t.qrGen?.goToQuinielas || 'Ir a Mis Quinielas'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="promociones"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={handleSelectPromocion}
                    className="w-full flex items-center gap-5 px-8 py-8 bg-white rounded-[2.5rem] border-2 border-slate-100 hover:border-fifa-blue transition-all group shadow-sm"
                  >
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
                      <Ticket size={32} className="opacity-80" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.qrGen?.dailyDraw || 'Sorteo del Día'}</h3>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{t.qrGen?.dailyDrawDesc || 'Registra tu visita para participar en sorteos inmediatos.'}</p>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 shrink-0" />
                  </button>

                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      {t.qrGen?.comingSoon || 'Próximamente más promociones exclusivas de nuestros aliados comerciales.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'scan_promoter' && (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6"
          >
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => { setStep('select_type'); setQuinielasError(null); }} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-800">{t.qrGen?.scanPromoter || 'Escanea al Promotor'}</h2>
                <p className="text-xs text-slate-500">{t.qrGen?.scanDesc || 'Escanea el código QR del establecimiento.'}</p>
              </div>
            </div>

            <PromoterScanner onScan={handlePromoterScan} />
            
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <Building2 className="text-fifa-blue mt-1 shrink-0" size={20} />
              <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.qrGen?.lookForQr?.replace('FanFest', '<strong>FanFest</strong>') || 'Busca el código QR de <strong>FanFest</strong> exhibido en el local para vincular tu participación a este establecimiento.' }}>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'show_ticket' && (
          <motion.div 
            key="ticket"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h2 className="text-2xl font-black text-fifa-blue">{t.qrGen?.ticketGenerated || 'Ticket Generado'}</h2>
              </div>
              <p className="text-sm text-slate-500">{t.qrGen?.showCode || 'Muestra este código al promotor para validar tu entrada.'}</p>
            </div>

            <div className={`p-6 bg-white rounded-[3rem] shadow-2xl border-8 ${isGuest ? 'border-amber-400/50' : 'border-fifa-blue/5'} relative`}>
              {isGuest && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-amber-500/90 text-white px-6 py-2 rounded-full font-black text-xs uppercase rotate-[-15deg] shadow-xl border-4 border-white">
                    {t.qrGen?.testMode || 'Modo Prueba'}
                  </div>
                </div>
              )}
              <QRCodeSVG 
                value={qrValue} 
                size={220}
                level="H"
                className={isGuest ? "opacity-30 blur-[1px]" : ""}
                includeMargin={true}
                imageSettings={profile?.foto_logo ? {
                  src: profile.foto_logo,
                  x: undefined,
                  y: undefined,
                  height: 44,
                  width: 44,
                  excavate: true,
                } : undefined}
              />
              <div className="absolute -top-4 -right-4 bg-fifa-gold text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg">
                {ticketType === 'quiniela' ? (t.qrGen?.quiniela || 'QUINIELA') : (t.qrGen?.promotion || 'PROMOCIÓN')}
              </div>
            </div>

            <div className="w-full bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Building2 className="text-fifa-blue" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.qrGen?.establishment || 'Establecimiento'}</p>
                  <p className="text-sm font-black text-slate-800">{promoterData?.nombre || t.qrGen?.localFanFest || 'Local FanFest'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <User size={16} className="text-fifa-blue" />
                  <span className="text-xs font-bold">{profile?.nombre}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <IdCard size={16} className="text-fifa-blue" />
                  <span className="text-xs font-bold">{profile?.nacionalidad}-{profile?.cedula_rif}</span>
                </div>
              </div>

              <button 
                onClick={() => { setStep('select_type'); setPromoterData(null); setQuinielasError(null); }}
                className="w-full py-3.5 px-8 text-[11px] font-bold text-fifa-blue bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors uppercase tracking-widest"
              >
                {t.qrGen?.closeTicket || 'CERRAR TICKET'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
