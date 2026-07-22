import { ActivitySession } from '../models/ActivitySession'
import {
  sessionsToPhase1JsonExport,
  type Phase1JsonExport,
} from './phase1JsonExport'

/**
 * Step 189 — export ActivitySessions as Phase 1 Step 105 JSON
 * for optional later import into the SQLite analytics app.
 */
export async function exportPhase1Json(
  month?: string
): Promise<Phase1JsonExport> {
  const docs = await ActivitySession.find({})
    .sort({ date: 1 })
    .lean()
    .exec()

  return sessionsToPhase1JsonExport(docs, { month })
}

export function buildExportFilename(
  format: 'json',
  month: string
): string {
  return `sleep-export-${month}.${format}`
}
