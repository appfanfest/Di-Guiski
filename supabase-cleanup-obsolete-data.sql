-- SCRIPT DE LIMPIEZA: ELIMINAR DATOS OBSOLETOS
-- Este script borra datos que no cumplen con el nuevo modelo de Quinielas 2026.

BEGIN;

-- 1. Eliminar participaciones de quinielas que van a ser borradas (para evitar errores de FK)
DELETE FROM public.participaciones 
WHERE quiniela_instancia_id IN (
    SELECT id FROM public.quinielas_instancias 
    WHERE pais_id IS NULL 
    OR pais_id NOT IN (SELECT id FROM public.paises_operativos)
);

-- 2. Eliminar quinielas que no tienen un país operativo válido (datos viejos o huérfanos)
DELETE FROM public.quinielas_instancias 
WHERE pais_id IS NULL 
OR pais_id NOT IN (SELECT id FROM public.paises_operativos);

-- 3. (Opcional) Eliminar datos de la tabla 'promociones' si ya migraste a 'quinielas_instancias'
-- Descomenta la línea de abajo si quieres limpiar esa tabla también.
-- DELETE FROM public.promociones;

-- 4. (Opcional) Limpiar quinielas de usuarios antiguas (las del modelo previo)
-- DELETE FROM public.quinielas;

COMMIT;

-- Mensaje de confirmación (si se ejecuta en psql)
-- RAISE NOTICE 'Limpieza completada con éxito.';
