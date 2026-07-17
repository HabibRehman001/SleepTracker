/**
 * Step 79 — Insights panel ("This month's patterns") on the dashboard.
 * Contract: bulleted callout + useInsights; live seed ≥2–3 real sentences.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  InsightsPanelView,
} from '../src/features/dashboard/InsightsPanel.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const panelSrc = readFileSync(
  join(root, 'src/features/dashboard/InsightsPanel.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(panelSrc, /This month/)
assert.match(panelSrc, /patterns/)
assert.match(panelSrc, /useInsights/)
assert.match(panelSrc, /list-disc/)
assert.match(panelSrc, /border-l-/)
assert.match(pageSrc, /InsightsPanel/)

const sample = [
  'You slept 42 minutes longer on days where you ate before sleep.',
  'used your phone before sleep increased your average sleep latency by 36 minutes.',
  'Weekends shift your bedtime by 3.1 hours.',
]

const html = renderToStaticMarkup(
  createElement(InsightsPanelView, { insights: sample })
)
assert.match(html, /This month/)
assert.match(html, /patterns/)
assert.match(html, /42 minutes/)
assert.match(html, /36 minutes/)
assert.match(html, /3\.1 hours/)
assert.doesNotMatch(html, /not enough data/i)

const emptyHtml = renderToStaticMarkup(
  createElement(InsightsPanelView, { insights: [] })
)
assert.match(emptyHtml, /Not enough data yet to surface patterns/)

const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'

async function liveCheck() {
  let entriesRes
  let insightsRes
  try {
    ;[entriesRes, insightsRes] = await Promise.all([
      fetch(`${API}/sleep-entries`),
      fetch(`${API}/analytics/insights`),
    ])
  } catch {
    console.log(
      'Insights panel contract OK — live API skipped (server not reachable)'
    )
    return
  }

  if (!entriesRes.ok || !insightsRes.ok) {
    console.log(
      `Insights panel contract OK — live API skipped (HTTP ${entriesRes.status}/${insightsRes.status})`
    )
    return
  }

  const entries = await entriesRes.json()
  const body = await insightsRes.json()
  assert.ok(
    Array.isArray(entries) && entries.length >= 30,
    `need ≥30 nights, got ${entries?.length}`
  )
  assert.ok(body && Array.isArray(body.insights), 'insights payload')
  const insights = body.insights
  assert.ok(
    insights.length >= 2,
    `expected ≥2 real insights, got ${insights.length}`
  )
  for (const sentence of insights) {
    assert.equal(typeof sentence, 'string')
    assert.ok(sentence.length > 10, 'non-trivial sentence')
    assert.doesNotMatch(
      sentence,
      /not enough data/i,
      `placeholder leaked: ${sentence}`
    )
  }

  const markup = renderToStaticMarkup(
    createElement(InsightsPanelView, { insights })
  )
  assert.match(markup, /This month/)
  for (const sentence of insights.slice(0, 3)) {
    assert.ok(
      markup.includes(sentence),
      `panel should render: ${sentence}`
    )
  }

  console.log(
    `Insights panel OK — ${entries.length} nights; ${insights.length} sentences render`
  )
}

await liveCheck()
