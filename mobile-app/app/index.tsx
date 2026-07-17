import { Link } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'

import * as lockService from '../services/lockService'
import { useLockStateStore } from '../store/lockStateStore'

/**
 * Home — lock UI driven by useLockStateStore (Step 123).
 */
export default function HomeScreen() {
  const isLocked = useLockStateStore((s) => s.isLocked)
  const busy = useLockStateStore((s) => s.busy)
  const ready = useLockStateStore((s) => s.ready)
  const setLocked = useLockStateStore((s) => s.setLocked)
  const setBusy = useLockStateStore((s) => s.setBusy)
  const setReady = useLockStateStore((s) => s.setReady)
  const setLastError = useLockStateStore((s) => s.setLastError)

  useEffect(() => {
    void lockService
      .isLocked()
      .then((value) => {
        setLocked(value)
        setReady(true)
      })
      .catch((err: unknown) => {
        setLastError(err instanceof Error ? err.message : 'Failed to read lock')
        setReady(true)
      })
  }, [setLocked, setReady, setLastError])

  const toggle = async () => {
    setBusy(true)
    setLastError(null)
    try {
      if (await lockService.isLocked()) {
        await lockService.disableLock()
      } else {
        await lockService.enableLock()
      }
      setLocked(await lockService.isLocked())
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Lock toggle failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View
      className="bg-background flex-1 items-center justify-center px-6"
      testID="home-screen"
    >
      <Text className="text-foreground text-3xl font-semibold mb-3">
        Sleep Lock
      </Text>
      <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-6">
        Same dark tokens as the web app — one product across analysis + lock.
      </Text>
      <View className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm">
        <Text
          className="text-card-foreground text-lg font-semibold tracking-wide text-center"
          testID="lock-status"
        >
          {!ready ? '…' : isLocked ? 'LOCKED' : 'unlocked'}
        </Text>
      </View>
      <Pressable
        className={`bg-primary px-5 py-3 rounded-lg mb-3 ${busy ? 'opacity-50' : ''}`}
        onPress={() => void toggle()}
        disabled={busy || !ready}
        testID="lock-toggle"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          {isLocked ? 'Disable lock' : 'Enable lock'}
        </Text>
      </Pressable>
      <Link href="/onboarding" asChild>
        <Pressable className="px-4 py-2.5" testID="open-onboarding">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Open onboarding
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}
