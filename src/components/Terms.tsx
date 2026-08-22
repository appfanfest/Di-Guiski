import { Shield, Scale, Eye, Info, Zap } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-4">Términos y Condiciones</h2>
        
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={18} className="text-fifa-blue" />
              <h3 className="font-bold text-slate-700">1. Uso de la Plataforma</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              FanFest Quiniela 2026 es una herramienta de promoción comercial. El uso de la plataforma implica la aceptación de estas normas. Queda prohibido cualquier intento de manipulación técnica o fraude en las predicciones.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-fifa-blue" />
              <h3 className="font-bold text-slate-700">2. Transparencia y Sorteos Aleatorios</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Los sorteos aleatorios se ejecutan mediante un algoritmo criptográfico demostrable (<span className="font-mono">window.crypto.getRandomValues</span>) que garantiza igualdad de condiciones para todos los participantes con tickets válidos. El usuario acepta este mecanismo como justo y definitivo, liberando a FanFest y a los promotores de cualquier reclamo por "mala suerte" o percepciones subjetivas de aleatoriedad.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Eye size={18} className="text-fifa-blue" />
              <h3 className="font-bold text-slate-700">3. Privacidad de Datos</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tus datos personales se utilizan exclusivamente para la gestión de la quiniela, validación de identidad en la entrega de premios y comunicaciones oficiales de FanFest. No compartimos información con terceros sin tu consentimiento.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-fifa-blue" />
              <h3 className="font-bold text-slate-700">4. Responsabilidad</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              FanFest actúa como plataforma tecnológica. La responsabilidad de la entrega de premios recae sobre el promotor de la quiniela debidamente identificado en la sección de perfil del mismo.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-700">5. Referencias Culturales y Comparativas</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              La plataforma utiliza el "Cromos del Mundial Index" como una referencia puramente cultural, anecdótica y pedagógica para facilitar al usuario la comprensión del valor de sus servicios durante el periodo del Mundial. Esta comparación se basa en costos estimados de mercado local de sobres de cromos y en ningún momento pretende establecer una asociación oficial, comercial o de patrocinio con los titulares de marcas de terceros mencionadas. FanFest respeta la propiedad intelectual y utiliza estas analogías únicamente con fines ilustrativos del contexto festivo del deporte.
            </p>
          </section>
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-[10px] text-amber-700 font-medium leading-tight">
          Al utilizar esta aplicación, confirmas que eres mayor de edad y que participas de forma voluntaria en las dinámicas promocionales presentadas.
        </p>
      </div>
    </div>
  );
};
