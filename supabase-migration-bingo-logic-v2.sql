-- Migración: Lógica de Datos Bingo Mundialista v2
-- Objetivo: Soportar estadísticas detalladas y totalización automática

-- 1. Ampliar tabla partidos con campos necesarios para el Bingo
ALTER TABLE partidos
ADD COLUMN IF NOT EXISTS tiros_al_palo INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minutos_goles INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resultado_final TEXT; -- '1', 'X', '2'

-- 2. Función para asegurar que solo haya UN partido de bingo activo a la vez
CREATE OR REPLACE FUNCTION set_active_bingo_match(p_partido_id UUID)
RETURNS void AS $$
BEGIN
    -- Desactivar todos
    UPDATE partidos SET partido_bingo = false;
    -- Activar el seleccionado
    UPDATE partidos SET partido_bingo = true WHERE id = p_partido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para calcular puntos de un ticket de bingo
CREATE OR REPLACE FUNCTION calcular_puntos_bingo(p_ticket_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_partido_id UUID;
    v_selections JSONB;
    v_puntos INTEGER := 0;
    v_goles_totales INTEGER;
    v_corners INTEGER;
    v_amarillas INTEGER;
    v_faltas INTEGER;
    v_al_palo INTEGER;
    v_minutos INTEGER[];
    v_res_final TEXT;
    v_val TEXT;
BEGIN
    -- Obtener datos del ticket y el partido
    SELECT partido_id, selections INTO v_partido_id, v_selections
    FROM bingo_mundial WHERE id = p_ticket_id;

    SELECT (goles1 + goles2), corners, amarillas, faltas_totales, tiros_al_palo, minutos_goles, resultado_final
    INTO v_goles_totales, v_corners, v_amarillas, v_faltas, v_al_palo, v_minutos, v_res_final
    FROM partidos WHERE id = v_partido_id;

    -- Lógica de validación por categoría (Simplificada para ejemplo)
    
    -- Goles
    v_val := v_selections->>'goles';
    IF (v_val = '0-1 Goles' AND v_goles_totales <= 1) OR
       (v_val = '2-3 Goles' AND v_goles_totales BETWEEN 2 AND 3) OR
       (v_val = '4+ Goles' AND v_goles_totales >= 4) THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Corners
    v_val := v_selections->>'corners';
    IF (v_val = '0-5 Corners' AND v_corners <= 5) OR
       (v_val = '6-9 Corners' AND v_corners BETWEEN 6 AND 9) OR
       (v_val = '10+ Corners' AND v_corners >= 10) THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Amarillas
    v_val := v_selections->>'amarillas';
    IF (v_val = '0-2 Amarillas' AND v_amarillas <= 2) OR
       (v_val = '3-5 Amarillas' AND v_amarillas BETWEEN 3 AND 5) OR
       (v_val = '6+ Amarillas' AND v_amarillas >= 6) THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Al Palo
    IF (v_selections->>'al_palo')::INTEGER = v_al_palo THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Faltas
    v_val := v_selections->>'faltas';
    IF (v_val = '8-15 Faltas' AND v_faltas BETWEEN 8 AND 15) OR
       (v_val = '16-22 Faltas' AND v_faltas BETWEEN 16 AND 22) OR
       (v_val = '23+ Faltas' AND v_faltas >= 23) THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Resultado
    v_val := v_selections->>'resultado';
    IF (v_val = 'Gana 1' AND v_res_final = '1') OR
       (v_val = 'Empate' AND v_res_final = 'X') OR
       (v_val = 'Gana 2' AND v_res_final = '2') THEN
        v_puntos := v_puntos + 1;
    END IF;

    -- Rangos de tiempo (Rango A y B)
    -- Rango A: 0-15, 16-30, 31-45+
    -- Rango B: 46-60, 61-75, 76-90+
    v_val := v_selections->>'rango_a';
    IF v_val IS NOT NULL THEN
        -- Parse range (e.g., '0-15 min')
        DECLARE
            v_start INT;
            v_end INT;
            v_min_gol INT;
        BEGIN
            v_start := SPLIT_PART(SPLIT_PART(v_val, ' ', 1), '-', 1)::INT;
            v_end := SPLIT_PART(SPLIT_PART(v_val, ' ', 1), '-', 2)::INT;
            -- Check if any goal minute falls in this range
            FOR v_min_gol IN SELECT UNNEST(v_minutos_goles) LOOP
                IF v_min_gol BETWEEN v_start AND v_end THEN
                    v_puntos := v_puntos + 1;
                    EXIT; -- Only count once per category
                END IF;
            END LOOP;
        END;
    END IF;

    v_val := v_selections->>'rango_b';
    IF v_val IS NOT NULL THEN
        DECLARE
            v_start INT;
            v_end INT;
            v_min_gol INT;
        BEGIN
            v_start := SPLIT_PART(SPLIT_PART(v_val, ' ', 1), '-', 1)::INT;
            v_end := SPLIT_PART(SPLIT_PART(v_val, ' ', 1), '-', 2)::INT;
            FOR v_min_gol IN SELECT UNNEST(v_minutos_goles) LOOP
                IF v_min_gol BETWEEN v_start AND v_end THEN
                    v_puntos := v_puntos + 1;
                    EXIT;
                END IF;
            END LOOP;
        END;
    END IF;

    -- Actualizar el ticket
    UPDATE bingo_mundial SET score = v_puntos, estado_verificacion = 'validado' 
    WHERE id = p_ticket_id;

    RETURN v_puntos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
