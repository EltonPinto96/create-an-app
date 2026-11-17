import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Kusanga Kitadi] Variáveis de ambiente do Supabase não configuradas. ' +
    'A aplicação funciona sem backend. Para activar, define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local'
  )
}

// Cria o cliente Supabase apenas se as variáveis estiverem disponíveis.
// Caso contrário, exporta null para que os hooks possam tratar graciosamente.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient<Database>>)

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey)
