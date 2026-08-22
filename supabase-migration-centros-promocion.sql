-- Migración: Centros de Promociones y Bingo Mundialista

-- 1. Añadir campos a la tabla perfiles_usuarios
ALTER TABLE perfiles_usuarios
ADD COLUMN IF NOT EXISTS estado_geografico TEXT;

-- 2. Añadir campos a la tabla partidos para el Bingo Mundialista
ALTER TABLE partidos
ADD COLUMN IF NOT EXISTS partido_bingo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goles_1er_tiempo INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS faltas_totales INTEGER DEFAULT 0;

-- 3. Crear tabla centros_promocion
CREATE TABLE IF NOT EXISTS centros_promocion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotor_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    nombre_centro TEXT NOT NULL,
    estado_geografico TEXT NOT NULL,
    direccion_detallada TEXT,
    qr_code_url TEXT,
    reglas_sorteo TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Crear tabla bingo_mundial (Tickets generados)
CREATE TABLE IF NOT EXISTS bingo_mundial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    centro_id UUID REFERENCES centros_promocion(id), -- Opcional, por si se juega desde un centro
    partido_id UUID REFERENCES partidos(id), -- Partido que sirve de base para el bingo
    selections JSONB NOT NULL, -- { "goles": "3-4", "corners": "8-10", "amarillas": "0-2", ... }
    score INTEGER DEFAULT 0,
    estado_verificacion TEXT DEFAULT 'pendiente', -- 'pendiente', 'validado_social', 'ganador'
    archivado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Políticas RLS para centros_promocion
ALTER TABLE centros_promocion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de centros" ON centros_promocion;
CREATE POLICY "Lectura pública de centros" ON centros_promocion FOR SELECT USING (true);

DROP POLICY IF EXISTS "Promotores gestionan sus centros" ON centros_promocion;
CREATE POLICY "Promotores gestionan sus centros" ON centros_promocion FOR ALL USING (
    promotor_id = auth.uid() OR public.has_role(ARRAY['admin'])
);

-- Políticas RLS para bingo_mundial
ALTER TABLE bingo_mundial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus tickets de bingo" ON bingo_mundial;
CREATE POLICY "Usuarios ven sus tickets de bingo" ON bingo_mundial FOR SELECT USING (
    user_id = auth.uid() OR public.has_role(ARRAY['admin'])
);

DROP POLICY IF EXISTS "Usuarios pueden crear tickets de bingo" ON bingo_mundial;
CREATE POLICY "Usuarios pueden crear tickets de bingo" ON bingo_mundial FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Las validaciones las hace el comercio o el admin
DROP POLICY IF EXISTS "Promotores validan tickets de bingo" ON bingo_mundial;
CREATE POLICY "Promotores validan tickets de bingo" ON bingo_mundial FOR UPDATE USING (
    EXISTS (SELECT 1 FROM centros_promocion WHERE id = centro_id AND promotor_id = auth.uid()) OR public.has_role(ARRAY['admin'])
);
