import { Pressable, Text, View } from 'react-native'

import type { PermissionRevokeFinding } from '../services/permissionRevokedMath'

/**
 * Step 194 — in-app banner when location/motion was revoked mid-use.
 */
export function PermissionRevokedBanner({
  finding,
  onReGrant,
}: {
  finding: PermissionRevokeFinding
  onReGrant: () => void
}) {
  return (
    <View
      className="bg-card border border-border rounded-lg px-4 py-3 mb-4"
      testID="permission-revoked-banner"
    >
      <Text
        className="text-foreground text-[15px] font-semibold mb-1"
        testID="permission-revoked-banner-title"
      >
        {finding.title}
      </Text>
      <Text
        className="text-muted-foreground text-sm leading-5 mb-3"
        testID="permission-revoked-banner-body"
      >
        {finding.body}
      </Text>
      <Pressable
        className="bg-primary py-3 rounded-lg items-center"
        onPress={onReGrant}
        testID="permission-revoked-regrant"
      >
        <Text className="text-primary-foreground font-semibold">
          Re-grant permission
        </Text>
      </Pressable>
    </View>
  )
}
