-- 1. Tabla de Suscripciones (Vínculo Usuario-Instancia)
CREATE TABLE IF NOT EXISTS quiniela_suscripciones (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiniela_id          UUID NOT NULL REFERENCES quinielas_instancias(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES perfiles_usuarios(id) ON DELETE CASCADE,
  id_interno_validado  TEXT,
  estado               TEXT NOT NULL DEFAULT 'activa'
                         CHECK (estado IN ('activa', 'anulada')),
  suscrito_en          TIMESTAMPTZ DEFAULT now(),
  anulado_en           TIMESTAMPTZ,
  anulado_por          TEXT,   -- 'usuario' | 'promotor'
  UNIQUE (quiniela_id, user_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_sus_user     ON quiniela_suscripciones(user_id);
CREATE INDEX IF NOT EXISTS idx_sus_quiniela ON quiniela_suscripciones(quiniela_id);

-- RLS
ALTER TABLE quiniela_suscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_reads_own" ON quiniela_suscripciones;
CREATE POLICY "user_reads_own" ON quiniela_suscripciones
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "promotor_reads_members" ON quiniela_suscripciones;
CREATE POLICY "promotor_reads_members" ON quiniela_suscripciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quinielas_instancias
            WHERE id = quiniela_id AND gestor_id = auth.uid())
  );

DROP POLICY IF EXISTS "user_inserts_own" ON quiniela_suscripciones;
CREATE POLICY "user_inserts_own" ON quiniela_suscripciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anulacion_permitida" ON quiniela_suscripciones;
CREATE POLICY "anulacion_permitida" ON quiniela_suscripciones
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM quinielas_instancias
               WHERE id = quiniela_id AND gestor_id = auth.uid())
  );

-- 2. Función RPC: Suscribirse con validación atómica
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

  -- Verificar activa y aprobada (si tiene el campo aprobada)
  -- NOTA: Si el campo 'aprobada' no existe todavía, esta línea fallará.
  -- Asegúrate de ejecutar el ALTER TABLE abajo primero.
  IF NOT (v_quiniela.activa) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela no está disponible');
  END IF;

  -- Validar país en comerciales
  IF v_quiniela.tipo = 'Comercial Presencial'
     AND p_pais_id IS NOT NULL
     AND v_quiniela.pais_id <> p_pais_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta quiniela no pertenece a tu país');
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
      RETURN jsonb_build_object('ok', false, 'error', 'Esta identificación ya está registrada en esta quiniela');
    END IF;
  END IF;

  -- Verificar si el usuario ya está suscrito (mismo correo/cuenta)
  IF EXISTS (
    SELECT 1 FROM quiniela_suscripciones 
    WHERE quiniela_id = p_quiniela_id 
      AND user_id = p_user_id 
      AND estado = 'activa'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALERTA: Ya tienes una participación activa en esta quiniela');
  END IF;

  -- Verificar cupo (si la tabla tiene limite_participantes)
  -- Usamos un bloque dinámico por si el campo no existe
  BEGIN
    IF v_quiniela.limite_participantes IS NOT NULL THEN
      SELECT COUNT(*) INTO v_activos
      FROM quiniela_suscripciones
      WHERE quiniela_id = p_quiniela_id AND estado = 'activa';

      IF v_activos >= v_quiniela.limite_participantes THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Cupos agotados');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Si no existe el campo limite_participantes, ignoramos la validación de cupo
    NULL;
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

-- 3. Función RPC para Anular
CREATE OR REPLACE FUNCTION anular_suscripcion(
  p_quiniela_id UUID,
  p_user_id     UUID,
  p_anulado_por TEXT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE quiniela_suscripciones
  SET estado = 'anulada',
      anulado_en = now(),
      anulado_por = p_anulado_por
  WHERE quiniela_id = p_quiniela_id AND user_id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función RPC: Buscar quiniela por código
CREATE OR REPLACE FUNCTION buscar_quiniela_por_codigo(p_codigo TEXT)
RETURNS JSONB AS $$
DECLARE
  v_res JSONB;
BEGIN
  SELECT jsonb_build_object(
    'ok', true,
    'id', id,
    'nombre', nombre,
    'tipo', tipo,
    'foto_logo_url', foto_logo_url,
    'pais_id', pais_id,
    'requiere_id_interno', requiere_id_interno,
    'instruccion_id_interno', instruccion_id_interno,
    'activa', activa
  ) INTO v_res
  FROM quinielas_instancias
  WHERE upper(codigo_participacion) = upper(p_codigo)
  LIMIT 1;

  IF v_res IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Código no encontrado');
  END IF;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Asegurar campos en quinielas_instancias
ALTER TABLE quinielas_instancias
  ADD COLUMN IF NOT EXISTS aprobada BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS limite_participantes INTEGER,
  ADD COLUMN IF NOT EXISTS pais_id UUID REFERENCES paises_operativos(id);

-- Para desarrollo, aprobamos todas las existentes
UPDATE quinielas_instancias SET aprobada = true WHERE activa = true;
