-- ============================================================
-- MIGRACIÓN: Solicitudes de Metaversos Privados
-- Ejecutar completo de una sola vez en el SQL Editor de Supabase
-- ============================================================

-- 1. Crear tabla solicitudes_metaversos
CREATE TABLE IF NOT EXISTS public.solicitudes_metaversos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nombre_negocio TEXT NOT NULL,
    tipo_metaverso TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    telefono_contacto TEXT NOT NULL,
    direccion TEXT NOT NULL,
    pais TEXT NOT NULL,
    estado_provincia TEXT,
    pagina_web TEXT,
    red_social_1 TEXT NOT NULL,
    red_social_2 TEXT NOT NULL,
    red_social_3 TEXT,
    color_primario TEXT,
    color_secundario TEXT,
    color_base TEXT,
    logo_url TEXT,
    hero_url TEXT,
    fuentes_tipograficas TEXT,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bucket para assets (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clientes_assets',
    'clientes_assets',
    true,
    10485760,
    '{image/jpeg,image/png,image/webp,image/svg+xml}'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage (limpiar primero para evitar conflictos)
DROP POLICY IF EXISTS "Public Access Clientes Assets" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Clientes Assets" ON storage.objects;
DROP POLICY IF EXISTS "User Update Clientes Assets" ON storage.objects;

CREATE POLICY "Public Access Clientes Assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'clientes_assets');

CREATE POLICY "Anon Upload Clientes Assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'clientes_assets');

CREATE POLICY "User Update Clientes Assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'clientes_assets');

-- 4. RLS en la tabla solicitudes_metaversos
ALTER TABLE public.solicitudes_metaversos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Insert Solicitudes Anon" ON public.solicitudes_metaversos;
DROP POLICY IF EXISTS "Allow Select Solicitudes Admin" ON public.solicitudes_metaversos;
DROP POLICY IF EXISTS "Allow Update Solicitudes Admin" ON public.solicitudes_metaversos;

CREATE POLICY "Allow Insert Solicitudes Anon"
    ON public.solicitudes_metaversos
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow Select Solicitudes Admin"
    ON public.solicitudes_metaversos
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM perfiles_usuarios WHERE rol = 'admin')
    );

CREATE POLICY "Allow Update Solicitudes Admin"
    ON public.solicitudes_metaversos
    FOR UPDATE
    USING (
        auth.uid() IN (SELECT id FROM perfiles_usuarios WHERE rol = 'admin')
    );

-- 5. Columna hero_cta_privados en organizacion (si no existe)
ALTER TABLE public.organizacion
    ADD COLUMN IF NOT EXISTS hero_cta_privados TEXT;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
