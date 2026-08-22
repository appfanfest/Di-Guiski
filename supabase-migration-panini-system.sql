-- Migración: Sistema Panini 5.0
-- 1. Añadir costo del sobre a países operativos
ALTER TABLE public.paises_operativos 
ADD COLUMN IF NOT EXISTS costo_panini DECIMAL(10,2) DEFAULT 1.0;

-- 2. Añadir nivel de acceso al perfil del usuario
-- Usamos TEXT con CHECK para mayor flexibilidad que un ENUM nativo
ALTER TABLE public.perfiles_usuarios 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Bronce' 
CHECK (level IN ('Bronce', 'Silver', 'Gold', 'Admin'));

-- 3. Actualizar datos iniciales de ejemplo para el Panini Index
-- Los precios son referenciales por sobre en cada país
UPDATE public.paises_operativos SET costo_panini = 1.50 WHERE nombre = 'Venezuela';
UPDATE public.paises_operativos SET costo_panini = 1.25 WHERE nombre = 'Estados Unidos';
UPDATE public.paises_operativos SET costo_panini = 0.90 WHERE nombre = 'España';
UPDATE public.paises_operativos SET costo_panini = 1.00 WHERE nombre = 'Colombia';
UPDATE public.paises_operativos SET costo_panini = 1.10 WHERE nombre = 'Panamá';

-- 4. Asegurar que los perfiles existentes tengan nivel Bronce
UPDATE public.perfiles_usuarios SET level = 'Bronce' WHERE level IS NULL;
UPDATE public.perfiles_usuarios SET level = 'Admin' WHERE rol = 'admin';
