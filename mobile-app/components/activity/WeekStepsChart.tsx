import { Text, View } from 'react-native'

import type { DayStepBar } from '../../services/activityScreenMath'
import { formatStepCount } from '../../services/activityScreenMath'
import { darkTokens } from '../../theme/tokens'

type Props = {
  bars: DayStepBar[]
  maxBarHeight?: number
}

/**
 * 7-day step bar chart (oldest → today).
 */
export function WeekStepsChart({ bars, maxBarHeight = 120 }: Props) {
  return (
    <View testID="activity-week-chart">
      <View
        className="flex-row items-end justify-between px-1"
        style={{ height: maxBarHeight + 28 }}
      >
        {bars.map((bar) => {
          const h = Math.max(4, Math.round(bar.heightRatio * maxBarHeight))
          return (
            <View
              key={bar.daysAgo}
              className="items-center flex-1"
              testID={`activity-bar-${bar.daysAgo}`}
            >
              <View
                style={{
                  width: 18,
                  height: h,
                  borderRadius: 4,
                  backgroundColor: bar.isToday
                    ? '#3fb950'
                    : bar.steps
                      ? darkTokens.sidebarPrimary
                      : darkTokens.muted,
                  opacity: bar.steps ? 1 : 0.35,
                }}
              />
              <Text
                className="text-muted-foreground text-[10px] mt-2"
                style={
                  bar.isToday
                    ? { color: darkTokens.foreground, fontWeight: '600' }
                    : undefined
                }
              >
                {bar.label}
              </Text>
            </View>
          )
        })}
      </View>
      <View className="flex-row justify-between mt-3 px-1">
        {bars.map((bar) => (
          <Text
            key={`v-${bar.daysAgo}`}
            className="text-muted-foreground text-[9px] flex-1 text-center tabular-nums"
            numberOfLines={1}
          >
            {bar.steps != null ? formatStepCount(bar.steps) : '—'}
          </Text>
        ))}
      </View>
    </View>
  )
}
