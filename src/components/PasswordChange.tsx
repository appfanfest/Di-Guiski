import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface PasswordChangeProps {
  userId: string;
  onComplete: () => void;
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({ userId, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      // 1. Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Update require_password_change flag in profile
      const { error: profileError } = await supabase
        .from('perfiles_usuarios')
        .update({ require_password_change: false })
        .eq('id', userId);

      if (profileError) throw profileError;

      onComplete();
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-fifa-blue/10 text-fifa-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Seguridad Requerida</h2>
            <p className="text-sm text-slate-500 font-medium">
              Has ingresado con una clave temporal. Por tu seguridad, debes definir una contraseña nueva para continuar.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fifa-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-fifa-blue outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100"
              >
                <AlertCircle size={20} />
                <p className="text-xs font-bold">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-fifa-blue text-white rounded-2xl font-black shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
              {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR Y ENTRAR'}
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
