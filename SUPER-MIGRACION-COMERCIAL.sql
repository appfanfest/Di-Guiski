-- ====================================================================
-- SUPER MIGRACIÓN: QUINIELAS COMERCIALES (UBICACIÓN + IMÁGENES + STORAGE)
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase
-- ====================================================================

-- 1. ESTRUCTURA DE TABLA
ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS ciudad_texto TEXT,
ADD COLUMN IF NOT EXISTS direccion_fisica TEXT,
ADD COLUMN IF NOT EXISTS latitud NUMERIC,
ADD COLUMN IF NOT EXISTS longitud NUMERIC,
ADD COLUMN IF NOT EXISTS imagenes_adicionales JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quinielas_instancias.ciudad_texto IS 'Nombre de la ciudad o localidad';
COMMENT ON COLUMN public.quinielas_instancias.direccion_fisica IS 'Dirección detallada del local';
COMMENT ON COLUMN public.quinielas_instancias.imagenes_adicionales IS 'Lista de URLs de fotos de sponsors o local';

-- 2. CREACIÓN DEL BUCKET DE STORAGE (SI NO EXISTE)
-- Nota: Esto intenta crear el bucket desde SQL. Si falla, créalo manualmente en Storage > New Bucket > "logos" (Público).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE SEGURIDAD PARA IMÁGENES
DO $$ 
BEGIN
    -- Política de lectura pública
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Logos') THEN
        CREATE POLICY "Public Access Logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
    END IF;

    -- Política de subida para autenticados
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload Logos') THEN
        CREATE POLICY "Authenticated Upload Logos" ON storage.objects FOR INSERT WITH CHECK (
            bucket_id = 'logos' AND auth.role() = 'authenticated'
        );
    END IF;
END $$;
