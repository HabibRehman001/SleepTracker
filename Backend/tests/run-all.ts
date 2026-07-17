import { prisma } from '../src/lib/prisma'
import { runAnalyticsRangeTests } from './analytics-range.test'
import { runAnalyticsServiceTests } from './analytics.service.test'
import { runCorrelationsTests } from './correlations.test'
import { runDashboardE2ETests } from './dashboard-e2e.test'
import { runExportStubTests } from './export.stub.test'
import { runInsightsTests } from './insights.test'
import { runRollingAverageTests } from './rolling-average.test'
import { runExperimentComparisonTests } from './experiment.comparison.test'
import { runExperimentCrudTests } from './experiment.crud.test'
import { runWelchTTestTests } from './welch-ttest.test'
import { runMonthlyReportTests } from './monthly-report.test'
import { runSmartPatternsTests } from './smart-patterns.test'
import { runStreaksTests } from './streaks.test'
import { runSleepEntryRepositoryTests } from './sleepEntry.repository.test'
import { runSleepEntryServiceTests } from './sleepEntry.service.test'
import { runSleepEntryValidationTests } from './sleepEntry.validation.test'

async function main() {
  console.log('SleepTracker backend tests')
  console.log('==========================')

  const analyticsOk = await runAnalyticsServiceTests()
  const rangeOk = await runAnalyticsRangeTests()
  const rollingOk = await runRollingAverageTests()
  const streaksOk = await runStreaksTests()
  const patternsOk = await runSmartPatternsTests()
  const experimentOk = await runExperimentCrudTests()
  const experimentCompareOk = await runExperimentComparisonTests()
  const welchOk = await runWelchTTestTests()
  const monthlyOk = await runMonthlyReportTests()
  const correlationsOk = await runCorrelationsTests()
  const insightsOk = await runInsightsTests()
  const exportOk = await runExportStubTests()
  const validationOk = await runSleepEntryValidationTests()
  const repoOk = await runSleepEntryRepositoryTests()
  const sleepServiceOk = await runSleepEntryServiceTests()
  const dashboardOk = await runDashboardE2ETests()

  const ok =
    analyticsOk &&
    rangeOk &&
    rollingOk &&
    streaksOk &&
    patternsOk &&
    experimentOk &&
    experimentCompareOk &&
    welchOk &&
    monthlyOk &&
    correlationsOk &&
    insightsOk &&
    exportOk &&
    validationOk &&
    repoOk &&
    sleepServiceOk &&
    dashboardOk

  console.log('\n==========================')
  console.log(ok ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED')
  process.exit(ok ? 0 : 1)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
