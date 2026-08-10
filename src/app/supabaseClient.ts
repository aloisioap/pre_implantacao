import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Supabase URL is required. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env.local file.');
}

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is required. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)