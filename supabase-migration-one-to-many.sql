-- FANFEST 2026: EVOLUCIÓN A PARADIGMA ONE-TO-MANY
-- Permite que un solo promotor gestione múltiples quinielas/promociones

-- 1. Robustecer la tabla de promociones
ALTER TABLE public.promociones 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS descripcion_premios TEXT,
ADD COLUMN IF NOT EXISTS direccion_fisica TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS estado_auditoria TEXT DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS es_privada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS codigo_acceso TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS terminos_condiciones TEXT,
ADD COLUMN IF NOT EXISTS pais_operativo_id UUID REFERENCES public.pais_sede(id);

-- 2. Comentarios para documentación
COMMENT ON COLUMN public.promociones.categoria IS 'nacional, regional, local, digital';
COMMENT ON COLUMN public.promociones.estado_auditoria IS 'pendiente, aprobada, rechazada';
COMMENT ON COLUMN public.promociones.es_privada IS 'Si es true, requiere codigo_acceso para participar';

-- 3. Crear índices para búsquedas rápidas en el directorio
CREATE INDEX IF NOT EXISTS idx_promociones_comercio ON public.promociones(comercio_id);
CREATE INDEX IF NOT EXISTS idx_promociones_activa_publica ON public.promociones(activa, es_privada, estado_auditoria);

-- 4. Actualizar RLS (Row Level Security) para promociones
-- Permitir que cualquiera vea las promociones públicas aprobadas
DROP POLICY IF EXISTS "Lectura pública de promociones" ON public.promociones;
CREATE POLICY "Lectura pública de promociones" ON public.promociones 
FOR SELECT USING (
    (activa = true AND es_privada = false AND estado_auditoria = 'aprobada') OR 
    (comercio_id = auth.uid()) OR 
    (public.has_role(ARRAY['admin']))
);

-- 5. Función para clonar campos del perfil a la primera promoción (Opcional, para migrar datos existentes)
-- INSERT INTO public.promociones (comercio_id, nombre, tipo, categoria, descripcion_premios, direccion_fisica, telefono, instagram, tiktok, estado_auditoria)
-- SELECT id, nombre_comercial, 'quiniela', categoria_promotor, descripcion_premios, direccion_fisica, telefono, instagram, tiktok, estado_auditoria
-- FROM public.perfiles_usuarios WHERE rol = 'comercio' AND nombre_comercial IS NOT NULL;
