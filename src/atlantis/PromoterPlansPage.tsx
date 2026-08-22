import React, { useState } from 'react';
import { Shield, Sparkles, Crown, Check, ChevronRight, Info, Globe, X, Rocket, Store, Users, Play, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  pc: string;
  onNavigate: (path: string) => void;
  org?: any;
}

export default function PromoterPlansPage({ pc, onNavigate, org }: Props) {
  const { t } = useLanguage();
  const [costoSobre, setCostoSobre] = useState<number>(1.0);
  const [userCountry, setUserCountry] = useState<string>('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [countryData, setCountryData] = useState<any[]>([]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    async function fetchData() {
      try {
        const { data: countries } = await supabase
          .from('paises_operativos')
          .select('*')
          .order('nombre');
        
        if (countries && isMounted) setCountryData(countries);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const { data: profile } = await supabase.from('perfiles_usuarios').select('pais_residencia').eq('id', session.user.id).maybeSingle();
          if (profile?.pais_residencia && isMounted) {
            setUserCountry(profile.pais_residencia);
            const { data: pais } = await supabase.from('paises_operativos').select('costo_panini').eq('nombre', profile.pais_residencia).maybeSingle();
            if (pais?.costo_panini && isMounted) setCostoSobre(Number(pais.costo_panini) || 1.0);
          }
        }
      } catch (err) {
        console.error('Error in PromoterPlansPage fetch:', err);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const promoterPlans = [
    {
      name: t.plans_promoter.freePlan,
      subtitle: t.plans_promoter.freeSubtitle,
      price: t.plans_promoter.freePrice,
      sobres: 0,
      icon: <Users size={24} className="text-white" />,
      features: [
        t.plans_promoter.freeF1,
        t.plans_promoter.freeF2,
        t.plans_promoter.freeF3,
        t.plans_promoter.freeF4
      ],
      color: 'from-blue-600 to-blue-900',
      border: 'border-blue-400/30',
      textColor: 'text-white',
      internalName: 'Entre Amigos'
    },
    {
      name: t.plans_promoter.privatePlan,
      subtitle: t.plans_promoter.privateSubtitle,
      price: `${org?.sobres_promotores || 20} ${t.plans_promoter.envelopes}`,
      sobres: org?.sobres_promotores || 20,
      icon: <Shield size={24} className="text-white" />,
      features: [
        t.plans_promoter.privateF1,
        t.plans_promoter.privateF2,
        t.plans_promoter.privateF3,
        t.plans_promoter.privateF4
      ],
      color: 'from-purple-600 to-purple-900',
      border: 'border-purple-400/30',
      textColor: 'text-white',
      internalName: 'Privada'
    },
    {
      name: t.plans_promoter.comercialPlan,
      subtitle: t.plans_promoter.comercialSubtitle,
      price: `${org?.albumes_promotores || 2} ${t.plans_promoter.albums}`,
      sobres: (org?.albumes_promotores || 2) * 50, // 1 álbum = 50 sobres (referencial)
      icon: <Store size={24} className="text-slate-900" />,
      features: [
        t.plans_promoter.comercialF1,
        t.plans_promoter.comercialF2,
        t.plans_promoter.comercialF3,
        t.plans_promoter.comercialF4,
        t.plans_promoter.comercialF5,
        t.plans_promoter.comercialF6,
        t.plans_promoter.comercialF7
      ],
      color: 'from-[#BF953F] via-[#FCF6BA] to-[#AA771C]',
      border: 'border-yellow-200/50',
      textColor: 'text-slate-900',
      isPopular: true,
      internalName: 'Comercial'
    },
    {
      name: t.plans_promoter.nationalPlan,
      subtitle: t.plans_promoter.nationalSubtitle,
      price: t.plans_promoter.nationalPrice,
      sobres: 0,
      icon: <Globe size={24} className="text-white" />,
      features: [
        t.plans_promoter.nationalF1,
        t.plans_promoter.nationalF2,
        t.plans_promoter.nationalF3,
        t.plans_promoter.nationalF4
      ],
      color: 'from-emerald-700 to-emerald-950',
      border: 'border-emerald-400/30',
      textColor: 'text-white',
      internalName: 'Nacional'
    }
  ];

  return (
    <div className="py-4 px-4 space-y-6 animate-fade-in pb-24">
      <div className="text-center space-y-4 pt-2">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight px-4">
          {t.plans_promoter.title}
        </h2>
        
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => setShowExplainModal(true)}
            className="text-[11px] font-black uppercase tracking-widest text-emerald-600 underline decoration-1 underline-offset-4 hover:text-emerald-800 transition-colors"
          >
            {t.plans_promoter.whyNeverLate}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {promoterPlans.map((plan) => {
          // Ajustar nombres de precios dinámicamente para consistencia
          const displayPrice = plan.internalName === 'Privada' ? `${org?.sobres_promotores || 20} ${t.plans_promoter.paniniEnvelopes}` : 
                               plan.internalName === 'Comercial' ? `${org?.albumes_promotores || 2} ${t.plans_promoter.paniniAlbums}` : 
                               plan.price;
          return (
            <div
              key={plan.name}
              className={`relative rounded-[2.5rem] overflow-hidden border transition-all ${plan.border} ${plan.isPopular ? (plan.internalName === 'Comercial' ? 'shadow-[0_0_60px_rgba(184,135,40,0.3)]' : 'shadow-[0_0_60px_rgba(0,112,192,0.3)]') : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.color}`} />
              {plan.isPopular && (
                <div className={`absolute top-5 right-5 z-20 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${plan.textColor} border border-white/30 shadow-lg`}>
                  {t.plans_promoter.mostProfitable}
                </div>
              )}

              <div className="relative z-10 p-7">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-widest leading-none ${plan.textColor}`}>{plan.name}</h3>
                    <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${plan.textColor}`}>{plan.subtitle}</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-col items-start gap-1">
                  <span className={`text-xl font-black ${plan.textColor} tracking-tighter uppercase leading-none underline decoration-2 underline-offset-4`}>
                    {displayPrice}
                  </span>
                  {plan.internalName !== 'Nacional' && (
                    <p className={`text-[9px] font-bold uppercase tracking-widest opacity-70 ${plan.textColor} mt-1`}>
                      {t.plans_promoter.operativeCost}{(plan.sobres * costoSobre).toFixed(2)} {t.plans_promoter.usd}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20`}>
                        <Check size={10} className={plan.textColor} />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${plan.textColor} opacity-90`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate(plan.internalName === 'Nacional' ? 'contact' : 'gestor')}
                  className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-2xl hover:scale-[1.02] active:scale-95 border-b-4 ${
                    plan.internalName === 'Comercial' 
                      ? 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-slate-900 border-yellow-700' 
                      : plan.internalName === 'Nacional'
                        ? 'bg-white/10 text-white border-white/20'
                        : plan.internalName === 'Entre Amigos'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-900'
                          : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white border-purple-900'
                  }`}
                >
                  {plan.internalName === 'Nacional' ? t.plans_promoter.btnConsult : plan.internalName === 'Privada' ? t.plans_promoter.btnPrivate : plan.internalName === 'Entre Amigos' ? t.plans_promoter.btnFree : t.plans_promoter.btnComercial}
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center pt-2">
          <button 
            onClick={() => setShowCountryModal(true)}
            className="text-[11px] font-black text-slate-600/80 uppercase tracking-[0.15em] flex flex-col items-center gap-2 hover:text-slate-900 transition-colors underline decoration-2 underline-offset-4 text-center px-6"
          >
            <Globe size={18} className="mb-1" />
            {t.plans_promoter.costInCountry1}{userCountry || t.plans_promoter.costInCountry2}
          </button>
        </div>

        <div className="p-6 bg-white/5 rounded-[2rem] border border-dashed border-white/10 flex items-start gap-4">
          <Info size={20} className="text-white/20 shrink-0 mt-1" />
          <p className="text-[8px] text-white/40 font-bold uppercase leading-relaxed italic">
            {t.plans_promoter.disclaimer}
          </p>
        </div>
      </div>

      {/* Modal de Países (Reutilizado de PlansPage) */}
      <AnimatePresence>
        {showCountryModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCountryModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">{t.plans_promoter.cromosIndex}</h3>
                <button onClick={() => setShowCountryModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                {countryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded-sm overflow-hidden shadow-sm border border-slate-200">
                        <img 
                          src={c.bandera_pais || c.bandera_url || `https://flagcdn.com/w40/${c.codigo_iso?.toLowerCase() || 'un'}.png`} 
                          alt={c.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{c.nombre}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">${Number(c.costo_panini).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Explicativo de Quiniela Progresiva */}
      <AnimatePresence>
        {showExplainModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExplainModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.8rem] p-8 shadow-2xl border border-slate-100 text-center space-y-5"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider leading-relaxed text-left">
                  {t.plans_promoter.modalText1}<strong className="text-emerald-600">{t.plans_promoter.modalBrand}</strong>{t.plans_promoter.modalText2}
                  <br /><br />
                  {t.plans_promoter.modalText3}
                </p>
              </div>
              
              <button 
                onClick={() => setShowExplainModal(false)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-emerald-700/50 shadow-lg active:scale-95"
              >
                {t.plans_promoter.understood}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
