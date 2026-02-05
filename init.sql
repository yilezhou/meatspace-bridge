-- Meatspace-Bridge Profile & Geolocation Engine
-- init.sql: Setup extensions, tables, indexes, and RLS policies.

-- 2.1 Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2.2 Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Table: skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT
);

-- 2.4 Table: profile_skills
CREATE TABLE IF NOT EXISTS profile_skills (
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    verification_level INT DEFAULT 0,
    PRIMARY KEY (profile_id, skill_id)
);

-- 2.5 Table: geo_locations
CREATE TABLE IF NOT EXISTS geo_locations (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    accuracy_radius FLOAT DEFAULT 0,
    last_ping TIMESTAMPTZ DEFAULT now()
);

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_geo_locations_location ON geo_locations USING GIST (location);

-- 4. Row-Level Security (RLS) Policies

-- 4.1 profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can see public profile info
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- INSERT/UPDATE: Users edit their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- skills (Read only for public)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);

-- profile_skills
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile skills are viewable by everyone" ON profile_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON profile_skills 
FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- 4.2 geo_locations (CRITICAL)
ALTER TABLE geo_locations ENABLE ROW LEVEL SECURITY;

-- Policy: owner_access
-- Allow owners to read/update their own location
CREATE POLICY "Owners can view their own location" 
ON geo_locations FOR SELECT 
USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Owners can update their own location" 
ON geo_locations FOR UPDATE 
USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Owners can insert their own location" 
ON geo_locations FOR INSERT 
WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Note: No public SELECT policy. Access is mediated via Edge Functions using service role.
-- Note: Supabase service_role bypasses RLS by default.

-- 5.1 Helper Function for search-workers edge function
-- This handles the complex geospatial join and skill filtering
CREATE OR REPLACE FUNCTION search_workers_geo(
    t_lat FLOAT, 
    t_long FLOAT, 
    r_meters FLOAT, 
    skill_slugs TEXT[] DEFAULT NULL, 
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    profile_id UUID,
    display_name TEXT,
    lat FLOAT,
    lng FLOAT,
    distance FLOAT,
    skills TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (service_role/admin)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as profile_id,
        p.display_name,
        ST_Y(gl.location::geometry) as lat,
        ST_X(gl.location::geometry) as lng,
        ST_Distance(gl.location, ST_SetSRID(ST_MakePoint(t_long, t_lat), 4326)::geography) as distance,
        ARRAY(
            SELECT s.slug 
            FROM skills s
            JOIN profile_skills ps ON ps.skill_id = s.id
            WHERE ps.profile_id = p.id
        ) as skills
    FROM profiles p
    JOIN geo_locations gl ON gl.profile_id = p.id
    WHERE 
        p.is_active = true
        AND ST_DWithin(gl.location, ST_SetSRID(ST_MakePoint(t_long, t_lat), 4326)::geography, r_meters)
        AND (
            skill_slugs IS NULL OR 
            EXISTS (
                SELECT 1 FROM profile_skills ps 
                JOIN skills s ON ps.skill_id = s.id 
                WHERE ps.profile_id = p.id AND s.slug = ANY(skill_slugs)
            )
        )
    ORDER BY gl.location <-> ST_SetSRID(ST_MakePoint(t_long, t_lat), 4326)::geography
    LIMIT p_limit;
END;
$$;

-- REVOKE execute permission from public roles to fix RLS Leak (Audit Finding 1)
REVOKE EXECUTE ON FUNCTION search_workers_geo(FLOAT, FLOAT, FLOAT, TEXT[], INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION search_workers_geo(FLOAT, FLOAT, FLOAT, TEXT[], INT) FROM anon;
REVOKE EXECUTE ON FUNCTION search_workers_geo(FLOAT, FLOAT, FLOAT, TEXT[], INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION search_workers_geo(FLOAT, FLOAT, FLOAT, TEXT[], INT) TO service_role;

-- ==========================================
-- MODULE B: BOUNTY SYSTEM
-- ==========================================

-- Enum: task_status
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'OPEN', 
        'ASSIGNED', 
        'SUBMITTED', 
        'VERIFIED', 
        'PAID', 
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status task_status NOT NULL DEFAULT 'OPEN',
    reward_amount NUMERIC NOT NULL,
    reward_token TEXT NOT NULL,
    evidence_data JSONB,
    geo_lat FLOAT,
    geo_long FLOAT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_manage_own_tasks"
ON tasks FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "workers_view_open_tasks"
ON tasks FOR SELECT
USING (status = 'OPEN');

CREATE POLICY "workers_manage_assigned_tasks"
ON tasks FOR ALL
USING (auth.uid() = assigned_to)
WITH CHECK (auth.uid() = assigned_to);

-- ==========================================
-- MODULE D: PAYMENT BRIDGE
-- ==========================================

-- Enum: transaction_status
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'PENDING', 
        'BROADCAST', 
        'CONFIRMED', 
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL UNIQUE REFERENCES tasks(id),
    chain_id INT NOT NULL DEFAULT 8453,
    tx_hash TEXT,
    block_number BIGINT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    token_address TEXT NOT NULL,
    status transaction_status NOT NULL DEFAULT 'PENDING',
    gas_used NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

-- RLS for transactions (Agents/Workers view their own task's transactions)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_transactions"
ON transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = transactions.task_id 
        AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid())
    )
);

-- ==========================================
-- TRIGGERS & HELPERS
-- ==========================================

-- Update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Notify status change
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM pg_notify('task_status_change', json_build_object(
            'task_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tasks_status_notify
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();
