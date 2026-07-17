import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  DEVICE_OWNER_ADB_COMMAND,
  DEVICE_OWNER_STEPS,
  FULL_LOCK_ENABLED_LABEL,
} from '../native'
import * as lockService from '../services/lockService'
import { useAppStore } from '../store/useAppStore'
import { useLockStateStore } from '../store/lockStateStore'

/**
 * Step 138 — one-time Android Device Owner setup (ADB; cannot be in-app).
 */
export default function DeviceOwnerSetupScreen() {
  const insets = useSafeAreaInsets()
  const setDeviceOwnerSetupDone = useAppStore((s) => s.setDeviceOwnerSetupDone)
  const setDeviceOwner = useLockStateStore((s) => s.setDeviceOwner)
  const isDeviceOwner = useLockStateStore((s) => s.isDeviceOwner)

  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setChecking(true)
    setStatusMessage(null)
    try {
      const owner = await lockService.isDeviceOwner()
      setDeviceOwner(owner)
      setStatusMessage(
        owner
          ? FULL_LOCK_ENABLED_LABEL
          : Platform.OS === 'android'
            ? 'Not Device Owner yet — run the ADB command, then check again.'
            : 'Device Owner is Android-only. iOS uses soft lock (FamilyControls).'
      )
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Could not read Device Owner status'
      )
    } finally {
      setChecking(false)
    }
  }, [setDeviceOwner])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const copyCommand = async () => {
    await Clipboard.setStringAsync(DEVICE_OWNER_ADB_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finish = () => {
    setDeviceOwnerSetupDone(true)
    router.replace('/family-controls-setup')
  }

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="device-owner-setup-screen"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-3">
          Android · one-time
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-3">
          Device Owner setup
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
          Full lock (kiosk / call block) needs Device Owner. This cannot be done
          inside the app — run ADB once on a phone with no Google account.
        </Text>

        {DEVICE_OWNER_STEPS.map((step, i) => (
          <View key={step} className="flex-row mb-3">
            <Text className="text-muted-foreground w-6 text-[15px]">{i + 1}.</Text>
            <Text className="text-foreground flex-1 text-[15px] leading-6">
              {step}
            </Text>
          </View>
        ))}

        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mt-5 mb-2">
          ADB command
        </Text>
        <Pressable
          onPress={() => void copyCommand()}
          className="bg-card border border-border rounded-lg px-4 py-4 mb-2"
          testID="device-owner-adb-copy"
        >
          <Text
            className="text-foreground font-mono text-[13px] leading-5"
            selectable
            testID="device-owner-adb-command"
          >
            {DEVICE_OWNER_ADB_COMMAND}
          </Text>
          <Text className="text-sidebar-primary text-sm mt-3 font-medium">
            {copied ? 'Copied' : 'Tap to copy'}
          </Text>
        </Pressable>

        <Pressable
          className={`border border-border py-4 rounded-lg items-center mb-3 mt-4 ${
            checking ? 'opacity-50' : ''
          }`}
          onPress={() => void refresh()}
          disabled={checking}
          testID="device-owner-check"
        >
          <Text className="text-foreground text-base font-semibold">
            {checking ? 'Checking…' : 'Check Device Owner status'}
          </Text>
        </Pressable>

        {statusMessage ? (
          <Text
            className={`text-center text-[15px] leading-6 mb-4 ${
              isDeviceOwner ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
            testID="device-owner-status"
          >
            {statusMessage}
          </Text>
        ) : null}

        {isDeviceOwner ? (
          <View
            className="bg-card border border-border rounded-lg px-4 py-3 mb-4 items-center"
            testID="device-owner-full-lock-badge"
          >
            <Text className="text-foreground text-lg font-semibold">
              {FULL_LOCK_ENABLED_LABEL}
            </Text>
          </View>
        ) : null}

        <Pressable
          className="bg-primary py-4 rounded-lg items-center"
          onPress={finish}
          testID="device-owner-continue"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {isDeviceOwner ? 'Continue' : 'Continue without Device Owner'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
