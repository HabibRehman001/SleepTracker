/**
 * Android Device Admin receiver — required for Device Owner (Step 158).
 *
 * Injected into the app package by `plugins/withDeviceAdmin.js` during
 * `npx expo prebuild` / `expo run:android`.
 *
 * One-time ADB (no Google account on device):
 *   adb shell dpm set-device-owner com.sleeptracker.sleeplock/.DeviceAdminReceiver
 *
 * Verify:
 *   adb shell dumpsys device_policy | grep -A2 "Device Owner"
 */

package com.sleeptracker.sleeplock

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class DeviceAdminReceiver : DeviceAdminReceiver() {
  override fun onEnabled(context: Context, intent: Intent) {
    super.onEnabled(context, intent)
    Log.i(TAG, "Device admin enabled")
  }

  override fun onDisabled(context: Context, intent: Intent) {
    super.onDisabled(context, intent)
    Log.i(TAG, "Device admin disabled")
  }

  companion object {
    private const val TAG = "SleepLockDeviceAdmin"
  }
}
