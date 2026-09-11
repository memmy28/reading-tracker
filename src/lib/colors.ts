import { supabase } from './supabaseClient'

export interface ColorOption {
  id: string
  name: string
  hex: string
  textColor: 'black' | 'white'
}

export async function fetchColors(): Promise<ColorOption[]> {
  const { data, error } = await supabase
    .from('colors')
    .select('id, name, hex, text_color, sort_order')
    .order('sort_order')
  if (error) throw error
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    hex: row.hex as string,
    textColor: row.text_color as 'black' | 'white',
  }))
}
