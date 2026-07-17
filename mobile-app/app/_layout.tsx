import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { queryClient } from '../services/queryClient'
import { darkTokens } from '../theme/tokens'

import '../global.css'

/**
 * Root layout — dark theme tokens match web-app `.dark` (Step 122).
 */
export default function RootLayout() {
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
      </Stack>
    </QueryClientProvider>
  )
}
