-- ============================================================
-- Migración: ar_config para experiencias AR nativas FanFest
-- ============================================================
-- Añade la columna ar_config (JSONB) a la tabla experiences.
-- Esta columna es OPCIONAL: si es NULL la experiencia muestra
-- solo video + overlay marco PNG (activation_link).
--
-- Estructura del JSON (todos los campos son opcionales):
-- {
--   "hat_url":           string,    -- PNG sombrero (Hora Loca)
--   "glasses_url":       string,    -- PNG lentes (Hora Loca)
--   "sticker_urls":      string[],  -- PNGs stickers (Hora Loca)
--   "particles": {
--     "enabled":         boolean,
--     "image_url":       string,    -- sprite de partícula
--     "count":           number,    -- cantidad por burst
--     "trigger":         "movement" | "always"
--   },
--   "face_paint_url":    string,    -- PNG bandera/animal (Face Glam)
--   "face_paint_opacity": number,   -- 0.0-1.0 (default 0.75)
--   "face_paint_blend":  "normal" | "multiply" | "overlay",
--   "face_paint_zones": {
--     "lips":   { "color": string, "opacity": number },
--     "eyes":   { "color": string, "opacity": number },
--     "cheeks": { "color": string, "opacity": number }
--   },
--   "background_url":    string,    -- fondo inmersivo
--   "blur_edge":         number     -- suavizado borde 0-10 (default 4)
-- }
-- ============================================================

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS ar_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.experiences.ar_config IS
  'Configuración AR nativa FanFest. NULL = solo video + overlay marco PNG.
   Ver supabase-migration-ar-config.sql para la estructura completa.';

-- Índice para búsquedas por tipo de AR (opcional, para analytics)
CREATE INDEX IF NOT EXISTS idx_experiences_ar_config
  ON public.experiences USING GIN (ar_config)
  WHERE ar_config IS NOT NULL;

-- ============================================================
-- Ejemplos de datos de prueba (descomentar para testing)
-- ============================================================

-- Hora Loca Hats — Sombrero + Lentes + Partículas
UPDATE public.experiences
SET ar_config = '{
  "hat_url": "https://i.ibb.co/EJEMPLO/copa-fanfest.png",
  "glasses_url": "https://i.ibb.co/EJEMPLO/lentes-2026.png",
  "particles": {
    "enabled": true,
    "image_url": "https://i.ibb.co/EJEMPLO/confeti-mini.png",
    "count": 20,
    "trigger": "movement"
  }
}'::jsonb
WHERE type = 'Hora Loca Hats'
  AND social_network = 'FanFest'
  AND niche = 'global';

-- Face Glam — Bandera Venezuela
UPDATE public.experiences
SET ar_config = '{
  "face_paint_url": "https://i.ibb.co/EJEMPLO/venezuela-flag.png",
  "face_paint_opacity": 0.75,
  "face_paint_blend": "normal",
  "particles": {
    "enabled": true,
    "image_url": "https://i.ibb.co/EJEMPLO/brillo-dorado.png",
    "count": 12,
    "trigger": "always"
  }
}'::jsonb
WHERE type = 'Face Glam'
  AND social_network = 'FanFest';

-- Fondos Inmersivos — Estadio FIFA 2026
UPDATE public.experiences
SET ar_config = '{
  "background_url": "https://i.ibb.co/EJEMPLO/estadio-fifa2026.jpg",
  "blur_edge": 4,
  "particles": {
    "enabled": true,
    "image_url": "https://i.ibb.co/EJEMPLO/estrella-dorada.png",
    "count": 15,
    "trigger": "always"
  }
}'::jsonb
WHERE type = 'Fondos Inmersivos'
  AND social_network = 'FanFest';
