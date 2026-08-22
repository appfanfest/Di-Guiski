-- 1. Crear el ENUM para evitar valores aleatorios
DO $$ BEGIN
    CREATE TYPE status_aprobacion_enum AS ENUM ('Pendiente', 'Aprobada', 'Rechazada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ELIMINAR EL DEFAULT ACTUAL para evitar conflictos de conversión
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion DROP DEFAULT;

-- 3. Convertir la columna al nuevo ENUM
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion TYPE status_aprobacion_enum 
USING (
    CASE 
        WHEN status_aprobacion ILIKE 'aprobada' THEN 'Aprobada'::status_aprobacion_enum
        WHEN status_aprobacion ILIKE 'rechazada' THEN 'Rechazada'::status_aprobacion_enum
        ELSE 'Pendiente'::status_aprobacion_enum
    END
);

-- 4. APLICAR EL NUEVO DEFAULT ya con el tipo correcto
ALTER TABLE public.quinielas_instancias 
ALTER COLUMN status_aprobacion SET DEFAULT 'Pendiente'::status_aprobacion_enum;

-- 5. FIX DE DATOS PARA VENEZUELA
UPDATE public.quinielas_instancias
SET pais_id = (SELECT id FROM public.paises_operativos WHERE nombre = 'Venezuela' LIMIT 1)
WHERE pais_id IS NULL OR pais_id NOT IN (SELECT id FROM public.paises_operativos);
