-- Actualización de esquema para Controles Comerciales y de Seguridad

-- 1. Agregar nuevos campos a perfiles_usuarios
ALTER TABLE perfiles_usuarios 
ADD COLUMN IF NOT EXISTS cantidad_quinielas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quinielas_solicitadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiniela_activa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bloqueo_fanfest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiniela_bloqueada BOOLEAN DEFAULT false;

-- 2. Comentario sobre los campos para documentación en Supabase
COMMENT ON COLUMN perfiles_usuarios.cantidad_quinielas IS 'Límite máximo de participantes permitidos para este comercio (Aprobado por Admin)';
COMMENT ON COLUMN perfiles_usuarios.quinielas_solicitadas IS 'Cantidad de participantes solicitada por el promotor';
COMMENT ON COLUMN perfiles_usuarios.quiniela_activa IS 'Interruptor del comercio para pausar su actividad';
COMMENT ON COLUMN perfiles_usuarios.bloqueo_fanfest IS 'Bloqueo administrativo global por irregularidades';
COMMENT ON COLUMN perfiles_usuarios.quiniela_bloqueada IS 'Bloqueo administrativo para evitar cambios en el contrato/capacidad por parte del usuario';

-- 3. Refuerzo de RLS para proteger campos sensibles
-- Solo el ADMIN puede editar cantidad_quinielas, bloqueo_fanfest y quiniela_bloqueada

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON perfiles_usuarios;
DROP POLICY IF EXISTS "Usuarios actualizan su perfil limitado" ON perfiles_usuarios;

CREATE POLICY "Usuarios actualizan su perfil limitado" ON perfiles_usuarios 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger para proteger campos sensibles
CREATE OR REPLACE FUNCTION protect_commercial_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el usuario no es admin
    IF (SELECT rol FROM perfiles_usuarios WHERE id = auth.uid()) != 'admin' THEN
        -- No permitir cambios en campos administrativos
        NEW.cantidad_quinielas := OLD.cantidad_quinielas;
        NEW.bloqueo_fanfest := OLD.bloqueo_fanfest;
        NEW.quiniela_bloqueada := OLD.quiniela_bloqueada;
        
        -- Si la quiniela está bloqueada, no permitir cambios en datos del contrato ni en la solicitud
        IF OLD.quiniela_bloqueada = true THEN
            NEW.nombre_comercial := OLD.nombre_comercial;
            NEW.direccion_fisica := OLD.direccion_fisica;
            NEW.quinielas_solicitadas := OLD.quinielas_solicitadas;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_commercial_fields ON perfiles_usuarios;
CREATE TRIGGER tr_protect_commercial_fields
BEFORE UPDATE ON perfiles_usuarios
FOR EACH ROW EXECUTE FUNCTION protect_commercial_fields();
