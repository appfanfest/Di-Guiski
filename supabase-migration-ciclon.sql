-- FANFEST 2026: SEGURIDAD Y LIMPIEZA DEL CICLÓN
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columna archivado a participaciones
ALTER TABLE public.participaciones 
ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;

-- 2. Función para limpiar el ciclón de un comercio específico
CREATE OR REPLACE FUNCTION public.limpiar_ciclon_comercio(p_comercio_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.participaciones 
  SET archivado = true 
  WHERE comercio_id = p_comercio_id 
    AND tipo = 'promocion' 
    AND estado = 'validado'
    AND archivado = false;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'comercio_id', p_comercio_id,
    'tickets_archivados', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.limpiar_ciclon_comercio TO authenticated;
