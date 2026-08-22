-- Migration: Add participant limit to quinielas_instancias
-- This supports National quinielas that might have limited spots.

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS limite_participantes INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.quinielas_instancias.limite_participantes IS 'Número máximo de participantes permitidos (opcional)';
