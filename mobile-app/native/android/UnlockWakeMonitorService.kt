/**
 * Step 198 — lightweight FGS that only listens for ACTION_USER_PRESENT.
 * Used while sleep-locked (alongside watchdog) and for manual unlock-wake tests.
 * Implicit manifest USER_PRESENT receivers are blocked on modern Android.
 */

package com.sleeptracker.sleeplock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

class UnlockWakeMonitorService : Service() {
  private var unlockReceiver: UnlockReceiver? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startAsForeground()
    if (unlockReceiver == null) {
      unlockReceiver = UnlockReceiver.register(this, UnlockReceiver())
    }
    Log.i(TAG, "Unlock wake monitor active")
    return START_STICKY
  }

  override fun onDestroy() {
    UnlockReceiver.unregister(this, unlockReceiver)
    unlockReceiver = null
    super.onDestroy()
  }

  private fun startAsForeground() {
    ensureChannel()
    val notification =
      Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("Sleep Lock")
        .setContentText("Listening for unlock (wake time)")
        .setSmallIcon(android.R.drawable.ic_lock_lock)
        .setOngoing(true)
        .setCategory(Notification.CATEGORY_SERVICE)
        .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      )
    } else {
      @Suppress("DEPRECATION")
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NotificationManager::class.java) ?: return
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    nm.createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        "Unlock wake detect",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Detects phone unlock as wake time"
        setShowBadge(false)
      }
    )
  }

  companion object {
    private const val TAG = "UnlockWakeMonitor"
    private const val CHANNEL_ID = "sleep_lock_unlock_wake"
    private const val NOTIFICATION_ID = 19801

    fun start(context: Context) {
      val app = context.applicationContext
      val intent = Intent(app, UnlockWakeMonitorService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        app.startForegroundService(intent)
      } else {
        app.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.applicationContext.stopService(
        Intent(context.applicationContext, UnlockWakeMonitorService::class.java)
      )
    }
  }
}
