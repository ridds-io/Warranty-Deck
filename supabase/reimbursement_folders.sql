-- =============================================================================
-- WarrantyDeck — Reimbursement Folders Feature
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Create reimbursement_folders table
CREATE TABLE IF NOT EXISTS public.reimbursement_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'submitted'))
);

-- 2. Add reimbursement_folder_id to receipts table
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS reimbursement_folder_id uuid REFERENCES public.reimbursement_folders(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reimbursement_folders_user_id 
ON public.reimbursement_folders(user_id);

CREATE INDEX IF NOT EXISTS idx_reimbursement_folders_status 
ON public.reimbursement_folders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_receipts_reimbursement_folder 
ON public.receipts(reimbursement_folder_id) 
WHERE folder_type = 'reimbursement';

-- 4. Enable Row Level Security
ALTER TABLE public.reimbursement_folders ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own reimbursement folders" ON public.reimbursement_folders;
DROP POLICY IF EXISTS "Users can insert own reimbursement folders" ON public.reimbursement_folders;
DROP POLICY IF EXISTS "Users can update own reimbursement folders" ON public.reimbursement_folders;
DROP POLICY IF EXISTS "Users can delete own reimbursement folders" ON public.reimbursement_folders;

CREATE POLICY "Users can view own reimbursement folders"
  ON public.reimbursement_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reimbursement folders"
  ON public.reimbursement_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reimbursement folders"
  ON public.reimbursement_folders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reimbursement folders"
  ON public.reimbursement_folders FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimbursement_folders TO authenticated;

-- 7. Create helpful view for folder summaries
CREATE OR REPLACE VIEW reimbursement_folder_summaries AS
SELECT 
  rf.id,
  rf.user_id,
  rf.folder_name,
  rf.description,
  rf.status,
  rf.created_at,
  rf.updated_at,
  COUNT(r.id) as receipt_count,
  COALESCE(SUM(r.total_amount), 0) as total_amount
FROM reimbursement_folders rf
LEFT JOIN receipts r ON rf.id = r.reimbursement_folder_id AND r.folder_type = 'reimbursement'
GROUP BY rf.id, rf.user_id, rf.folder_name, rf.description, rf.status, rf.created_at, rf.updated_at;

-- 8. Grant view permissions
GRANT SELECT ON reimbursement_folder_summaries TO authenticated;

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reimbursement_folder_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 10. Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS update_reimbursement_folder_timestamp ON public.reimbursement_folders;
CREATE TRIGGER update_reimbursement_folder_timestamp
  BEFORE UPDATE ON public.reimbursement_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_reimbursement_folder_timestamp();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check the new table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reimbursement_folders'
ORDER BY ordinal_position;

-- Verify receipts table has the new column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'receipts'
  AND column_name = 'reimbursement_folder_id';

-- Test the view
SELECT * FROM reimbursement_folder_summaries LIMIT 1;
