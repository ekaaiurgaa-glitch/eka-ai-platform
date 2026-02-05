-- ═══════════════════════════════════════════════════════════════════════════════
-- EKA-AI COMPLETE DATABASE SCHEMA
-- Governed Automobile Intelligence System for Go4Garage Private Limited
-- Phase 1 + Phase 2 + Phase 3 - Production Ready
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Vehicles Table
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
    workshop_id UUID REFERENCES workshops(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Cards Table
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    workshop_id UUID REFERENCES workshops(id),
    registration_number TEXT,
    status TEXT DEFAULT 'CREATED',
    symptoms TEXT[],
    diagnosis JSONB,
    estimate JSONB,
    approval_token TEXT,
    approval_expires_at TIMESTAMPTZ,
    customer_phone TEXT,
    customer_approved_at TIMESTAMPTZ,
    technician_id UUID REFERENCES user_profiles(user_id),
    notes TEXT,
    sent_for_approval_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(user_id),
    status_notes TEXT
);

-- Job Card State History (Audit Trail for State Changes)
CREATE TABLE IF NOT EXISTS job_card_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES user_profiles(user_id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    metadata JSONB
);

-- PDI Evidence Table
CREATE TABLE IF NOT EXISTS pdi_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id),
    checklist_item TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('image', 'video')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES user_profiles(user_id),
    verified_by UUID REFERENCES user_profiles(user_id),
    verified_at TIMESTAMPTZ
);

-- PDI Checklists Template
CREATE TABLE IF NOT EXISTS pdi_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'STANDARD', 'HEAVY', 'LIGHT'
    items JSONB NOT NULL, -- Array of {task: string, critical: boolean}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Logs (AI Decision Audit)
CREATE TABLE IF NOT EXISTS intelligence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id),
    mode INTEGER,
    status TEXT,
    user_query TEXT,
    ai_response TEXT,
    confidence_score NUMERIC,
    session_id TEXT,
    model_used TEXT, -- 'gemini', 'claude'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: PRICING GOVERNANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Parts Catalog (Pricing Truth)
CREATE TABLE IF NOT EXISTS parts_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    part_code TEXT NOT NULL,
    description TEXT NOT NULL,
    hsn_code TEXT NOT NULL DEFAULT '8708',
    gst_rate NUMERIC DEFAULT 28.0,
    price_min NUMERIC NOT NULL,
    price_max NUMERIC NOT NULL,
    stock_qty INTEGER DEFAULT 0,
    supplier_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(user_id),
    UNIQUE(workshop_id, part_code)
);

-- Labor Catalog (Service Pricing)
CREATE TABLE IF NOT EXISTS labor_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    service_code TEXT NOT NULL,
    description TEXT NOT NULL,
    sac_code TEXT NOT NULL DEFAULT '9987',
    gst_rate NUMERIC DEFAULT 18.0,
    standard_rate NUMERIC NOT NULL,
    estimated_hours NUMERIC,
    skill_level TEXT CHECK (skill_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workshop_id, service_code)
);

-- Pricing Access Log (Audit who accessed pricing)
CREATE TABLE IF NOT EXISTS pricing_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    user_id UUID REFERENCES user_profiles(user_id),
    access_type TEXT NOT NULL, -- 'VIEW', 'MODIFY', 'ESTIMATE'
    item_type TEXT NOT NULL, -- 'PART', 'LABOR'
    item_code TEXT,
    job_card_id UUID REFERENCES job_cards(id),
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: MG (MINIMUM GUARANTEE) FLEET MODEL
-- ═══════════════════════════════════════════════════════════════════════════════

-- MG Contracts
CREATE TABLE IF NOT EXISTS mg_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_name TEXT NOT NULL,
    workshop_id UUID REFERENCES workshops(id),
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    assured_km_per_year INTEGER NOT NULL,
    rate_per_km NUMERIC NOT NULL,
    excess_rate_per_km NUMERIC,
    billing_cycle_months INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id)
);

-- MG Vehicle Logs (Fleet KM Tracking)
CREATE TABLE IF NOT EXISTS mg_vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES mg_contracts(id),
    vehicle_reg_number TEXT NOT NULL,
    billing_month DATE NOT NULL,
    opening_odometer INTEGER NOT NULL,
    closing_odometer INTEGER NOT NULL,
    actual_km_run INTEGER GENERATED ALWAYS AS (closing_odometer - opening_odometer) STORED,
    assured_km_quota INTEGER,
    billable_amount NUMERIC,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CALCULATED', 'INVOICED', 'DISPUTED')),
    calculated_at TIMESTAMPTZ,
    calculated_by UUID REFERENCES user_profiles(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MG Calculation Audit Log
CREATE TABLE IF NOT EXISTS mg_calculation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_log_id UUID REFERENCES mg_vehicle_logs(id),
    contract_id UUID REFERENCES mg_contracts(id),
    calculation_method TEXT NOT NULL,
    assured_km_monthly NUMERIC,
    actual_km INTEGER,
    billable_km NUMERIC,
    rate_per_km NUMERIC,
    excess_rate_per_km NUMERIC,
    base_amount NUMERIC,
    excess_amount NUMERIC,
    final_amount NUMERIC,
    utilization_type TEXT,
    calculated_by UUID REFERENCES user_profiles(user_id),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    is_audit_safe BOOLEAN DEFAULT TRUE
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: INVOICING & GST
-- ═══════════════════════════════════════════════════════════════════════════════

-- Invoice Number Sequence
CREATE TABLE IF NOT EXISTS invoice_sequences (
    workshop_id UUID PRIMARY KEY REFERENCES workshops(id),
    fiscal_year TEXT NOT NULL,
    last_number INTEGER DEFAULT 0,
    prefix TEXT DEFAULT 'INV',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id),
    workshop_id UUID REFERENCES workshops(id),
    invoice_number TEXT NOT NULL,
    customer_gstin TEXT,
    customer_name TEXT,
    customer_address TEXT,
    tax_type TEXT CHECK (tax_type IN ('CGST_SGST', 'IGST')),
    total_taxable_value NUMERIC DEFAULT 0,
    total_tax_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')),
    due_date DATE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES user_profiles(user_id),
    finalized_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    item_type TEXT CHECK (item_type IN ('PART', 'LABOR', 'MG_ADJUSTMENT')),
    description TEXT,
    hsn_sac_code TEXT,
    quantity NUMERIC,
    unit_price NUMERIC,
    taxable_value NUMERIC,
    gst_rate NUMERIC,
    tax_amount NUMERIC,
    total_amount NUMERIC,
    discount_amount NUMERIC DEFAULT 0
);

-- Credit/Debit Notes
CREATE TABLE IF NOT EXISTS credit_debit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    note_type TEXT CHECK (note_type IN ('CREDIT', 'DEBIT')),
    note_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    gst_adjustment NUMERIC,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'APPLIED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    approved_by UUID REFERENCES user_profiles(user_id),
    approved_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 3: MULTI-TENANCY & RBAC
-- ═══════════════════════════════════════════════════════════════════════════════

-- Workshops (Tenants)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    state_code TEXT, -- 2-digit for GST
    city TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id),
    role TEXT CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'FLEET_MANAGER', 'ACCOUNTANT')),
    full_name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    user_id UUID REFERENCES user_profiles(user_id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'JOB_CARD', 'INVOICE', 'VEHICLE', 'PRICING', 'MG', etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_calculation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Workshop Isolation Policy Function
CREATE OR REPLACE FUNCTION get_user_workshop_ids()
RETURNS TABLE(workshop_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT up.workshop_id 
    FROM user_profiles up 
    WHERE up.user_id = auth.uid() AND up.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Workshop isolation - vehicles" ON vehicles
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - job_cards" ON job_cards
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - job_card_states" ON job_card_states
    FOR ALL TO authenticated
    USING (job_card_id IN (
        SELECT id FROM job_cards WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - pdi_evidence" ON pdi_evidence
    FOR ALL TO authenticated
    USING (job_card_id IN (
        SELECT id FROM job_cards WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - pdi_checklists" ON pdi_checklists
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - intelligence_logs" ON intelligence_logs
    FOR ALL TO authenticated
    USING (job_card_id IN (
        SELECT id FROM job_cards WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ) OR job_card_id IS NULL);

CREATE POLICY "Workshop access - workshops" ON workshops
    FOR ALL TO authenticated
    USING (id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "User profiles access" ON user_profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - parts_catalog" ON parts_catalog
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - labor_catalog" ON labor_catalog
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - pricing_access_logs" ON pricing_access_logs
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - mg_contracts" ON mg_contracts
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - mg_vehicle_logs" ON mg_vehicle_logs
    FOR ALL TO authenticated
    USING (contract_id IN (
        SELECT id FROM mg_contracts WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - mg_calculation_logs" ON mg_calculation_logs
    FOR ALL TO authenticated
    USING (contract_id IN (
        SELECT id FROM mg_contracts WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - invoices" ON invoices
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - invoice_items" ON invoice_items
    FOR ALL TO authenticated
    USING (invoice_id IN (
        SELECT id FROM invoices WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - credit_debit_notes" ON credit_debit_notes
    FOR ALL TO authenticated
    USING (invoice_id IN (
        SELECT id FROM invoices WHERE workshop_id IN (SELECT get_user_workshop_ids())
    ));

CREATE POLICY "Workshop isolation - audit_logs" ON audit_logs
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

CREATE POLICY "Workshop isolation - invoice_sequences" ON invoice_sequences
    FOR ALL TO authenticated
    USING (workshop_id IN (SELECT get_user_workshop_ids()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_workshop ON vehicles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_vehicle ON job_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_workshop ON job_cards(workshop_id);
CREATE INDEX IF NOT EXISTS idx_job_card_states_job ON job_card_states(job_card_id);
CREATE INDEX IF NOT EXISTS idx_pdi_evidence_job ON pdi_evidence(job_card_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_job ON intelligence_logs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_created ON intelligence_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_workshops_gstin ON workshops(gstin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_workshop ON user_profiles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_parts_catalog_workshop ON parts_catalog(workshop_id);
CREATE INDEX IF NOT EXISTS idx_labor_catalog_workshop ON labor_catalog(workshop_id);
CREATE INDEX IF NOT EXISTS idx_pricing_access_logs_workshop ON pricing_access_logs(workshop_id);
CREATE INDEX IF NOT EXISTS idx_mg_contracts_workshop ON mg_contracts(workshop_id);
CREATE INDEX IF NOT EXISTS idx_mg_vehicle_logs_contract ON mg_vehicle_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_mg_vehicle_logs_month ON mg_vehicle_logs(billing_month);
CREATE INDEX IF NOT EXISTS idx_mg_calculation_logs_vehicle ON mg_calculation_logs(vehicle_log_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_card ON invoices(job_card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_debit_notes_invoice ON credit_debit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workshop ON audit_logs(workshop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS FOR AUTOMATED UPDATES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_catalog_updated_at BEFORE UPDATE ON parts_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_catalog_updated_at BEFORE UPDATE ON labor_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-log job card state changes
CREATE OR REPLACE FUNCTION log_job_card_state_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO job_card_states (job_card_id, previous_status, new_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by, NEW.status_notes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_card_state_change AFTER UPDATE ON job_cards
    FOR EACH ROW EXECUTE FUNCTION log_job_card_state_change();
