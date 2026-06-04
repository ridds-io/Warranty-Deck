-- Run in Supabase → SQL Editor if user_profiles stays empty after login.
-- Requires: public.user_profiles.user_id (uuid) references auth.users(id).

-- Optional columns (skip if you already have them):
-- ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light';
-- ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
