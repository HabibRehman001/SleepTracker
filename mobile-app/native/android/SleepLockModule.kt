/**
 * SleepLockModule — Device Owner (158) + Lock Task enter/exit (159/163) + calls (161–162).
 *
 * enableLock(): setLockTaskPackages + DISALLOW_OUTGOING_CALLS + startLockTask()
 * disableLock(): clear outgoing restriction + stopLockTask() (Step 163; wake trigger path)
 */

package com.sleeptracker.sleeplock

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.os.Handler
import android.os.Looper
import android.os.UserManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class SleepLockModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  private val mainHandler = Handler(Looper.getMainLooper())

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun onHostResume() {
    val activity = currentActivity

    // Wake-time disableLock may run headless — finish exiting kiosk when Activity is back.
    if (SleepLockSession.consumePendingStopLockTask()) {
      if (activity != null) {
        mainHandler.post { safeStopLockTask(activity) }
      }
      return
    }

    // Step 165 — after crash/watchdog relaunch, re-enter Lock Task if still locked.
    if (activity == null) return
    if (!SleepLockSession.isLocked(reactApplicationContext)) return
    mainHandler.post {
      try {
        val am = activity.getSystemService(ActivityManager::class.java)
        val mode =
          am?.lockTaskModeState ?: ActivityManager.LOCK_TASK_MODE_NONE
        if (mode == ActivityManager.LOCK_TASK_MODE_NONE) {
          activity.startLockTask()
        }
      } catch (_: Exception) {
        try {
          activity.startLockTask()
        } catch (_: Exception) {
        }
      }
    }
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {}

  private fun devicePolicyManager(): DevicePolicyManager =
    reactApplicationContext.getSystemService(DevicePolicyManager::class.java)
      ?: throw IllegalStateException("DevicePolicyManager unavailable")

  private fun adminComponent(): ComponentName =
    ComponentName(reactApplicationContext, DeviceAdminReceiver::class.java)

  private fun safeStopLockTask(activity: Activity) {
    try {
      val am = activity.getSystemService(ActivityManager::class.java)
      val mode =
        am?.lockTaskModeState ?: ActivityManager.LOCK_TASK_MODE_NONE
      if (mode != ActivityManager.LOCK_TASK_MODE_NONE) {
        activity.stopLockTask()
      }
    } catch (_: Exception) {
      try {
        activity.stopLockTask()
      } catch (_: Exception) {
      }
    }
  }

  @ReactMethod
  fun isDeviceOwner(promise: Promise) {
    try {
      val dpm = devicePolicyManager()
      promise.resolve(dpm.isDeviceOwnerApp(reactApplicationContext.packageName))
    } catch (e: Exception) {
      promise.reject("E_DEVICE_OWNER", e.message, e)
    }
  }

  @ReactMethod
  fun enableLock(promise: Promise) {
    try {
      val context = reactApplicationContext
      val packageName = context.packageName
      val dpm = devicePolicyManager()

      if (!dpm.isDeviceOwnerApp(packageName)) {
        promise.reject(
          "E_NOT_DEVICE_OWNER",
          "Lock Task requires Device Owner (run ADB dpm set-device-owner first)"
        )
        return
      }

      val admin = adminComponent()
      dpm.setLockTaskPackages(admin, arrayOf(packageName))
      // Outgoing block for normal dials. Android still allows emergency numbers
      // (911 / local) under DISALLOW_OUTGOING_CALLS + Lock Task — do not add
      // CallScreening logic that rejects emergency handles (Step 164).
      dpm.addUserRestriction(admin, UserManager.DISALLOW_OUTGOING_CALLS)
      SleepLockSession.clearPendingStopLockTask()

      val activity: Activity? = currentActivity
      if (activity == null) {
        dpm.clearUserRestriction(admin, UserManager.DISALLOW_OUTGOING_CALLS)
        promise.reject(
          "E_NO_ACTIVITY",
          "No Activity available to call startLockTask()"
        )
        return
      }

      mainHandler.post {
        try {
          activity.startLockTask()
          SleepLockSession.setLocked(context, true)
          SleepLockWatchdogService.start(context)
          promise.resolve(null)
        } catch (e: Exception) {
          try {
            dpm.clearUserRestriction(admin, UserManager.DISALLOW_OUTGOING_CALLS)
          } catch (_: Exception) {
          }
          SleepLockSession.setLocked(context, false)
          promise.reject("E_LOCK_TASK", e.message, e)
        }
      }
    } catch (e: Exception) {
      promise.reject("E_LOCK_TASK", e.message, e)
    }
  }

  /**
   * Exit Lock Task + clear outgoing-call block (Step 163).
   * Invoked by scheduled wake unlock (Step 153) via JS disableLock().
   */
  @ReactMethod
  fun disableLock(promise: Promise) {
    try {
      val context = reactApplicationContext
      val dpm = devicePolicyManager()
      val admin = adminComponent()
      if (dpm.isDeviceOwnerApp(context.packageName)) {
        dpm.clearUserRestriction(admin, UserManager.DISALLOW_OUTGOING_CALLS)
      }

      val activity = currentActivity
      if (activity != null) {
        mainHandler.post {
          try {
            SleepLockWatchdogService.stop(context)
            safeStopLockTask(activity)
            SleepLockSession.setLocked(context, false)
            SleepLockSession.clearPendingStopLockTask()
            promise.resolve(null)
          } catch (e: Exception) {
            SleepLockSession.setLocked(context, false)
            promise.reject("E_UNLOCK", e.message, e)
          }
        }
      } else {
        // Background fetch / no Activity — unlock session; stopLockTask on next resume.
        SleepLockWatchdogService.stop(context)
        SleepLockSession.setPendingStopLockTask(true)
        SleepLockSession.setLocked(context, false)
        promise.resolve(null)
      }
    } catch (e: Exception) {
      promise.reject("E_UNLOCK", e.message, e)
    }
  }

  @ReactMethod
  fun isLocked(promise: Promise) {
    promise.resolve(SleepLockSession.isLocked(reactApplicationContext))
  }

  @ReactMethod
  fun hasFamilyControlsEntitlement(promise: Promise) {
    promise.resolve(false)
  }

  /** Step 162 — "allowlist_only" | "decline_non_favorites" */
  @ReactMethod
  fun setIncomingCallPolicy(policy: String, promise: Promise) {
    try {
      val parsed = IncomingCallGate.Policy.fromKey(policy)
      SleepLockSession.setIncomingCallPolicy(reactApplicationContext, parsed)
      promise.resolve(IncomingCallGate.Policy.toKey(parsed))
    } catch (e: Exception) {
      promise.reject("E_CALL_POLICY", e.message, e)
    }
  }

  @ReactMethod
  fun getIncomingCallPolicy(promise: Promise) {
    try {
      val p = SleepLockSession.getIncomingCallPolicy(reactApplicationContext)
      promise.resolve(IncomingCallGate.Policy.toKey(p))
    } catch (e: Exception) {
      promise.reject("E_CALL_POLICY", e.message, e)
    }
  }

  @ReactMethod
  fun setCallAllowlist(numbers: ReadableArray, promise: Promise) {
    try {
      val list = ArrayList<String>()
      for (i in 0 until numbers.size()) {
        val n = numbers.getString(i)?.trim().orEmpty()
        if (n.isNotEmpty()) list.add(n)
      }
      SleepLockSession.setCallAllowlist(reactApplicationContext, list)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_CALL_ALLOWLIST", e.message, e)
    }
  }

  @ReactMethod
  fun getCallAllowlist(promise: Promise) {
    try {
      val list = SleepLockSession.getCallAllowlist(reactApplicationContext)
      val arr = Arguments.createArray()
      for (n in list) arr.pushString(n)
      promise.resolve(arr)
    } catch (e: Exception) {
      promise.reject("E_CALL_ALLOWLIST", e.message, e)
    }
  }

  @ReactMethod
  fun getAsleepCallbackMessage(promise: Promise) {
    promise.resolve(SleepLockSession.ASLEEP_CALLBACK_MESSAGE)
  }

  /**
   * Step 164 — battery fraction 0..1 for locked-screen low-battery notice.
   * Returns -1 if unavailable.
   */
  @ReactMethod
  fun getBatteryLevel(promise: Promise) {
    try {
      val bm =
        reactApplicationContext.getSystemService(android.content.Context.BATTERY_SERVICE)
          as? android.os.BatteryManager
      if (bm == null) {
        promise.resolve(-1.0)
        return
      }
      val pct = bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)
      if (pct < 0) {
        promise.resolve(-1.0)
        return
      }
      promise.resolve(pct / 100.0)
    } catch (e: Exception) {
      promise.reject("E_BATTERY", e.message, e)
    }
  }

  /** True when digits look like an emergency short code (classification only). */
  @ReactMethod
  fun isEmergencyNumber(number: String, promise: Promise) {
    promise.resolve(EmergencyNumbers.isEmergencyDigits(number))
  }

  companion object {
    const val NAME = "SleepLockModule"
  }
}
