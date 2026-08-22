-- Migración para el nuevo sistema de pagos de Say Lucy!

-- 1. Tabla de Planes de Suscripción
CREATE TABLE IF NOT EXISTS planes_suscripcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- 'Silver', 'Gold', etc.
    price_usd DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar planes iniciales
INSERT INTO planes_suscripcion (name, price_usd, duration_days) VALUES 
('Silver', 10.00, 365),
('Gold', 20.00, 365);

-- 2. Tabla de Campañas Promocionales
CREATE TABLE IF NOT EXISTS campanas_promocionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Promotores
CREATE TABLE IF NOT EXISTS promotores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES planes_suscripcion(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reference VARCHAR(100),
    promoter_id UUID REFERENCES promotores(id) ON DELETE SET NULL,
    country_origin VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Códigos de Regalo (Vouchers para Venezuela)
CREATE TABLE IF NOT EXISTS codigos_regalo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    generated_by_payment_id UUID REFERENCES pagos(id) ON DELETE CASCADE,
    used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- 6. Actualización a la tabla perfiles_usuarios existente
ALTER TABLE perfiles_usuarios
ADD COLUMN IF NOT EXISTS fecha_expiracion_plan TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS device_id TEXT;
