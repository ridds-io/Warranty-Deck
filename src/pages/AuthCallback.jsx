// Legacy path — some Supabase redirect URLs may still point here.
// AuthSessionHandler does the real work; this route only exists so /auth/callback 404s.

import AuthSessionHandler from '../components/AuthSessionHandler'

export default function AuthCallback() {
  return (
    <AuthSessionHandler>
      <div />
    </AuthSessionHandler>
  )
}
