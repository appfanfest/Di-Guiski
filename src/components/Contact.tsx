import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Instagram, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface ContactProps {
  org?: any;
}

export const Contact: React.FC<ContactProps> = ({ org }) => {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulación de envío
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-2">{t.contact_page?.title || 'Contáctanos'}</h2>
        <p className="text-sm text-slate-500 mb-6">{t.contact_page?.subtitle || 'Estamos aquí para ayudarte. Déjanos tu mensaje y te responderemos a la brevedad.'}</p>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t.contact_page?.success?.title || '¡Mensaje Enviado!'}</h3>
              <p className="text-sm text-slate-500">{t.contact_page?.success?.message || 'Nos pondremos en contacto contigo muy pronto.'}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.contact_page?.form?.name || 'Nombre'}</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all"
                  placeholder={t.contact_page?.form?.name_placeholder || 'Tu nombre completo'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.contact_page?.form?.email || 'Correo'}</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all"
                  placeholder={t.contact_page?.form?.email_placeholder || 'Tu correo electrónico'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.contact_page?.form?.message || 'Mensaje'}</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 transition-all resize-none"
                  placeholder={t.contact_page?.form?.message_placeholder || '¿En qué podemos ayudarte?'}
                />
              </div>
              <button 
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-fifa-blue text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-fifa-blue/90 transition-all disabled:opacity-70"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Send size={18} />
                    {t.contact_page?.form?.send || 'Enviar Mensaje'}
                  </>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a 
          href={org?.instagram || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
            <Instagram size={20} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t.contact_page?.social?.instagram || 'Instagram'}</span>
        </a>
        <a 
          href={`https://wa.me/${(org?.whatsapp?.toString() || '').replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 text-center"
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <Phone size={20} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t.contact_page?.social?.whatsapp || 'WhatsApp'}</span>
        </a>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800 text-white p-6 rounded-3xl flex items-start gap-4">
          <MapPin className="text-fifa-gold shrink-0" size={24} />
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest mb-1">{t.contact_page?.offices?.main || 'Oficina Principal'}</h3>
            <p className="text-sm opacity-70">{org?.direccion_central || t.contact_page?.offices?.not_available || 'Información no disponible'}</p>
          </div>
        </div>

        {org?.direccion_miami && (
          <div className="bg-white text-slate-800 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
            <MapPin className="text-blue-500 shrink-0" size={24} />
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest mb-1 text-slate-400">{t.contact_page?.offices?.miami || 'Sede Miami'}</h3>
              <p className="text-sm opacity-70">{org.direccion_miami}</p>
            </div>
          </div>
        )}

        {org?.direccion_cinci && (
          <div className="bg-white text-slate-800 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
            <MapPin className="text-orange-500 shrink-0" size={24} />
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest mb-1 text-slate-400">{t.contact_page?.offices?.cincinnati || 'Sede Cincinnati'}</h3>
              <p className="text-sm opacity-70">{org.direccion_cinci}</p>
            </div>
          </div>
        )}

        {org?.direccion_texas && (
          <div className="bg-white text-slate-800 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
            <MapPin className="text-red-500 shrink-0" size={24} />
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest mb-1 text-slate-400">{t.contact_page?.offices?.texas || 'Sede Texas'}</h3>
              <p className="text-sm opacity-70">{org.direccion_texas}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
