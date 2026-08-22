-- ============================================================
-- FANFEST 2026 — SCORING ENGINE MIGRATION v1.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. PARTIDOS: Resultado real y bloqueo de predicciones
ALTER TABLE public.partidos
  ADD COLUMN IF NOT EXISTS resultado_final TEXT,
  ADD COLUMN IF NOT EXISTS prediccion_bloqueada BOOLEAN DEFAULT false;
-- resultado_final: '1' (local), 'E' (empate), '2' (visitante), NULL = no jugado
-- prediccion_bloqueada: TRUE = Admin cerró ventana de edición para esta ronda

-- 2. QUINIELAS: Campos del motor de scoring
ALTER TABLE public.quinielas
  ADD COLUMN IF NOT EXISTS total_puntos       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_valoracion   DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_valoracion     DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partido_max_id     UUID REFERENCES public.partidos(id),
  ADD COLUMN IF NOT EXISTS ultima_evaluacion  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS partidos_invalidados INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partidos_evaluados JSONB DEFAULT '[]'::jsonb;
-- partidos_evaluados: array de UUIDs ya procesados → garantiza idempotencia

-- 3. FUNCIÓN: Motor de scoring activado por partido
CREATE OR REPLACE FUNCTION public.calcular_scoring_partido(p_partido_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_partido           RECORD;
  v_quiniela          RECORD;
  v_prediccion        TEXT;
  v_factor            DECIMAL(5,2);
  v_fecha_inicio      DATE;
  v_ya_evaluado       BOOLEAN;
  v_total_evaluadas   INTEGER := 0;
  v_total_acertadas   INTEGER := 0;
  v_total_invalidas   INTEGER := 0;
BEGIN
  -- Obtener el partido
  SELECT * INTO v_partido FROM public.partidos WHERE id = p_partido_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Partido no encontrado');
  END IF;
  IF v_partido.resultado_final IS NULL THEN
    RETURN jsonb_build_object('error', 'El partido no tiene resultado_final registrado');
  END IF;

  -- Fecha de inicio del torneo
  SELECT MIN(fecha) INTO v_fecha_inicio FROM public.partidos;

  -- Iterar sobre quinielas que tienen predicción para este partido
  FOR v_quiniela IN
    SELECT * FROM public.quinielas
    WHERE (predicciones ->> p_partido_id::TEXT) IS NOT NULL
  LOOP
    v_total_evaluadas := v_total_evaluadas + 1;

    -- Idempotencia: ¿ya fue evaluado este partido para esta quiniela?
    v_ya_evaluado := (v_quiniela.partidos_evaluados @> jsonb_build_array(p_partido_id::TEXT));
    IF v_ya_evaluado THEN
      CONTINUE;
    END IF;

    -- Regla de los 3 días de gracia:
    -- Si la quiniela se creó después del inicio del torneo
    -- y el partido se jugó el mismo día o antes de la creación → invalidado
    IF v_quiniela.created_at::DATE > v_fecha_inicio AND
       v_partido.fecha <= v_quiniela.created_at::DATE THEN
      UPDATE public.quinielas SET
        partidos_invalidados = COALESCE(partidos_invalidados, 0) + 1,
        partidos_evaluados   = COALESCE(partidos_evaluados, '[]'::jsonb)
                               || jsonb_build_array(p_partido_id::TEXT),
        ultima_evaluacion    = NOW()
      WHERE id = v_quiniela.id;
      v_total_invalidas := v_total_invalidas + 1;
      CONTINUE;
    END IF;

    -- Obtener predicción
    v_prediccion := v_quiniela.predicciones ->> p_partido_id::TEXT;

    -- Comparar con resultado real
    IF v_prediccion = v_partido.resultado_final THEN
      -- Factor según resultado
      v_factor := CASE v_prediccion
        WHEN '1' THEN COALESCE(v_partido.factor1, 1.0)
        WHEN 'E' THEN COALESCE(v_partido.factor2, 1.0)
        ELSE          COALESCE(v_partido.factor3, 1.0)
      END;

      UPDATE public.quinielas SET
        total_puntos     = COALESCE(total_puntos, 0) + 1,
        total_valoracion = COALESCE(total_valoracion, 0) + v_factor,
        -- Si el nuevo factor >= max actual, reemplazar (el más reciente gana en desempate)
        max_valoracion   = CASE WHEN v_factor >= COALESCE(max_valoracion, 0)
                                THEN v_factor ELSE max_valoracion END,
        partido_max_id   = CASE WHEN v_factor >= COALESCE(max_valoracion, 0)
                                THEN p_partido_id ELSE partido_max_id END,
        partidos_evaluados = COALESCE(partidos_evaluados, '[]'::jsonb)
                             || jsonb_build_array(p_partido_id::TEXT),
        ultima_evaluacion  = NOW()
      WHERE id = v_quiniela.id;

      v_total_acertadas := v_total_acertadas + 1;
    ELSE
      -- No acertó: marcar como evaluado igualmente (sin puntos)
      UPDATE public.quinielas SET
        partidos_evaluados = COALESCE(partidos_evaluados, '[]'::jsonb)
                             || jsonb_build_array(p_partido_id::TEXT),
        ultima_evaluacion  = NOW()
      WHERE id = v_quiniela.id;
    END IF;

  END LOOP;

  RETURN jsonb_build_object(
    'success',           true,
    'partido_id',        p_partido_id,
    'resultado',         v_partido.resultado_final,
    'quinielas_evaluadas', v_total_evaluadas,
    'aciertos',          v_total_acertadas,
    'invalidados',       v_total_invalidas
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calcular_scoring_partido TO authenticated;

-- 4. FUNCIÓN: Ranking de una quiniela filtrado por ubicación
CREATE OR REPLACE FUNCTION public.ranking_quiniela(
  p_quiniela_id    UUID,     -- Quiniela específica del fan (opcional)
  p_pais_id        UUID DEFAULT NULL,
  p_estado_id      UUID DEFAULT NULL,
  p_comercio_id    UUID DEFAULT NULL
)
RETURNS TABLE (
  posicion          BIGINT,
  quiniela_id       UUID,
  usuario_id        UUID,
  fan_nombre        TEXT,
  fan_foto          TEXT,
  quiniela_nombre   TEXT,
  total_puntos      INTEGER,
  total_valoracion  DECIMAL,
  max_valoracion    DECIMAL,
  partido_max_nro   INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    RANK() OVER (
      ORDER BY q.total_puntos DESC,
               q.total_valoracion DESC,
               q.max_valoracion DESC,
               COALESCE(pm.partido_nro, 0) DESC
    )                             AS posicion,
    q.id                          AS quiniela_id,
    q.usuario_id,
    pu.nombre                     AS fan_nombre,
    pu.foto_logo                  AS fan_foto,
    q.nombre                      AS quiniela_nombre,
    q.total_puntos,
    q.total_valoracion,
    q.max_valoracion,
    pm.partido_nro                AS partido_max_nro
  FROM public.quinielas q
  JOIN public.perfiles_usuarios pu ON pu.id = q.usuario_id
  JOIN public.participaciones p    ON p.quiniela_id = q.id AND p.estado = 'validado'
  LEFT JOIN public.partidos pm     ON pm.id = q.partido_max_id
  WHERE
    (p_pais_id    IS NULL OR pu.pais_operativo_id   = p_pais_id)
    AND (p_estado_id   IS NULL OR pu.estado_operativo_id = p_estado_id)
    AND (p_comercio_id IS NULL OR p.comercio_id          = p_comercio_id)
  GROUP BY q.id, pu.nombre, pu.foto_logo, pm.partido_nro
  ORDER BY posicion ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ranking_quiniela TO authenticated;

-- 5. ÍNDICES para performance del ranking
CREATE INDEX IF NOT EXISTS idx_quinielas_scoring
  ON public.quinielas (total_puntos DESC, total_valoracion DESC, max_valoracion DESC);

CREATE INDEX IF NOT EXISTS idx_participaciones_quiniela
  ON public.participaciones (quiniela_id) WHERE quiniela_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_participaciones_comercio_tipo
  ON public.participaciones (comercio_id, tipo, estado);
