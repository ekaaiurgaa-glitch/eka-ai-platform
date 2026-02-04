-- EKA-AI Storage Bucket Policies
-- Governed Automobile Intelligence System for Go4Garage Private Limited
-- Execute this SQL in your Supabase SQL Editor AFTER creating the bucket

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET: pdi-evidence
-- ═══════════════════════════════════════════════════════════════
-- 
-- MANUAL SETUP REQUIRED:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named: pdi-evidence
-- 3. Set bucket to PUBLIC (for read access)
-- 4. Then execute the policies below

-- ═══════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'pdi-evidence');

-- Policy: Allow public read access (for evidence URLs)
CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'pdi-evidence');

-- Policy: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'pdi-evidence')
    WITH CHECK (bucket_id = 'pdi-evidence');

-- Policy: Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'pdi-evidence');

-- ═══════════════════════════════════════════════════════════════
-- ALTERNATIVE: Using Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════
-- If you prefer using the Dashboard:
-- 1. Go to Storage > pdi-evidence bucket > Policies
-- 2. Add policy for INSERT: authenticated users can upload
-- 3. Add policy for SELECT: public access (anonymous users can read)
-- 4. Add policy for UPDATE: authenticated users can update
-- 5. Add policy for DELETE: authenticated users can delete
