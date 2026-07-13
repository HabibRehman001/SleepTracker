import { prisma } from '../src/lib/prisma'
import { runAnalyticsServiceTests } from './analytics.service.test'
import { runCorrelationsTests } from './correlations.test'
import { runDashboardE2ETests } from './dashboard-e2e.test'
import { runExportStubTests } from './export.stub.test'
import { runInsightsTests } from './insights.test'
import { runSleepEntryRepositoryTests } from './sleepEntry.repository.test'
import { runSleepEntryServiceTests } from './sleepEntry.service.test'
import { runSleepEntryValidationTests } from './sleepEntry.validation.test'

async function main() {
  console.log('SleepTracker backend tests')
  console.log('==========================')

  const analyticsOk = await runAnalyticsServiceTests()
  const correlationsOk = await runCorrelationsTests()
  const insightsOk = await runInsightsTests()
  const exportOk = await runExportStubTests()
  const validationOk = await runSleepEntryValidationTests()
  const repoOk = await runSleepEntryRepositoryTests()
  const sleepServiceOk = await runSleepEntryServiceTests()
  const dashboardOk = await runDashboardE2ETests()

  const ok =
    analyticsOk &&
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
