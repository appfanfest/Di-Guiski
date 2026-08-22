-- =============================================================
-- TRIGGER: Generación automática de códigos de regalo (GOLD)
-- =============================================================
-- Cuando un administrador actualiza el campo status de un pago
-- de 'pending' a 'approved' en la tabla pagos, esta función:
--   1. Verifica que el plan sea GOLD.
--   2. Verifica que el pago se originó fuera de Venezuela.
--   3. Genera 2 códigos únicos en la tabla codigos_regalo
--      con la misma fecha de expiración que la membresía del comprador.
--   4. Actualiza perfiles_usuarios del comprador (level + fecha_expiracion_plan).

-- Paso 1: Función que ejecuta el trigger
CREATE OR REPLACE FUNCTION fn_post_payment_approval()
RETURNS TRIGGER AS $BODY$
DECLARE
    v_plan_name VARCHAR;
    v_expira_en TIMESTAMP WITH TIME ZONE;
    v_codigo TEXT;
BEGIN
    -- Solo actuar cuando el status cambia a 'approved'
    IF OLD.status <> 'pending' OR NEW.status <> 'approved' THEN
        RETURN NEW;
    END IF;

    -- Obtener nombre del plan
    SELECT name INTO v_plan_name
    FROM planes_suscripcion
    WHERE id = NEW.plan_id;

    -- Calcular fecha de expiración (365 días desde la aprobación)
    v_expira_en := NOW() + INTERVAL '365 days';

    -- Actualizar el nivel del usuario en perfiles_usuarios
    UPDATE perfiles_usuarios
    SET
        level = UPPER(v_plan_name),     -- 'SILVER' o 'GOLD'
        fecha_expiracion_plan = v_expira_en
    WHERE id = NEW.user_id;

    -- Si el plan es GOLD y el pago NO vino de Venezuela → generar 2 códigos regalo
    IF v_plan_name = 'Gold' AND NEW.country_origin NOT IN ('Venezuela', 'VE') THEN
        FOR i IN 1..2 LOOP
            -- Generar código único tipo: LUCY-XXXX-XXXX
            v_codigo := 'LUCY-'
                || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
                || '-'
                || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

            INSERT INTO codigos_regalo (
                code,
                generated_by_payment_id,
                is_active,
                expires_at
            ) VALUES (
                v_codigo,
                NEW.id,
                true,
                v_expira_en
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 2: Crear el trigger en la tabla pagos
DROP TRIGGER IF EXISTS trg_post_payment_approval ON pagos;
CREATE TRIGGER trg_post_payment_approval
    AFTER UPDATE OF status ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION fn_post_payment_approval();
