-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTION DEPLOYMENT MIGRATION - FINAL AUDIT
-- Go4Garage Private Limited - EKA-AI Platform
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure workshops table exists first (dependency)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    state_code TEXT,
    city TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_profiles exists
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

-- Ensure vehicles table exists
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

-- Ensure job_cards table exists with ALL required columns
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

-- MG Contracts Table
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

-- MG Vehicle Logs
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

-- Invoices Table
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

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    user_id UUID REFERENCES user_profiles(user_id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_calculation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_cards_workshop ON job_cards(workshop_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_mg_contracts_workshop ON mg_contracts(workshop_id);
CREATE INDEX IF NOT EXISTS idx_mg_vehicle_logs_contract ON mg_vehicle_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workshop ON audit_logs(workshop_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOYMENT VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify all critical tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN (
        'workshops', 'user_profiles', 'vehicles', 'job_cards', 
        'mg_contracts', 'mg_vehicle_logs', 'mg_calculation_logs',
        'invoices', 'invoice_items', 'audit_logs'
    )) = 10, 'Missing critical tables';
    
    RAISE NOTICE 'PRODUCTION MIGRATION COMPLETE - ALL TABLES VERIFIED';
END $$;
