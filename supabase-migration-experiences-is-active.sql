-- =============================================================
-- MIGRACION: Control de visibilidad por is_active en experiences
-- Fecha: 2026-09-16
-- Descripcion: Agrega el campo is_active (boolean) a la tabla
--   experiences para que el administrador pueda activar o
--   desactivar experiencias e impresiones de forma individual,
--   sin borrar registros.
--   Por defecto todos los registros quedan en FALSE (inactivo)
--   para garantizar carga masiva segura.
-- =============================================================

-- 1. Agregar columna is_active con valor por defecto FALSE
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- 2. Indice para que las consultas de usuarios (WHERE is_active = true)
--    sean instantaneas incluso con miles de registros.
CREATE INDEX IF NOT EXISTS idx_experiences_is_active
  ON public.experiences (is_active);

-- 3. Comentario descriptivo en la columna para documentar el esquema
COMMENT ON COLUMN public.experiences.is_active IS
  'Controla la visibilidad publica de la experiencia. TRUE = visible para usuarios. FALSE = oculta (modo borrador/inactivo). Solo administradores pueden cambiar este valor.';

-- =============================================================
-- INSTRUCCIONES POSTERIORES:
--   - Activa de forma individual cada registro cambiando
--     is_active = TRUE desde el panel de administracion.
--   - Los registros con is_active = FALSE siguen existiendo
--     en la BD y pueden editarse antes de ser publicados.
-- =============================================================
