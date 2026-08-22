-- Migration: Update quinielas_instancias for detailed private quinielas
-- Add missing columns for branding and social media

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS foto_logo_url TEXT,
ADD COLUMN IF NOT EXISTS premios TEXT,
ADD COLUMN IF NOT EXISTS requisitos TEXT,
ADD COLUMN IF NOT EXISTS edad_minima INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT;

-- Update RLS if necessary (it should already be handled by the previous migration)
-- But let's ensure public read is allowed for detailed views
DROP POLICY IF EXISTS "Lectura pública de detalles de quinielas" ON public.quinielas_instancias;
CREATE POLICY "Lectura pública de detalles de quinielas" ON public.quinielas_instancias 
FOR SELECT USING (true);

COMMENT ON COLUMN public.quinielas_instancias.foto_logo_url IS 'URL de la imagen o logo de la quiniela';
COMMENT ON COLUMN public.quinielas_instancias.premios IS 'Descripción de los premios disponibles';
COMMENT ON COLUMN public.quinielas_instancias.requisitos IS 'Requisitos de participación (ej. ser socio, comprar producto)';
COMMENT ON COLUMN public.quinielas_instancias.edad_minima IS 'Edad mínima requerida para participar';
