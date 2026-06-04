-- =============================================================================
-- WarrantyDeck — user_profiles setup (run once in Supabase → SQL Editor)
-- =============================================================================
-- Fixes empty user_profiles after login: RLS policies + auto-create on sign-up.
--
-- Check your table first (Table Editor → user_profiles):
--   • Most setups use user_id (uuid) = auth.users.id  ← script below assumes this
--   • If your PK column is named id instead, see the alternate trigger at the bottom

-- Optional columns (safe to re-run):
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Ensure user_id exists and references auth (skip if you already have this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Auto-create profile when a new auth user is created (works even if the app insert fails)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fname text;
  lname text;
BEGIN
  fname := COALESCE(
    NEW.raw_user_meta_data->>'given_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
    split_part(NEW.email, '@', 1),
    ''
  );
  lname := COALESCE(
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(trim(substring(
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
      FROM position(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ' ') || ' ') + 1
    )), ''),
    ''
  );

  INSERT INTO public.user_profiles (user_id, first_name, last_name, theme)
  VALUES (NEW.id, fname, lname, 'light')
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.user_profiles.first_name),
    last_name  = COALESCE(EXCLUDED.last_name, public.user_profiles.last_name);

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for users who already signed up before this script:
INSERT INTO public.user_profiles (user_id, first_name, last_name, theme)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'given_name', split_part(u.email, '@', 1), ''),
  COALESCE(u.raw_user_meta_data->>'family_name', ''),
  'light'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.id
);
