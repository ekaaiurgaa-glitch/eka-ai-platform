-- EKA-AI Database Schema (Production)
-- Governed Automobile Intelligence System for Go4Garage Private Limited
-- Execute this SQL in your Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- TABLE 1: VEHICLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    fuel_type TEXT,
    vin TEXT,
    owner_name TEXT,
    owner_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE 2: JOB CARDS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    registration_number TEXT,
    status TEXT DEFAULT 'CREATED',
    symptoms TEXT[],
    diagnosis JSONB,
    estimate JSONB,
    approval_token TEXT,
    approval_expires_at TIMESTAMPTZ,
    customer_phone TEXT,
    customer_approved_at TIMESTAMPTZ,
    technician_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE 3: PDI EVIDENCE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pdi_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id),
    checklist_item TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('image', 'video')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by TEXT,
    verified_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE 4: INTELLIGENCE LOGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS intelligence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode INTEGER,
    status TEXT,
    user_query TEXT,
    ai_response TEXT,
    confidence_score NUMERIC,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
-- CRITICAL: RLS must be enabled to prevent unauthorized public access

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES (MVP - Allow authenticated users full access)
-- ═══════════════════════════════════════════════════════════════
-- NOTE: For production, replace these with more restrictive policies
-- based on user roles and ownership.
-- The service_role key used by the backend bypasses RLS, so these
-- policies apply to client-side Supabase SDK usage.

CREATE POLICY "Authenticated access" ON vehicles 
    FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access" ON job_cards 
    FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access" ON pdi_evidence 
    FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access" ON intelligence_logs 
    FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_vehicle ON job_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pdi_evidence_job ON pdi_evidence(job_card_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_created ON intelligence_logs(created_at);
