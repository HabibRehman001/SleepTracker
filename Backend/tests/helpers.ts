export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`)
  }
}

export function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `ASSERT FAILED [${label}]: expected ${String(expected)}, got ${String(actual)}`
    )
  }
}

export function assertClose(
  actual: number,
  expected: number,
  epsilon: number,
  label: string
): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(
      `ASSERT FAILED [${label}]: expected ~${expected} (±${epsilon}), got ${actual}`
    )
  }
}

export async function runTest(
  name: string,
  fn: () => Promise<void> | void
): Promise<boolean> {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`  ✗ ${name}`)
    console.error(`    ${message}`)
    return false
  }
}
