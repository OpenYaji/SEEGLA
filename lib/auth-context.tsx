/**
 * Auth context for SEEGLA-MOBILE
 * Ported from SEEGLA-WEB/lib/auth-context.tsx — same Supabase schema, same
 * User shape. Replaces Next.js 'use client' with standard React.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Types — kept identical to web so the same Supabase queries work
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id:          string
  email?:      string
  full_name?:  string
  role:        'employee' | 'hr_admin' | 'system_admin'
  org_id:      string
  avatar_url?: string
}

interface AuthContextType {
  session:   Session | null
  user:      User | null
  isLoading: boolean
  signOut:   () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mapUserData(userData: Record<string, unknown>): User {
  return {
    id:         userData.id         as string,
    email:      userData.email      as string | undefined,
    full_name:  userData.full_name  as string | undefined,
    role:       userData.role       as User['role'],
    org_id:     userData.org_id     as string,
    avatar_url: userData.avatar_url as string | undefined,
  }
}

function fallbackUser(sessionUser: Record<string, unknown>): User {
  const meta = (sessionUser.user_metadata ?? {}) as Record<string, unknown>
  return {
    id:         sessionUser.id    as string,
    email:      sessionUser.email as string | undefined,
    full_name:  (meta.full_name  as string | undefined) ?? (sessionUser.email as string | undefined),
    role:       (meta.role       as User['role'])       ?? 'employee',
    org_id:     (meta.org_id     as string | undefined) ?? '',
    avatar_url: meta.avatar_url  as string | undefined,
  }
}

async function fetchUserProfile(sessionUser: Record<string, unknown>): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single()

    if (data && !error) return mapUserData(data as Record<string, unknown>)
  } catch {
    // Table missing or query failed — fall through to metadata fallback
  }
  return fallbackUser(sessionUser)
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null)
  const [user,      setUser]      = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        setSession(session)
        if (session?.user) {
          const profile = await fetchUserProfile(session.user as Record<string, unknown>)
          if (mounted) setUser(profile)
        }
      } catch (err) {
        console.error('[AuthProvider] getSession error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return
        setSession(session)
        if (session?.user) {
          const profile = await fetchUserProfile(session.user as Record<string, unknown>)
          if (mounted) setUser(profile)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ session, user, isLoading, signOut }),
    [session, user, isLoading] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
