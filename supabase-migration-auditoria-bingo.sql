-- Migración: Auditoría de Ganadores y Reportes de Bingo
-- Objetivo: Persistencia de ganadores, desempates y auditoría

-- 1. Tabla de Ganadores
CREATE TABLE IF NOT EXISTS ganadores_sorteos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    match_id UUID REFERENCES partidos(id), -- Solo para Bingo
    promocion_id UUID REFERENCES promociones(id), -- Para sorteos directos
    tipo_sorteo TEXT NOT NULL, -- 'bingo_ranking', 'ciclon_general', 'ciclon_desempate'
    premio_asignado TEXT,
    posicion INTEGER DEFAULT 1,
    puntos_logrados INTEGER,
    entregado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Función para obtener ranking de Bingo por partido
-- Retorna el ranking ordenado por puntaje descendente
CREATE OR REPLACE FUNCTION get_bingo_ranking(p_match_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_cedula TEXT,
    puntos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.user_id,
        p.nombre as user_name,
        p.cedula_rif as user_cedula,
        b.score as puntos,
        b.created_at
    FROM bingo_mundial b
    JOIN perfiles_usuarios p ON b.user_id = p.id
    WHERE b.partido_id = p_match_id
    ORDER BY b.score DESC, b.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS para Ganadores
ALTER TABLE ganadores_sorteos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de ganadores" ON ganadores_sorteos;
CREATE POLICY "Lectura pública de ganadores" ON ganadores_sorteos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gestiona ganadores" ON ganadores_sorteos;
CREATE POLICY "Admin gestiona ganadores" ON ganadores_sorteos FOR ALL USING (
    public.has_role(ARRAY['admin'])
);

-- 4. Notificaciones de Auditoría (Ejemplo simple de log)
COMMENT ON TABLE ganadores_sorteos IS 'Tabla oficial para auditoría de premios entregados en la plataforma.';
