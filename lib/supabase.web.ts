/**
 * Supabase client — WEB platform override
 *
 * Metro resolves `lib/supabase.web.ts` on web and `lib/supabase.ts` on
 * iOS/Android. This file avoids importing AsyncStorage (which calls
 * `window` at module load and crashes Node SSR).
 *
 * SSR guard: `typeof window !== 'undefined'` ensures no storage access
 * happens during server rendering, only in the browser.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// localStorage-backed storage — safe to pass even during SSR because
// Supabase defers calls through the storage object, not at createClient time.
const webStorage =
  typeof window !== 'undefined'
    ? {
        getItem:    (key: string) =>
          Promise.resolve(window.localStorage.getItem(key)),
        setItem:    (key: string, value: string) => {
          window.localStorage.setItem(key, value)
          return Promise.resolve()
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key)
          return Promise.resolve()
        },
      }
    : undefined   // SSR: no storage — session will not persist server-side

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            webStorage,
    autoRefreshToken:   typeof window !== 'undefined',
    persistSession:     typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
})
