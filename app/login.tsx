/**
 * Login — Sign In / Sign Up
 *
 * Dark green header: "Welcome back, Kabayan! 🇵🇭"
 * White card with Sign In / Sign Up toggle tabs
 * SSO: Google + Microsoft
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const { width } = Dimensions.get('window')

async function afterLogin() {
  const permsRaw = await AsyncStorage.getItem('seegla_activity_perms')
  if (Platform.OS === 'android' && permsRaw !== 'true') {
    router.replace('/permissions')
  } else {
    router.replace('/(tabs)/dashboard')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign In form
// ─────────────────────────────────────────────────────────────────────────────

function SignInForm() {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [ssoLoading, setSsoLoading] = useState<'google' | 'microsoft' | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    })
    setLoading(false)
    if (err) setError(err.message)
    else await afterLogin()
  }

  const handleSSO = async (provider: 'google' | 'azure') => {
    setSsoLoading(provider === 'azure' ? 'microsoft' : 'google')
    setError(null)
    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { skipBrowserRedirect: true, redirectTo: 'seegla://login' },
      })
      if (err || !data.url) { setError(err?.message ?? 'Could not start SSO.'); return }
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'seegla://')
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const accessToken  = url.searchParams.get('access_token')
        const refreshToken = url.searchParams.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error: se } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (se) setError(se.message)
          else await afterLogin()
        }
      }
    } catch { setError('SSO sign-in failed. Please try again.') }
    finally { setSsoLoading(null) }
  }

  return (
    <View style={f.wrap}>
      {error ? (
        <View style={f.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
          <Text style={f.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Work Email */}
      <View style={f.fieldGroup}>
        <Text style={f.label}>Work Email</Text>
        <View style={f.inputRow}>
          <Ionicons name="mail-outline" size={17} color="#94a3b8" style={f.inputIcon} />
          <TextInput
            style={f.input}
            placeholder="juan@company.com.ph"
            placeholderTextColor="#c4cdd8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>
      </View>

      {/* Password */}
      <View style={f.fieldGroup}>
        <Text style={f.label}>Password</Text>
        <View style={f.inputRow}>
          <Ionicons name="lock-closed-outline" size={17} color="#94a3b8" style={f.inputIcon} />
          <TextInput
            style={[f.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#c4cdd8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable onPress={() => setShowPass(!showPass)} style={f.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      <Pressable style={f.forgotWrap}>
        <Text style={f.forgotText}>Forgot password?</Text>
      </Pressable>

      {/* Sign In button */}
      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={({ pressed }) => [f.primaryBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={f.primaryBtnText}>Sign In →</Text>
        )}
      </Pressable>

      {/* Divider */}
      <View style={f.divider}>
        <View style={f.divLine} />
        <Text style={f.divText}>or continue with</Text>
        <View style={f.divLine} />
      </View>

      {/* SSO */}
      <Pressable
        onPress={() => handleSSO('google')}
        disabled={!!ssoLoading}
        style={({ pressed }) => [f.ssoBtn, pressed && { opacity: 0.85 }]}
      >
        {ssoLoading === 'google' ? <ActivityIndicator size="small" color="#ea4335" /> : (
          <Ionicons name="logo-google" size={18} color="#ea4335" />
        )}
        <Text style={f.ssoBtnText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        onPress={() => handleSSO('azure')}
        disabled={!!ssoLoading}
        style={({ pressed }) => [f.ssoBtn, pressed && { opacity: 0.85 }]}
      >
        {ssoLoading === 'microsoft' ? <ActivityIndicator size="small" color="#0078d4" /> : (
          <Ionicons name="logo-windows" size={18} color="#0078d4" />
        )}
        <Text style={f.ssoBtnText}>Continue with Microsoft</Text>
      </Pressable>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign Up form
// ─────────────────────────────────────────────────────────────────────────────

function SignUpForm() {
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [ssoLoading, setSsoLoading] = useState<'google' | 'microsoft' | null>(null)

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (err) setError(err.message)
    else Alert.alert('Check your email', 'We sent a confirmation link to your work email.')
  }

  const handleSSO = async (provider: 'google' | 'azure') => {
    setSsoLoading(provider === 'azure' ? 'microsoft' : 'google')
    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { skipBrowserRedirect: true, redirectTo: 'seegla://login' },
      })
      if (err || !data.url) { setError(err?.message ?? 'Could not start SSO.'); return }
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'seegla://')
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const at = url.searchParams.get('access_token')
        const rt = url.searchParams.get('refresh_token')
        if (at && rt) {
          const { error: se } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
          if (!se) await afterLogin()
        }
      }
    } catch { setError('SSO failed. Please try again.') }
    finally { setSsoLoading(null) }
  }

  return (
    <View style={f.wrap}>
      {error ? (
        <View style={f.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
          <Text style={f.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={f.fieldGroup}>
        <Text style={f.label}>Full Name</Text>
        <View style={f.inputRow}>
          <Ionicons name="person-outline" size={17} color="#94a3b8" style={f.inputIcon} />
          <TextInput
            style={f.input}
            placeholder="Juan dela Cruz"
            placeholderTextColor="#c4cdd8"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={f.fieldGroup}>
        <Text style={f.label}>Work Email</Text>
        <View style={f.inputRow}>
          <Ionicons name="mail-outline" size={17} color="#94a3b8" style={f.inputIcon} />
          <TextInput
            style={f.input}
            placeholder="juan@company.com.ph"
            placeholderTextColor="#c4cdd8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={f.fieldGroup}>
        <Text style={f.label}>Password</Text>
        <View style={f.inputRow}>
          <Ionicons name="lock-closed-outline" size={17} color="#94a3b8" style={f.inputIcon} />
          <TextInput
            style={[f.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#c4cdd8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            returnKeyType="done"
          />
          <Pressable onPress={() => setShowPass(!showPass)} style={f.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleSignUp}
        disabled={loading}
        style={({ pressed }) => [f.primaryBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={f.primaryBtnText}>Create Account</Text>
        )}
      </Pressable>

      <View style={f.divider}>
        <View style={f.divLine} />
        <Text style={f.divText}>or continue with</Text>
        <View style={f.divLine} />
      </View>

      <Pressable
        onPress={() => handleSSO('google')}
        style={({ pressed }) => [f.ssoBtn, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="logo-google" size={18} color="#ea4335" />
        <Text style={f.ssoBtnText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        onPress={() => handleSSO('azure')}
        style={({ pressed }) => [f.ssoBtn, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="logo-windows" size={18} color="#0078d4" />
        <Text style={f.ssoBtnText}>Continue with Microsoft</Text>
      </Pressable>
    </View>
  )
}

const f = StyleSheet.create({
  wrap: { gap: 14 },
  errorBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#fef2f2',
    borderWidth:       1,
    borderColor:       '#fecaca',
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  errorText: { flex: 1, fontSize: 13, color: '#ef4444', fontWeight: '500' },
  fieldGroup: { gap: 5 },
  label: {
    fontSize:      12,
    fontWeight:    '700',
    color:         '#475569',
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#f8fafc',
    borderWidth:       1,
    borderColor:       '#e2e8f0',
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   Platform.OS === 'ios' ? 13 : 10,
  },
  inputIcon: { marginRight: 9 },
  input:     { flex: 1, fontSize: 15, color: '#0f172a', padding: 0 },
  eyeBtn:    { paddingLeft: 8 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, color: '#3FE870', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#1a3a1a',
    borderRadius:    14,
    paddingVertical: 15,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  divText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  ssoBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               10,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       '#e2e8f0',
    paddingVertical:   13,
    backgroundColor:   '#f8fafc',
  },
  ssoBtnText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Dark green header */}
      <View style={s.header}>
        <View style={s.logoMark}>
          <Ionicons name="body-outline" size={22} color="#fff" />
        </View>
        <Text style={s.logoText}>SEEGLA</Text>
        <Text style={s.headerSub}>
          {tab === 'signin'
            ? 'Welcome back, Kabayan! 🇵🇭'
            : 'Join 50,000+ Filipino professionals'}
        </Text>
      </View>

      {/* White card */}
      <View style={s.card}>
        {/* Tabs */}
        <View style={s.tabRow}>
          <Pressable
            onPress={() => setTab('signin')}
            style={[s.tabBtn, tab === 'signin' && s.tabBtnActive]}
          >
            <Text style={[s.tabBtnText, tab === 'signin' && s.tabBtnTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('signup')}
            style={[s.tabBtn, tab === 'signup' && s.tabBtnActive]}
          >
            <Text style={[s.tabBtnText, tab === 'signup' && s.tabBtnTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {tab === 'signin' ? <SignInForm /> : <SignUpForm />}

          {/* Footer */}
          <Text style={s.footer}>
            By continuing, you agree to Seegla's{' '}
            <Text style={s.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.footerLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0d2210',
  },
  header: {
    alignItems:        'center',
    paddingTop:        Platform.OS === 'ios' ? 64 : 48,
    paddingBottom:     28,
    paddingHorizontal: 24,
    gap:               6,
  },
  logoMark: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  logoText: {
    fontSize:      20,
    fontWeight:    '900',
    color:         '#ffffff',
    letterSpacing: 3,
  },
  headerSub: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.6)',
    fontWeight:'500',
  },

  card: {
    flex:              1,
    backgroundColor:   '#ffffff',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop:        24,
  },
  tabRow: {
    flexDirection:     'row',
    backgroundColor:   '#f1f5f9',
    borderRadius:      12,
    padding:           4,
    marginBottom:      20,
  },
  tabBtn: {
    flex:           1,
    paddingVertical: 10,
    borderRadius:    9,
    alignItems:     'center',
  },
  tabBtnActive: {
    backgroundColor: '#1a3a1a',
  },
  tabBtnText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },

  footer: {
    fontSize:   11,
    color:      '#94a3b8',
    textAlign:  'center',
    lineHeight: 17,
    marginTop:  16,
  },
  footerLink: {
    color:      '#3FE870',
    fontWeight: '600',
  },
})
