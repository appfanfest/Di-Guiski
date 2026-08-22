-- Migración para Rediseño de Usuarios, Quinielas y Promociones 2026

-- 1. Tipos ENUM para Gestores
DO $$ BEGIN
    CREATE TYPE tipo_gestor_enum AS ENUM ('Privado', 'Community Manager', 'Influencer', 'Agencia de Publicidad', 'Negocio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_gestor_enum AS ENUM ('Pendiente de Aprobación', 'Aceptado', 'Rechazado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_quiniela_instancia_enum AS ENUM ('Privada', 'Comercial Presencial', 'Nacional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Actualización de perfiles_usuarios
ALTER TABLE perfiles_usuarios 
ADD COLUMN IF NOT EXISTS pais_residencia TEXT,
ADD COLUMN IF NOT EXISTS estado_residencia TEXT,
ADD COLUMN IF NOT EXISTS identificacion TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT,
ADD COLUMN IF NOT EXISTS redes_sociales JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS quiere_gestionar_quinielas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_gestor tipo_gestor_enum,
ADD COLUMN IF NOT EXISTS quiere_gestionar_promociones BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_terminos_publico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_terminos_gestor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_participar_privadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_gestor status_gestor_enum DEFAULT 'Pendiente de Aprobación',
ADD COLUMN IF NOT EXISTS aprobado_privadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aprobado_comerciales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aprobado_nacionales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS perfil_completado BOOLEAN DEFAULT false;

-- 3. Tabla de Instancias de Quinielas (Creadas por Gestores)
CREATE TABLE IF NOT EXISTS quinielas_instancias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gestor_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    tipo tipo_quiniela_instancia_enum NOT NULL,
    nombre TEXT NOT NULL,
    codigo_participacion TEXT UNIQUE, -- Para privadas: 2 letras + 6 números
    requiere_id_interno BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    terminos_condiciones TEXT,
    configuracion JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla de Promociones (Independiente de Quinielas)
-- Ya existe una tabla 'promociones', vamos a reforzarla o crear una nueva para el rediseño
-- Si ya existe, nos aseguramos que tenga los campos del Ciclón
ALTER TABLE promociones 
ADD COLUMN IF NOT EXISTS requiere_qr BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ciclon_vaciado_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terminos_condiciones TEXT;

-- 5. Tabla de Participaciones (Actualización para ID Interno)
ALTER TABLE participaciones 
ADD COLUMN IF NOT EXISTS identificacion_interna TEXT, -- Para quinielas privadas (apto, socio, etc)
ADD COLUMN IF NOT EXISTS quiniela_instancia_id UUID REFERENCES quinielas_instancias(id);

-- 6. RLS para nuevas tablas
ALTER TABLE quinielas_instancias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de instancias de quinielas" ON quinielas_instancias;
CREATE POLICY "Lectura pública de instancias de quinielas" ON quinielas_instancias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestores manejan sus instancias" ON quinielas_instancias;
CREATE POLICY "Gestores manejan sus instancias" ON quinielas_instancias 
FOR ALL USING (gestor_id = auth.uid() OR public.has_role(ARRAY['admin']));

-- 7. Función para generar código de participación aleatorio (2 letras + 6 números)
CREATE OR REPLACE FUNCTION generar_codigo_quiniela_privada() 
RETURNS TEXT AS $$
DECLARE
    letras TEXT := '';
    numeros TEXT := '';
    resultado TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
BEGIN
    -- 2 letras aleatorias
    FOR i IN 1..2 LOOP
        letras := letras || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- 6 números aleatorios
    FOR i IN 1..6 LOOP
        numeros := numeros || floor(random() * 10)::text;
    END LOOP;
    
    resultado := letras || numeros;
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;
