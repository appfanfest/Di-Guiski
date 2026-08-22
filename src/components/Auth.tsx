import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Mail, Lock, User, ArrowRight, Loader2, Globe, CheckCircle2, Search, Phone, AlertCircle, Sparkles, Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { APP_CONFIG, FLAG_FALLBACKS, DEFAULT_COUNTRIES, ORG_FALLBACK } from '../lib/constants';

interface AuthProps {
  onGuestEntry: (countryName: string) => void;
  logo?: string;
  isSupabaseConfigured?: boolean; // Prop added for future-proofing
  org?: any; // Prop added for future-proofing
  onRegisterSuccess?: () => void;
  onCancel?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onGuestEntry, logo, onRegisterSuccess, onCancel }) => {
  const { lang, t } = useLanguage();

  const getCountryName = (p: any) => {
    const nameKey = lang === 'es' ? 'name' : `name_${lang}`;
    return p[nameKey] || p.name || p.nombre;
  };
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSelectingCountry, setIsSelectingCountry] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paises, setPaises] = useState<any[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchPaises();
  }, []);

  async function fetchPaises() {
    try {
      const { data } = await supabase.from('paises_operativos').select('*').order('nombre', { ascending: true });
      if (data && data.length > 0) {
        setPaises(data);
      } else {
        setPaises(DEFAULT_COUNTRIES);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      setPaises(DEFAULT_COUNTRIES);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } }
        });
        if (error) throw error;
        onRegisterSuccess?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales de acceso inválidas' : err.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white overflow-hidden relative" style={{ backgroundImage: 'url("https://i.ibb.co/PZrnNtmF/BACK-PANINI.webp")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-fifa-gold/5 blur-3xl rounded-full -ml-32 -mb-32" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-6 relative z-10"
      >
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl overflow-hidden border-4 border-white/20">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Trophy size={40} className="text-fifa-blue" />
          )}
        </div>
        <h1 className="text-4xl font-black mb-1 tracking-tighter italic">{APP_CONFIG.NAME}</h1>
        <p className="text-yellow-400 font-black tracking-widest uppercase text-[10px] bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 inline-block shadow-lg">
          {ORG_FALLBACK.slogan}
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-slate-900 relative z-10"
      >
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        <AnimatePresence mode="wait">
          {!isSelectingCountry ? (
            <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-6">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                      !isRegistering ? 'bg-white shadow-sm text-fifa-blue' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.auth.signIn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                      isRegistering ? 'bg-white shadow-sm text-fifa-blue' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.auth.register}
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegistering && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" placeholder={t.auth.enterName} value={nombre}
                      onChange={(e) => setNombre(e.target.value)} required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" placeholder={t.auth.enterEmail} value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={t.auth.enterPassword} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fifa-blue transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold px-2 uppercase tracking-tight">{error}</p>}
                <button 
                  type="submit" disabled={loading}
                  className="w-full py-4 px-8 bg-fifa-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-fifa-blue/90 transition-all shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>{isRegistering ? t.auth.signUp : t.auth.signIn} <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 px-8 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-sm mt-4 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                Continuar con Google
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-white px-4 text-slate-700 font-black tracking-[0.2em]">{t.auth.orContinueWith}</span></div>
              </div>

              <button 
                onClick={() => onGuestEntry('Estados Unidos')}
                className="w-full py-5 px-8 bg-green-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-4 hover:bg-green-700 active:scale-95 transition-all"
              >
                {t.auth.visitGuest}
                <ArrowRight size={16} className="opacity-70" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="country" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <Globe size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-800 italic uppercase">{t.auth?.whereFrom ?? "¿Desde dónde vienes?"}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.auth?.bestExperience ?? "Para mostrarte la mejor experiencia local"}</p>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.auth?.searchCountry ?? "Buscar país..."}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                {[...paises]
                  .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
                  .filter(p => getCountryName(p).toLowerCase().includes(countrySearch.toLowerCase()))
                  .map((p) => (
                  <button
                    key={p.id || p.nombre}
                    onClick={() => onGuestEntry(p.nombre)}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-7 rounded shadow-sm overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={p.bandera_pais || p.bandera_url || FLAG_FALLBACKS[p.nombre]}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const fallback = FLAG_FALLBACKS[p.nombre];
                            if (fallback) (e.target as HTMLImageElement).src = fallback;
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase">{getCountryName(p)}</span>
                    </div>
                    <CheckCircle2 size={18} className="text-orange-200 group-hover:text-orange-500 transition-colors" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsSelectingCountry(false)}
                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                {t.auth?.backToStart ?? "VOLVER AL INICIO"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* GLOBAL FOOTER */}
      <footer className="mt-8 text-center space-y-2 relative z-10 drop-shadow-md">
        <p className="text-[10px] font-black uppercase tracking-widest text-white">
          Diseño &amp; Vibe Coding: {APP_CONFIG.VIBE_CODING}
        </p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-white">
          Derechos Reservados 2026
        </p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-white">
          RIF: {APP_CONFIG.RIF}
        </p>
        <div className="flex items-center justify-center gap-4 pt-3">
          <img src="https://flagcdn.com/w20/ve.png" alt="Venezuela" className="w-5 h-3.5 object-cover rounded-[2px]" />
          <img src="https://flagcdn.com/w20/us.png" alt="USA" className="w-5 h-3.5 object-cover rounded-[2px]" />
          <img src="https://flagcdn.com/w20/es.png" alt="España" className="w-5 h-3.5 object-cover rounded-[2px]" />
        </div>
      </footer>

      {/* PROMO MODAL PRE-LANZAMIENTO */}
      <AnimatePresence>
        {showPromoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-gradient-to-br from-orange-500 to-orange-600 p-1 rounded-[3rem] shadow-2xl"
            >
              <div className="bg-white rounded-[2.8rem] p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Sparkles size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase leading-none tracking-tighter">¡Próximamente!</h3>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                    Estamos en período de pre-lanzamiento. Muy pronto habilitaremos los registros oficiales.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Mientras tanto...</p>
                   <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
                     Te invitamos a entrar como <span className="text-orange-500">VISITANTE</span> para que conozcas toda la experiencia del FanFest 5.0
                   </p>
                </div>

                <button 
                  onClick={() => {
                    setShowPromoModal(false);
                    setIsSelectingCountry(true);
                  }}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-orange-200 active:scale-95 transition-all"
                >
                  ¡VAMOS ALLÁ!
                </button>
                
                <button 
                  onClick={() => setShowPromoModal(false)}
                  className="w-full py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400"
                >
                  VOLVER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
