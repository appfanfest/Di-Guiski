import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  User, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  MapPin, 
  IdCard, 
  Phone, 
  Instagram, 
  Users,
  ShieldCheck,
  Smartphone,
  Building2,
  Zap,
  Heart,
  Gift,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getStatesForCountry } from '../lib/geography';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProfileSettingsProps {
  profile: any;
  onUpdate: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onUpdate }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paisesOperativos, setPaisesOperativos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    foto_logo: profile?.foto_logo || '',
    mi_favorito: profile?.mi_favorito || '',
    edad: profile?.edad || '',
    instagram: profile?.instagram || '',
    tiktok: profile?.tiktok || '',
    desea_gestionar: profile?.desea_gestionar || false,
    tipo_gestor_solicitado: profile?.tipo_gestor_solicitado || 'Privado',
    solicito_privadas: profile?.solicito_privadas || false,
    solicito_comerciales: profile?.solicito_comerciales || false,
    solicito_nacionales: profile?.solicito_nacionales || false,
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setError(null);
  };

  const validate = () => {
    if (!formData.nombre || !formData.edad) {
      setError(t.profile_settings.error_fields);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const cleanData: any = {};
      Object.keys(formData).forEach(key => {
        const val = (formData as any)[key];
        cleanData[key] = val === '' ? null : val;
      });

      const { error: updateError } = await supabase
        .from('perfiles_usuarios')
        .update({
          ...cleanData,
          perfil_completado: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
       if (err.message.includes('UUID')) {
         const { error: retryError } = await supabase
          .from('perfiles_usuarios')
          .update({
            ...Object.fromEntries(Object.entries(formData).filter(([k]) => k !== 'mi_favorito')),
            perfil_completado: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
          
          if (retryError) setError(retryError.message);
          else {
            setSuccess(true);
            onUpdate();
          }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-6 text-slate-900">
      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
        <div className="p-8 pb-0 text-slate-900 flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-md">
              {formData.foto_logo ? <img src={formData.foto_logo} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-slate-900 rounded-xl flex items-center justify-center cursor-pointer border shadow-sm hover:scale-105 active:scale-95 transition-all">
              <Camera size={14} /><input type="text" className="hidden" placeholder="URL" onChange={(e) => setFormData({...formData, foto_logo: e.target.value})} />
            </label>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">{t.profile_settings.title}</h3>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><User size={14} className="text-fifa-blue" /><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.profile_settings.personal_data}</h4></div>
            <div className="grid grid-cols-[1fr_80px] gap-4">
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" name="nombre" placeholder={t.profile_settings.name} value={formData.nombre} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>
              <input type="number" name="edad" placeholder={t.profile_settings.age} value={formData.edad} onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none text-center" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><Instagram size={14} className="text-pink-600" /><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.profile_settings.community}</h4></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={16} /><input type="text" name="instagram" placeholder="@Instagram" value={formData.instagram} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>
              <div className="relative"><Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={16} /><input type="text" name="tiktok" placeholder="@TikTok" value={formData.tiktok} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>
            </div>
          </div>

          <AnimatePresence>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase"><AlertCircle className="inline mr-2" size={14} /> {error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase"><CheckCircle2 className="inline mr-2" size={14} /> {t.profile_settings.success_msg}</div>}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="w-full py-5 bg-fifa-blue text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? t.profile_settings.saving : t.profile_settings.save_profile}
          </button>
        </div>
      </form>
    </div>
  );
};
