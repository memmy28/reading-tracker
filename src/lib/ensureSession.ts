import { supabase } from './supabaseClient'

export async function ensureSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session

  const { data: signInData, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return signInData.session
}
