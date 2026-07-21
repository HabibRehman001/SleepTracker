/**
 * Emergency number helpers (Step 164).
 * Never dial real emergency numbers in tests — classify only.
 *
 * Well-known short codes + optional carrier test lines for careful manual checks.
 */

package com.sleeptracker.sleeplock

object EmergencyNumbers {
  /**
   * Common emergency short codes (US/EU/UK/AU/Asia). Local OS list via
   * TelecomManager.isEmergencyNumber is preferred when available.
   */
  val WELL_KNOWN: Set<String> =
    setOf(
      "911",
      "112",
      "999",
      "000",
      "110",
      "119",
      "118",
      "122",
      "15", // PK police (short)
      "16",
      "1122", // PK rescue
    )

  /**
   * Placeholders for *manual* carrier/lab verification only — never automate dialing.
   * Replace with your carrier's official non-emergency test line when validating.
   */
  const val MANUAL_TEST_NOTE =
    "Use carrier official test line or lab stub — never dial real emergency numbers."

  fun isEmergencyDigits(raw: String?): Boolean {
    val d = IncomingCallGate.normalizeNumber(raw)
    if (d.isEmpty()) return false
    if (WELL_KNOWN.contains(d)) return true
    // Short prefixed forms (e.g. 1911) — keep tight to avoid false positives.
    for (code in WELL_KNOWN) {
      if (d.length <= code.length + 2 && d.endsWith(code)) return true
    }
    return false
  }
}
