/**
 * Welch's two-sample t-test (unequal variances) — Step 99.
 * Hand-rolled: no jstat dependency.
 */

export type WelchTTestResult = {
  t: number
  df: number
  /** Two-tailed p-value. */
  pValue: number
  meanA: number
  meanB: number
  nA: number
  nB: number
}

function sampleMean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Unbiased sample variance (n − 1). */
function sampleVariance(values: number[], mean: number): number {
  if (values.length < 2) return 0
  let ss = 0
  for (const v of values) {
    const d = v - mean
    ss += d * d
  }
  return ss / (values.length - 1)
}

/** Log-gamma via Lanczos approximation (for incomplete beta). */
function logGamma(z: number): number {
  const g = 7
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.984369654078563e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  z -= 1
  let x = p[0]
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (z + i)
  }
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

function betacf(x: number, a: number, b: number): number {
  const maxIter = 200
  const eps = 3e-12
  let am = 1
  let bm = 1
  let az = 1
  let qab = a + b
  let qap = a + 1
  let qam = a - 1
  let bz = 1 - (qab * x) / qap

  for (let m = 1; m <= maxIter; m++) {
    const em = m
    const tem = em + em
    let d = (em * (b - em) * x) / ((qam + tem) * (a + tem))
    let ap = az + d * am
    let bp = bz + d * bm
    d = (-(a + em) * (qab + em) * x) / ((a + tem) * (qap + tem))
    const app = ap + d * az
    const bpp = bp + d * bz
    const aold = az
    am = ap / bpp
    bm = bp / bpp
    az = app / bpp
    bz = 1
    if (Math.abs(az - aold) < eps * Math.abs(az)) {
      return az
    }
  }
  return az
}

/** Regularized incomplete beta I_x(a,b). */
function betai(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
  )
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b
}

/**
 * Two-tailed survival function for Student's t: P(|T| ≥ |t|).
 * Uses F_{t,ν} ↔ Beta relationship.
 */
export function studentTPvalue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) {
    return 1
  }
  const x = df / (df + t * t)
  // P(|T| > |t|) = I_x(df/2, 1/2)
  return betai(x, df / 2, 0.5)
}

/**
 * Welch's t-test comparing sample `a` vs sample `b` (two-tailed).
 * Returns null when either sample has fewer than 2 observations
 * (except zero-variance equal/unequal means handled with n≥1 when possible).
 */
export function welchTTest(
  a: number[],
  b: number[]
): WelchTTestResult | null {
  if (a.length < 1 || b.length < 1) return null

  const meanA = sampleMean(a)
  const meanB = sampleMean(b)
  const nA = a.length
  const nB = b.length
  const varA = sampleVariance(a, meanA)
  const varB = sampleVariance(b, meanB)

  // Degenerate: both sides constant
  if (varA === 0 && varB === 0) {
    const equal = meanA === meanB
    return {
      t: equal ? 0 : Infinity,
      df: nA + nB - 2 > 0 ? nA + nB - 2 : 1,
      pValue: equal ? 1 : 0,
      meanA,
      meanB,
      nA,
      nB,
    }
  }

  if (nA < 2 || nB < 2) {
    // Need ≥2 on each side for a finite Welch variance estimate
    return null
  }

  const se2 = varA / nA + varB / nB
  if (se2 === 0) {
    return {
      t: 0,
      df: nA + nB - 2,
      pValue: 1,
      meanA,
      meanB,
      nA,
      nB,
    }
  }

  const t = (meanA - meanB) / Math.sqrt(se2)
  const dfNum = se2 * se2
  const dfDen =
    (varA / nA) ** 2 / (nA - 1) + (varB / nB) ** 2 / (nB - 1)
  const df = dfDen > 0 ? dfNum / dfDen : nA + nB - 2
  const pValue = studentTPvalue(t, df)

  return {
    t,
    df,
    pValue,
    meanA,
    meanB,
    nA,
    nB,
  }
}

/** Common α for “statistically interesting” experiment diffs. */
export const EXPERIMENT_ALPHA = 0.05
