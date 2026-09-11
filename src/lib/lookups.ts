import { supabase } from './supabaseClient'

export type LookupTable = 'authors' | 'series' | 'genres' | 'formats' | 'sources' | 'languages'

export async function fetchLookupNames(table: LookupTable): Promise<string[]> {
  const { data, error } = await supabase.from(table).select('name').order('name')
  if (error) throw error
  return data.map((row) => row.name as string)
}

export async function findOrCreateLookup(
  table: LookupTable,
  name: string,
  userId: string,
): Promise<string> {
  const trimmed = name.trim()

  const { data: existing, error: findError } = await supabase
    .from(table)
    .select('id')
    .ilike('name', trimmed)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id as string

  const { data: created, error: insertError } = await supabase
    .from(table)
    .insert({ name: trimmed, user_id: userId })
    .select('id')
    .single()
  if (insertError) throw insertError
  return created.id as string
}
