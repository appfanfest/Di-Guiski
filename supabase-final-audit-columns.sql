-- AUDITORÍA TOTAL DE COLUMNAS - perfiles_usuarios (v4 - FINAL)
-- Sincronización absoluta con updated_at y campos legales

ALTER TABLE perfiles_usuarios 
ADD COLUMN IF NOT EXISTS pais_residencia TEXT,
ADD COLUMN IF NOT EXISTS estado_residencia TEXT,
ADD COLUMN IF NOT EXISTS identificacion TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS desea_gestionar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_gestor_solicitado TEXT,
ADD COLUMN IF NOT EXISTS solicito_privadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS solicito_comerciales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS solicito_nacionales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_terminos_publico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_terminos_gestor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS perfil_completado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mi_favorito TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Comentario: v4 agrega updated_at para evitar error de Schema Cache en el guardado
