import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  FAMILY_CONTROLS_CHECKLIST,
  FAMILY_CONTROLS_REQUEST_URL,
  IOS_BUNDLE_ID,
  NOTIFICATION_ONLY_MODE_BODY,
  NOTIFICATION_ONLY_MODE_LABEL,
  SOFT_LOCK_ENABLED_LABEL,
  classifyLockCapability,
} from '../native'
import * as lockService from '../services/lockService'
import { useAppStore } from '../store/useAppStore'
import { useLockStateStore } from '../store/lockStateStore'

/**
 * Step 139 — Family Controls entitlement checklist (Apple request; not in-app).
 * Until approved, the app runs in notification-only mode on iOS.
 */
export default function FamilyControlsSetupScreen() {
  const insets = useSafeAreaInsets()
  const setFamilyControlsSetupDone = useAppStore(
    (s) => s.setFamilyControlsSetupDone
  )
  const setFamilyControls = useLockStateStore((s) => s.setFamilyControls)
  const setLockCapability = useLockStateStore((s) => s.setLockCapability)
  const isDeviceOwner = useLockStateStore((s) => s.isDeviceOwner)
  const hasFamilyControls = useLockStateStore((s) => s.hasFamilyControls)
  const lockCapability = useLockStateStore((s) => s.lockCapability)

  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({})

  const refresh = useCallback(async () => {
    setChecking(true)
    try {
      const [owner, family] = await Promise.all([
        lockService.isDeviceOwner(),
        lockService.hasFamilyControlsEntitlement(),
      ])
      setFamilyControls(family)
      setLockCapability(classifyLockCapability(owner, family))
    } finally {
      setChecking(false)
    }
  }, [setFamilyControls, setLockCapability])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyUrl = async () => {
    await Clipboard.setStringAsync(FAMILY_CONTROLS_REQUEST_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finish = () => {
    setFamilyControlsSetupDone(true)
    router.replace('/')
  }

  const notificationOnly = lockCapability === 'notification-only'

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="family-controls-setup-screen"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-3">
          iOS · Apple review
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-3">
          Screen Time entitlement
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6 mb-5">
          Soft lock on iOS needs Apple’s Family Controls entitlement. That
          request cannot be automated in the app — submit it, wait for approval,
          then rebuild. Bundle ID:{' '}
          <Text className="text-foreground font-mono text-[13px]">
            {IOS_BUNDLE_ID}
          </Text>
        </Text>

        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
          Checklist
        </Text>
        {FAMILY_CONTROLS_CHECKLIST.map((item) => {
          const on = !!checkedIds[item.id]
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              className="flex-row items-start mb-3"
              testID={`family-controls-check-${item.id}`}
            >
              <View
                className={`mt-0.5 mr-3 h-5 w-5 rounded border items-center justify-center ${
                  on ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {on ? (
                  <Text className="text-primary-foreground text-[11px] font-bold">
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text className="text-foreground flex-1 text-[15px] leading-6">
                {item.label}
              </Text>
            </Pressable>
          )
        })}

        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mt-4 mb-2">
          Request form
        </Text>
        <Pressable
          onPress={() => void copyUrl()}
          className="bg-card border border-border rounded-lg px-4 py-4 mb-2"
          testID="family-controls-url-copy"
        >
          <Text
            className="text-foreground font-mono text-[12px] leading-5"
            selectable
            testID="family-controls-request-url"
          >
            {FAMILY_CONTROLS_REQUEST_URL}
          </Text>
          <Text className="text-sidebar-primary text-sm mt-3 font-medium">
            {copied ? 'Copied' : 'Tap to copy URL'}
          </Text>
        </Pressable>
        <Pressable
          className="py-3 mb-2"
          onPress={() => void Linking.openURL(FAMILY_CONTROLS_REQUEST_URL)}
          testID="family-controls-open-url"
        >
          <Text className="text-sidebar-primary text-center text-[15px] font-medium">
            Open Apple request form
          </Text>
        </Pressable>

        {notificationOnly ? (
          <View
            className="bg-card border border-border rounded-lg px-4 py-4 mb-4"
            testID="notification-only-mode-banner"
          >
            <Text className="text-foreground text-base font-semibold mb-2">
              {NOTIFICATION_ONLY_MODE_LABEL}
            </Text>
            <Text className="text-muted-foreground text-[14px] leading-6">
              {NOTIFICATION_ONLY_MODE_BODY}
            </Text>
          </View>
        ) : hasFamilyControls ? (
          <View
            className="bg-card border border-border rounded-lg px-4 py-3 mb-4 items-center"
            testID="soft-lock-ready-badge"
          >
            <Text className="text-foreground text-base font-semibold">
              {SOFT_LOCK_ENABLED_LABEL}
            </Text>
          </View>
        ) : null}

        <Pressable
          className={`border border-border py-4 rounded-lg items-center mb-3 ${
            checking ? 'opacity-50' : ''
          }`}
          onPress={() => void refresh()}
          disabled={checking}
          testID="family-controls-check-status"
        >
          <Text className="text-foreground text-base font-semibold">
            {checking ? 'Checking…' : 'Check entitlement status'}
          </Text>
        </Pressable>

        {Platform.OS !== 'ios' ? (
          <Text className="text-muted-foreground text-center text-sm mb-4 leading-5">
            This checklist is for iOS builds. On Android, use Device Owner for
            full lock
            {isDeviceOwner ? ' (already enabled).' : '.'}
          </Text>
        ) : null}

        <Pressable
          className="bg-primary py-4 rounded-lg items-center"
          onPress={finish}
          testID="family-controls-continue"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {hasFamilyControls
              ? 'Continue'
              : 'Continue in notification-only mode'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
