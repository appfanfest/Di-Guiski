import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Download, Link2, MapPin, Palette } from 'lucide-react';

interface SolicitarMetaversoProps {
  onBack: () => void;
  org?: any;
}

export const SolicitarMetaverso: React.FC<SolicitarMetaversoProps> = ({ onBack, org }) => {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    nombre_negocio: '',
    tipo_metaverso: 'comercial',
    email_contacto: '',
    telefono_contacto: '',
    direccion: '',
    pais: '',
    estado_provincia: '',
    pagina_web: '',
    red_social_1: '',
    red_social_2: '',
    red_social_3: '',
    color_primario: '#10b981',
    color_secundario: '#3b82f6',
    color_base: '#000000',
    fuentes_tipograficas: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadFile = async (file: File, pathPrefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}_${Math.random()}.${fileExt}`;
    const filePath = `solicitudes/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('clientes_assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('clientes_assets')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Validaciones
      if (formData.pais === 'Venezuela' && !formData.estado_provincia) {
        throw new Error('El estado/provincia es obligatorio para Venezuela.');
      }
      if (!formData.red_social_1 || !formData.red_social_2) {
        throw new Error('Debes proporcionar al menos 2 redes sociales (ej. Instagram, TikTok, etc.).');
      }

      let logo_url = '';
      let hero_url = '';

      if (logoFile) {
        logo_url = await uploadFile(logoFile, 'logo');
      }
      if (heroFile) {
        hero_url = await uploadFile(heroFile, 'hero');
      }

      // Current user if exists
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: dbError } = await supabase
        .from('solicitudes_metaversos')
        .insert([{
          user_id: session?.user?.id || null,
          nombre_negocio: formData.nombre_negocio,
          tipo_metaverso: formData.tipo_metaverso,
          email_contacto: formData.email_contacto,
          telefono_contacto: formData.telefono_contacto,
          direccion: formData.direccion,
          pais: formData.pais,
          estado_provincia: formData.estado_provincia || null,
          pagina_web: formData.pagina_web || null,
          red_social_1: formData.red_social_1,
          red_social_2: formData.red_social_2,
          red_social_3: formData.red_social_3 || null,
          color_primario: formData.color_primario,
          color_secundario: formData.color_secundario,
          color_base: formData.color_base,
          logo_url: logo_url || null,
          hero_url: hero_url || null,
          fuentes_tipograficas: formData.fuentes_tipograficas || null
        }]);

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black italic text-emerald-600">¡Solicitud Enviada!</h2>
        <p className="text-sm text-slate-500 font-medium px-4">
          Hemos recibido tu solicitud. Nuestro equipo la revisará y se pondrá en contacto contigo pronto.
        </p>
        <button 
          onClick={onBack}
          className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in relative max-w-lg mx-auto">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-6 pb-4 mb-6 border-b border-slate-100 flex items-center justify-between px-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-800 uppercase italic">
          {lang === 'es' ? 'Tu Metaverso' : 'Your Metaverse'}
        </h2>
        <div className="w-8" />
      </div>

      <div className="px-2 space-y-6">
        
        {/* Guía de Medios Card */}
        {org?.guia_medios && (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mb-8 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-emerald-800 font-black text-lg">Guía de Medios</h3>
                <p className="text-emerald-600/80 text-xs font-medium mt-1">
                  Incluye medidas y formatos en blanco para Photo Booth, Postales Wassap, Marcos Pro y todos los impresos (No incluye papercrafts).
                </p>
              </div>
              <a 
                href={org.guia_medios} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                <Download size={16} />
                Descargar Guía (PDF)
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Información Básica */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">1</div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Info. Principal</h3>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nombre (Negocio / Evento)</label>
              <input type="text" name="nombre_negocio" required value={formData.nombre_negocio} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-500/20 transition-all border border-slate-100" placeholder="Ej. Mi Super Empresa" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipo de Metaverso</label>
              <select name="tipo_metaverso" value={formData.tipo_metaverso} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100">
                <option value="comercial">Comercial (Negocio)</option>
                <option value="evento_privado">Evento Privado (Boda, Fiesta)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <input type="email" name="email_contacto" required value={formData.email_contacto} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Teléfono</label>
                <input type="text" name="telefono_contacto" required value={formData.telefono_contacto} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" />
              </div>
            </div>
          </section>

          {/* Ubicación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><MapPin size={16} /></div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Ubicación</h3>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">País</label>
              <select name="pais" required value={formData.pais} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100">
                <option value="">Selecciona un país</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="España">España</option>
                <option value="Colombia">Colombia</option>
                <option value="Mexico">México</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {formData.pais === 'Venezuela' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 mt-4">Estado / Provincia *</label>
                <input type="text" name="estado_provincia" required value={formData.estado_provincia} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="Ej. Distrito Capital, Zulia..." />
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Dirección Completa</label>
              <textarea name="direccion" required value={formData.direccion} onChange={handleInputChange} rows={2} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" />
            </div>
          </section>

          {/* Redes y Web */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Link2 size={16} /></div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Presencia Digital</h3>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Página Web (Opcional)</label>
              <input type="url" name="pagina_web" value={formData.pagina_web} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="https://" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Red Social 1 (Requerida) *</label>
              <input type="text" name="red_social_1" required value={formData.red_social_1} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="@usuario o URL (Ej. Instagram)" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Red Social 2 (Requerida) *</label>
              <input type="text" name="red_social_2" required value={formData.red_social_2} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="@usuario o URL (Ej. TikTok)" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Red Social 3 (Opcional)</label>
              <input type="text" name="red_social_3" value={formData.red_social_3} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="@usuario o URL" />
            </div>
          </section>

          {/* Branding */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Palette size={16} /></div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Identidad Visual</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Primario</label>
                <div className="h-12 rounded-2xl overflow-hidden border-2 border-slate-100 relative">
                  <input type="color" name="color_primario" value={formData.color_primario} onChange={handleInputChange} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Secundario</label>
                <div className="h-12 rounded-2xl overflow-hidden border-2 border-slate-100 relative">
                  <input type="color" name="color_secundario" value={formData.color_secundario} onChange={handleInputChange} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Base</label>
                <div className="h-12 rounded-2xl overflow-hidden border-2 border-slate-100 relative">
                  <input type="color" name="color_base" value={formData.color_base} onChange={handleInputChange} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 mt-4">Fuentes Tipográficas</label>
              <input type="text" name="fuentes_tipograficas" value={formData.fuentes_tipograficas} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100" placeholder="Ej. Montserrat, Roboto..." />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Logo</label>
                <label className="flex flex-col items-center justify-center h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload size={20} className="text-slate-400 mb-2" />
                  <span className="text-[9px] font-bold text-slate-500 truncate max-w-[90%]">{logoFile ? logoFile.name : 'Subir (PNG/SVG)'}</span>
                  <input type="file" accept="image/*,.svg" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Hero Banner</label>
                <label className="flex flex-col items-center justify-center h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload size={20} className="text-slate-400 mb-2" />
                  <span className="text-[9px] font-bold text-slate-500 truncate max-w-[90%]">{heroFile ? heroFile.name : 'Subir Imagen'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setHeroFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] disabled:opacity-50 mt-8 relative"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
};
