
-- Migración para el Metaverso Atlantis 5.0 (Mundial FanFest)

-- 1. Tabla de Nichos (Metaversos Privados / Promotores)
CREATE TABLE IF NOT EXISTS public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    title TEXT,
    slogan TEXT,
    logo_url TEXT,
    hero_url TEXT,
    primary_color TEXT DEFAULT '#0066ff',
    secondary_color TEXT DEFAULT '#ffcc00',
    base_color TEXT DEFAULT '#000000',
    category_configs JSONB DEFAULT '{}'::jsonb,
    is_commercial BOOLEAN DEFAULT false,
    onboarding_images TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Experiencias (Artes, Filtros y Herramientas)
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'Hora Loca Hats', 'Face Glam', 'Photo Booth', 'Postales Wassap', 'Marcos Pro', 'Fondos Inmersivos'
    level TEXT DEFAULT 'Bronce', -- 'Bronce', 'Silver', 'Gold'
    social_network TEXT DEFAULT 'TikTok', -- 'TikTok', 'Snapchat', 'FanFest'
    image_url TEXT,
    activation_link TEXT,
    demo_link TEXT,
    photobooth_link3 TEXT,
    photobooth_link4 TEXT,
    category TEXT DEFAULT 'General',
    is_multi_user BOOLEAN DEFAULT false,
    niche TEXT DEFAULT 'global', -- Relacionado con niches.name o 'global'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Seguridad)
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (para que los usuarios vean las experiencias)
CREATE POLICY "Permitir lectura pública de niches" ON public.niches FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública de experiencias" ON public.experiences FOR SELECT USING (true);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_experiences_niche ON public.experiences(niche);
CREATE INDEX IF NOT EXISTS idx_experiences_type ON public.experiences(type);
