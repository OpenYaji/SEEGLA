/**
 * Supabase client for SEEGLA-MOBILE
 *
 * Required installs (run once):
 *   npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
 *
 * Required env vars in .env.local:
 *   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * These must match the values used in SEEGLA-WEB so both apps share the same
 * Supabase project and database.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.\n' +
    'Create a .env.local file in SEEGLA-MOBILE/ with these values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
})
