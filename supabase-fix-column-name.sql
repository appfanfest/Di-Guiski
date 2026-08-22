-- Corrección de Nomenclatura para evitar error de Schema Cache
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles_usuarios' AND column_name = 'quiere_gestionar_quinielas') THEN
        ALTER TABLE perfiles_usuarios RENAME COLUMN quiere_gestionar_quinielas TO desea_gestionar;
    END IF;
END $$;

-- Asegurar que la columna existe con el nombre correcto
ALTER TABLE perfiles_usuarios ADD COLUMN IF NOT EXISTS desea_gestionar BOOLEAN DEFAULT false;
