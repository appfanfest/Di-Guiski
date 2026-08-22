-- Migration: Add additional images field to quinielas_instancias
-- This allows merchants to showcase sponsors/providers.

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS imagenes_adicionales JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quinielas_instancias.imagenes_adicionales IS 'Lista de URLs de imágenes adicionales (sponsors, fotos del local, etc)';
