import { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  INCOMING_CALL_POLICY_LABELS,
  type IncomingCallPolicy,
} from '../native/incomingCallPolicy'
import {
  ASLEEP_CALLBACK_MESSAGE,
  addCallAllowlistNumber,
  getCallAllowlist,
  getIncomingCallPolicy,
  removeCallAllowlistNumber,
  setIncomingCallPolicy,
} from '../services/callAllowlist'

/**
 * Step 162 — favorites/emergency allow-list + incoming-call policy during lock.
 */
export default function CallAllowlistScreen() {
  const insets = useSafeAreaInsets()
  const [numbers, setNumbers] = useState<string[]>([])
  const [policy, setPolicy] = useState<IncomingCallPolicy>('allowlist_only')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const [list, pol] = await Promise.all([
      getCallAllowlist(),
      getIncomingCallPolicy(),
    ])
    setNumbers(list)
    setPolicy(pol)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onAdd = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      const next = await addCallAllowlistNumber(draft)
      setNumbers(next)
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async (n: string) => {
    setBusy(true)
    try {
      setNumbers(await removeCallAllowlistNumber(n))
    } finally {
      setBusy(false)
    }
  }

  const onPolicy = async (next: IncomingCallPolicy) => {
    setBusy(true)
    try {
      await setIncomingCallPolicy(next)
      setPolicy(next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}
      testID="call-allowlist-screen"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
        During lock, numbers on this list can still ring (emergencies /
        favorites). Everyone else follows the policy below.
      </Text>

      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
        Policy
      </Text>
      {(
        [
          'allowlist_only',
          'decline_non_favorites',
        ] as const satisfies readonly IncomingCallPolicy[]
      ).map((key) => {
        const selected = policy === key
        return (
          <Pressable
            key={key}
            className={`border rounded-lg px-4 py-3 mb-2 ${
              selected ? 'border-foreground/40 bg-card' : 'border-border'
            }`}
            onPress={() => void onPolicy(key)}
            disabled={busy}
            testID={`call-policy-${key}`}
          >
            <Text className="text-foreground text-[15px] font-medium">
              {INCOMING_CALL_POLICY_LABELS[key]}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1 leading-5">
              {key === 'allowlist_only'
                ? 'Only allow-list callers ring; others are silenced.'
                : 'Favorites ring; others are auto-declined (missed-call log kept).'}
            </Text>
          </Pressable>
        )
      })}

      <Text className="text-muted-foreground text-xs mt-2 mb-6 leading-5">
        Declined callers — scenario: “{ASLEEP_CALLBACK_MESSAGE}” (carrier
        reject-SMS when supported; otherwise silent decline).
      </Text>

      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
        Allow-list
      </Text>
      <View className="flex-row gap-2 mb-4">
        <TextInput
          className="flex-1 border border-border rounded-lg px-3 py-3 text-foreground"
          placeholder="+15551234567"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={draft}
          onChangeText={setDraft}
          testID="call-allowlist-input"
        />
        <Pressable
          className={`bg-primary px-4 rounded-lg items-center justify-center ${busy ? 'opacity-50' : ''}`}
          onPress={() => void onAdd()}
          disabled={busy}
          testID="call-allowlist-add"
        >
          <Text className="text-primary-foreground font-semibold">Add</Text>
        </Pressable>
      </View>

      {numbers.length === 0 ? (
        <Text
          className="text-muted-foreground text-sm leading-5"
          testID="call-allowlist-empty"
        >
          No favorites yet — add at least one emergency contact.
        </Text>
      ) : (
        numbers.map((n) => (
          <View
            key={n}
            className="flex-row items-center justify-between border border-border rounded-lg px-4 py-3 mb-2"
            testID={`call-allowlist-row-${n}`}
          >
            <Text className="text-foreground text-[15px] font-mono">{n}</Text>
            <Pressable onPress={() => void onRemove(n)} testID={`call-allowlist-remove-${n}`}>
              <Text className="text-muted-foreground text-sm">Remove</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  )
}
