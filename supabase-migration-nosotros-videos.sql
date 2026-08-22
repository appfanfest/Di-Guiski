-- Migration: Agregar campos de video multilingüe para la sección "Nosotros"
-- Tabla: organizacion
-- Fecha: 2026-06-06

ALTER TABLE organizacion
  ADD COLUMN IF NOT EXISTS video_nosotros_en TEXT,
  ADD COLUMN IF NOT EXISTS video_nosotros_fr TEXT;

COMMENT ON COLUMN organizacion.video_nosotros_en IS 'URL del video de presentación (Nosotros) en inglés';
COMMENT ON COLUMN organizacion.video_nosotros_fr IS 'URL del video de presentación (Nosotros) en francés';
