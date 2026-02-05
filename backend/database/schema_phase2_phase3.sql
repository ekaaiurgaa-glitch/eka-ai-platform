-- ═══════════════════════════════════════════════════════════════
-- PHASE 3: MULTI-TENANCY & RBAC
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    state_code TEXT, -- Essential for GST (e.g., '27' for Maharashtra)
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link Supabase Auth Users to Workshops
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id),
    role TEXT CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'FLEET_MANAGER')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2: PRICING GOVERNANCE (The "Truth" for AI)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS parts_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    part_code TEXT NOT NULL,
    description TEXT NOT NULL,
    hsn_code TEXT NOT NULL DEFAULT '8708',
    gst_rate NUMERIC DEFAULT 28.0, -- 28% for parts
    price_min NUMERIC NOT NULL,
    price_max NUMERIC NOT NULL,
    stock_qty INTEGER DEFAULT 0,
    UNIQUE(workshop_id, part_code)
);

CREATE TABLE IF NOT EXISTS labor_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    service_code TEXT NOT NULL,
    description TEXT NOT NULL,
    sac_code TEXT NOT NULL DEFAULT '9987',
    gst_rate NUMERIC DEFAULT 18.0, -- 18% for labor
    standard_rate NUMERIC NOT NULL,
    UNIQUE(workshop_id, service_code)
);

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2: MG (MINIMUM GUARANTEE) FLEET MODEL
-- ═══════════════════════════════════════════════════════════════
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
    is_active BOOLEAN DEFAULT TRUE
);

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
    status TEXT DEFAULT 'PENDING'
);

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2: INVOICING & GST
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES job_cards(id),
    workshop_id UUID REFERENCES workshops(id),
    invoice_number TEXT NOT NULL,
    customer_gstin TEXT,
    tax_type TEXT CHECK (tax_type IN ('CGST_SGST', 'IGST')),
    total_taxable_value NUMERIC DEFAULT 0,
    total_tax_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

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
    total_amount NUMERIC
);

-- Enable RLS on new tables
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mg_vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables (authenticated users can access their workshop data)
CREATE POLICY "Workshop isolation" ON workshops 
    FOR ALL TO authenticated 
    USING (id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "User profiles access" ON user_profiles 
    FOR ALL TO authenticated 
    USING (user_id = auth.uid() OR workshop_id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    ));

CREATE POLICY "Parts catalog workshop isolation" ON parts_catalog 
    FOR ALL TO authenticated 
    USING (workshop_id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Labor catalog workshop isolation" ON labor_catalog 
    FOR ALL TO authenticated 
    USING (workshop_id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "MG contracts workshop isolation" ON mg_contracts 
    FOR ALL TO authenticated 
    USING (workshop_id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "MG vehicle logs workshop isolation" ON mg_vehicle_logs 
    FOR ALL TO authenticated 
    USING (contract_id IN (
        SELECT id FROM mg_contracts WHERE workshop_id IN (
            SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Invoices workshop isolation" ON invoices 
    FOR ALL TO authenticated 
    USING (workshop_id IN (
        SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Invoice items workshop isolation" ON invoice_items 
    FOR ALL TO authenticated 
    USING (invoice_id IN (
        SELECT id FROM invoices WHERE workshop_id IN (
            SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
        )
    ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workshops_gstin ON workshops(gstin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_workshop ON user_profiles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_parts_catalog_workshop ON parts_catalog(workshop_id);
CREATE INDEX IF NOT EXISTS idx_labor_catalog_workshop ON labor_catalog(workshop_id);
CREATE INDEX IF NOT EXISTS idx_mg_contracts_workshop ON mg_contracts(workshop_id);
CREATE INDEX IF NOT EXISTS idx_mg_vehicle_logs_contract ON mg_vehicle_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_mg_vehicle_logs_month ON mg_vehicle_logs(billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_card ON invoices(job_card_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
