import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Mail, Lock, UserPlus, LogIn, Chrome, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    
    const { login, registerUser, loginWithGoogle, user } = useAppContext();
    const navigate = useNavigate();

    // Redirigir si ya está logueado
    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setErrorMsg(null);
        setSuccessMsg(null);
        setPass('');
        setConfirmPass('');
    };

    const handleGoogleLogin = async () => {
        // Disabled functionality
        return; 
        
        /* 
        setLoading(true);
        setErrorMsg(null);
        const result = await loginWithGoogle();
        if (!result.success && result.message) {
            setErrorMsg(result.message);
            setLoading(false);
        }
        */
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (mode === 'register') {
                if (pass !== confirmPass) throw new Error("Las contraseñas no coinciden.");
                if (pass.length < 6) throw new Error("La contraseña debe tener mínimo 6 caracteres.");
                if (!acceptTerms) throw new Error("Debes aceptar los términos y condiciones.");

                const result = await registerUser(email, pass);
                
                if (result.success) {
                    if (result.message) {
                        setSuccessMsg(result.message);
                        setPass(''); 
                        setConfirmPass('');
                    } else {
                        navigate('/'); // Auto login exitoso
                    }
                } else {
                    setErrorMsg(result.message || "Error al registrarse.");
                }

            } else {
                const result = await login(email, pass);
                if (result.success) {
                    navigate('/');
                } else {
                    setErrorMsg(result.message || "Error al iniciar sesión.");
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-800 overflow-hidden relative">
                
                {/* Decorative Top Glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600"></div>

                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2 font-display">
                        {mode === 'login' ? 'Bienvenido' : 'Únete a NaviFest'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {mode === 'login' 
                            ? 'Accede a tus experiencias exclusivas.' 
                            : 'Crea una cuenta y vive la magia de la AR.'}
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 pt-6">
                    {/* Alerts */}
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 flex gap-3 text-sm animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6 flex gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-navifest-gold transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-navifest-gold focus:ring-1 focus:ring-navifest-gold transition-all"
                                    placeholder="hola@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-navifest-gold transition-colors" size={18} />
                                <input 
                                    type={showPass ? "text" : "password"}
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 text-white rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-navifest-gold focus:ring-1 focus:ring-navifest-gold transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-navifest-gold transition-colors" size={18} />
                                        <input 
                                            type={showPass ? "text" : "password"}
                                            value={confirmPass}
                                            onChange={e => setConfirmPass(e.target.value)}
                                            className="w-full bg-black/50 border border-gray-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-navifest-gold focus:ring-1 focus:ring-navifest-gold transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={acceptTerms}
                                            onChange={e => setAcceptTerms(e.target.checked)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-black/50 checked:bg-navifest-red checked:border-navifest-red transition-all"
                                        />
                                        <CheckCircle2 className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity" />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                        Acepto los <Link to="/terms" className="text-navifest-gold hover:underline">Términos y Condiciones</Link> y la Política de Privacidad.
                                    </span>
                                </label>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                                loading ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-navifest-red to-red-700 hover:from-red-500 hover:to-red-600 shadow-navifest-red/25 hover:shadow-navifest-red/40'
                            }`}
                        >
                            {loading ? (
                                <span className="animate-pulse">Procesando...</span>
                            ) : (
                                <>
                                    {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                                    {mode === 'login' ? 'Entrar' : 'Crear Cuenta'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex py-6 items-center">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">O continúa con</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={true}
                        className="w-full bg-gray-800 text-gray-500 border border-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
                        title="Inicio de sesión con Google temporalmente deshabilitado"
                    >
                        <Chrome size={20} className="text-gray-500" />
                        Google
                    </button>

                    {/* Switcher */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            {mode === 'login' ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                            <button 
                                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                className="text-navifest-gold font-bold hover:text-yellow-400 hover:underline transition-colors ml-1"
                            >
                                {mode === 'login' ? "Regístrate gratis" : "Inicia Sesión"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};