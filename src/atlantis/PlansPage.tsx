import React, { useState } from 'react';
import { Shield, Sparkles, Crown, Check, ChevronRight, CreditCard, Loader2, Send, Gift, Tag, X, Lock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  pc: string;
  onNavigate: (path: string) => void;
  org?: any;
}

export default function PlansPage({ pc, onNavigate, org }: Props) {
  const { t } = useLanguage();

  // ── States ───────────────────────────────────────────────────────────────
  const [plansData, setPlansData] = useState<any[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<any | null>(null);
  const [geoCountry, setGeoCountry] = useState<string>('');
  const [promoterCode, setPromoterCode] = useState<string>('');
  const [giftCode, setGiftCode] = useState<string>('');
  const [giftCodeMode, setGiftCodeMode] = useState<boolean>(false);
  const [giftCodeStatus, setGiftCodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [giftCodeMessage, setGiftCodeMessage] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<'Silver' | 'Gold' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [debugError, setDebugError] = useState<string>('');

  // ── On load ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;

    async function fetchAll() {
      // 0) Check session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) setCurrentUser(session?.user || null);
      } catch (_) {}

      // 1) IP Geolocation
      try {
        const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (isMounted && geo?.country_name) setGeoCountry(geo.country_name);
      } catch (_) {
        // silently ignore geolocation errors
      }

      // 2) Fetch plans
      try {
        const { data: plans, error } = await supabase
          .from('planes_suscripcion')
          .select('id, name, price_usd, duration_days')
          .order('price_usd', { ascending: true });
        
        if (error) {
          if (isMounted) setDebugError('Error DB Planes: ' + error.message);
        } else if (plans && isMounted) {
          if (plans.length === 0) {
            setDebugError('La tabla planes_suscripcion está vacía o el RLS bloquea la lectura.');
          }
          setPlansData(plans);
        }
      } catch (err: any) {
        if (isMounted) setDebugError('Catch Error: ' + err?.message);
      }

      // 3) Fetch active campaign / discount
      try {
        const now = new Date().toISOString();
        const { data: campaigns } = await supabase
          .from('campanas_promocionales')
          .select('*')
          .eq('is_active', true);
        if (campaigns && isMounted) {
          const valid = campaigns.find(
            (c: any) => c.start_date <= now && c.end_date >= now
          );
          setActiveDiscount(valid || null);
        }
      } catch (_) {}
    }

    fetchAll();
    return () => { isMounted = false; };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getPlanData(name: 'Silver' | 'Gold') {
    return plansData.find((p: any) => p.name === name) || null;
  }

  function getDiscountedPrice(priceUsd: number): number {
    if (!activeDiscount) return priceUsd;
    return priceUsd * (1 - activeDiscount.discount_percent / 100);
  }

  function formatPrice(priceUsd: number, name: 'Silver' | 'Gold'): React.ReactNode {
    const plan = getPlanData(name);
    if (!plan) return <span className="opacity-50">Cargando...</span>;
    const original = plan.price_usd;
    const discounted = getDiscountedPrice(original);
    if (activeDiscount) {
      return (
        <span className="flex flex-col gap-0.5">
          <span className="line-through text-white/40 text-sm font-bold">
            ${Number(original).toFixed(2)} USD / año
          </span>
          <span className="text-emerald-300 font-black text-lg">
            ${Number(discounted).toFixed(2)} USD / año
          </span>
        </span>
      );
    }
    return <span>${Number(original).toFixed(2)} USD / año</span>;
  }

  function getAmountToPay(): number {
    if (!selectedPlan) return 0;
    const plan = getPlanData(selectedPlan);
    if (!plan) return 0;
    return getDiscountedPrice(plan.price_usd);
  }

  // ── handleReportPayment ──────────────────────────────────────────────────
  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference || !selectedPlan) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No session');

      const plan = getPlanData(selectedPlan);
      if (!plan) throw new Error('Plan not found');

      const amount = getAmountToPay();

      const { error } = await supabase.from('pagos').insert({
        user_id: session.user.id,
        plan_id: plan.id,
        amount,
        status: 'pending',
        reference,
        promoter_id: null,
        country_origin: geoCountry || null,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      alert('Error al reportar pago: ' + (err?.message || 'Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  // ── handleRedeemGiftCode ─────────────────────────────────────────────────
  const handleRedeemGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;
    setGiftCodeStatus('loading');
    setGiftCodeMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Debes iniciar sesión para canjear un código.');

      const now = new Date().toISOString();
      const { data: codes, error: fetchError } = await supabase
        .from('codigos_regalo')
        .select('*')
        .eq('code', giftCode.trim())
        .eq('is_active', true)
        .gt('expires_at', now);

      if (fetchError) throw fetchError;
      if (!codes || codes.length === 0) {
        setGiftCodeStatus('error');
        setGiftCodeMessage('Código inválido, expirado o ya fue utilizado.');
        return;
      }

      const code = codes[0];

      // Mark code as used
      await supabase
        .from('codigos_regalo')
        .update({
          is_active: false,
          used_by_user_id: session.user.id,
          used_at: now,
        })
        .eq('id', code.id);

      // Upgrade user profile
      await supabase
        .from('perfiles_usuarios')
        .update({
          level: 'SILVER',
          fecha_expiracion_plan: code.expires_at,
        })
        .eq('id', session.user.id);

      setGiftCodeStatus('success');
      setGiftCodeMessage('¡Código canjeado! Tu plan Silver ha sido activado.');
    } catch (err: any) {
      setGiftCodeStatus('error');
      setGiftCodeMessage(err?.message || 'Error al canjear el código.');
    }
  };

  // ── Plan card config (static) ────────────────────────────────────────────
  const planCards = [
    {
      name: 'Bronce' as const,
      icon: <Shield size={24} className="text-white" />,
      features: (t.plans_user.plan_bronce_features as string[]),
      color: 'from-[#064e3b] to-[#065f46]',
      border: 'border-emerald-400/30',
      textColor: 'text-white',
      shadow: '',
    },
    {
      name: 'Silver' as const,
      icon: <Sparkles size={24} className="text-white" />,
      features: (t.plans_user.plan_silver_features as string[]),
      color: 'from-[#1e3a8a] to-[#1e40af]',
      border: 'border-blue-400/30',
      textColor: 'text-white',
      shadow: 'shadow-[0_0_40px_rgba(30,58,138,0.2)]',
    },
    {
      name: 'Gold' as const,
      icon: <Crown size={24} className="text-slate-900" />,
      features: (t.plans_user.plan_gold_features as string[]),
      color: 'from-[#BF953F] via-[#FCF6BA] to-[#AA771C]',
      border: 'border-yellow-200/50',
      textColor: 'text-slate-900',
      shadow: 'shadow-[0_0_60px_rgba(184,135,40,0.3)]',
    },
  ];

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="py-20 px-6 text-center space-y-6 flex flex-col items-center justify-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <Check size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-white">{t.plans_user.success_title}</h2>
        <p className="text-xs text-white/60 uppercase tracking-widest max-w-xs leading-relaxed">
          {t.plans_user.success_desc1}{' '}
          <span className="text-yellow-400 font-bold">{reference || 'N/A'}</span>{' '}
          {t.plans_user.success_desc2} {selectedPlan || 'seleccionado'}.
          <br /><br />
          {t.plans_user.success_desc3}
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-8 px-8 py-4 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/20 transition-all border border-white/20"
        >
          {t.plans_user.back_home}
        </button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="py-4 px-4 space-y-8 animate-fade-in pb-32">

      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">FanFest 5.0</p>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
          {t.plans_user.title || 'PLANES DE AFILIACIÓN'}
        </h1>
        <p className="text-[11px] text-white/50 uppercase tracking-wider">
          {t.plans_user.subtitle || 'Desbloquea el poder total del metaverso'}
        </p>

        {/* Active discount banner */}
        <AnimatePresence>
          {activeDiscount && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-400/30 rounded-2xl px-4 py-3"
            >
              <Tag size={14} className="text-emerald-300 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                {activeDiscount.discount_percent}% OFF — {activeDiscount.name || 'Campaña Activa'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {debugError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-xs font-mono text-left break-all">
            {debugError}
          </div>
        )}
      </div>

      {/* Plan Cards */}
      {!showPaymentForm ? (
        <div className="space-y-5">
          {planCards.map((card) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`relative rounded-[2.5rem] overflow-hidden border transition-all ${card.border} ${card.shadow}`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />

              {/* Gold recommended badge */}
              {card.name === 'Gold' && (
                <div className="absolute top-5 right-5 z-20 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-slate-900 border border-white/30 shadow-lg">
                  {t.plans_user.recommended}
                </div>
              )}

              {/* Gold Venezuela badge */}
              {card.name === 'Gold' && geoCountry !== 'Venezuela' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-sm rounded-2xl px-3 py-2 border border-yellow-300/30"
                >
                  <Gift size={12} className="text-yellow-300 shrink-0" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-yellow-200 leading-tight max-w-[100px]">
                    + 2 Afiliaciones Gratis para Venezuela
                  </span>
                </motion.div>
              )}

              {/* Decorative glow orb */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] opacity-30 bg-white/20" />

              <div className="relative z-10 p-7">
                {/* Icon + Name + Price */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-widest leading-none ${card.textColor}`}>
                      {card.name}
                    </h3>
                    <div className={`mt-1 font-black text-base ${card.textColor}`}>
                      {card.name === 'Bronce' ? (
                        <span className="text-emerald-300 font-black">Gratis</span>
                      ) : (
                        formatPrice(getPlanData(card.name as 'Silver' | 'Gold')?.price_usd ?? 0, card.name as 'Silver' | 'Gold')
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {card.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                        <Check size={10} className={card.textColor} />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${card.textColor} opacity-90`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {card.name === 'Bronce' ? (
                  <div className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-white/10 text-white/80 border border-white/20 text-center">
                    {t.plans_user.current_plan}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setSelectedPlan(card.name as 'Silver' | 'Gold');
                        setShowRegisterModal(true);
                        return;
                      }
                      setSelectedPlan(card.name as 'Silver' | 'Gold');
                      setShowPaymentForm(true);
                      setTimeout(() => window.scrollTo({ top: 9999, behavior: 'smooth' }), 100);
                    }}
                    className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] transition-all shadow-2xl hover:scale-[1.02] active:scale-95 border-b-4 ${
                      card.name === 'Gold'
                        ? 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-slate-900 border-yellow-700'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-900'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {t.plans_user.acquire} {card.name.toUpperCase()}
                      <ChevronRight size={20} />
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── Payment Form Panel ─────────────────────────────────────────── */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-gradient-to-b from-slate-900 to-black backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8 relative overflow-hidden"
          >
            {/* Security decorative background */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="text-center space-y-3 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { setShowPaymentForm(false); setSelectedPlan(null); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30 mx-auto shadow-lg shadow-blue-500/20">
                  <Lock size={32} className="text-blue-400" />
                </div>
                <div className="w-10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
                Pago Seguro <ShieldCheck size={24} className="text-emerald-400" />
              </h3>
              <p className="text-[11px] text-white/50 uppercase tracking-widest">
                {t.plans_user.selected_plan}{' '}
                <strong className={selectedPlan === 'Gold' ? 'text-yellow-400 text-sm' : 'text-blue-400 text-sm'}>
                  {selectedPlan}
                </strong>
              </p>
            </div>

            {/* Payment instructions */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 relative z-10 shadow-inner">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <CreditCard size={24} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Datos de Transferencia
                  </p>
                  <p className="text-[11px] text-white/40">Zelle o Pago Móvil</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Zelle</span>
                  <span className="text-sm font-bold text-white tracking-wide">pagos@saylucy.com</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Pago Móvil</span>
                  <span className="text-xs font-bold text-white tracking-wide">0414-0000000 / V-00000000 / BNC</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                    Total a Pagar
                  </p>
                  {activeDiscount && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-0.5">
                      {activeDiscount.discount_percent}% descuento aplicado
                    </p>
                  )}
                </div>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  ${getAmountToPay().toFixed(2)} USD
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleReportPayment} className="space-y-6 relative z-10">
              {/* Reference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
                  <Send size={12} className="text-blue-400" /> {t.plans_user.payment_reference}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={t.plans_user.payment_placeholder}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Promoter code (optional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
                  <Tag size={12} className="text-purple-400" /> Código de Promotor <span className="text-white/20">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={promoterCode}
                  onChange={e => setPromoterCode(e.target.value)}
                  placeholder="Ej. PROMO-2026"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-white/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Secure Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-white/40">
                <Lock size={12} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Información encriptada de extremo a extremo</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !reference}
                className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 border border-white/10"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <ShieldCheck size={22} />}
                {loading ? t.plans_user.validating : t.plans_user.report_now}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Gift Code Redemption ──────────────────────────────────────────── */}
      <div className="mt-6 space-y-4">
        <button
          onClick={() => { setGiftCodeMode(v => !v); setGiftCodeStatus('idle'); setGiftCodeMessage(''); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/60 hover:text-white text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <Gift size={16} className="text-pink-400" />
          ¿Tienes un Código de Regalo?
        </button>

        <AnimatePresence>
          {giftCodeMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-pink-400/20 space-y-5">
                {/* Icon header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-400/20">
                    <Gift size={20} className="text-pink-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Código de Regalo</h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">Canjea tu acceso especial</p>
                  </div>
                </div>

                {/* Status messages */}
                <AnimatePresence>
                  {giftCodeMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                        giftCodeStatus === 'success'
                          ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                          : 'bg-red-500/20 border-red-400/30 text-red-300'
                      }`}
                    >
                      {giftCodeMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                {giftCodeStatus !== 'success' && (
                  <form onSubmit={handleRedeemGiftCode} className="space-y-4">
                    <input
                      type="text"
                      value={giftCode}
                      onChange={e => setGiftCode(e.target.value)}
                      placeholder="Ej. GIFT-XXXX-XXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white placeholder:text-white/20 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={giftCodeStatus === 'loading' || !giftCode.trim()}
                      className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-[0_8px_24px_rgba(236,72,153,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                    >
                      {giftCodeStatus === 'loading' ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Gift size={16} />
                      )}
                      {giftCodeStatus === 'loading' ? 'Validando...' : 'Canjear Código'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* ── Register Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 text-center space-y-6"
            >
              {/* Close */}
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 hover:text-slate-800"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <Shield size={36} className="text-blue-500" />
              </div>

              {/* Text */}
              <div className="space-y-3">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">
                  {t.plans_user.registerModalTitle || 'Registro Requerido'}
                </h3>
                <p className="text-[12px] text-slate-500 font-semibold leading-relaxed">
                  {t.plans_user.registerModalDesc1 || 'Para adquirir el plan'}{' '}
                  <span className={`font-black ${selectedPlan === 'Gold' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {selectedPlan}
                  </span>{' '}
                  {t.plans_user.registerModalDesc2 || 'necesitas una cuenta ¡Di Guiski!.'}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.plans_user.registerModalFree || 'El registro es completamente gratuito y toma menos de 1 minuto.'}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  window.dispatchEvent(new CustomEvent('request_login'));
                }}
                className="w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)] hover:scale-[1.02] active:scale-95 transition-all border border-white/10 flex items-center justify-center gap-3"
              >
                {t.plans_user.registerModalBtn || 'Registrarme Gratis'}
                <ChevronRight size={20} />
              </button>

              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all font-bold"
              >
                {t.plans_user.registerModalCancel || 'Quizás después'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
