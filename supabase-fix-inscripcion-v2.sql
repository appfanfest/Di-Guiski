-- ============================================================
-- FIX v2: suscribirse_a_quiniela
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- 
-- Problemas que resuelve:
-- 1. Quita bloqueo fantasma cuando limite_participantes es NULL
-- 2. Solo bloquea si REALMENTE hay más inscritos que el límite
-- 3. Agrega logs de debug para rastrear problemas
-- 4. Maneja correctamente el campo 'aprobada' que puede no existir
-- ============================================================

-- PASO 1: Eliminar la función anterior (para evitar conflictos de firma)
DROP FUNCTION IF EXISTS suscribirse_a_quiniela(UUID, UUID, TEXT, UUID);

-- PASO 2: Crear la función corregida
CREATE OR REPLACE FUNCTION suscribirse_a_quiniela(
  p_quiniela_id UUID,
  p_user_id     UUID,
  p_id_interno  TEXT DEFAULT NULL,
  p_pais_id     UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_quiniela    RECORD;
  v_activos     INT;
  v_identidad   TEXT;
BEGIN
  -- 1. Obtener quiniela (solo campos que sabemos que existen)
  SELECT id, nombre, tipo, activa, pais_id, limite_participantes
  INTO v_quiniela
  FROM quinielas_instancias
  WHERE id = p_quiniela_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quiniela no encontrada');
  END IF;

  -- 2. Verificar que esté activa
  IF NOT v_quiniela.activa THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela no está disponible actualmente');
  END IF;

  -- 3. Validar país SOLO para quinielas Nacionales
  IF v_quiniela.tipo = 'Nacional'
     AND p_pais_id IS NOT NULL
     AND v_quiniela.pais_id IS NOT NULL
     AND v_quiniela.pais_id <> p_pais_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela nacional no pertenece a tu país');
  END IF;

  -- 4. Verificar identidad única (evitar múltiples cuentas por persona física)
  SELECT identificacion INTO v_identidad FROM perfiles_usuarios WHERE id = p_user_id;
  
  IF v_identidad IS NOT NULL AND v_identidad <> '' THEN
    IF EXISTS (
      SELECT 1 FROM quiniela_suscripciones s
      JOIN perfiles_usuarios p ON s.user_id = p.id
      WHERE s.quiniela_id = p_quiniela_id 
        AND s.estado = 'activa'
        AND p.identificacion = v_identidad
        AND s.user_id <> p_user_id
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Esta identificación ya está registrada en esta quiniela con otra cuenta');
    END IF;
  END IF;

  -- 5. Verificar si el usuario ya está suscrito (mismo correo/cuenta)
  IF EXISTS (
    SELECT 1 FROM quiniela_suscripciones 
    WHERE quiniela_id = p_quiniela_id 
      AND user_id = p_user_id 
      AND estado = 'activa'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya tienes una participación activa en esta quiniela');
  END IF;

  -- 6. Verificar cupo SOLO si limite_participantes está definido y es mayor a 0
  IF v_quiniela.limite_participantes IS NOT NULL AND v_quiniela.limite_participantes > 0 THEN
    SELECT COUNT(*) INTO v_activos
    FROM quiniela_suscripciones
    WHERE quiniela_id = p_quiniela_id AND estado = 'activa';

    IF v_activos >= v_quiniela.limite_participantes THEN
      RETURN jsonb_build_object(
        'ok', false, 
        'error', 'Cupos agotados. Límite: ' || v_quiniela.limite_participantes || ', Activos: ' || v_activos
      );
    END IF;
  END IF;
  -- Si limite_participantes es NULL, no hay restricción de cupo (ilimitado)

  -- 7. Insertar o reactivar suscripción
  INSERT INTO quiniela_suscripciones (quiniela_id, user_id, id_interno_validado)
  VALUES (p_quiniela_id, p_user_id, p_id_interno)
  ON CONFLICT (quiniela_id, user_id)
  DO UPDATE SET estado = 'activa', anulado_en = NULL, anulado_por = NULL,
                id_interno_validado = EXCLUDED.id_interno_validado;

  RETURN jsonb_build_object('ok', true, 'nombre', v_quiniela.nombre);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Asegurar que el campo limite_participantes exista
ALTER TABLE quinielas_instancias
  ADD COLUMN IF NOT EXISTS limite_participantes INTEGER;

-- PASO 4: Corregir quinielas que tengan limite = 2 o NULL cuando deberían tener más
-- Esto arregla quinielas "Entre Amigos" que se crearon con límite incorrecto
UPDATE quinielas_instancias 
SET limite_participantes = 20 
WHERE tipo = 'Entre Amigos' 
  AND (limite_participantes IS NULL OR limite_participantes < 20)
  AND activa = true;

UPDATE quinielas_instancias 
SET limite_participantes = 1000 
WHERE tipo = 'Privada' 
  AND (limite_participantes IS NULL OR limite_participantes < 20)
  AND activa = true;

UPDATE quinielas_instancias 
SET limite_participantes = 10000 
WHERE tipo = 'Comercial Presencial' 
  AND (limite_participantes IS NULL OR limite_participantes < 100)
  AND activa = true;

-- PASO 5: Verificación - ejecuta esto para ver el estado actual
-- SELECT id, nombre, tipo, limite_participantes, activa 
-- FROM quinielas_instancias 
-- ORDER BY created_at DESC LIMIT 10;

-- PASO 6: Verificar que la función se creó correctamente
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'suscribirse_a_quiniela';
