import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { darkTokens } from '../../theme/tokens'
import {
  formatStepCount,
  goalProgress,
  DEFAULT_DAILY_STEP_GOAL,
} from '../../services/activityScreenMath'

type Props = {
  steps: number
  goal?: number
  size?: number
}

/**
 * GitHub-style contribution ring — progress toward daily step goal.
 */
export function StepGoalRing({
  steps,
  goal = DEFAULT_DAILY_STEP_GOAL,
  size = 200,
}: Props) {
  const { ratio, percent, remaining } = goalProgress(steps, goal)
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - ratio)

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      testID="activity-goal-ring"
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={darkTokens.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ratio >= 1 ? '#3fb950' : '#2ea043'}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="items-center px-4" testID="activity-today-steps-wrap">
        <Text
          className="text-foreground font-semibold tabular-nums"
          style={{ fontSize: 40, lineHeight: 44 }}
          testID="activity-today-steps"
        >
          {formatStepCount(steps)}
        </Text>
        <Text
          className="text-muted-foreground text-xs mt-1"
          testID="activity-goal-percent"
        >
          {percent}% of {formatStepCount(goal)}
        </Text>
        {remaining > 0 ? (
          <Text className="text-muted-foreground text-[11px] mt-0.5">
            {formatStepCount(remaining)} to go
          </Text>
        ) : (
          <Text
            className="text-[11px] mt-0.5"
            style={{ color: '#3fb950' }}
            testID="activity-goal-done"
          >
            Goal reached
          </Text>
        )}
      </View>
    </View>
  )
}
