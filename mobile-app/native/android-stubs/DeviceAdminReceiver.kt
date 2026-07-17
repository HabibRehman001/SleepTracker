/**
 * Android Device Admin stub for Device Owner (Step 138).
 *
 * Copy into the Android project after `npx expo prebuild` (or wire via a
 * config plugin) as:
 *   android/app/src/main/java/com/sleeptracker/sleeplock/DeviceAdminReceiver.kt
 *
 * Manifest (inside <application>):
 *   <receiver
 *     android:name=".DeviceAdminReceiver"
 *     android:permission="android.permission.BIND_DEVICE_ADMIN"
 *     android:exported="true">
 *     <meta-data
 *       android:name="android.app.device_admin"
 *       android:resource="@xml/device_admin" />
 *     <intent-filter>
 *       <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
 *     </intent-filter>
 *   </receiver>
 *
 * Then once (no Google account on device):
 *   adb shell dpm set-device-owner com.sleeptracker.sleeplock/.DeviceAdminReceiver
 *
 * Native SleepLockModule.isDeviceOwner() should call:
 *   DevicePolicyManager.isDeviceOwnerApp(packageName)
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
