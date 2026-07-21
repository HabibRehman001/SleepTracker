/**
 * Incoming-call gate during sleep lock (Step 162).
 * Favorites/emergency allow-list + policy (a) allowlist-only or (b) decline non-favorites.
 */

package com.sleeptracker.sleeplock

object IncomingCallGate {
  enum class Policy {
    /** (a) Only allow-list numbers ring; everyone else is silenced/rejected. */
    ALLOWLIST_ONLY,

    /** (b) Favorites ring; non-favorites are auto-declined (call log kept). */
    DECLINE_NON_FAVORITES;

    companion object {
      fun fromKey(raw: String?): Policy =
        when (raw?.lowercase()?.trim()) {
          "decline_non_favorites", "decline-non-favorites", "b" ->
            DECLINE_NON_FAVORITES
          else -> ALLOWLIST_ONLY
        }

      fun toKey(policy: Policy): String =
        when (policy) {
          ALLOWLIST_ONLY -> "allowlist_only"
          DECLINE_NON_FAVORITES -> "decline_non_favorites"
        }
    }
  }

  enum class Decision {
    /** Ring / present normally. */
    ALLOW,
    /** Silent reject — no ring, no notification (policy a, non-favorite). */
    REJECT_SILENT,
    /** Auto-decline — reject, keep call log (policy b, non-favorite). */
    REJECT_DECLINE,
  }

  /** Digits only for comparison. */
  fun normalizeNumber(raw: String?): String {
    if (raw.isNullOrBlank()) return ""
    return raw.filter { it.isDigit() }
  }

  /**
   * Match if normalized forms are equal, or either ends with the other
   * (handles +country vs local), requiring at least 7 digits of overlap.
   */
  fun isAllowlisted(caller: String?, allowlist: Collection<String>): Boolean {
    val needle = normalizeNumber(caller)
    if (needle.length < 7) return false
    for (entry in allowlist) {
      val hay = normalizeNumber(entry)
      if (hay.length < 7) continue
      if (needle == hay || needle.endsWith(hay) || hay.endsWith(needle)) {
        return true
      }
    }
    return false
  }

  fun decide(
    locked: Boolean,
    isFavorite: Boolean,
    policy: Policy,
    isEmergency: Boolean = false,
  ): Decision {
    if (!locked) return Decision.ALLOW
    // Step 164 — never screen out emergency / emergency-callback traffic.
    if (isEmergency) return Decision.ALLOW
    if (isFavorite) return Decision.ALLOW
    return when (policy) {
      Policy.ALLOWLIST_ONLY -> Decision.REJECT_SILENT
      Policy.DECLINE_NON_FAVORITES -> Decision.REJECT_DECLINE
    }
  }
}
