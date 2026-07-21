/**
 * Foreground watchdog while sleep-locked (Step 165).
 *
 * START_STICKY: if the process dies (crash / OOM / am kill), the system restarts
 * this service, which brings MainActivity back and Lock Task re-engages via
 * SleepLockModule.onHostResume.
 *
 * Note: `am force-stop` marks the package stopped and blocks auto-restart on
 * stock Android — use `am kill` to validate sticky recovery. Device Owner +
 * Lock Task still rely on this path after crash.
 */

package com.sleeptracker.sleeplock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

class SleepLockWatchdogService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startAsForeground()

    if (!SleepLockSession.isLocked(this)) {
      Log.i(TAG, "Not locked — stopping watchdog")
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    bringLockedActivityToFront()
    return START_STICKY
  }

  override fun onDestroy() {
    // If still locked, ask the system to recreate us (crash recovery).
    if (SleepLockSession.isLocked(this)) {
      Log.i(TAG, "Watchdog destroyed while locked — requesting restart")
      start(this)
    }
    super.onDestroy()
  }

  private fun startAsForeground() {
    ensureChannel()
    val launch =
      packageManager.getLaunchIntentForPackage(packageName)
        ?: Intent().setClassName(this, "$packageName.MainActivity")
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    launch.putExtra(EXTRA_REENGAGE_LOCK, true)

    val pi =
      PendingIntent.getActivity(
        this,
        0,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

    val notification =
      Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("Sleep Lock")
        .setContentText("Lock active")
        .setSmallIcon(android.R.drawable.ic_lock_lock)
        .setContentIntent(pi)
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
    val existing = nm.getNotificationChannel(CHANNEL_ID)
    if (existing != null) return
    val channel =
      NotificationChannel(
        CHANNEL_ID,
        "Sleep Lock",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Keeps sleep lock active if the app restarts"
        setShowBadge(false)
      }
    nm.createNotificationChannel(channel)
  }

  private fun bringLockedActivityToFront() {
    try {
      val launch =
        packageManager.getLaunchIntentForPackage(packageName)
          ?: Intent().setClassName(this, "$packageName.MainActivity")
      launch.addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
      )
      launch.putExtra(EXTRA_REENGAGE_LOCK, true)
      startActivity(launch)
      Log.i(TAG, "Relaunched activity for Lock Task re-engage")
    } catch (e: Exception) {
      Log.w(TAG, "Failed to relaunch activity: ${e.message}")
    }
  }

  companion object {
    private const val TAG = "SleepLockWatchdog"
    private const val CHANNEL_ID = "sleep_lock_watchdog"
    private const val NOTIFICATION_ID = 16501
    const val EXTRA_REENGAGE_LOCK = "sleep_lock_reengage"

    fun start(context: Context) {
      val app = context.applicationContext
      val intent = Intent(app, SleepLockWatchdogService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        app.startForegroundService(intent)
      } else {
        app.startService(intent)
      }
    }

    fun stop(context: Context) {
      val app = context.applicationContext
      app.stopService(Intent(app, SleepLockWatchdogService::class.java))
    }
  }
}
