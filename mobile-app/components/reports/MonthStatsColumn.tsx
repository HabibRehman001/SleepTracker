import { Text, View } from 'react-native'

import {
  arrowGlyph,
  type ComparedReportMetric,
  type MetricTone,
} from '../../services/monthlyReportMath'

function toneColor(tone: MetricTone): string {
  if (tone === 'improved') return '#3fb950'
  if (tone === 'regressed') return '#f85149'
  return 'rgba(180,190,200,0.55)'
}

type Props = {
  title: string
  subtitle: string
  metrics: ComparedReportMetric[]
  /** Show this month's values (+ arrows). When false, show previous values. */
  side: 'current' | 'previous'
  testID?: string
}

/**
 * One month column — mirrors Phase 1 MonthStatsColumn layout.
 */
export function MonthStatsColumn({
  title,
  subtitle,
  metrics,
  side,
  testID,
}: Props) {
  const showArrows = side === 'current'

  return (
    <View
      className="flex-1 bg-card border border-border rounded-lg px-3 py-3 min-w-0"
      testID={testID}
    >
      <Text className="text-foreground text-[15px] font-semibold mb-0.5">
        {title}
      </Text>
      <Text className="text-muted-foreground text-xs mb-3 leading-4">
        {subtitle}
      </Text>
      {metrics.map((metric) => {
        const value =
          side === 'current' ? metric.currentDisplay : metric.previousDisplay
        return (
          <View
            key={metric.key}
            className="flex-row items-center justify-between gap-2 mb-3"
            testID={`metric-row-${metric.key}-${side}`}
          >
            <View className="min-w-0 flex-1">
              <Text className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                {metric.label}
              </Text>
              <Text className="text-foreground text-base font-semibold tabular-nums">
                {value}
              </Text>
            </View>
            {showArrows ? (
              <View className="items-end max-w-[42%]">
                <Text
                  style={{ color: toneColor(metric.tone), fontSize: 16 }}
                  testID={`metric-arrow-${metric.key}`}
                >
                  {arrowGlyph(metric.tone)}
                </Text>
                {metric.deltaDisplay ? (
                  <Text
                    className="text-[10px] text-right leading-3 mt-0.5"
                    style={{ color: toneColor(metric.tone) }}
                    numberOfLines={2}
                  >
                    {metric.deltaDisplay}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
