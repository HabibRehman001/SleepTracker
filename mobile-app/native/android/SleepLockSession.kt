/**
 * Lock session + incoming-call allow-list / policy (Steps 161–162).
 * Readable from CallScreeningService without the RN bridge.
 */

package com.sleeptracker.sleeplock

import android.content.Context
import org.json.JSONArray

object SleepLockSession {
  private const val PREFS = "sleep_lock_session"
  private const val KEY_LOCKED = "locked"
  private const val KEY_POLICY = "incoming_call_policy"
  private const val KEY_ALLOWLIST = "call_allowlist_json"

  /** Shown in product copy when non-favorites are declined (carrier SMS optional). */
  const val ASLEEP_CALLBACK_MESSAGE = "Asleep — will call back."

  @Volatile
  private var lockedMemory: Boolean = false

  @Volatile
  private var pendingStopLockTaskMemory: Boolean = false

  fun isLocked(context: Context? = null): Boolean {
    if (lockedMemory) return true
    if (context == null) return false
    return context
      .applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_LOCKED, false)
  }

  fun setLocked(context: Context, locked: Boolean) {
    lockedMemory = locked
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_LOCKED, locked)
      .apply()
  }

  /** Step 163 — stopLockTask deferred when disableLock runs without an Activity. */
  fun setPendingStopLockTask(pending: Boolean) {
    pendingStopLockTaskMemory = pending
  }

  fun clearPendingStopLockTask() {
    pendingStopLockTaskMemory = false
  }

  /** Returns true once if a deferred stopLockTask was requested. */
  fun consumePendingStopLockTask(): Boolean {
    if (!pendingStopLockTaskMemory) return false
    pendingStopLockTaskMemory = false
    return true
  }

  fun getIncomingCallPolicy(context: Context): IncomingCallGate.Policy {
    val raw =
      context
        .applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getString(KEY_POLICY, IncomingCallGate.Policy.toKey(IncomingCallGate.Policy.ALLOWLIST_ONLY))
    return IncomingCallGate.Policy.fromKey(raw)
  }

  fun setIncomingCallPolicy(context: Context, policy: IncomingCallGate.Policy) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_POLICY, IncomingCallGate.Policy.toKey(policy))
      .apply()
  }

  fun getCallAllowlist(context: Context): List<String> {
    val raw =
      context
        .applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getString(KEY_ALLOWLIST, "[]") ?: "[]"
    return try {
      val arr = JSONArray(raw)
      buildList {
        for (i in 0 until arr.length()) {
          val n = arr.optString(i, "").trim()
          if (n.isNotEmpty()) add(n)
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun setCallAllowlist(context: Context, numbers: List<String>) {
    val arr = JSONArray()
    for (n in numbers) {
      val t = n.trim()
      if (t.isNotEmpty()) arr.put(t)
    }
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_ALLOWLIST, arr.toString())
      .apply()
  }
}
