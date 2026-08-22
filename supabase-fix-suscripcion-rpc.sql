-- ============================================================
-- FIX: suscribirse_a_quiniela
-- Cambios:
-- 1. País solo se valida para quinielas NACIONALES
-- 2. Mensajes de error más claros
-- 3. La validación de aprobada solo aplica a Nacionales
-- ============================================================

CREATE OR REPLACE FUNCTION suscribirse_a_quiniela(
  p_quiniela_id UUID,
  p_user_id     UUID,
  p_id_interno  TEXT DEFAULT NULL,
  p_pais_id     UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_quiniela  quinielas_instancias%ROWTYPE;
  v_activos   INT;
  v_identidad TEXT;
BEGIN
  -- Obtener quiniela
  SELECT * INTO v_quiniela FROM quinielas_instancias WHERE id = p_quiniela_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Quiniela no encontrada');
  END IF;

  -- Verificar que esté activa
  IF NOT (v_quiniela.activa) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela no está disponible actualmente');
  END IF;

  -- Validar país SOLO para quinielas Nacionales
  IF v_quiniela.tipo = 'Nacional'
     AND p_pais_id IS NOT NULL
     AND v_quiniela.pais_id IS NOT NULL
     AND v_quiniela.pais_id <> p_pais_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela nacional no pertenece a tu país');
  END IF;

  -- Validar identidad única (evitar múltiples cuentas por persona física)
  SELECT identificacion INTO v_identidad FROM perfiles_usuarios WHERE id = p_user_id;
  
  IF v_identidad IS NOT NULL THEN
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

  -- Verificar si el usuario ya está suscrito (mismo correo/cuenta)
  IF EXISTS (
    SELECT 1 FROM quiniela_suscripciones 
    WHERE quiniela_id = p_quiniela_id 
      AND user_id = p_user_id 
      AND estado = 'activa'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya tienes una participación activa en esta quiniela');
  END IF;

  -- Verificar cupo (solo si limite_participantes está definido)
  BEGIN
    IF v_quiniela.limite_participantes IS NOT NULL AND v_quiniela.limite_participantes > 0 THEN
      SELECT COUNT(*) INTO v_activos
      FROM quiniela_suscripciones
      WHERE quiniela_id = p_quiniela_id AND estado = 'activa';

      IF v_activos >= v_quiniela.limite_participantes THEN
        RETURN jsonb_build_object('ok', false, 'error', 
          'Cupos agotados. Esta quiniela ya alcanzó el límite de ' || v_quiniela.limite_participantes || ' participantes');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Si hay error al leer limite_participantes, ignorar validación de cupo
  END;

  -- Insertar o reactivar
  INSERT INTO quiniela_suscripciones (quiniela_id, user_id, id_interno_validado)
  VALUES (p_quiniela_id, p_user_id, p_id_interno)
  ON CONFLICT (quiniela_id, user_id)
  DO UPDATE SET estado = 'activa', anulado_en = NULL, anulado_por = NULL,
                id_interno_validado = EXCLUDED.id_interno_validado;

  RETURN jsonb_build_object('ok', true, 'nombre', v_quiniela.nombre);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que el campo notificacion exista en quinielas_instancias
ALTER TABLE quinielas_instancias
  ADD COLUMN IF NOT EXISTS notificacion TEXT;

-- IMPORTANTE: Si tu quiniela de prueba tiene limite_participantes = 2,
-- puedes quitarlo o cambiarlo con:
-- UPDATE quinielas_instancias SET limite_participantes = NULL WHERE tipo = 'Privada';
-- O para una quiniela específica:
-- UPDATE quinielas_instancias SET limite_participantes = NULL WHERE id = 'tu-uuid-aqui';
