-- Fix country reference in quinielas_instancias (RETRY SAFE)
-- This version handles existing data by setting invalid IDs to NULL before applying the constraint.

-- 1. Remove old constraint if it exists
ALTER TABLE public.quinielas_instancias 
DROP CONSTRAINT IF EXISTS quinielas_instancias_pais_id_fkey;

-- 2. Clean up existing data that doesn't exist in the NEW table
-- This prevents the "violates foreign key constraint" error
UPDATE public.quinielas_instancias 
SET pais_id = NULL 
WHERE pais_id NOT IN (SELECT id FROM public.paises_operativos);

-- 3. Add the new correct constraint
ALTER TABLE public.quinielas_instancias 
ADD CONSTRAINT quinielas_instancias_pais_id_fkey 
FOREIGN KEY (pais_id) REFERENCES public.paises_operativos(id)
ON DELETE SET NULL;
