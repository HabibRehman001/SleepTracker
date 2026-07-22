import { Text, View } from 'react-native'

import type { ActivityMinutes } from '../../services/activityScreenMath'
import { totalActivityMinutes } from '../../services/activityScreenMath'

type Props = {
  minutes: ActivityMinutes
}

const ROWS: Array<{
  key: keyof ActivityMinutes
  label: string
  color: string
}> = [
  { key: 'walk', label: 'Walk', color: '#58a6ff' },
  { key: 'jog', label: 'Jog', color: '#d29922' },
  { key: 'run', label: 'Run', color: '#f85149' },
]

/**
 * Small walk / jog / run minutes breakdown.
 */
export function ActivityBreakdown({ minutes }: Props) {
  const total = totalActivityMinutes(minutes)

  return (
    <View testID="activity-breakdown">
      {ROWS.map((row) => {
        const value = minutes[row.key]
        const ratio = total > 0 ? value / total : 0
        return (
          <View key={row.key} className="mb-3" testID={`activity-breakdown-${row.key}`}>
            <View className="flex-row justify-between mb-1">
              <Text className="text-foreground text-sm font-medium">
                {row.label}
              </Text>
              <Text
                className="text-muted-foreground text-sm tabular-nums"
                testID={`activity-minutes-${row.key}`}
              >
                {value} min
              </Text>
            </View>
            <View
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <View
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  height: '100%',
                  backgroundColor: row.color,
                  borderRadius: 999,
                }}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}
