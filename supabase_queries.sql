-- ============================================================================
-- Warranty Deck - Advanced SQL Queries, Views, Functions, Procedures, Triggers
-- ============================================================================
-- This file contains advanced SQL constructs for the DBMS course project
-- Run these in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEWS
-- ----------------------------------------------------------------------------

-- View 1: Active Warranties Summary
-- Shows all active warranties with user and receipt information
CREATE OR REPLACE VIEW active_warranties_view AS
SELECT 
    w.warranty_id,
    w.user_id,
    w.receipt_id,
    u.first_name,
    u.email,
    w.product_name,
    w.brand,
    w.warranty_start_date,
    w.warranty_end_date,
    w.warranty_type,
    w.warranty_number,
    w.status,
    r.store_name,
    r.total_amount,
    r.purchase_date,
    (w.warranty_end_date - CURRENT_DATE) AS days_remaining
FROM warranties w
INNER JOIN users u ON w.user_id = u.user_id
LEFT JOIN receipts r ON w.receipt_id = r.receipt_id
WHERE w.status = 'active'
    AND w.warranty_end_date >= CURRENT_DATE
ORDER BY w.warranty_end_date ASC;

-- View 2: User Dashboard Statistics
-- Aggregated statistics per user
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.user_id,
    u.email,
    u.first_name,
    COUNT(DISTINCT r.receipt_id) AS total_receipts,
    COUNT(DISTINCT w.warranty_id) AS total_warranties,
    COUNT(DISTINCT CASE 
        WHEN w.warranty_end_date >= CURRENT_DATE 
        THEN w.warranty_id 
    END) AS active_warranties,
    COUNT(DISTINCT CASE 
        WHEN w.warranty_end_date BETWEEN CURRENT_DATE 
            AND (CURRENT_DATE + INTERVAL '90 days')
        THEN w.warranty_id 
    END) AS expiring_soon_count,
    COALESCE(SUM(r.total_amount), 0) AS total_coverage_value,
    COALESCE(AVG(r.total_amount), 0) AS avg_receipt_amount
FROM users u
LEFT JOIN receipts r ON u.user_id = r.user_id
LEFT JOIN warranties w ON u.user_id = w.user_id
GROUP BY u.user_id, u.email, u.first_name;

-- View 3: Expiring Warranties (within 90 days)
-- Shows warranties expiring soon with details
CREATE OR REPLACE VIEW expiring_warranties_view AS
SELECT 
    w.warranty_id,
    w.user_id,
    u.first_name,
    u.email,
    w.product_name,
    w.brand,
    w.warranty_end_date,
    (w.warranty_end_date - CURRENT_DATE) AS days_until_expiry,
    CASE 
        WHEN (w.warranty_end_date - CURRENT_DATE) <= 30 THEN 'critical'
        WHEN (w.warranty_end_date - CURRENT_DATE) <= 60 THEN 'warning'
        ELSE 'attention'
    END AS urgency_level,
    r.store_name,
    r.total_amount
FROM warranties w
INNER JOIN users u ON w.user_id = u.user_id
LEFT JOIN receipts r ON w.receipt_id = r.receipt_id
WHERE w.status = 'active'
    AND w.warranty_end_date BETWEEN CURRENT_DATE 
        AND (CURRENT_DATE + INTERVAL '90 days')
ORDER BY w.warranty_end_date ASC;

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function 1: Calculate Warranty Days Remaining
-- Returns the number of days remaining for a warranty
CREATE OR REPLACE FUNCTION get_warranty_days_remaining(warranty_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    SELECT (warranty_end_date - CURRENT_DATE)::INTEGER
    INTO days_remaining
    FROM warranties
    WHERE warranty_id = warranty_id_param;
    
    RETURN COALESCE(days_remaining, 0);
END;
$$;

-- Function 2: Get User Total Coverage Value
-- Calculates total value of all receipts for a user
CREATE OR REPLACE FUNCTION get_user_total_coverage(user_id_param UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    total_value DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total_value
    FROM receipts
    WHERE user_id = user_id_param;
    
    RETURN total_value;
END;
$$;

-- Function 3: Check Warranty Expiry Status
-- Returns warranty status: 'active', 'expiring', 'expired'
CREATE OR REPLACE FUNCTION check_warranty_status(warranty_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    end_date DATE;
    days_left INTEGER;
    status_result TEXT;
BEGIN
    SELECT warranty_end_date
    INTO end_date
    FROM warranties
    WHERE warranty_id = warranty_id_param;
    
    IF end_date IS NULL THEN
        RETURN 'unknown';
    END IF;
    
    days_left := (end_date - CURRENT_DATE)::INTEGER;
    
    IF days_left < 0 THEN
        status_result := 'expired';
    ELSIF days_left <= 30 THEN
        status_result := 'expiring';
    ELSIF days_left <= 90 THEN
        status_result := 'warning';
    ELSE
        status_result := 'active';
    END IF;
    
    RETURN status_result;
END;
$$;

-- Function 4: Get Expiring Warranties Count for User
-- Counts warranties expiring within specified days
CREATE OR REPLACE FUNCTION get_expiring_warranties_count(
    user_id_param UUID,
    days_ahead INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    expiring_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO expiring_count
    FROM warranties
    WHERE user_id = user_id_param
        AND status = 'active'
        AND warranty_end_date BETWEEN CURRENT_DATE 
            AND (CURRENT_DATE + (days_ahead || ' days')::INTERVAL);
    
    RETURN COALESCE(expiring_count, 0);
END;
$$;

-- ----------------------------------------------------------------------------
-- STORED PROCEDURES
-- ----------------------------------------------------------------------------

-- Procedure 1: Create Warranty from Receipt
-- Automatically creates a warranty entry when a receipt is processed
CREATE OR REPLACE PROCEDURE create_warranty_from_receipt(
    p_receipt_id UUID,
    p_product_name TEXT,
    p_brand TEXT,
    p_warranty_type TEXT DEFAULT 'standard',
    p_warranty_months INTEGER DEFAULT 12,
    p_warranty_number TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_purchase_date DATE;
    v_warranty_start DATE;
    v_warranty_end DATE;
BEGIN
    -- Get receipt details
    SELECT user_id, purchase_date
    INTO v_user_id, v_purchase_date
    FROM receipts
    WHERE receipt_id = p_receipt_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Receipt not found';
    END IF;
    
    -- Calculate warranty dates
    v_warranty_start := COALESCE(v_purchase_date, CURRENT_DATE);
    v_warranty_end := v_warranty_start + (p_warranty_months || ' months')::INTERVAL;
    
    -- Insert warranty
    INSERT INTO warranties (
        user_id,
        receipt_id,
        product_name,
        brand,
        warranty_start_date,
        warranty_end_date,
        warranty_type,
        warranty_number,
        status,
        created_at
    ) VALUES (
        v_user_id,
        p_receipt_id,
        p_product_name,
        p_brand,
        v_warranty_start,
        v_warranty_end,
        p_warranty_type,
        p_warranty_number,
        'active',
        CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Warranty created successfully';
END;
$$;

-- Procedure 2: Update Warranty Status
-- Updates warranty status based on expiry date
CREATE OR REPLACE PROCEDURE update_warranty_statuses()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mark expired warranties
    UPDATE warranties
    SET status = 'expired'
    WHERE status = 'active'
        AND warranty_end_date < CURRENT_DATE;
    
    -- Log update
    RAISE NOTICE 'Warranty statuses updated. Expired warranties marked.';
END;
$$;

-- Procedure 3: Get User Dashboard Data
-- Retrieves all dashboard statistics for a user
CREATE OR REPLACE PROCEDURE get_user_dashboard(
    p_user_id UUID,
    OUT total_receipts INTEGER,
    OUT active_warranties INTEGER,
    OUT expiring_soon INTEGER,
    OUT total_coverage DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Total receipts
    SELECT COUNT(*)
    INTO total_receipts
    FROM receipts
    WHERE user_id = p_user_id;
    
    -- Active warranties
    SELECT COUNT(*)
    INTO active_warranties
    FROM warranties
    WHERE user_id = p_user_id
        AND status = 'active'
        AND warranty_end_date >= CURRENT_DATE;
    
    -- Expiring soon (90 days)
    SELECT COUNT(*)
    INTO expiring_soon
    FROM warranties
    WHERE user_id = p_user_id
        AND status = 'active'
        AND warranty_end_date BETWEEN CURRENT_DATE 
            AND (CURRENT_DATE + INTERVAL '90 days');
    
    -- Total coverage
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total_coverage
    FROM receipts
    WHERE user_id = p_user_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger Function 1: Auto-create user record on auth signup
-- Creates entry in users table when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        user_id,
        email,
        first_name,
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger: On auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger Function 2: Update warranty status when end date passes
-- Automatically updates warranty status when it expires
CREATE OR REPLACE FUNCTION update_expired_warranties()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- This runs on INSERT/UPDATE to check if warranty should be expired
    IF NEW.warranty_end_date < CURRENT_DATE AND NEW.status = 'active' THEN
        NEW.status := 'expired';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Before insert/update on warranties
DROP TRIGGER IF EXISTS check_warranty_expiry ON warranties;
CREATE TRIGGER check_warranty_expiry
    BEFORE INSERT OR UPDATE ON warranties
    FOR EACH ROW
    EXECUTE FUNCTION update_expired_warranties();

-- Trigger Function 3: Log receipt creation
-- Creates an audit log entry when receipt is created
CREATE OR REPLACE FUNCTION log_receipt_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- You can create an audit_log table if needed
    -- For now, we'll just update the upload_date
    IF NEW.upload_date IS NULL THEN
        NEW.upload_date := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Before insert on receipts
DROP TRIGGER IF EXISTS set_receipt_upload_date ON receipts;
CREATE TRIGGER set_receipt_upload_date
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION log_receipt_creation();

-- ----------------------------------------------------------------------------
-- ADVANCED QUERIES (Examples for DBMS Course)
-- ----------------------------------------------------------------------------

-- Query 1: Complex JOIN with aggregations
-- Get all receipts with their warranties and calculate total value per store
SELECT 
    r.store_name,
    COUNT(DISTINCT r.receipt_id) AS receipt_count,
    COUNT(DISTINCT w.warranty_id) AS warranty_count,
    SUM(r.total_amount) AS total_store_value,
    AVG(r.total_amount) AS avg_receipt_value,
    MAX(r.purchase_date) AS latest_purchase
FROM receipts r
LEFT JOIN warranties w ON r.receipt_id = w.receipt_id
WHERE r.user_id = 'USER_ID_HERE'  -- Replace with actual user_id
GROUP BY r.store_name
ORDER BY total_store_value DESC;

-- Query 2: Window Functions - Ranking warranties by expiry
-- Show warranties ranked by days until expiry
SELECT 
    w.warranty_id,
    w.product_name,
    w.warranty_end_date,
    (w.warranty_end_date - CURRENT_DATE) AS days_remaining,
    RANK() OVER (PARTITION BY w.user_id ORDER BY w.warranty_end_date ASC) AS expiry_rank,
    PERCENT_RANK() OVER (PARTITION BY w.user_id ORDER BY w.warranty_end_date ASC) AS expiry_percentile
FROM warranties w
WHERE w.user_id = 'USER_ID_HERE'  -- Replace with actual user_id
    AND w.status = 'active'
ORDER BY w.warranty_end_date ASC;

-- Query 3: Subquery with EXISTS
-- Find users who have warranties expiring in the next 30 days
SELECT DISTINCT
    u.user_id,
    u.email,
    u.first_name,
    COUNT(w.warranty_id) AS expiring_count
FROM users u
INNER JOIN warranties w ON u.user_id = w.user_id
WHERE EXISTS (
    SELECT 1
    FROM warranties w2
    WHERE w2.user_id = u.user_id
        AND w2.status = 'active'
        AND w2.warranty_end_date BETWEEN CURRENT_DATE 
            AND (CURRENT_DATE + INTERVAL '30 days')
)
GROUP BY u.user_id, u.email, u.first_name
HAVING COUNT(w.warranty_id) > 0;

-- Query 4: CTE (Common Table Expression)
-- Calculate warranty statistics using CTEs
WITH warranty_stats AS (
    SELECT 
        user_id,
        COUNT(*) AS total_warranties,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_count,
        COUNT(CASE WHEN warranty_end_date < CURRENT_DATE THEN 1 END) AS expired_count,
        COUNT(CASE 
            WHEN warranty_end_date BETWEEN CURRENT_DATE 
                AND (CURRENT_DATE + INTERVAL '90 days')
            THEN 1 
        END) AS expiring_count
    FROM warranties
    GROUP BY user_id
),
receipt_stats AS (
    SELECT 
        user_id,
        COUNT(*) AS total_receipts,
        SUM(total_amount) AS total_value
    FROM receipts
    GROUP BY user_id
)
SELECT 
    u.user_id,
    u.email,
    u.first_name,
    COALESCE(ws.total_warranties, 0) AS total_warranties,
    COALESCE(ws.active_count, 0) AS active_warranties,
    COALESCE(ws.expiring_count, 0) AS expiring_warranties,
    COALESCE(rs.total_receipts, 0) AS total_receipts,
    COALESCE(rs.total_value, 0) AS total_coverage
FROM users u
LEFT JOIN warranty_stats ws ON u.user_id = ws.user_id
LEFT JOIN receipt_stats rs ON u.user_id = rs.user_id
ORDER BY u.created_at DESC;

-- Query 5: UNION Query
-- Combine active warranties and receipts for user timeline
SELECT 
    'receipt' AS item_type,
    receipt_id::TEXT AS item_id,
    store_name AS item_name,
    purchase_date AS item_date,
    total_amount AS item_value,
    file_url AS item_url
FROM receipts
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id

UNION ALL

SELECT 
    'warranty' AS item_type,
    warranty_id::TEXT AS item_id,
    product_name AS item_name,
    warranty_start_date AS item_date,
    NULL AS item_value,
    file_url AS item_url
FROM warranties
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
    AND status = 'active'
ORDER BY item_date DESC;

-- ============================================================================
-- END OF SQL QUERIES
-- ============================================================================

