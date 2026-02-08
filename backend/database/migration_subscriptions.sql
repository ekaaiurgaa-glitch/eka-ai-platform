-- 1. Add subscription columns to workshops
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE', -- 'FREE' or 'PRO'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAST_DUE', 'CANCELLED'
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'MONTHLY';

-- 2. Audit log for subscription changes
-- Note: workshop_id is UUID to match workshops.id
CREATE TABLE IF NOT EXISTS subscription_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES workshops(id),
    previous_plan TEXT,
    new_plan TEXT,
    amount DECIMAL(10,2),
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscription_logs
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create policy conditionally (PostgreSQL doesn't support IF NOT EXISTS for policies)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_logs' 
    AND policyname = 'Owners view subscription'
  ) THEN 
    CREATE POLICY "Owners view subscription" ON subscription_logs
      FOR SELECT USING (
        workshop_id IN (
          SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
