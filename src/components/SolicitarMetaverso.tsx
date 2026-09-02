import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Download, Link2, MapPin, ImageIcon } from 'lucide-react';

interface SolicitarMetaversoProps {
  onBack: () => void;
  org?: any;
}

export const SolicitarMetaverso: React.FC<SolicitarMetaversoProps> = ({ onBack, org }) => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nombre_negocio: '',
    tipo_metaverso: 'comercial',
    email_contacto: '',
    telefono_contacto: '',
    direccion: '',
    pais: '',
    estado_provincia: '',
    pagina_web: '',
    instagram: '',
    tiktok: '',
    snapchat: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setHeroFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setHeroPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setHeroPreview(null);
    }
  };

  const uploadFile = async (file: File, pathPrefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `solicitudes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('clientes_assets')
      .upload(filePath, file, { upsert: false });

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
      if (formData.pais === 'Venezuela' && !formData.estado_provincia) {
        throw new Error('El estado/provincia es obligatorio para Venezuela.');
      }
      if (!formData.instagram) {
        throw new Error('El usuario de Instagram es obligatorio.');
      }
      if (!formData.tiktok) {
        throw new Error('El usuario de TikTok es obligatorio.');
      }

      let logo_url = '';
      let hero_url = '';

      if (logoFile) logo_url = await uploadFile(logoFile, 'logo');
      if (heroFile) hero_url = await uploadFile(heroFile, 'hero');

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
          red_social_1: formData.instagram,
          red_social_2: formData.tiktok,
          red_social_3: formData.snapchat || null,
          logo_url: logo_url || null,
          hero_url: hero_url || null,
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black italic text-emerald-600">¡Solicitud Enviada!</h2>
        <p className="text-sm text-slate-500 font-medium">
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

      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-6 pb-4 mb-6 border-b border-slate-100 flex items-center justify-between px-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-800 uppercase italic">
          {lang === 'es' ? 'Tu Metaverso' : lang === 'fr' ? 'Votre Metavers' : 'Your Metaverse'}
        </h2>
        <div className="w-8" />
      </div>

      <div className="px-2 space-y-6">

        {/* Guía de Medios */}
        {org?.guia_medios && (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-emerald-800 font-black text-base">Guía de Medios</h3>
              <p className="text-emerald-700/80 text-[11px] font-medium leading-relaxed">
                Incluye medidas y formatos en blanco para Photo Booth, Postales Wassap, Marcos Pro y todos los impresos <em>(No incluye papercrafts)</em>.
              </p>
              <a
                href={org.guia_medios}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                <Download size={15} />
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

          {/* ── 1. Info Principal ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-black shrink-0">1</div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Información Principal</h3>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Nombre del Negocio o Evento *
              </label>
              <input
                type="text" name="nombre_negocio" required
                value={formData.nombre_negocio} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-400/30 transition-all border border-slate-100"
                placeholder="Ej. Mi Super Empresa"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Tipo de Metaverso
              </label>
              <select
                name="tipo_metaverso"
                value={formData.tipo_metaverso} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100"
              >
                <option value="comercial">Comercial (Negocio)</option>
                <option value="evento_privado">Evento Privado (Boda, Fiesta, etc.)</option>
              </select>
            </div>

            {/* Email — línea única */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Email de Contacto *
              </label>
              <input
                type="email" name="email_contacto" required
                value={formData.email_contacto} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-400/30 transition-all border border-slate-100"
                placeholder="correo@ejemplo.com"
              />
            </div>

            {/* Teléfono — línea única */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Teléfono de Contacto *
              </label>
              <input
                type="tel" name="telefono_contacto" required
                value={formData.telefono_contacto} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-400/30 transition-all border border-slate-100"
                placeholder="+58 412 000 0000"
              />
            </div>
          </section>

          {/* ── 2. Ubicación ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                <MapPin size={14} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Ubicación</h3>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">País *</label>
              <select
                name="pais" required
                value={formData.pais} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100"
              >
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
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Estado / Provincia *
                </label>
                <input
                  type="text" name="estado_provincia" required
                  value={formData.estado_provincia} onChange={handleInputChange}
                  className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100"
                  placeholder="Ej. Distrito Capital, Zulia, Miranda..."
                />
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Dirección Completa *
              </label>
              <textarea
                name="direccion" required rows={2}
                value={formData.direccion} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100 resize-none"
                placeholder="Calle, Urb., Local, Edificio..."
              />
            </div>
          </section>

          {/* ── 3. Presencia Digital ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                <Link2 size={14} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Presencia Digital</h3>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Página Web <span className="text-slate-300">(Opcional)</span>
              </label>
              <input
                type="url" name="pagina_web"
                value={formData.pagina_web} onChange={handleInputChange}
                className="w-full bg-slate-50 p-4 rounded-2xl font-medium outline-none border border-slate-100"
                placeholder="https://mi-empresa.com"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Instagram *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">@</span>
                <input
                  type="text" name="instagram" required
                  value={formData.instagram} onChange={handleInputChange}
                  className="w-full bg-slate-50 pl-8 pr-4 py-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-400/30 transition-all border border-slate-100"
                  placeholder="usuario"
                />
              </div>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                TikTok *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">@</span>
                <input
                  type="text" name="tiktok" required
                  value={formData.tiktok} onChange={handleInputChange}
                  className="w-full bg-slate-50 pl-8 pr-4 py-4 rounded-2xl font-medium outline-none focus:bg-emerald-50 focus:ring-1 ring-emerald-400/30 transition-all border border-slate-100"
                  placeholder="usuario"
                />
              </div>
            </div>

            {/* Snapchat */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Snapchat <span className="text-slate-300">(Opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">@</span>
                <input
                  type="text" name="snapchat"
                  value={formData.snapchat} onChange={handleInputChange}
                  className="w-full bg-slate-50 pl-8 pr-4 py-4 rounded-2xl font-medium outline-none border border-slate-100"
                  placeholder="usuario"
                />
              </div>
            </div>
          </section>

          {/* ── 4. Identidad Visual ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                <ImageIcon size={14} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Identidad Visual</h3>
            </div>

            {/* Logo — línea única con preview */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Logo del Negocio / Evento
              </label>
              <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview logo" className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                    <Upload size={20} className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-600 truncate">
                    {logoFile ? logoFile.name : 'Subir logo (PNG, SVG, JPG)'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Toca para seleccionar archivo</p>
                </div>
                <input type="file" accept="image/*,.svg" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>

            {/* Hero Banner — línea única con preview */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Hero Banner / Arte Principal
              </label>
              <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors">
                {heroPreview ? (
                  <img src={heroPreview} alt="Preview hero" className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                    <Upload size={20} className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-600 truncate">
                    {heroFile ? heroFile.name : 'Subir imagen de fondo (JPG, PNG, WEBP)'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Toca para seleccionar archivo</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
              </label>
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] disabled:opacity-50 mt-4"
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
