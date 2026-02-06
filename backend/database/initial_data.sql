-- ═══════════════════════════════════════════════════════════════
-- EKA-AI INITIAL DATA SETUP
-- Run this AFTER deploying schema_complete.sql
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. CREATE DEMO WORKSHOP
-- ─────────────────────────────────────────
INSERT INTO workshops (
    name, 
    gstin, 
    state_code, 
    address, 
    city, 
    pincode,
    phone, 
    email,
    settings
)
VALUES (
    'Go4Garage Demo Workshop',
    '27AABCU9603R1ZX',
    '27',
    'Shop No. 15, Main Road, Andheri East',
    'Mumbai',
    '400069',
    '+91-9876543210',
    'admin@go4garage.com',
    '{"invoice_prefix": "G4G", "tax_enabled": true}'::jsonb
)
RETURNING id, name, gstin, created_at;

-- ⚠️ SAVE THE WORKSHOP ID FROM ABOVE!
-- Replace <WORKSHOP_ID> below with the actual UUID

-- ─────────────────────────────────────────
-- 2. CREATE DEMO VEHICLES
-- ─────────────────────────────────────────
INSERT INTO vehicles (
    workshop_id,
    registration_number,
    brand,
    model,
    year,
    fuel_type,
    vin,
    owner_name,
    owner_phone
)
VALUES
(
    '<WORKSHOP_ID>',
    'MH01AB1234',
    'Maruti',
    'Swift',
    2020,
    'Petrol',
    'MA3ERLF1S00000001',
    'Rahul Sharma',
    '+91-9876543210'
),
(
    '<WORKSHOP_ID>',
    'MH02CD5678',
    'Hyundai',
    'Creta',
    2021,
    'Diesel',
    'MALNCE81KK000002',
    'Priya Patel',
    '+91-9876543211'
),
(
    '<WORKSHOP_ID>',
    'MH12EF9012',
    'Tata',
    'Nexon',
    2022,
    'Electric',
    'MAT734567890123',
    'Amit Kumar',
    '+91-9876543212'
)
RETURNING id, registration_number, brand, model;

-- ─────────────────────────────────────────
-- 3. CREATE PARTS CATALOG (SAMPLE DATA)
-- ─────────────────────────────────────────
INSERT INTO parts_catalog (
    workshop_id,
    part_code,
    description,
    hsn_code,
    gst_rate,
    price_min,
    price_max,
    stock_qty
)
VALUES
(
    '<WORKSHOP_ID>',
    'BRK-PAD-F-SW',
    'Brake Pads Front - Maruti Swift',
    '87083010',
    28.0,
    1800.00,
    2500.00,
    10
),
(
    '<WORKSHOP_ID>',
    'OIL-ENG-5W30',
    'Engine Oil 5W-30 Synthetic (4L)',
    '27101990',
    28.0,
    2200.00,
    3200.00,
    25
),
(
    '<WORKSHOP_ID>',
    'FLT-AIR-UNIV',
    'Air Filter Universal',
    '84213990',
    28.0,
    350.00,
    650.00,
    30
),
(
    '<WORKSHOP_ID>',
    'BAT-12V-55AH',
    'Battery 12V 55Ah',
    '85071000',
    28.0,
    4500.00,
    6500.00,
    8
)
RETURNING part_code, description, price_min, price_max;

-- ─────────────────────────────────────────
-- 4. CREATE LABOR CATALOG (SAMPLE DATA)
-- ─────────────────────────────────────────
INSERT INTO labor_catalog (
    workshop_id,
    service_code,
    description,
    sac_code,
    gst_rate,
    standard_rate,
    estimated_hours,
    skill_level
)
VALUES
(
    '<WORKSHOP_ID>',
    'SRV-OIL-CHG',
    'Engine Oil Change Service',
    '998714',
    18.0,
    500.00,
    0.5,
    'BASIC'
),
(
    '<WORKSHOP_ID>',
    'SRV-BRK-SVC',
    'Brake Service Complete',
    '998714',
    18.0,
    1200.00,
    2.0,
    'INTERMEDIATE'
),
(
    '<WORKSHOP_ID>',
    'SRV-ENG-DIG',
    'Engine Diagnostic',
    '998714',
    18.0,
    800.00,
    1.0,
    'ADVANCED'
),
(
    '<WORKSHOP_ID>',
    'SRV-GEN-INSP',
    'General Inspection',
    '998714',
    18.0,
    300.00,
    0.5,
    'BASIC'
)
RETURNING service_code, description, standard_rate;

-- ─────────────────────────────────────────
-- 5. CREATE MG CONTRACT (SAMPLE)
-- ─────────────────────────────────────────
INSERT INTO mg_contracts (
    workshop_id,
    fleet_name,
    contract_start_date,
    contract_end_date,
    assured_km_per_year,
    rate_per_km,
    excess_rate_per_km,
    billing_cycle_months
)
VALUES
(
    '<WORKSHOP_ID>',
    'ABC Logistics Fleet',
    '2024-01-01',
    '2025-12-31',
    36000,
    12.50,
    10.00,
    1
)
RETURNING id, fleet_name, assured_km_per_year, rate_per_km;

-- ─────────────────────────────────────────
-- 6. VERIFY DATA
-- ─────────────────────────────────────────
-- Check workshop
SELECT id, name, gstin FROM workshops;

-- Check vehicles
SELECT id, registration_number, brand, model FROM vehicles;

-- Check parts catalog
SELECT COUNT(*) as parts_count FROM parts_catalog;

-- Check labor catalog
SELECT COUNT(*) as labor_count FROM labor_catalog;

-- Check MG contracts
SELECT id, fleet_name FROM mg_contracts;

-- ═══════════════════════════════════════════════════════════════
-- NEXT STEPS:
-- 1. Create user in Authentication → Users
-- 2. Create user_profile linking to workshop
-- 3. Generate JWT token for API testing
-- ═══════════════════════════════════════════════════════════════
