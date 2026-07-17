import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PermissionStatusRow } from '../components/permissions/PermissionStatusRow'
import { openAppSettings } from '../services/location'
import {
  loadPermissionsStatus,
  type PermissionStatusRowModel,
} from '../services/permissionsStatus'

/**
 * Step 140 — Settings-style permissions checklist (✅ / ⚠️ / ❌).
 */
export default function PermissionsStatusScreen() {
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState<PermissionStatusRowModel[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const next = await loadPermissionsStatus()
      setRows(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to read permissions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openFix = (id: string) => {
    switch (id) {
      case 'location':
        router.push('/location-permission')
        break
      case 'motion':
        router.push('/motion-permission')
        break
      case 'notifications':
        router.push('/notification-permission')
        break
      case 'device-owner':
        router.push('/device-owner-setup')
        break
      case 'family-controls':
        router.push('/family-controls-setup')
        break
      default:
        void openAppSettings()
    }
  }

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="permissions-status-screen"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor="#fafafa"
          />
        }
      >
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-2">
          Privacy
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-2">
          Permissions
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
          Same idea as Settings → Privacy — what’s allowed for Sleep Lock on
          this device.
        </Text>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#fafafa" />
          </View>
        ) : (
          <View
            className="bg-card border border-border rounded-xl overflow-hidden mb-6"
            testID="permissions-status-list"
          >
            {rows.map((row, i) => (
              <PermissionStatusRow
                key={row.id}
                row={row}
                isLast={i === rows.length - 1}
                onPress={
                  row.tone === 'ok' ? undefined : () => openFix(row.id)
                }
              />
            ))}
          </View>
        )}

        {error ? (
          <Text className="text-destructive text-center text-sm mb-4">
            {error}
          </Text>
        ) : null}

        <Pressable
          className="border border-border py-3.5 rounded-lg items-center mb-3"
          onPress={() => void load(true)}
          testID="permissions-status-refresh"
        >
          <Text className="text-foreground text-base font-semibold">
            Refresh status
          </Text>
        </Pressable>
        <Pressable
          className="py-3 items-center"
          onPress={() => void openAppSettings()}
          testID="permissions-open-settings"
        >
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Open system Settings
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
