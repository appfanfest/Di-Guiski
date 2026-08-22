-- Migration: Add instruccion_id_interno to quinielas_instancias
-- This allows promoters to define the label/instruction for the internal ID field

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS instruccion_id_interno TEXT DEFAULT 'Nro de Apartamento / Socio';

COMMENT ON COLUMN public.quinielas_instancias.instruccion_id_interno IS 'Etiqueta o instrucción que verá el participante para el campo de ID interno';
