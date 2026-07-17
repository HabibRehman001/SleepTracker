import { expect, test } from '@playwright/test'

/**
 * Step 112 — one happy-path smoke:
 * log an entry → see it on the dashboard → see data on analytics.
 */
test('log entry appears on dashboard and analytics', async ({ page }) => {
  const marker = `e2e-smoke-${Date.now()}`

  await page.goto('/log')
  await expect(page.getByTestId('sleep-entry-form')).toBeVisible()

  const notes = page.locator('#notes')
  await notes.fill(marker)

  await page.getByRole('button', { name: /save entry/i }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: /^dashboard$/i }).click()
  await expect(page.getByTestId('dashboard-page')).toBeVisible()
  await expect(page.getByTestId('dashboard-empty')).toHaveCount(0)
  await expect(page.getByTestId('today-card')).toBeVisible()
  await expect(page.getByTestId('today-notes')).toHaveText(marker)
  await expect(page.getByTestId('today-empty')).toHaveCount(0)
  await expect(
    page.getByTestId('dashboard-page').getByText(/\d+\s+nights\s·/)
  ).toBeVisible()

  await page.getByRole('link', { name: /^analytics$/i }).click()
  await expect(page.getByTestId('analytics-page')).toBeVisible()
  await expect(page.getByTestId('analytics-empty')).toHaveCount(0)
  await expect(
    page.getByTestId('analytics-page').getByText(/\d+\s+nights in range/)
  ).toBeVisible()
  await expect(page.getByTestId('analytics-charts')).toBeVisible()
  await expect(page.getByTestId('sleep-duration-chart')).toBeVisible()
  await expect(page.getByTestId('sleep-quality-over-time-chart')).toBeVisible()
})
