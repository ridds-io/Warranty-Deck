// =============================================================================
// WARRANTYDECK — SUPABASE CLIENT
// src/lib/supabase.js
//
// This file does one job: create the Supabase client and export it.
// Every hook, page, and component that needs to talk to the database
// imports `supabase` from this file.
//
// Rule: NEVER create a new Supabase client anywhere else in the app.
// One client, one connection, shared everywhere.
// =============================================================================

import { createClient } from '@supabase/supabase-js'

// -----------------------------------------------------------------------------
// Environment variables
//
// These come from your .env file at the project root:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJh...
//
// Vite exposes .env variables via import.meta.env (not process.env like Node).
// Only variables prefixed with VITE_ are exposed to the browser — this is a
// security feature. Never put secret keys in VITE_ variables.
//
// The anon key is safe to expose — it's designed to be public. Supabase's
// Row Level Security (RLS) policies control what each user can actually access.
// -----------------------------------------------------------------------------

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly in development if env vars are missing.
// Better to crash with a clear message than silently fail later.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[WarrantyDeck] Missing Supabase environment variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

// -----------------------------------------------------------------------------
// Create the client
//
// Options we're setting:
//
// auth.autoRefreshToken — Supabase sessions expire after 1 hour by default.
//   This tells the client to automatically refresh the token in the background
//   so users never get randomly logged out mid-session.
//
// auth.persistSession — stores the session in localStorage so the user stays
//   logged in across page refreshes and browser restarts.
//
// auth.detectSessionInUrl — when Google OAuth redirects back to your app,
//   the session token is in the URL hash (#access_token=...). This option
//   tells Supabase to detect and process it automatically.
//   Without this, Google login would redirect back but the user wouldn't
//   be recognised as logged in.
// -----------------------------------------------------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
  },
})

// =============================================================================
// STORAGE HELPERS
//
// Supabase Storage is where receipt images and PDFs are kept.
// These helpers abstract the bucket name so we don't hardcode 'receipts'
// in every component — change it here and it updates everywhere.
// =============================================================================

// The name of your Supabase Storage bucket for receipt files.
// Create this bucket in your Supabase dashboard under Storage → New Bucket.
// Set it to private (authenticated users only).
export const RECEIPTS_BUCKET = 'receipts'

/**
 * Get a signed (temporary) public URL for a receipt file.
 * Signed URLs expire after `expiresIn` seconds (default: 1 hour).
 * 
 * Why signed URLs? The receipts bucket is private — direct URLs won't work.
 * A signed URL is a time-limited URL that proves the current user is allowed
 * to view this file without exposing permanent access.
 *
 * @param {string} filePath   - The file path inside the bucket (e.g. 'user-id/filename.jpg')
 * @param {number} expiresIn  - Seconds until the URL expires (default: 3600 = 1hr)
 * @returns {Promise<string|null>} The signed URL, or null if it fails
 */
export async function getReceiptFileUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase
    .storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    console.error('[WarrantyDeck] Failed to get signed URL:', error.message)
    return null
  }

  return data.signedUrl
}

/**
 * Upload a receipt file to Supabase Storage.
 * Files are stored at: receipts/{userId}/{timestamp}-{filename}
 * This path structure keeps each user's files in their own folder.
 *
 * @param {string} userId   - The authenticated user's ID (from auth.users)
 * @param {File}   file     - The File object from the browser file input
 * @returns {Promise<{path: string, url: string}|null>}
 */
export async function uploadReceiptFile(userId, file) {
  // Build a unique file path to avoid collisions if the same filename
  // is uploaded twice. Timestamp prefix guarantees uniqueness.
  const timestamp = Date.now()
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') // sanitise filename
  const filePath  = `${userId}/${timestamp}-${safeName}`

  const { error } = await supabase
    .storage
    .from(RECEIPTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',       // browser can cache for 1 hour
      upsert: false,              // don't overwrite existing files
      contentType: file.type,     // preserve MIME type (image/jpeg, application/pdf etc.)
    })

  if (error) {
    console.error('[WarrantyDeck] File upload failed:', error.message)
    return null
  }

  // Immediately get a signed URL for the freshly uploaded file
  const url = await getReceiptFileUrl(filePath)
  return { path: filePath, url }
}

/**
 * Delete a receipt file from storage.
 * Called when a user deletes a receipt record — cleans up the file too.
 *
 * @param {string} filePath - The file path inside the bucket
 * @returns {Promise<boolean>} true if deleted, false if failed
 */
export async function deleteReceiptFile(filePath) {
  const { error } = await supabase
    .storage
    .from(RECEIPTS_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('[WarrantyDeck] File deletion failed:', error.message)
    return false
  }

  return true
}

// =============================================================================
// DATABASE QUERY HELPERS
//
// These are thin wrappers around common Supabase queries.
// They standardise error handling so every query behaves the same way.
//
// Pattern: every function returns { data, error }.
// Callers check: if (error) { show error } else { use data }
// =============================================================================

/** True when the profile row simply does not exist yet (not a permissions failure). */
export function isProfileNotFoundError(error) {
  if (!error) return false
  return error.code === 'PGRST116' || /0 rows/i.test(error.message ?? '')
}

/**
 * Fetch a profile row by auth user id (does not call getUser — avoids session timing races).
 */
export async function fetchUserProfileByUserId(userId) {
  return supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
}

/**
 * Fetch the current authenticated user's profile from user_profiles.
 *
 * @param {string} [userId] - Optional; pass from AuthContext to avoid getUser() races after login.
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchUserProfile(userId) {
  if (userId) return fetchUserProfileByUserId(userId)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return { data: null, error: authError }
  if (!user) return { data: null, error: { message: 'Not authenticated' } }

  return fetchUserProfileByUserId(user.id)
}

/**
 * Create or update a user's profile.
 * Uses upsert — inserts if the row doesn't exist, updates if it does.
 *
 * @param {string} userId
 * @param {object} profileData - { first_name, last_name, avatar_url, theme, ... }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function upsertUserProfile(userId, profileData) {
  const row = {
    user_id: userId,
    first_name: profileData.first_name ?? '',
    last_name:  profileData.last_name ?? '',
    theme:      profileData.theme ?? 'light',
  }

  if (profileData.avatar_url) {
    row.avatar_url = profileData.avatar_url
  }

  return supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single()
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Absolute site origin for auth redirects. Must include https:// — if Supabase's
 * Site URL is set to a hostname without https:// (or the wrong Vercel project),
 * redirects become https://<project>.supabase.co/your-hostname → "requested path is invalid".
 *
 * Set VITE_SITE_URL in Vercel/local .env to your full production URL.
 */
export function getAppOrigin() {
  const configured = import.meta.env.VITE_SITE_URL?.trim()
  if (configured) {
    const withScheme = /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`
    return withScheme.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin
  }

  return 'http://localhost:5173'
}

/**
 * Where Supabase sends users after Google OAuth or email magic links.
 * Uses site root so Vercel always serves the SPA; AuthSessionHandler reads tokens from the URL.
 */
export function getAuthRedirectUrl() {
  return `${getAppOrigin()}/`
}

/**
 * Read and clear an auth error left in the URL after a failed OAuth/magic-link redirect.
 * Supabase appends #error=...&error_description=... on failure.
 */
export function consumeAuthCallbackError() {
  const raw = window.location.hash.replace(/^#/, '') || window.location.search.replace(/^\?/, '')
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const description = params.get('error_description') || params.get('error')
  if (!description) return null

  window.history.replaceState(null, '', window.location.pathname)
  return decodeURIComponent(description.replace(/\+/g, ' '))
}

/**
 * Sign in with Google OAuth.
 * Redirects the user to Google's login page.
 * On return, Supabase handles the session automatically (detectSessionInUrl: true).
 *
 * redirectTo: where Supabase sends the user after successful Google auth.
 * In development this is localhost. In production, change to your domain.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      queryParams: {
        // Request these scopes from Google — we only need basic profile info
        access_type: 'offline',
        prompt: 'select_account', // always show account picker, even if already logged in
      },
    },
  })

  if (error) {
    console.error('[WarrantyDeck] Google sign-in failed:', error.message)
    return { error }
  }
  return { error: null }
}

/**
 * Sign in with email (magic link).
 * Sends a one-time link that signs the user in on click.
 */
export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getAuthRedirectUrl(),
    },
  })

  if (error) {
    console.error('[WarrantyDeck] Email sign-in failed:', error.message)
    return { error }
  }

  return { error: null }
}

/**
 * Sign out the current user.
 * Clears the session from localStorage and Supabase's auth state.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('[WarrantyDeck] Sign out failed:', error.message)
    return { error }
  }
  return { error: null }
}

/**
 * Get the currently logged-in user synchronously from the cached session.
 * Use this for quick checks — it doesn't make a network request.
 * For the authoritative current user, use supabase.auth.getUser() instead.
 *
 * @returns {object|null} The user object, or null if not logged in
 */
export function getCurrentUser() {
  return supabase.auth.getSession().then(({ data: { session } }) => {
    return session?.user ?? null
  })
}
