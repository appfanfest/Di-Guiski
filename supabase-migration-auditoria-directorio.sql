-- ACTUALIZACIÓN PARA SISTEMA DE AUDITORÍA Y DIRECTORIO
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columna de estado de auditoría
ALTER TABLE public.perfiles_usuarios 
ADD COLUMN IF NOT EXISTS estado_auditoria TEXT DEFAULT 'pendiente';

-- 2. Añadir columna para categoría de promotor si no existe
ALTER TABLE public.perfiles_usuarios 
ADD COLUMN IF NOT EXISTS categoria_promotor TEXT DEFAULT 'local';

-- 3. Documentación de estados
COMMENT ON COLUMN public.perfiles_usuarios.estado_auditoria IS 'Estados: pendiente, aprobada, rechazada';
COMMENT ON COLUMN public.perfiles_usuarios.categoria_promotor IS 'Categorías: nacional, regional, local, digital';

-- 4. Ejemplo de actualización para un promotor (opcional)
-- UPDATE public.perfiles_usuarios SET estado_auditoria = 'aprobada' WHERE id = 'ID_DEL_PROMOTOR';
