-- Ativar extensão para geração automática de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    weight NUMERIC(5,2), -- Ex: 82.50
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'moderate', 'active', 'athlete')),
    goal TEXT CHECK (goal IN ('muscle_gain', 'weight_loss', 'endurance', 'health', 'performance')),
    protein_target NUMERIC(5,1),
    calories_target NUMERIC(5,1),
    
    -- Fidelity Cycle (SaaS)
    is_subscribed BOOLEAN DEFAULT false,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'none')) DEFAULT 'none',
    discount_applied NUMERIC(3,2) DEFAULT 0.00, -- Ex: 0.10 para 10%
    next_billing_date TIMESTAMPTZ,
    
    -- Integrações com Wearables
    garmin_connected BOOLEAN DEFAULT false,
    garmin_last_sync TIMESTAMPTZ,
    apple_health_connected BOOLEAN DEFAULT false,
    apple_health_last_sync TIMESTAMPTZ,
    strava_connected BOOLEAN DEFAULT false,
    strava_last_sync TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nutrition_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL, -- YYYY-MM-DD para o streak
    protein NUMERIC(6,2) NOT NULL,
    calories NUMERIC(6,2) NOT NULL,
    label TEXT NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('meal', 'supplement')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para acelerar a busca dos dashboards diários
CREATE INDEX idx_nutrition_user_date ON nutrition_entries(user_id, entry_date);

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT CHECK (source IN ('garmin', 'apple_health', 'strava', 'manual')),
    workout_type TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    intensity_zone TEXT, -- Ex: 'Z3', 'Z4'
    calories_burned NUMERIC(6,2),
    workout_timestamp TIMESTAMPTZ NOT NULL, -- Timing para a IA usar
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_time ON chat_sessions(user_id, created_at);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tag TEXT,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    protein_per_scoop NUMERIC(5,1),
    calories_per_scoop NUMERIC(5,1),
    digestibility_score TEXT, -- Ex: 'Alta', 'Média', 'Baixa'
    is_active BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL, -- Desnormalizado para query rápida no front
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    taste_score INTEGER CHECK (taste_score >= 1 AND taste_score <= 5),
    texture_score INTEGER CHECK (texture_score >= 1 AND texture_score <= 5),
    digestibility_score INTEGER CHECK (digestibility_score >= 1 AND digestibility_score <= 5),
    comment TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_type TEXT CHECK (order_type IN ('one-time', 'subscription_renewal')),
    status TEXT CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'processing',
    total_amount NUMERIC(10,2) NOT NULL,
    discount_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10,2) NOT NULL -- Congela o preço na hora da compra
);

-- 1. Adicionando campos de perfil e gamificação na tabela de usuários
ALTER TABLE users 
ADD COLUMN username TEXT UNIQUE, -- Ex: 'dr.marcus'
ADD COLUMN avatar_url TEXT,
ADD COLUMN user_tier TEXT DEFAULT 'Standard Performance'; -- Ex: 'Elite Performance'

-- 2. Criando a tabela para o "Performance Feed" da Comunidade
CREATE TABLE feed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('goal_reached', 'streak_achieved', 'fidelity_renewed')),
    description TEXT NOT NULL, -- Ex: 'atingiu a meta de bio-disponibilidade semanal.'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para carregar o feed da comunidade rapidamente
CREATE INDEX idx_feed_events_date ON feed_events(created_at DESC);