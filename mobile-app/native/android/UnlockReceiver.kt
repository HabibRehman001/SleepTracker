/**
 * Step 198 — wake-time signal from phone unlock (ACTION_USER_PRESENT).
 *
 * Registered at runtime from SleepLockWatchdogService (foreground service).
 * Manifest-registered implicit USER_PRESENT receivers are restricted on modern
 * Android — do not add this action to the manifest.
 */

package com.sleeptracker.sleeplock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log

class UnlockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action == Intent.ACTION_USER_PRESENT) {
      recordUnlockEvent(context, System.currentTimeMillis())
    }
  }

  companion object {
    private const val TAG = "UnlockReceiver"

    /** Same entry point the Step 198 snippet names — persists + logs. */
    @JvmStatic
    fun recordUnlockEvent(context: Context, epochMs: Long) {
      UnlockEventStore.recordUnlockEvent(context, epochMs)
    }

    /**
     * Runtime registration (required on modern Android).
     * Call from a started foreground service.
     */
    @JvmStatic
    fun register(context: Context, receiver: UnlockReceiver): UnlockReceiver {
      val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
      val app = context.applicationContext
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        app.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        app.registerReceiver(receiver, filter)
      }
      Log.i(TAG, "Registered ACTION_USER_PRESENT (runtime)")
      return receiver
    }

    @JvmStatic
    fun unregister(context: Context, receiver: UnlockReceiver?) {
      if (receiver == null) return
      try {
        context.applicationContext.unregisterReceiver(receiver)
        Log.i(TAG, "Unregistered ACTION_USER_PRESENT")
      } catch (e: Exception) {
        Log.w(TAG, "unregister: ${e.message}")
      }
    }
  }
}
