-- Script SQL para Supabase - FanFest Quiniela 2026

-- 1. Tablas Base
CREATE TABLE IF NOT EXISTS pais_sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    bandera_url TEXT
);

CREATE TABLE IF NOT EXISTS sede (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pais_sede_id UUID REFERENCES pais_sede(id),
    nombre TEXT NOT NULL,
    foto_url TEXT,
    logo_sede_url TEXT
);

CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letra_grupo CHAR(1) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS paises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    bandera_url TEXT,
    federacion TEXT,
    ranking_fifa INTEGER,
    factor_quiniela DECIMAL(5,2),
    grupo_id UUID REFERENCES grupos(id)
);

CREATE TABLE IF NOT EXISTS partidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_nro INTEGER,
    pais_sede_id UUID REFERENCES pais_sede(id),
    sede_id UUID REFERENCES sede(id),
    id_grupo UUID REFERENCES grupos(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    pais_id1 UUID REFERENCES paises(id),
    pais_id2 UUID REFERENCES paises(id),
    nombre1 TEXT,
    nombre2 TEXT,
    bandera1 TEXT,
    bandera2 TEXT,
    ranking1 INTEGER,
    ranking2 INTEGER,
    factor1 DECIMAL(5,2), -- Gana 1
    factor2 DECIMAL(5,2), -- Empate
    factor3 DECIMAL(5,2), -- Gana 2
    goles1 INTEGER DEFAULT 0,
    goles2 INTEGER DEFAULT 0,
    rojas INTEGER DEFAULT 0,
    amarillas INTEGER DEFAULT 0,
    corners INTEGER DEFAULT 0,
    bloque_primer_gol TEXT,
    bloque_gol_final TEXT,
    estado TEXT DEFAULT 'programado' -- programado, en_vivo, finalizado
);

CREATE TABLE IF NOT EXISTS perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL,
    telefono TEXT,
    sexo TEXT,
    edad INTEGER,
    nacionalidad TEXT, -- V o E para Venezuela
    cedula_rif TEXT,
    foto_logo TEXT, -- URL de la imagen
    rol TEXT DEFAULT 'usuario', -- usuario, admin, comercio
    
    -- Campos para Promotores
    nombre_comercial TEXT,
    descripcion_premios TEXT,
    direccion_fisica TEXT,
    instagram TEXT,
    tiktok TEXT,
    autorizado BOOLEAN DEFAULT false,
    acepta_terminos BOOLEAN DEFAULT false,
    
    -- Nuevos campos de control comercial
    cantidad_quinielas INTEGER DEFAULT 0,
    quiniela_activa BOOLEAN DEFAULT true,
    bloqueo_fanfest BOOLEAN DEFAULT false,
    quiniela_bloqueada BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS quinielas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    nombre TEXT NOT NULL, -- e.g., 'Quiniela 1', 'Favoritos', etc.
    predicciones JSONB DEFAULT '{}'::jsonb, -- { "match_id": "1", "match_id2": "X" }
    completada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- NUEVA TABLA: Organización (Datos dinámicos de contacto)
CREATE TABLE IF NOT EXISTS organizacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    slogan TEXT,
    correo_contacto TEXT,
    telefono_whatsapp TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    direccion_central TEXT,
    hero_image_url TEXT,
    atlantis_img TEXT,
    atlantis_dir TEXT,
    video_youtube TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- NUEVA TABLA: Testimonios (NotiQuinielas)
CREATE TABLE IF NOT EXISTS testimonios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autor_nombre TEXT NOT NULL,
    autor_rol TEXT, -- 'Comercio' o 'Ganador'
    contenido TEXT NOT NULL,
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- NUEVA TABLA: Promociones (Definidas por el comercio)
CREATE TABLE IF NOT EXISTS promociones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    tipo TEXT NOT NULL, -- 'quiniela', 'sorteo_diario'
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- NUEVA TABLA: Participaciones (Vínculo Usuario-Comercio-Actividad)
CREATE TABLE IF NOT EXISTS participaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    comercio_id UUID REFERENCES perfiles_usuarios(id) NOT NULL,
    promocion_id UUID REFERENCES promociones(id),
    quiniela_id UUID REFERENCES quinielas(id),
    tipo TEXT NOT NULL, -- 'quiniela', 'promocion'
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'validado'
    puntos_ranking INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Funciones y Triggers para Perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles_usuarios (id, nombre, correo, rol)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nombre', new.email),
        new.email,
        'usuario'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para verificar roles sin causar recursión en RLS
CREATE OR REPLACE FUNCTION public.has_role(target_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles_usuarios
    WHERE id = auth.uid() AND rol = ANY(target_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Políticas de Seguridad (RLS)
ALTER TABLE pais_sede ENABLE ROW LEVEL SECURITY;
ALTER TABLE sede ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE paises ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE participaciones ENABLE ROW LEVEL SECURITY;

-- Lectura pública para datos del mundial
DROP POLICY IF EXISTS "Lectura pública para todos" ON pais_sede;
CREATE POLICY "Lectura pública para todos" ON pais_sede FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública para todos" ON sede;
CREATE POLICY "Lectura pública para todos" ON sede FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública para todos" ON grupos;
CREATE POLICY "Lectura pública para todos" ON grupos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública para todos" ON paises;
CREATE POLICY "Lectura pública para todos" ON paises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública para todos" ON partidos;
CREATE POLICY "Lectura pública para todos" ON partidos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública" ON organizacion;
CREATE POLICY "Lectura pública" ON organizacion FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins gestionan organizacion" ON organizacion;
CREATE POLICY "Admins gestionan organizacion" ON organizacion FOR ALL USING (
    public.has_role(ARRAY['admin'])
);

DROP POLICY IF EXISTS "Lectura pública" ON testimonios;
CREATE POLICY "Lectura pública" ON testimonios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins gestionan testimonios" ON testimonios;
CREATE POLICY "Admins gestionan testimonios" ON testimonios FOR ALL USING (
    public.has_role(ARRAY['admin'])
);

-- Perfiles: Usuario lee y actualiza el suyo, Admin lee todos
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON perfiles_usuarios;
CREATE POLICY "Usuarios ven su propio perfil" ON perfiles_usuarios FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON perfiles_usuarios;
CREATE POLICY "Usuarios actualizan su propio perfil" ON perfiles_usuarios FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios insertan su propio perfil" ON perfiles_usuarios;
CREATE POLICY "Usuarios insertan su propio perfil" ON perfiles_usuarios FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON perfiles_usuarios;
CREATE POLICY "Admins ven todos los perfiles" ON perfiles_usuarios FOR SELECT USING (
    public.has_role(ARRAY['admin'])
);

DROP POLICY IF EXISTS "Admins gestionan todos los perfiles" ON perfiles_usuarios;
CREATE POLICY "Admins gestionan todos los perfiles" ON perfiles_usuarios FOR ALL USING (
    public.has_role(ARRAY['admin'])
);

-- Partidos: Solo Admin actualiza
DROP POLICY IF EXISTS "Solo Admin actualiza partidos" ON partidos;
CREATE POLICY "Solo Admin actualiza partidos" ON partidos FOR UPDATE USING (
    public.has_role(ARRAY['admin'])
);

-- Quinielas: Usuario gestiona las suyas, Admin ve todas
ALTER TABLE quinielas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus quinielas" ON quinielas;
CREATE POLICY "Usuarios gestionan sus quinielas" ON quinielas 
    FOR ALL USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Admins ven todas las quinielas" ON quinielas;
CREATE POLICY "Admins ven todas las quinielas" ON quinielas 
    FOR SELECT USING (public.has_role(ARRAY['admin']));

-- Políticas para Promociones
DROP POLICY IF EXISTS "Lectura pública de promociones" ON promociones;
CREATE POLICY "Lectura pública de promociones" ON promociones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Comercios gestionan sus promociones" ON promociones;
CREATE POLICY "Comercios gestionan sus promociones" ON promociones FOR ALL USING (
    comercio_id = auth.uid() OR public.has_role(ARRAY['admin'])
);

-- Políticas para Participaciones
DROP POLICY IF EXISTS "Usuarios ven sus participaciones" ON participaciones;
CREATE POLICY "Usuarios ven sus participaciones" ON participaciones FOR SELECT USING (
    usuario_id = auth.uid() OR public.has_role(ARRAY['admin'])
);

DROP POLICY IF EXISTS "Comercios ven sus participantes" ON participaciones;
CREATE POLICY "Comercios ven sus participantes" ON participaciones FOR SELECT USING (
    comercio_id = auth.uid() OR public.has_role(ARRAY['admin'])
);

DROP POLICY IF EXISTS "Usuarios insertan participaciones" ON participaciones;
CREATE POLICY "Usuarios insertan participaciones" ON participaciones FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
);

DROP POLICY IF EXISTS "Comercios validan participaciones" ON participaciones;
CREATE POLICY "Comercios validan participaciones" ON participaciones FOR UPDATE USING (
    comercio_id = auth.uid() OR public.has_role(ARRAY['admin'])
);
