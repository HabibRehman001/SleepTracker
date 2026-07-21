/**
 * @deprecated Step 158 — real sources live in `native/android/`.
 * Kept so older Step 138 checks still resolve; prefer native/android/.
 *
 * Copy target after prebuild (via plugins/withDeviceAdmin.js):
 *   android/app/src/main/java/com/sleeptracker/sleeplock/DeviceAdminReceiver.kt
 */

package com.sleeptracker.sleeplock

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

class DeviceAdminReceiver : DeviceAdminReceiver() {
  override fun onEnabled(context: Context, intent: Intent) {
    super.onEnabled(context, intent)
  }

  override fun onDisabled(context: Context, intent: Intent) {
    super.onDisabled(context, intent)
  }
}
