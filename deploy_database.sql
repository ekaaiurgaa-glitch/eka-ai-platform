-- ═══════════════════════════════════════════════════════════════════════════════
-- EKA-AI PRODUCTION DATABASE SCHEMA
-- Execute this in Supabase SQL Editor: https://gymkrbjujghwvphessns.supabase.co
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Workshops (Root entity)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT UNIQUE,
    state_code TEXT NOT NULL,
    address TEXT,
    city TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'ADVISOR', 'FLEET_MANAGER')),
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
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

-- Job Cards with FSM
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    registration_number TEXT NOT NULL,
    status TEXT DEFAULT 'CREATED',
    symptoms TEXT[],
    diagnosis JSONB,
    estimate JSONB,
    approval_token TEXT,
    approval_expires_at TIMESTAMPTZ,
    customer_phone TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_approved_at TIMESTAMPTZ,
    technician_id UUID REFERENCES user_profiles(user_id),
    notes TEXT,
    odometer_reading INTEGER,
    fuel_level TEXT,
    reported_issues TEXT,
    sent_for_approval_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Card State History
CREATE TABLE IF NOT EXISTS job_card_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
    from_state TEXT,
    to_state TEXT NOT NULL,
    transitioned_by UUID REFERENCES user_profiles(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDI Checklists
CREATE TABLE IF NOT EXISTS pdi_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'STANDARD',
    status TEXT DEFAULT 'PENDING',
    technician_declaration BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDI Items
CREATE TABLE IF NOT EXISTS pdi_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID REFERENCES pdi_checklists(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    checked BOOLEAN DEFAULT false,
    notes TEXT,
    checked_at TIMESTAMPTZ,
    checked_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    job_card_id UUID REFERENCES job_cards(id),
    invoice_number TEXT UNIQUE NOT NULL,
    workshop_gstin TEXT,
    customer_name TEXT,
    customer_address TEXT,
    customer_gstin TEXT,
    customer_state TEXT,
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    parts_total DECIMAL(10,2) DEFAULT 0,
    labor_total DECIMAL(10,2) DEFAULT 0,
    taxable_amount DECIMAL(10,2) DEFAULT 0,
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    notes TEXT,
    created_by UUID REFERENCES user_profiles(user_id),
    finalized_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('PART', 'LABOR')),
    item_code TEXT,
    description TEXT NOT NULL,
    hsn_sac_code TEXT,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    taxable_value DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    cgst_amount DECIMAL(10,2),
    sgst_amount DECIMAL(10,2),
    igst_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts Catalog
CREATE TABLE IF NOT EXISTS parts_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    part_code TEXT NOT NULL,
    description TEXT NOT NULL,
    hsn_code TEXT,
    gst_rate DECIMAL(5,2) NOT NULL,
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_qty INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workshop_id, part_code)
);

-- Labor Catalog
CREATE TABLE IF NOT EXISTS labor_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    service_code TEXT NOT NULL,
    description TEXT NOT NULL,
    sac_code TEXT,
    gst_rate DECIMAL(5,2) NOT NULL,
    standard_rate DECIMAL(10,2),
    estimated_hours DECIMAL(5,2),
    skill_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workshop_id, service_code)
);

-- MG Contracts
CREATE TABLE IF NOT EXISTS mg_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    fleet_name TEXT NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    assured_km_per_year INTEGER NOT NULL,
    rate_per_km DECIMAL(10,2) NOT NULL,
    excess_rate_per_km DECIMAL(10,2),
    billing_cycle_months INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_cards_workshop ON job_cards(workshop_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_job_card ON pdi_checklists(job_card_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INITIAL DATA SEEDING
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert default workshop (replace with your details)
INSERT INTO workshops (name, gstin, state_code, address, city, phone, email)
VALUES (
    'Go4Garage Main Workshop',
    '10AAICG9768N1ZZ',
    '10',
    'Industrial Area, Patna, Bihar',
    'Patna',
    '+91-9876543210',
    'legal@go4garage.in'
) ON CONFLICT (gstin) DO NOTHING
RETURNING id;

-- Insert sample parts catalog
INSERT INTO parts_catalog (workshop_id, part_code, description, hsn_code, gst_rate, price_min, price_max)
SELECT 
    w.id,
    'BRK-PAD-F-SW',
    'Brake Pads Front - Maruti Swift',
    '87083010',
    28.0,
    1800.00,
    2200.00
FROM workshops w WHERE w.gstin = '10AAICG9768N1ZZ'
ON CONFLICT (workshop_id, part_code) DO NOTHING;

INSERT INTO parts_catalog (workshop_id, part_code, description, hsn_code, gst_rate, price_min, price_max)
SELECT 
    w.id,
    'OIL-ENG-5W30',
    'Engine Oil 5W-30 Synthetic (4L)',
    '27101990',
    28.0,
    2200.00,
    2800.00
FROM workshops w WHERE w.gstin = '10AAICG9768N1ZZ'
ON CONFLICT (workshop_id, part_code) DO NOTHING;

-- Insert sample labor catalog
INSERT INTO labor_catalog (workshop_id, service_code, description, sac_code, gst_rate, standard_rate, estimated_hours)
SELECT 
    w.id,
    'SRV-BRK-SVC',
    'Brake Service Complete',
    '998714',
    18.0,
    1200.00,
    2.0
FROM workshops w WHERE w.gstin = '10AAICG9768N1ZZ'
ON CONFLICT (workshop_id, service_code) DO NOTHING;

SELECT 'Database schema deployed successfully!' as status;
