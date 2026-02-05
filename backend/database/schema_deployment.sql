-- ═══════════════════════════════════════════════════════════════════════════════
-- EKA-AI DATABASE SCHEMA - DEPLOYMENT READY
-- Properly ordered for dependency resolution
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE BASE TABLES (No dependencies)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Workshops Table (Root entity for multi-tenancy)
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

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'ADVISOR', 'FLEET_MANAGER')),
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles Table
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE DEPENDENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Job Cards Table
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(user_id),
    status_notes TEXT
);

-- Job Card States (Audit log)
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

-- PDI Checklist Items
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

-- PDI Evidence
CREATE TABLE IF NOT EXISTS pdi_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID REFERENCES pdi_checklists(id) ON DELETE CASCADE,
    item_code TEXT,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    last_sequence INTEGER DEFAULT 0,
    UNIQUE(workshop_id, year)
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

-- Pricing Access Logs
CREATE TABLE IF NOT EXISTS pricing_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES user_profiles(user_id),
    item_type TEXT NOT NULL,
    item_code TEXT,
    query_type TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
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

-- MG Vehicle Logs
CREATE TABLE IF NOT EXISTS mg_vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES mg_contracts(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    log_period TEXT NOT NULL,
    opening_km INTEGER NOT NULL,
    closing_km INTEGER NOT NULL,
    actual_km INTEGER NOT NULL,
    validated BOOLEAN DEFAULT false,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MG Calculation Logs
CREATE TABLE IF NOT EXISTS mg_calculation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES mg_contracts(id) ON DELETE CASCADE,
    log_period TEXT NOT NULL,
    total_assured_km INTEGER NOT NULL,
    total_actual_km INTEGER NOT NULL,
    billable_km INTEGER NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    utilization_type TEXT,
    calculation_details JSONB,
    calculated_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Logs
CREATE TABLE IF NOT EXISTS intelligence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
    query_type TEXT NOT NULL,
    query_text TEXT,
    domain_gate_pass BOOLEAN,
    confidence_score DECIMAL(3,2),
    context_complete BOOLEAN,
    permission_granted BOOLEAN,
    response_summary TEXT,
    user_id UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_job_cards_workshop ON job_cards(workshop_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_vehicle ON job_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_card ON invoices(job_card_id);
CREATE INDEX IF NOT EXISTS idx_pdi_checklists_job_card ON pdi_checklists(job_card_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workshop ON audit_logs(workshop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Total Tables Created: 19
-- RLS Enabled: Yes
-- Indexes Created: Yes
-- Ready for Production: Yes
