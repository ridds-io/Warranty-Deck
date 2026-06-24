-- =============================================================================
-- Fix Notifications Table Type Mismatch
-- =============================================================================
-- Problem: notifications.receipt_id is INTEGER but receipts.id is UUID
-- Solution: Recreate notifications table with correct types
-- 
-- ⚠️ WARNING: This will delete all existing notifications!
-- Only run this if you don't have important notification data
-- =============================================================================

-- 1. Drop the old notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 2. Recreate with correct types
CREATE TABLE public.notifications (
  notification_id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id uuid REFERENCES public.receipts(id) ON DELETE CASCADE,
  warranty_id uuid REFERENCES public.warranties(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('return_reminder', 'warranty_expiry', 'receipt_uploaded')),
  delivery_method text CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'push')),
  title text,
  message text,
  scheduled_date date,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Add indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled_date ON public.notifications(scheduled_date) WHERE status = 'pending';
CREATE INDEX idx_notifications_receipt_id ON public.notifications(receipt_id);
CREATE INDEX idx_notifications_warranty_id ON public.notifications(warranty_id);

-- 4. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_notification_id_seq TO authenticated;

-- 7. Create the pending_notifications view (now that types match)
CREATE OR REPLACE VIEW pending_notifications AS
SELECT 
  n.notification_id,
  n.user_id,
  n.receipt_id,
  n.warranty_id,
  n.notification_type,
  n.delivery_method,
  n.title,
  n.message,
  n.scheduled_date,
  n.status,
  COALESCE(r.store_name, 'Unknown') as store_name,
  r.purchase_date,
  w.product_name as warranty_product,
  w.warranty_end_date
FROM notifications n
LEFT JOIN receipts r ON n.receipt_id = r.id
LEFT JOIN warranties w ON n.warranty_id = w.id
WHERE n.status = 'pending'
  AND n.scheduled_date <= CURRENT_DATE
ORDER BY n.scheduled_date;

-- 8. Grant view permissions
GRANT SELECT ON pending_notifications TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check the new table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Verify receipt_id is now uuid
SELECT 
  'notifications.receipt_id is uuid' as check_name,
  data_type = 'uuid' as passed
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
  AND column_name = 'receipt_id';

SELECT 'Notifications table recreated successfully!' as status;
