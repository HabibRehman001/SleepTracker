/**
 * Persist unlock / wake timestamps from ACTION_USER_PRESENT (Step 198).
 * SharedPreferences so JS + crash recovery can read the last unlock.
 */

package com.sleeptracker.sleeplock

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

object UnlockEventStore {
  private const val PREFS = "sleep_lock_unlock_events"
  private const val KEY_LAST_MS = "last_unlock_ms"
  private const val KEY_LOG = "unlock_log_json"
  private const val LOG_MAX = 50
  private const val TAG = "UnlockEventStore"

  fun recordUnlockEvent(context: Context, epochMs: Long = System.currentTimeMillis()) {
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putLong(KEY_LAST_MS, epochMs).apply()

    val log = readLog(context)
    log.put(
      JSONObject()
        .put("atMs", epochMs)
        .put("action", "ACTION_USER_PRESENT")
    )
    while (log.length() > LOG_MAX) {
      log.remove(0)
    }
    prefs.edit().putString(KEY_LOG, log.toString()).apply()
    Log.i(TAG, "recordUnlockEvent atMs=$epochMs")
  }

  fun lastUnlockMs(context: Context): Long {
    return context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getLong(KEY_LAST_MS, -1L)
  }

  fun unlockLogJson(context: Context): String {
    return readLog(context).toString()
  }

  private fun readLog(context: Context): JSONArray {
    val raw =
      context.applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getString(KEY_LOG, null)
    return try {
      if (raw.isNullOrBlank()) JSONArray() else JSONArray(raw)
    } catch (_: Exception) {
      JSONArray()
    }
  }
}
