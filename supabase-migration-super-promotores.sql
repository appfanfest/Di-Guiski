-- FANFEST 2026: SOPORTE PARA SUPER PROMOTORES (PATROCINADORES NACIONALES)
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir campos necesarios a perfiles_usuarios
ALTER TABLE public.perfiles_usuarios 
ADD COLUMN IF NOT EXISTS es_super_promotor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terminos_condiciones TEXT;

-- 2. Asegurar que el tipo 'optin_digital' sea válido en la aplicación
-- (La tabla participaciones usa un campo de texto para 'tipo', así que no requiere cambio de schema de ENUM si es texto libre)

-- 3. Función para registrarse en una Super Promoción
CREATE OR REPLACE FUNCTION public.registrar_optin_digital(
  p_usuario_id UUID,
  p_comercio_id UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_pais_usuario UUID;
  v_pais_comercio UUID;
BEGIN
  -- 1. Verificar que no se haya registrado ya
  SELECT EXISTS(
    SELECT 1 FROM public.participaciones 
    WHERE usuario_id = p_usuario_id AND comercio_id = p_comercio_id AND tipo = 'optin_digital'
  ) INTO v_exists;
  
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ya estás registrado en esta promoción.');
  END IF;

  -- 3. Verificar coincidencia de país
  SELECT pais_operativo_id INTO v_pais_usuario FROM public.perfiles_usuarios WHERE id = p_usuario_id;
  SELECT pais_operativo_id INTO v_pais_comercio FROM public.perfiles_usuarios WHERE id = p_comercio_id;
  
  IF v_pais_usuario != v_pais_comercio THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta promoción nacional no está disponible para tu país.');
  END IF;

  -- 4. Insertar participación
  INSERT INTO public.participaciones (
    usuario_id, 
    comercio_id, 
    tipo, 
    estado, 
    metadata
  ) VALUES (
    p_usuario_id, 
    p_comercio_id, 
    'optin_digital', 
    'validado', 
    p_metadata
  );
  
  RETURN jsonb_build_object('success', true, 'message', '¡Registro exitoso! Ya estás participando.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.registrar_optin_digital TO authenticated;
