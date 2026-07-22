import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'

import * as lockService from '../services/lockService'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/useAppStore'
import { useLockStateStore } from '../store/lockStateStore'

/**
 * Create account / log in — required before permissions.
 * Signed-in users are redirected away (never show credentials again).
 */
export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const signup = useAuthStore((s) => s.signup)
  const login = useAuthStore((s) => s.login)
  const hydrate = useAuthStore((s) => s.hydrate)
  const busy = useAuthStore((s) => s.busy)
  const lastError = useAuthStore((s) => s.lastError)
  const clearError = useAuthStore((s) => s.clearError)
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const locationSetupDone = useAppStore((s) => s.locationSetupDone)
  const setLocked = useLockStateStore((s) => s.setLocked)

  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center"
        testID="auth-hydrating"
      >
        <ActivityIndicator color="#fafafa" />
      </View>
    )
  }

  if (token) {
    return (
      <Redirect href={locationSetupDone ? '/' : '/location-permission'} />
    )
  }

  const afterAuth = async () => {
    lockService.configureLockService()
    const accountLocked = await lockService.syncAccountLockFromServer()
    const locked = accountLocked || (await lockService.isLocked())
    setLocked(locked)
    if (locked) {
      router.replace('/locked')
      return
    }
    router.replace('/location-permission')
  }

  const submit = async () => {
    clearError()
    try {
      if (mode === 'signup') {
        await signup(email, password, name)
      } else {
        await login(email, password)
      }
      await afterAuth()
    } catch {
      // lastError set on store
    }
  }

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="auth-screen"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4">
          Sleep Lock
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-3">
          {mode === 'signup' ? 'Create account' : 'Log in'}
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
          Then allow a few permissions so Sleep Lock can learn your stats and
          run soft lock from them.
        </Text>

        {mode === 'signup' ? (
          <TextInput
            className="bg-card border border-border text-foreground rounded-lg px-4 py-3.5 mb-3 text-[16px]"
            placeholder="Name (optional)"
            placeholderTextColor="#71717a"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            testID="auth-name"
          />
        ) : null}

        <TextInput
          className="bg-card border border-border text-foreground rounded-lg px-4 py-3.5 mb-3 text-[16px]"
          placeholder="Email"
          placeholderTextColor="#71717a"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          testID="auth-email"
        />
        <TextInput
          className="bg-card border border-border text-foreground rounded-lg px-4 py-3.5 mb-4 text-[16px]"
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#71717a"
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChangeText={setPassword}
          testID="auth-password"
        />

        {lastError ? (
          <Text
            className="text-red-400 text-[14px] leading-5 mb-4"
            testID="auth-error"
          >
            {lastError}
          </Text>
        ) : null}

        <Pressable
          className={`bg-primary py-4 rounded-lg items-center mb-4 ${
            busy ? 'opacity-50' : ''
          }`}
          onPress={() => void submit()}
          disabled={busy}
          testID="auth-submit"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {busy
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : 'Log in'}
          </Text>
        </Pressable>

        <Pressable
          className="py-2 items-center"
          onPress={() => {
            clearError()
            setMode(mode === 'signup' ? 'login' : 'signup')
          }}
          testID="auth-toggle-mode"
        >
          <Text className="text-sidebar-primary text-[15px] font-medium">
            {mode === 'signup'
              ? 'Already have an account? Log in'
              : 'Need an account? Sign up'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
