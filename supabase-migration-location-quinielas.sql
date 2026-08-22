-- Migration: Add country and location to quinielas_instancias
-- This allows commercial quinielas to be associated with a specific place

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS pais_id UUID REFERENCES public.pais_sede(id),
ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES public.sede(id);

COMMENT ON COLUMN public.quinielas_instancias.pais_id IS 'País donde opera la quiniela (importante para comerciales/nacionales)';
COMMENT ON COLUMN public.quinielas_instancias.sede_id IS 'Ciudad o sede física específica para quinielas comerciales presenciales';
