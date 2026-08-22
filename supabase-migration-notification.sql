-- Migration: Add notification column to quinielas_instancias
-- Add a communication channel for promoter-to-participant notifications

ALTER TABLE public.quinielas_instancias 
ADD COLUMN IF NOT EXISTS notificacion TEXT;

COMMENT ON COLUMN public.quinielas_instancias.notificacion IS 'Mensaje de comunicación directa del promotor para sus participantes';
