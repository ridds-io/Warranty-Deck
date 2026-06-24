-- =============================================================================
-- WarrantyDeck — Minimal Schema Updates (Safe Version)
-- Run these essential updates without views
-- =============================================================================

-- 1. Make product_id nullable
ALTER TABLE public.receipt_items 
ALTER COLUMN product_id DROP NOT NULL;

-- 2. Ensure category_name column exists
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS category_name text;

-- 3. Create index for category_name
CREATE INDEX IF NOT EXISTS idx_receipts_category_name 
ON public.receipts(category_name);

-- 4. Ensure notes column exists
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS notes text;

-- 5. Verify folder_type constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'receipts_folder_type_check'
      AND conrelid = 'public.receipts'::regclass
  ) THEN
    ALTER TABLE public.receipts DROP CONSTRAINT receipts_folder_type_check;
  END IF;
  
  ALTER TABLE public.receipts 
  ADD CONSTRAINT receipts_folder_type_check 
  CHECK (folder_type = ANY (ARRAY['vault'::text, 'memorabilia'::text, 'reimbursement'::text]));
END $$;

-- 6. Add warranty_benefits and ai_summary to warranties if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'warranties'
      AND column_name = 'warranty_benefits'
  ) THEN
    ALTER TABLE public.warranties ADD COLUMN warranty_benefits text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'warranties'
      AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE public.warranties ADD COLUMN ai_summary text;
  END IF;
END $$;

-- 7. Add indexes for notifications (if table exists with correct types)
DO $$
BEGIN
  -- Check if notifications table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_status 
    ON public.notifications(user_id, status);
    
    CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_date 
    ON public.notifications(scheduled_date) 
    WHERE status = 'pending';
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Schema updates completed successfully!' as status;

-- Check key columns
SELECT 
  'receipts.category_name' as column_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'receipts' 
      AND column_name = 'category_name'
  ) as exists;

SELECT 
  'receipts.notes' as column_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'receipts' 
      AND column_name = 'notes'
  ) as exists;

SELECT 
  'receipt_items.product_id nullable' as check_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'receipt_items' 
  AND column_name = 'product_id';
