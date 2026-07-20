import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import {
  FAILED_DETECTION_PROMPT,
  isValidHHMM,
} from '../services/nightDetection'
import { useBaselineStore } from '../store/baselineStore'

/**
 * Step 146 — manual bed/wake fallback after a failed detection night.
 */
export default function ManualSleepEntryScreen() {
  const insets = useSafeAreaInsets()
  const prompt =
    useBaselineStore((s) => s.lastDetectionPrompt) ?? FAILED_DETECTION_PROMPT
  const submitManualNight = useBaselineStore((s) => s.submitManualNight)
  const dismissManualEntry = useBaselineStore((s) => s.dismissManualEntry)

  const [bedtime, setBedtime] = useState('04:00')
  const [waketime, setWaketime] = useState('12:00')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const bed = bedtime.trim()
    const wake = waketime.trim()
    if (!isValidHHMM(bed) || !isValidHHMM(wake)) {
      setError('Use 24h times like 04:10 and 12:05')
      return
    }
    setError(null)
    submitManualNight(bed, wake)
    router.replace('/')
  }

  const skip = () => {
    dismissManualEntry()
    router.replace('/')
  }

  return (
    <View
      className="bg-background flex-1 px-8"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
      testID="manual-sleep-entry-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4">
        Last night
      </Text>
      <Text
        className="text-foreground text-2xl font-semibold leading-tight mb-4"
        testID="failed-detection-prompt"
      >
        {prompt}
      </Text>
      <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
        Enter the times you actually slept. This night won’t be guessed from
        motion — only what you confirm here goes into the baseline.
      </Text>

      <Text className="text-muted-foreground text-sm mb-2">Bedtime (HH:MM)</Text>
      <TextInput
        className="bg-card border border-border text-foreground rounded-lg px-4 py-3.5 mb-4 text-[16px]"
        value={bedtime}
        onChangeText={setBedtime}
        placeholder="04:10"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        testID="manual-bedtime"
      />

      <Text className="text-muted-foreground text-sm mb-2">Wake time (HH:MM)</Text>
      <TextInput
        className="bg-card border border-border text-foreground rounded-lg px-4 py-3.5 mb-4 text-[16px]"
        value={waketime}
        onChangeText={setWaketime}
        placeholder="12:05"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        testID="manual-waketime"
      />

      {error ? (
        <Text className="text-red-400 text-[14px] mb-4" testID="manual-sleep-error">
          {error}
        </Text>
      ) : null}

      <Pressable
        className="bg-primary py-4 rounded-lg items-center mb-3"
        onPress={save}
        testID="manual-sleep-save"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Save night
        </Text>
      </Pressable>

      <Pressable className="py-3 items-center" onPress={skip} testID="manual-sleep-skip">
        <Text className="text-muted-foreground text-[15px]">Not now</Text>
      </Pressable>
    </View>
  )
}
