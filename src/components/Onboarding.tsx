import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  Trophy, 
  MapPin, 
  ChevronRight, 
  User, 
  Phone, 
  IdCard, 
  Globe, 
  Instagram, 
  Camera, 
  Loader2,
  Smartphone,
  AlertCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStatesForCountry } from '../lib/geography';

interface OnboardingProps {
  userId: string;
  profile: any;
  onComplete: (updatedProfile: any) => void;
  org?: any;
}

export const Onboarding: React.FC<OnboardingProps> = ({ userId, profile, onComplete, org }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paisesOperativos, setPaisesOperativos] = useState<any[]>([]);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(profile?.foto_logo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    foto_logo: profile?.foto_logo || '',
    identificacion: profile?.identificacion || '',
    genero: profile?.genero || '',
    edad: profile?.edad || '',
    telefono: profile?.telefono || '',
    instagram: profile?.instagram || '',
    tiktok: profile?.tiktok || '',
    acepta_terminos_publico: profile?.acepta_terminos_publico || false,
  });

  useEffect(() => {
    // Ya no es necesario obtener países operativos aquí
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }

      setUploadingImage(true);
      setError(null);

      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos') // Reusing logos bucket as it exists
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, foto_logo: publicUrl }));
    } catch (err: any) {
      console.error('Error uploading:', err);
      setError('Error al subir imagen: ' + (err.message || 'Error desconocido'));
      setLocalPreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.foto_logo && !localPreview) {
      setError('Debes subir una foto de perfil obligatoria.');
      return false;
    }
    if (!formData.nombre || !formData.identificacion || !formData.genero || !formData.edad || !formData.telefono) {
      setError('Por favor completa todos los campos obligatorios (*)');
      return false;
    }
    if (!formData.instagram && !formData.tiktok) {
      setError('Al menos una red social (Instagram o TikTok) es obligatoria.');
      return false;
    }
    if (!formData.acepta_terminos_publico) {
      setError('Debes aceptar los términos y condiciones de usuario.');
      return false;
    }
    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    try {
      const cleanData: any = {};
      
      Object.keys(formData).forEach(key => {
        const val = (formData as any)[key];
        if (val === '') {
          cleanData[key] = null;
        } else {
          cleanData[key] = val;
        }
      });

      const { data, error: updateError } = await supabase
        .from('perfiles_usuarios')
        .update({
          ...cleanData,
          perfil_completado: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      onComplete(data);
    } catch (err: any) {
      if (err.message.includes('UUID')) {
         const { data: retryData, error: retryError } = await supabase
          .from('perfiles_usuarios')
          .update({
            ...Object.fromEntries(Object.entries(formData).filter(([k]) => k !== 'mi_favorito')),
            perfil_completado: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
          
          if (retryError) throw retryError;
          onComplete(retryData);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-y-auto text-slate-900">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col p-6 pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-fifa-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-fifa-blue leading-none italic uppercase">FANFEST 2026</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activación</p>
            </div>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="text-left mb-6">
            <h1 className="text-4xl font-black text-slate-900 leading-none uppercase italic tracking-tighter mb-2">
              ¡Activa tu <span className="text-fifa-blue">Perfil</span>!
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Completa tus datos oficiales</p>
          </div>

          <div className="space-y-4">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
              <div 
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl cursor-pointer group"
              >
                {localPreview ? (
                  <img src={localPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-fifa-blue transition-colors">
                    <Camera size={32} />
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Sube tu foto *</p>
            </div>

            {/* Identidad */}
            <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" name="nombre" placeholder="Nombre completo *" value={formData.nombre} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>
            
            <div className="relative"><IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" name="identificacion" placeholder="ID / Cédula / Pasaporte *" value={formData.identificacion} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <select name="genero" value={formData.genero} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none"><option value="">Género *</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select>
              <input type="number" name="edad" placeholder="Edad *" value={formData.edad} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
            </div>
            
            <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="tel" name="telefono" placeholder="Teléfono / WhatsApp *" value={formData.telefono} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" /></div>

            {/* Redes Sociales */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Comunidad</h3>
              <div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={20} /><input type="text" name="instagram" placeholder="@UsuarioInstagram" value={formData.instagram} onChange={handleChange} className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" /></div>
              <div className="relative"><Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={20} /><input type="text" name="tiktok" placeholder="@UsuarioTikTok" value={formData.tiktok} onChange={handleChange} className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" /></div>
            </div>

            {/* Terminos */}
            <div className="pt-6">
              <label className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                <input type="checkbox" name="acepta_terminos_publico" checked={formData.acepta_terminos_publico} onChange={handleChange} className="mt-1 w-5 h-5 text-fifa-blue rounded border-slate-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight">Acepto Términos de Usuario</p>
                  <a href="#" className="text-[9px] text-fifa-blue font-bold uppercase mt-1 flex items-center gap-1 hover:underline">
                    <FileText size={12} /> Ver Términos y Condiciones
                  </a>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50 flex justify-center z-[1100] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <div className="w-full max-w-md space-y-4">
            {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase leading-tight"><AlertCircle size={18} className="shrink-0" /> {error}</motion.div>}
            <button onClick={saveProfile} disabled={loading || uploadingImage} className="w-full py-5 bg-fifa-blue text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {(loading || uploadingImage) ? <Loader2 className="animate-spin" size={20} /> : 'FINALIZAR REGISTRO'}
              {!(loading || uploadingImage) && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
