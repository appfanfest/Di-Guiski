-- Migración para la gestión de Metaversos y su relación con Nichos

-- 1. Tabla de Metaversos (Crear si no existe)
CREATE TABLE IF NOT EXISTS public.metaversos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    icono TEXT,
    is_active BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Si la tabla ya existe, añadimos las columnas nuevas por si faltan
ALTER TABLE public.metaversos 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS base_color TEXT DEFAULT '#000000';

-- Habilitar RLS para metaversos
ALTER TABLE public.metaversos ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
DROP POLICY IF EXISTS "Permitir lectura pública de metaversos" ON public.metaversos;
CREATE POLICY "Permitir lectura pública de metaversos" ON public.metaversos FOR SELECT USING (true);

-- Insertar o actualizar los metaversos base
INSERT INTO public.metaversos (nombre, orden, primary_color, secondary_color, title, slogan) VALUES
('Festividades', 1, '#FF2D31', '#10b981', 'FESTIVIDADES', 'Celebra con nosotros'),
('Mundo Viajes', 2, '#3b82f6', '#FF2D31', 'MUNDO VIAJES', 'Descubre el mundo'),
('Deportes', 3, '#eab308', '#3b82f6', 'DEPORTES', 'Vive la pasión'),
('Mundo Música', 4, '#8b5cf6', '#eab308', 'MUNDO MÚSICA', 'Siente el ritmo')
ON CONFLICT (nombre) DO UPDATE SET 
    title = EXCLUDED.title,
    slogan = EXCLUDED.slogan,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    orden = EXCLUDED.orden;

-- 2. Actualizar la tabla niches para conectarla con metaversos
ALTER TABLE public.niches 
ADD COLUMN IF NOT EXISTS metaverso_id UUID REFERENCES public.metaversos(id);

-- Crear un índice para optimizar las consultas por metaverso
CREATE INDEX IF NOT EXISTS idx_niches_metaverso ON public.niches(metaverso_id);

-- Asignar los nichos existentes al metaverso "Festividades" por defecto (para no romper la app existente)
DO $$
DECLARE
    festividades_id UUID;
BEGIN
    SELECT id INTO festividades_id FROM public.metaversos WHERE nombre = 'Festividades' LIMIT 1;
    
    IF festividades_id IS NOT NULL THEN
        UPDATE public.niches SET metaverso_id = festividades_id WHERE metaverso_id IS NULL;
    END IF;
END $$;
