-- Migración: Países Operativos y Refuerzo de Validaciones
CREATE TABLE IF NOT EXISTS paises_operativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    codigo_iso TEXT UNIQUE,
    bandera_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE paises_operativos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de países operativos" ON paises_operativos;
CREATE POLICY "Lectura pública de países operativos" ON paises_operativos FOR SELECT USING (true);

-- Insertar datos iniciales (Ejemplo)
INSERT INTO paises_operativos (nombre, codigo_iso) 
VALUES 
('Venezuela', 'VE'),
('Colombia', 'CO'),
('Estados Unidos', 'US'),
('Panamá', 'PA'),
('España', 'ES')
ON CONFLICT (nombre) DO NOTHING;
