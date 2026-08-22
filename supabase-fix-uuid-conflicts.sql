-- LIMPIEZA AUTOMÁTICA DE COLUMNAS UUID (v2)
-- Este script es ultra-resiliente y no fallará si las columnas no existen.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Buscamos todas las columnas de tipo UUID en perfiles_usuarios 
    -- que no sean la columna 'id' (la llave primaria)
    FOR r IN (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'perfiles_usuarios' 
        AND data_type = 'uuid' 
        AND column_name != 'id'
    ) 
    LOOP
        -- Para cada columna UUID encontrada, la hacemos opcional y con valor nulo por defecto
        EXECUTE 'ALTER TABLE perfiles_usuarios ALTER COLUMN ' || quote_ident(r.column_name) || ' DROP NOT NULL';
        EXECUTE 'ALTER TABLE perfiles_usuarios ALTER COLUMN ' || quote_ident(r.column_name) || ' SET DEFAULT NULL';
        RAISE NOTICE 'Corregida columna UUID: %', r.column_name;
    END LOOP;
END $$;
