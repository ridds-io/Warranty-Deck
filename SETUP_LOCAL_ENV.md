# Setting Up Local Environment Variables

## Problem: "Failed to fetch" Error

This error occurs because Supabase environment variables are not set locally. The app is trying to connect to Supabase but can't because it's using placeholder values.

## Solution: Create `.env.local` file

1. **Create a file named `.env.local` in the root directory** (same level as `package.json`)

2. **Add your Supabase credentials:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://uzntsawsxztgkeexvbjt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bnRzYXdzeHp0Z2tlZXh2Ymp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTU2MTEsImV4cCI6MjA3NzY3MTYxMX0.60SOHTUxk5R0W1qz9UAPT5u-yZO2dJCJ7V2Li3cfIWs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bnRzYXdzeHp0Z2tlZXh2Ymp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5NTYxMSwiZXhwIjoyMDc3NjcxNjExfQ.D3REHzoVbM8mvhJs928BX4OZ7f364ZwN0rzSruEnLAY
```

3. **Restart your dev server:**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Important Notes

- ✅ `.env.local` is already in `.gitignore` (won't be pushed to GitHub)
- ✅ The file should be in the **root directory** (where `package.json` is)
- ✅ After creating the file, you **must restart** the Next.js dev server
- ✅ Use `npm run dev` (not `npm start`) for development with environment variables

## Verification

After creating `.env.local` and restarting:

1. The signup/login pages should work
2. You should be able to create accounts
3. No more "Failed to fetch" errors

## For Production (Vercel)

When deploying to Vercel, add these same environment variables in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

Vercel will use them at runtime automatically.

