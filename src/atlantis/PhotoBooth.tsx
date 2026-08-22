import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAtlantis } from './AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, RefreshCw, Download, Trash2, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
const CD = 3, SLOTS = 4, EW = 2160, EH = 3840;
interface Props { experienceId: string; onBack: () => void; }
export const PhotoBooth: React.FC<Props> = ({ experienceId, onBack }) => {
  const { experiences, nicheConfig } = useAtlantis();
  const { t } = useLanguage();
  const experience = experiences.find(e => e.id === experienceId);
  const pc = nicheConfig?.primary_color || '#10b981';
  const sc = nicheConfig?.secondary_color || '#FFD700';
  const [status, setStatus] = useState<'idle'|'countdown'|'finished'>('idle');
  const [photos, setPhotos] = useState<(string|null)[]>([null,null,null,null]);
  const [slot, setSlot] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [facing, setFacing] = useState<'user'|'environment'>('user');
  const [exporting, setExporting] = useState(false);
  const [camErr, setCamErr] = useState<string|null>(null);
  const [sel, setSel] = useState<1|2|3|4>(1);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const audioRef = useRef<AudioContext|null>(null);
  const mounted = useRef(true);
  const overlayUrl = useMemo(() => {
    if (!experience) return "";
    if (sel===2) return experience.demoLink||experience.activationLink;
    if (sel===3) return experience.photoboothLink3||experience.activationLink;
    if (sel===4) return experience.photoboothLink4||experience.activationLink;
    return experience.activationLink;
  }, [experience, sel]);
  const shutter = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx = audioRef.current; if (ctx.state==='suspended') ctx.resume();
      const now = ctx.currentTime;

      // ── Layer 1: Mirror slap — low mechanical THUNK at t=0 ──
      const b1 = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
      const d1 = b1.getChannelData(0);
      for (let i = 0; i < d1.length; i++) d1[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d1.length * 0.12));
      const s1 = ctx.createBufferSource(); s1.buffer = b1;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 350;
      const g1 = ctx.createGain(); g1.gain.setValueAtTime(2.5, now);
      s1.connect(lp); lp.connect(g1); g1.connect(ctx.destination); s1.start(now);

      // ── Layer 2: Shutter blades — sharp mechanical SNAP at t=18ms ──
      const b2 = ctx.createBuffer(1, ctx.sampleRate * 0.025, ctx.sampleRate);
      const d2 = b2.getChannelData(0);
      for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d2.length * 0.08));
      const s2 = ctx.createBufferSource(); s2.buffer = b2;
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 3500; hp.Q.value = 0.8;
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(2.0, now + 0.018);
      s2.connect(hp); hp.connect(g2); g2.connect(ctx.destination); s2.start(now + 0.018);

      // ── Layer 3: Flash capacitor pop — electrical WHOOSH at t=30ms ──
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now + 0.03);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
      const g3 = ctx.createGain(); g3.gain.setValueAtTime(0.45, now + 0.03); g3.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900;
      osc.connect(lp2); lp2.connect(g3); g3.connect(ctx.destination);
      osc.start(now + 0.03); osc.stop(now + 0.12);
    } catch(e) {}
  }, []);
  const startCam = async (retries=2) => {
    if (!mounted.current) return; setCamErr(null);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    const c: MediaStreamConstraints = retries>0 ? {video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}},audio:false} : {video:{facingMode:facing},audio:false};
    try {
      const s = await navigator.mediaDevices.getUserMedia(c);
      if (!mounted.current) { s.getTracks().forEach(t=>t.stop()); return; }
      streamRef.current=s;
      if (videoRef.current) { videoRef.current.srcObject=s; await new Promise(r=>{if(videoRef.current)videoRef.current.onloadedmetadata=r;}); if(mounted.current) try{await videoRef.current.play();}catch(e){} }
    } catch(e:any) { if(retries>0) await startCam(retries-1); else setCamErr(e.name==='NotAllowedError'? t.atlantis.camDenied : t.atlantis.camError); }
  };
  useEffect(()=>{ mounted.current=true; startCam(); return()=>{ mounted.current=false; streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; }; },[facing]);
  const capture = async () => {
    if (!videoRef.current||!mounted.current) return;
    const canvas=document.createElement('canvas'); const v=videoRef.current;
    canvas.width=1080; canvas.height=1920; const ctx=canvas.getContext('2d'); if(!ctx) return;
    const vA=v.videoWidth/v.videoHeight; const tA=9/16;
    let sx=0,sy=0,sw=v.videoWidth,sh=v.videoHeight;
    if(vA>tA){sw=v.videoHeight*tA;sx=(v.videoWidth-sw)/2;}else{sh=v.videoWidth/tA;sy=(v.videoHeight-sh)/2;}
    ctx.save(); if(facing==='user'){ctx.translate(1080,0);ctx.scale(-1,1);}
    ctx.drawImage(v,sx,sy,sw,sh,0,0,1080,1920); ctx.restore();
    const d=canvas.toDataURL('image/jpeg',0.9);
    setPhotos(prev=>{const n=[...prev];n[slot]=d;return n;});
    shutter();
    // Flash: instant white-out then quick fade
    setFlashOpacity(1);
    setTimeout(() => setFlashOpacity(0), 80);
    setTimeout(()=>{ if(!mounted.current) return; if(slot<SLOTS-1){setSlot(slot+1);setCountdown(CD);setStatus('countdown');}else{setStatus('finished');} },420);
  };
  useEffect(()=>{ if(status==='countdown'&&countdown>0){const t=setTimeout(()=>setCountdown(c=>c-1),1000);return()=>clearTimeout(t);} else if(status==='countdown'&&countdown===0) capture(); },[status,countdown]);
  const reset=()=>{setPhotos([null,null,null,null]);setSlot(0);setStatus('idle');startCam();};
  const exportIt=async()=>{
    setExporting(true); const canvas=document.createElement('canvas'); canvas.width=EW; canvas.height=EH;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    for(let i=0;i<SLOTS;i++){ if(!photos[i]) continue; const img=new Image(); img.src=photos[i]!; await new Promise(r=>img.onload=r); ctx.drawImage(img,(i%2)*(EW/2),Math.floor(i/2)*(EH/2),EW/2,EH/2); }
    const ov=new Image(); ov.crossOrigin='anonymous'; ov.src=overlayUrl;
    await new Promise(r=>{ov.onload=r;ov.onerror=r;}); ctx.drawImage(ov,0,0,EW,EH);
    const link=document.createElement('a'); link.download=`PhotoBooth_${Date.now()}.jpg`; link.href=canvas.toDataURL('image/jpeg',0.9); link.click();
    setExporting(false);
  };
  const getSlotStyle=(idx:number)=>{const iL=idx%2===0,iT=Math.floor(idx/2)===0;return{left:'4px',top:'4px',width:'calc(50% - 6px)',height:'calc(50% - 6px)',transform:`translate(${iL?'0':'calc(100% + 4px)'}, ${iT?'0':'calc(100% + 4px)'})`};};
  if(!experience) return <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-white font-black uppercase">{t.atlantis.notFound}</div>;
  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-black/80 backdrop-blur-md shadow-lg">
        <button onClick={() => { if (status === 'finished') reset(); else onBack(); }} className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all active:scale-90 shadow-lg text-yellow-400 flex items-center gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14} /> {t.atlantis.back}</button>
        <div className="flex items-center gap-2 font-black text-xs tracking-widest text-yellow-400 uppercase">
          {t.atlantis.photoboothTitle}
        </div>
        <div className="w-10" />
      </header>
      <div className="flex-1 relative p-1 z-[105] bg-black">
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full w-full">
          {[0,1,2,3].map(idx=>(
            <div key={idx} className="relative bg-gray-900 border border-white/5 rounded-xl overflow-hidden">
              {photos[idx]&&<img src={photos[idx]!} className="absolute inset-0 w-full h-full object-cover" alt={`F${idx}`} />}
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                <img src={overlayUrl} key={`s-${idx}-${sel}`} className="absolute w-[200%] h-[200%] max-w-none mix-blend-screen opacity-90" style={{left:`${-(idx%2)*100}%`,top:`${-Math.floor(idx/2)*100}%`}} />
              </div>
            </div>
          ))}
        </div>
        {status!=='finished'&&!camErr&&(
          <div className="absolute z-50 transition-all duration-500 overflow-hidden rounded-xl border border-white/20 shadow-2xl" style={getSlotStyle(slot)}>
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facing==='user'?'scale-x-[-1]':''}`} />
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
              <img src={overlayUrl} key={`cam-${sel}`} className="absolute w-[200%] h-[200%] max-w-none mix-blend-screen opacity-90" style={{left:`${-(slot%2)*100}%`,top:`${-Math.floor(slot/2)*100}%`}} />
            </div>
            {status==='countdown'&&<div className="absolute inset-0 border-2 border-white/40 animate-pulse z-40 rounded-xl" />}
          </div>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]">
          {status==='finished'?(
            <button onClick={exportIt} disabled={exporting} className="w-24 h-24 rounded-full backdrop-blur-xl flex flex-col items-center justify-center border-2 active:scale-90 disabled:opacity-50" style={{backgroundColor:`${pc}20`,color:pc,borderColor:`${pc}50`,boxShadow:`0 0 40px ${pc}40`}}>
              {exporting?<Loader2 className="animate-spin" size={30}/>:<Download size={30}/>}
              <span className="text-[7px] font-black mt-1 uppercase tracking-widest">{t.atlantis.save}</span>
            </button>
          ):status==='idle'?(
            <button onClick={()=>{if(camErr)return;setPhotos([null,null,null,null]);setSlot(0);setCountdown(CD);setStatus('countdown');}} disabled={!!camErr} className="w-24 h-24 rounded-full border-2 border-white/30 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center group active:scale-95 disabled:opacity-30 shadow-2xl">
              <div className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center bg-white/10 group-active:bg-white"><Camera size={32} className="text-white group-active:text-black" /></div>
            </button>
          ):null}
        </div>
        {status==='countdown'&&countdown>0&&<div className="absolute inset-0 flex items-center justify-center z-[150] pointer-events-none"><span className="text-[10rem] font-black text-white/90 drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]">{countdown}</span></div>}
        {flashOpacity > 0 && <div className="absolute inset-0 z-[200] pointer-events-none" style={{ backgroundColor: 'white', opacity: flashOpacity, transition: flashOpacity === 0 ? 'opacity 200ms ease-out' : 'none' }} />}
      </div>
      <footer className="h-24 bg-black border-t border-white/10 flex items-center justify-between px-6 z-[120] shrink-0">
        <button disabled={status!=='idle'} onClick={()=>setFacing(p=>p==='user'?'environment':'user')} className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center active:bg-yellow-500 active:text-slate-950 disabled:opacity-0"><RefreshCw size={18}/></button>
        <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          {([1,2,3,4] as const).map(n=>(
            <button key={n} onClick={()=>setSel(n)} disabled={status==='countdown'||status==='flash'} className={`w-9 h-9 rounded-full font-black text-xs transition-all border-2 flex items-center justify-center disabled:opacity-20 ${sel===n?'bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110':'bg-yellow-500/5 text-yellow-500/60 border-yellow-500/20'}`}>{n}</button>
          ))}
        </div>
        <button onClick={reset} className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center active:bg-red-600 active:text-white"><Trash2 size={18}/></button>
      </footer>
      {camErr&&<div className="absolute top-16 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><AlertCircle size={12}/> {camErr}</div>}
    </div>
  );
};
