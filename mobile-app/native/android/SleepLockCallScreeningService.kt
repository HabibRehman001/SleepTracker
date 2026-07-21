/**
 * Call screening during sleep lock (Steps 161–162, 164).
 *
 * While locked: favorites ring per policy; emergency numbers always allowed.
 * Outgoing 911/local emergency remains an OS exemption under Lock Task +
 * DISALLOW_OUTGOING_CALLS — never block it in screening logic.
 */

package com.sleeptracker.sleeplock

import android.net.Uri
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.telecom.TelecomManager
import android.util.Log

class SleepLockCallScreeningService : CallScreeningService() {
  override fun onScreenCall(callDetails: Call.Details) {
    val locked = SleepLockSession.isLocked(this)
    if (!locked) {
      respondToCall(callDetails, CallResponse.Builder().build())
      return
    }

    val caller = extractNumber(callDetails)
    val emergency = isEmergencyCall(callDetails, caller)
    if (emergency) {
      Log.i(TAG, "Allowing emergency-related call during lock caller=$caller")
      respondToCall(callDetails, CallResponse.Builder().build())
      return
    }

    val allowlist = SleepLockSession.getCallAllowlist(this)
    val favorite = IncomingCallGate.isAllowlisted(caller, allowlist)
    val policy = SleepLockSession.getIncomingCallPolicy(this)
    val decision =
      IncomingCallGate.decide(
        locked = locked,
        isFavorite = favorite,
        policy = policy,
        isEmergency = false,
      )

    Log.i(
      TAG,
      "Incoming during lock caller=$caller favorite=$favorite policy=$policy → $decision"
    )

    when (decision) {
      IncomingCallGate.Decision.ALLOW -> {
        respondToCall(callDetails, CallResponse.Builder().build())
      }
      IncomingCallGate.Decision.REJECT_SILENT -> {
        respondToCall(
          callDetails,
          CallResponse.Builder()
            .setDisallowCall(true)
            .setRejectCall(true)
            .setSkipCallLog(true)
            .setSkipNotification(true)
            .build()
        )
      }
      IncomingCallGate.Decision.REJECT_DECLINE -> {
        respondToCall(
          callDetails,
          CallResponse.Builder()
            .setDisallowCall(true)
            .setRejectCall(true)
            .setSkipCallLog(false)
            .setSkipNotification(true)
            .build()
        )
      }
    }
  }

  private fun isEmergencyCall(details: Call.Details, caller: String?): Boolean {
    if (EmergencyNumbers.isEmergencyDigits(caller)) return true
    try {
      if (details.hasProperty(Call.Details.PROPERTY_EMERGENCY_CALLBACK_MODE)) {
        return true
      }
    } catch (_: Exception) {
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && caller != null) {
        val tm = getSystemService(TelecomManager::class.java)
        if (tm != null && tm.isEmergencyNumber(caller)) return true
      }
    } catch (_: Exception) {
    }
    return false
  }

  private fun extractNumber(details: Call.Details): String? {
    val handle: Uri? = details.handle
    if (handle != null) {
      val ssp = handle.schemeSpecificPart
      if (!ssp.isNullOrBlank()) return ssp
    }
    return null
  }

  companion object {
    private const val TAG = "SleepLockCallScreen"
  }
}
