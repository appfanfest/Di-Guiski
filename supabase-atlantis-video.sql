-- Actualizar tabla organización con el campo de video para el Metaverso
ALTER TABLE organizacion 
ADD COLUMN IF NOT EXISTS video_youtube TEXT;

COMMENT ON COLUMN organizacion.video_youtube IS 'Enlace al video de YouTube (Short o normal) para la sección ¿Cómo Funciona?';

-- Ejemplo de actualización
-- UPDATE organizacion SET 
-- video_youtube = 'https://www.youtube.com/shorts/TU_ID_AQUI'
-- WHERE id = 'TU_ID_DE_ORGANIZACION';
