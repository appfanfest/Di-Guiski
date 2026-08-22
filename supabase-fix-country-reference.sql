-- Fix country reference in quinielas_instancias
-- Quinielas should be linked to operative countries, not host countries.
ALTER TABLE public.quinielas_instancias 
DROP CONSTRAINT IF EXISTS quinielas_instancias_pais_id_fkey,
ADD CONSTRAINT quinielas_instancias_pais_id_fkey 
FOREIGN KEY (pais_id) REFERENCES public.paises_operativos(id);
