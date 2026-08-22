-- Migration to add approval status to quinielas
ALTER TABLE quinielas_instancias 
ADD COLUMN IF NOT EXISTS status_aprobacion TEXT DEFAULT 'Pendiente' CHECK (status_aprobacion IN ('Pendiente', 'Aprobada', 'Rechazada'));

-- Update existing quinielas to 'Aprobada' if they don't have a status
UPDATE quinielas_instancias SET status_aprobacion = 'Aprobada' WHERE status_aprobacion IS NULL;
