-- SCRIPT DE ESTABILIZACIÓN DEFINITIVO (Usando Check Constraint en lugar de ENUM)
-- El uso de CHECK es más flexible y evita errores de "operator does not exist" en Supabase.

BEGIN;

-- 1. Si intentaste crear el ENUM, lo regresamos a TEXT para máxima compatibilidad
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion TYPE TEXT;

-- 2. Limpiamos y normalizamos los valores actuales
UPDATE public.quinielas_instancias 
SET status_aprobacion = CASE 
    WHEN status_aprobacion ILIKE 'aprobada' THEN 'Aprobada'
    WHEN status_aprobacion ILIKE 'rechazada' THEN 'Rechazada'
    ELSE 'Pendiente'
END;

-- 3. Agregamos la RESTRICCIÓN DE VALORES FIJOS (CHECK)
-- Esto garantiza que nadie pueda insertar valores que no sean estos 3.
ALTER TABLE public.quinielas_instancias 
DROP CONSTRAINT IF EXISTS status_aprobacion_check;

ALTER TABLE public.quinielas_instancias 
ADD CONSTRAINT status_aprobacion_check 
CHECK (status_aprobacion IN ('Pendiente', 'Aprobada', 'Rechazada'));

-- 4. Establecemos el valor por defecto
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion SET DEFAULT 'Pendiente';

-- 5. FIX DE DATOS PARA VENEZUELA (Asegurar que tus pruebas aparezcan)
UPDATE public.quinielas_instancias
SET pais_id = (SELECT id FROM public.paises_operativos WHERE nombre = 'Venezuela' LIMIT 1)
WHERE pais_id IS NULL OR pais_id NOT IN (SELECT id FROM public.paises_operativos);

COMMIT;
