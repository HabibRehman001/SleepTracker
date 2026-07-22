import { QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform, StyleSheet } from 'react-native'

import { watchIosWakeProxy } from '../services/iosWakeProxy'
import { queryClient } from '../services/queryClient'
import { isWeekStartSummaryNotificationData } from '../services/weekStartSummary'
import { useAuthStore } from '../store/authStore'
import { darkTokens } from '../theme/tokens'

// Step 141 — TaskManager.defineTask must run in global scope (before screens mount).
import '../services/backgroundTasks'

import '../global.css'

// NativeWind web: must match tailwind `darkMode: 'class'` (avoids media-mode crash).
;(StyleSheet as unknown as { setFlag?: (k: string, v: string) => void }).setFlag?.(
  'darkMode',
  'class'
)

/**
 * Root layout — dark theme tokens match web-app `.dark` (Step 122).
 * Hydrates auth once so /auth never flashes the form for a signed-in user.
 */
export default function RootLayout() {
  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  // Step 199 — iOS wake ≈ first AppState active after static window (approximation).
  useEffect(() => {
    if (Platform.OS === 'android') return
    return watchIosWakeProxy()
  }, [])

  // Step 204 — week-start notification → /week-start-summary deep link.
  useEffect(() => {
    const go = (data: Record<string, unknown> | undefined) => {
      if (isWeekStartSummaryNotificationData(data)) {
        router.push('/week-start-summary')
      }
    }

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        go(
          response.notification.request.content.data as
            | Record<string, unknown>
            | undefined
        )
      }
    })

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        go(
          response.notification.request.content.data as
            | Record<string, unknown>
            | undefined
        )
      }
    )
    return () => sub.remove()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: darkTokens.background },
          headerTintColor: darkTokens.foreground,
          contentStyle: { backgroundColor: darkTokens.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Sleep Lock' }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="auth"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="location-permission"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="motion-permission"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="notification-permission"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="set-home"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="device-owner-setup"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="family-controls-setup"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="permissions-status"
          options={{ title: 'Permissions', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="manual-sleep-entry"
          options={{ title: 'Enter sleep', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="baseline-results"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="lock-schedule"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="lock-countdown"
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="locked"
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="current-location"
          options={{ title: 'Current location', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="live-steps"
          options={{ title: 'Live steps', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="activity"
          options={{ title: 'Activity', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="monthly-report"
          options={{ title: 'Monthly report', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="week-start-summary"
          options={{ title: 'Start of week', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="call-allowlist"
          options={{ title: 'Call allow-list', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="request-schedule-change"
          options={{ headerShown: false, animation: 'fade' }}
        />
      </Stack>
    </QueryClientProvider>
  )
}
