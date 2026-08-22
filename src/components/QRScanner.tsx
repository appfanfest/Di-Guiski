import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle, AlertCircle, RefreshCw, X, Zap, ZapOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface QRScannerProps {
  onScanSuccess?: (decodedText: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess }) => {
  const { t } = useLanguage();
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "reader";

  useEffect(() => {
    html5QrCode.current = new Html5Qrcode(scannerContainerId);
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!html5QrCode.current) return;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        setHasCameraPermission(true);
        setIsScanning(true);
        
        // Prefer back camera
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('trasera') ||
          c.label.toLowerCase().includes('environment')
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await html5QrCode.current.start(
          cameraId,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScan,
          onScanError
        );
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      setHasCameraPermission(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        await html5QrCode.current.stop();
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  const toggleFlash = async () => {
    try {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        const newState = !isFlashOn;
        await html5QrCode.current.applyVideoConstraints({
          // @ts-ignore - torch is not in standard types but supported by many browsers
          advanced: [{ torch: newState }]
        });
        setIsFlashOn(newState);
      }
    } catch (err) {
      console.warn("Flash not supported on this device/browser");
    }
  };

  async function onScan(decodedText: string) {
    try {
      const data = JSON.parse(decodedText);
      const validTypes = ['fanfest_quiniela_ticket', 'fanfest_promo_ticket'];
      
      if (!validTypes.includes(data.type) || !data.uid) {
        throw new Error('Código QR no válido para FanFest 2026');
      }

      await stopScanner();
      setIsScanning(false);

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('No se pudo identificar al comercio');

      // Fetch literal profile of the scanner (could be master or agent)
      const { data: myProfile, error: myProfileError } = await supabase
        .from('perfiles_usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (myProfileError) throw myProfileError;

      // Check if it's an agent and if they are active
      if (myProfile.parent_id && myProfile.agente_activo === false) {
        throw new Error('Tu acceso como agente de escaneo ha sido desactivado por el comercio.');
      }

      // Determine the Effective Commerce ID (The one that pays/has the limit)
      const effectiveCommerceId = myProfile.parent_id || currentUser.id;

      // Fetch the Master profile for validation (limits, blocking, etc)
      const { data: masterProfile, error: masterError } = await supabase
        .from('perfiles_usuarios')
        .select('cantidad_quinielas, quiniela_activa, bloqueo_fanfest, autorizado, nombre, pais_operativo_id, estado_operativo_id, alcance_nacional')
        .eq('id', effectiveCommerceId)
        .single();

      if (masterError) throw masterError;

      // 0. Geographic Validations
      const { data: userProfile, error: userError } = await supabase
        .from('perfiles_usuarios')
        .select('pais_operativo_id, estado_operativo_id, nombre')
        .eq('id', data.uid)
        .single();

      if (userError) throw new Error('No se pudo verificar el perfil del usuario escaneado.');

      // Check Country
      if (userProfile.pais_operativo_id !== masterProfile.pais_operativo_id) {
        throw new Error('Validación fallida: El usuario pertenece a otro país operativo.');
      }

      // Check State (if not national scope)
      if (!masterProfile.alcance_nacional && userProfile.estado_operativo_id !== masterProfile.estado_operativo_id) {
        throw new Error('Validación fallida: Este local solo acepta participaciones de su mismo estado/región.');
      }

      // 1. Check if master commerce is blocked or not authorized by admin
      if (masterProfile.bloqueo_fanfest || masterProfile.autorizado === false) {
        throw new Error(`La cuenta de "${masterProfile.nombre}" no está autorizada o se encuentra bloqueada.`);
      }

      // 2. Check if commerce has deactivated their quiniela
      if (!masterProfile.quiniela_activa) {
        throw new Error('La quiniela de este comercio está pausada.');
      }

      // 3. Check capacity limit of the master
      const { count, error: countError } = await supabase
        .from('participaciones')
        .select('*', { count: 'exact', head: true })
        .eq('comercio_id', effectiveCommerceId);

      if (countError) throw countError;

      if (count !== null && count >= masterProfile.cantidad_quinielas) {
        throw new Error(`Se ha alcanzado el límite máximo de ${masterProfile.cantidad_quinielas} participantes contratados.`);
      }

      // 4. Check if user already has an active ticket in the Cyclone for this commerce
      if (data.type === 'fanfest_promo_ticket') {
        const { data: existingTicket, error: ticketCheckError } = await supabase
          .from('participaciones')
          .select('id')
          .eq('usuario_id', data.uid)
          .eq('comercio_id', effectiveCommerceId)
          .eq('tipo', 'promocion')
          .eq('archivado', false)
          .maybeSingle();

        if (ticketCheckError) throw ticketCheckError;
        if (existingTicket) {
          throw new Error('El usuario ya tiene un ticket activo en el Ciclón de este local.');
        }
      }

      // Check if the QR was generated for THIS master commerce
      if (data.comercio_id !== effectiveCommerceId) {
        throw new Error('Este ticket fue generado para otro establecimiento.');
      }

      // Insert into participaciones attributing it to the Master
      const { error } = await supabase
        .from('participaciones')
        .insert({
          usuario_id: data.uid,
          comercio_id: effectiveCommerceId,
          agente_id: myProfile.parent_id ? currentUser.id : null, // Store who scanned it for audit
          tipo: data.type === 'fanfest_quiniela_ticket' ? 'quiniela' : 'promocion',
          estado: 'validado',
          punto_escaneo: myProfile.nombre_punto || 'Sede Principal'
        });

      if (error) throw error;

      setScanResult({ 
        success: true, 
        message: data.type === 'fanfest_quiniela_ticket' 
          ? '¡Quiniela validada con éxito!' 
          : '¡Participación en sorteo diario registrada!' 
      });
      
      if (onScanSuccess) onScanSuccess(decodedText);
    } catch (err: any) {
      console.error(err);
      setScanResult({ success: false, message: err.message || 'Error al procesar el código' });
    }
  }

  function onScanError(err: any) {
    // We ignore errors during scanning as it happens frequently when no QR is in view
  }

  const resetScanner = () => {
    setScanResult(null);
    startScanner();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-fifa-blue mb-2">{t.qr_scanner.title}</h2>
        <p className="text-sm text-slate-500">{t.qr_scanner.subtitle}</p>
      </div>

      <div className="w-full max-w-sm relative aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
        {isScanning ? (
          <>
            <div id="reader" className="w-full h-full object-cover"></div>
            
            {/* Custom Overlay */}
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 border-[60px] border-black/40"></div>
              <div className="absolute top-[60px] left-[60px] right-[60px] bottom-[60px] border-2 border-fifa-blue rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-fifa-gold -mt-1 -ml-1 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-fifa-gold -mt-1 -mr-1 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-fifa-gold -mb-1 -ml-1 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-fifa-gold -mb-1 -mr-1 rounded-br-lg"></div>
                
                {/* Scanning line animation */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-fifa-blue/50 shadow-[0_0_15px_rgba(30,58,138,0.8)] z-20"
                />
              </div>
            </div>

            {/* Flash Toggle */}
            <button 
              onClick={toggleFlash}
              className="absolute bottom-6 right-6 z-30 p-3 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-black/60 transition-all"
            >
              {isFlashOn ? <ZapOff size={20} /> : <Zap size={20} />}
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white">
            <AnimatePresence mode="wait">
              {scanResult?.success ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100/50">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">{t.qr_scanner.success}</h3>
                  <p className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">{scanResult.message}</p>
                  <button 
                    onClick={resetScanner}
                    className="flex items-center gap-3 bg-fifa-blue text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-fifa-blue/90 transition-all shadow-lg shadow-fifa-blue/20 active:scale-95"
                  >
                    <RefreshCw size={18} />
                    {t.qr_scanner.scan_next}
                  </button>
                </motion.div>
              ) : scanResult ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100/50">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">{t.qr_scanner.validation_error}</h3>
                  <p className="text-[10px] font-bold text-red-400 mb-8 uppercase tracking-widest leading-relaxed">{scanResult.message}</p>
                  <button 
                    onClick={resetScanner}
                    className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    <RefreshCw size={18} />
                    {t.qr_scanner.retry}
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Loader2 className="animate-spin text-fifa-blue mb-4" size={40} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.qr_scanner.starting_camera}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {hasCameraPermission === false && (
          <div className="absolute inset-0 z-[40] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
            <Camera size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-black uppercase italic mb-2">{t.qr_scanner.camera_blocked}</h3>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed">
              {t.qr_scanner.camera_blocked_desc}
            </p>
            <button 
              onClick={startScanner}
              className="mt-6 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              {t.qr_scanner.retry_permissions}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
        <Camera size={14} />
        <span>{t.qr_scanner.good_lighting}</span>
      </div>
    </div>
  );
};
