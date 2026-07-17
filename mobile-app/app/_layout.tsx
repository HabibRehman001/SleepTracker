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
          options={{ title: 'Onboarding', presentation: 'card' }}
        />
      </Stack>
    </QueryClientProvider>
  )
}
