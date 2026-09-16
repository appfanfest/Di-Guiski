-- =============================================================
-- MIGRACION: Control de visibilidad is_active en experiences
-- Fecha: 2026-09-16
-- =============================================================

-- PASO 1: Agregar la columna con DEFAULT true
-- Esto asigna TRUE a TODOS los registros existentes automaticamente
-- (las experiencias actuales siguen siendo visibles sin cambio alguno).
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- PASO 2: Cambiar el DEFAULT a false para registros FUTUROS
-- Los nuevos registros insertados sin especificar is_active
-- comenzaran en modo borrador (ocultos) hasta que el admin los active.
ALTER TABLE public.experiences
  ALTER COLUMN is_active SET DEFAULT false;

-- PASO 3: Indice de rendimiento para la columna
CREATE INDEX IF NOT EXISTS idx_experiences_is_active
  ON public.experiences (is_active);

-- PASO 4: Comentario descriptivo en la columna
COMMENT ON COLUMN public.experiences.is_active IS
  'TRUE = visible para usuarios (activo). FALSE = oculto/borrador. Registros existentes quedan TRUE. Nuevos registros inician en FALSE hasta que el admin los active manualmente.';
