-- Migration: Add detailed physical location fields to quinielas_instancias
-- This supports the "Commercial" philosophy of free-form city names and exact geoloc

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS ciudad_texto TEXT,
ADD COLUMN IF NOT EXISTS direccion_fisica TEXT,
ADD COLUMN IF NOT EXISTS latitud NUMERIC,
ADD COLUMN IF NOT EXISTS longitud NUMERIC;

COMMENT ON COLUMN public.quinielas_instancias.ciudad_texto IS 'Nombre de la ciudad o localidad (ingresado libremente por el promotor)';
COMMENT ON COLUMN public.quinielas_instancias.direccion_fisica IS 'Dirección detallada del local o sede comercial';
COMMENT ON COLUMN public.quinielas_instancias.latitud IS 'Coordenada de latitud capturada via GPS';
COMMENT ON COLUMN public.quinielas_instancias.longitud IS 'Coordenada de longitud capturada via GPS';
