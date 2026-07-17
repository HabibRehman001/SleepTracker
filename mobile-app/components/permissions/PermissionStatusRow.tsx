import { Pressable, Text, View } from 'react-native'

import {
  toneGlyph,
  type PermissionStatusRowModel,
} from '../../services/permissionsStatus'

type Props = {
  row: PermissionStatusRowModel
  onPress?: () => void
  isLast?: boolean
}

/**
 * One Settings-style permission row (Step 140).
 */
export function PermissionStatusRow({ row, onPress, isLast }: Props) {
  const content = (
    <View
      className={`flex-row items-center px-4 py-3.5 ${
        isLast ? '' : 'border-b border-border'
      }`}
      testID={`permission-row-${row.id}`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-foreground text-[16px] font-medium">
          {row.title}
        </Text>
        {row.platformNote ? (
          <Text className="text-muted-foreground text-xs mt-0.5">
            {row.platformNote}
          </Text>
        ) : null}
      </View>
      <Text
        className="text-muted-foreground text-[15px] mr-2"
        testID={`permission-detail-${row.id}`}
      >
        {row.detail}
      </Text>
      <Text
        className="text-[17px] w-7 text-right"
        testID={`permission-tone-${row.id}`}
      >
        {toneGlyph(row.tone)}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    )
  }
  return content
}
