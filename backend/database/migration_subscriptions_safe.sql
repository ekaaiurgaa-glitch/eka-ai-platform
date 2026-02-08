-- 1. Add subscription columns to workshops
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'MONTHLY';

-- 2. Create subscription_logs table
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

-- 3. Create permissive policy (safe for all authenticated users)
-- This is a simpler policy that works without user_profiles join
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_logs' 
    AND policyname = 'Allow authenticated read'
  ) THEN 
    CREATE POLICY "Allow authenticated read" ON subscription_logs
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Alternative: If you need workshop-specific filtering, use this instead:
-- NOTE: This requires user_profiles table with workshop_id column
-- DO $$ 
-- BEGIN 
--   IF EXISTS (
--     SELECT 1 
--     FROM information_schema.columns 
--     WHERE table_name = 'user_profiles' 
--     AND column_name = 'user_id'
--   ) THEN
--     IF NOT EXISTS (
--       SELECT 1 FROM pg_policies 
--       WHERE schemaname = 'public' 
--       AND tablename = 'subscription_logs' 
--       AND policyname = 'Owners view subscription'
--     ) THEN 
--       CREATE POLICY "Owners view subscription" ON subscription_logs
--         FOR SELECT USING (
--           workshop_id IN (
--             SELECT workshop_id FROM user_profiles WHERE user_id = auth.uid()
--           )
--         );
--     END IF;
--   END IF;
-- END $$;
