-- 1. Crear el ENUM para evitar valores aleatorios que rompan el sistema
DO $$ BEGIN
    CREATE TYPE status_aprobacion_enum AS ENUM ('Pendiente', 'Aprobada', 'Rechazada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Convertir la columna al nuevo ENUM (manejando conversiones de texto)
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion TYPE status_aprobacion_enum 
USING (
    CASE 
        WHEN status_aprobacion ILIKE 'aprobada' THEN 'Aprobada'::status_aprobacion_enum
        WHEN status_aprobacion ILIKE 'rechazada' THEN 'Rechazada'::status_aprobacion_enum
        ELSE 'Pendiente'::status_aprobacion_enum
    END
);

-- 3. FIX DE DATOS PARA VENEZUELA (Solo para tus pruebas actuales)
-- Esto vincula tus quinielas actuales al ID correcto de Venezuela en la tabla operativa
UPDATE public.quinielas_instancias
SET pais_id = (SELECT id FROM public.paises_operativos WHERE nombre = 'Venezuela' LIMIT 1)
WHERE pais_id IS NULL OR pais_id NOT IN (SELECT id FROM public.paises_operativos);

-- 4. Asegurar que las nuevas quinielas siempre tengan el valor por defecto correcto
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion SET DEFAULT 'Pendiente'::status_aprobacion_enum;
