/**
 * B8 Monte Carlo Power Analysis — CLI entry point
 *
 * Answers: can the classifier reliably distinguish experienced vs new
 * from simulated event histories, before any live model is built?
 *
 * Usage:
 *   tsx src/simulation/power.ts [options]
 *
 * Options:
 *   --trials <n>   Number of Monte Carlo trials per day-count (default: 200)
 *   --days <n>     Maximum day-count to evaluate; also runs 7/14/21 if <= max (default: 30)
 *   --out <path>   Output JSON path (default: ./generated/power-report.json)
 *
 * Exit code: 0 = PASS, 1 = FAIL (CI-compatible).
 *
 * Go/no-go thresholds (applied to the maximum day-count result):
 *   accuracy >= 85%     classifier is correct 85%+ of the time
 *   A/A failure <= 5%   same persona + different seed → same classification >= 95% of the time
 *   top Cohen's d >= 0.8  at least one continuous feature separates the personas with large effect
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL_PERSONAS, CURRICULUM } from '@adaptive/shared'
import type { PersonaId } from '@adaptive/shared'
import { generateHistory } from './generator'
import { extractFeatures } from './features'
import type { BehavioralFeatures } from './features'
import { classifyPersona } from './recover'
import type { SimulatorConfig } from './types'

// ─── Thresholds ───────────────────────────────────────────────────────────────

export const THRESHOLDS = {
  minAccuracy: 0.85,
  maxAaFailureRate: 0.05,
  minTopCohenD: 0.8,
} as const

// ─── Continuous features ──────────────────────────────────────────────────────

export const CONTINUOUS_FEATURES = [
  'lessonAbandonRate',
  'hintRate',
  'correctOnFirstTryRate',
  'medianAnswerLatencyMs',
  'medianContentDwellMs',
  'avgSessionDurationMs',
  'dailyEngagementRate',
  'directiveReviewCount',
] as const satisfies ReadonlyArray<
  keyof Omit<BehavioralFeatures, 'personaId' | 'skipBehaviorPresent'>
>

export type ContinuousFeature = (typeof CONTINUOUS_FEATURES)[number]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayResult {
  dayCount: number
  accuracy: number
  aaFailureRate: number
  featureEffectSizes: Record<ContinuousFeature, number>
  featureMeans: {
    experienced: Record<ContinuousFeature, number>
    new: Record<ContinuousFeature, number>
  }
  topCohenD: number
  verdict: 'PASS' | 'FAIL'
  failReasons: string[]
}

export interface PowerReport {
  config: {
    trials: number
    dayCounts: number[]
    thresholds: typeof THRESHOLDS
  }
  results: DayResult[]
  overallVerdict: 'PASS' | 'FAIL'
  overallFailReasons: string[]
  generatedAt: string
}

// ─── Statistics ───────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1)
}

function cohensD(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 0
  const pooledVar = (variance(a) + variance(b)) / 2
  if (pooledVar === 0) return 0
  return Math.abs(mean(a) - mean(b)) / Math.sqrt(pooledVar)
}

function round(n: number, places: number): number {
  const factor = 10 ** places
  return Math.round(n * factor) / factor
}

// ─── Core Monte Carlo ─────────────────────────────────────────────────────────

export function runTrialsForDayCount(trials: number, dayCount: number): DayResult {
  // Fixed reference epoch keeps output deterministic across runs
  const referenceEpoch = Date.parse('2026-06-16')
  const startDate = new Date(referenceEpoch - dayCount * 86_400_000).toISOString().slice(0, 10)
  const generatedAt = new Date(referenceEpoch).toISOString()

  // Seed blocks — no overlap between primary and A/A seeds across all trials
  // Primary experienced:  seeds 1..trials
  // Primary new:          seeds trials+1..2*trials
  // A/A experienced:      seeds 2*trials+1..3*trials
  // A/A new:              seeds 3*trials+1..4*trials
  const AA_OFFSET = 2 * trials

  let correct = 0
  let total = 0
  let aaFailures = 0
  let aaPairs = 0

  type FeatureBank = Record<ContinuousFeature, number[]>
  const featureVectors: { experienced: FeatureBank; new: FeatureBank } = {
    experienced: Object.fromEntries(CONTINUOUS_FEATURES.map(f => [f, []])) as FeatureBank,
    new: Object.fromEntries(CONTINUOUS_FEATURES.map(f => [f, []])) as FeatureBank,
  }

  for (let i = 0; i < trials; i++) {
    for (const persona of ALL_PERSONAS) {
      const pKey = persona.personaId as 'experienced' | 'new'
      const seedOffset = pKey === 'experienced' ? i + 1 : i + 1 + trials

      const configA: SimulatorConfig = { seed: seedOffset, days: dayCount, startDate }
      const historyA = generateHistory(persona, CURRICULUM, configA, generatedAt)
      const featuresA = extractFeatures(historyA)
      const predictedA: PersonaId = classifyPersona(featuresA)

      if (predictedA === persona.personaId) correct++
      total++

      for (const f of CONTINUOUS_FEATURES) {
        featureVectors[pKey][f].push(featuresA[f] as number)
      }

      // A/A: same persona, different seed — classification must agree
      const configB: SimulatorConfig = { seed: seedOffset + AA_OFFSET, days: dayCount, startDate }
      const historyB = generateHistory(persona, CURRICULUM, configB, generatedAt)
      const featuresB = extractFeatures(historyB)
      const predictedB: PersonaId = classifyPersona(featuresB)

      if (predictedA !== predictedB) aaFailures++
      aaPairs++
    }
  }

  const accuracy = correct / total
  const aaFailureRate = aaFailures / aaPairs

  // Cohen's d per feature
  const featureEffectSizes = {} as Record<ContinuousFeature, number>
  const featureMeans = {
    experienced: {} as Record<ContinuousFeature, number>,
    new: {} as Record<ContinuousFeature, number>,
  }
  let topCohenD = 0

  for (const f of CONTINUOUS_FEATURES) {
    const expVals = featureVectors.experienced[f]
    const newVals = featureVectors.new[f]
    const d = cohensD(expVals, newVals)
    featureEffectSizes[f] = round(d, 3)
    featureMeans.experienced[f] = round(mean(expVals), 3)
    featureMeans.new[f] = round(mean(newVals), 3)
    if (d > topCohenD) topCohenD = d
  }

  const failReasons: string[] = []
  if (accuracy < THRESHOLDS.minAccuracy) {
    failReasons.push(
      `accuracy ${(accuracy * 100).toFixed(1)}% < threshold ${THRESHOLDS.minAccuracy * 100}%`,
    )
  }
  if (aaFailureRate > THRESHOLDS.maxAaFailureRate) {
    failReasons.push(
      `A/A failure rate ${(aaFailureRate * 100).toFixed(1)}% > threshold ${THRESHOLDS.maxAaFailureRate * 100}%`,
    )
  }
  if (topCohenD < THRESHOLDS.minTopCohenD) {
    failReasons.push(
      `top Cohen's d ${topCohenD.toFixed(3)} < threshold ${THRESHOLDS.minTopCohenD}`,
    )
  }

  return {
    dayCount,
    accuracy: round(accuracy, 4),
    aaFailureRate: round(aaFailureRate, 4),
    featureEffectSizes,
    featureMeans,
    topCohenD: round(topCohenD, 3),
    verdict: failReasons.length === 0 ? 'PASS' : 'FAIL',
    failReasons,
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): { trials: number; maxDays: number; outPath: string } {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag)
    return idx !== -1 ? argv[idx + 1] : undefined
  }
  return {
    trials: Number(get('--trials') ?? 200),
    maxDays: Number(get('--days') ?? 30),
    outPath: get('--out') ?? './generated/power-report.json',
  }
}

function main(): void {
  const { trials, maxDays, outPath } = parseArgs()

  const allDayCounts = [7, 14, 21, 30]
  const dayCounts = [...new Set([...allDayCounts.filter(d => d <= maxDays), maxDays])].sort(
    (a, b) => a - b,
  )

  console.log('B8 Monte Carlo Power Analysis')
  console.log(`  trials: ${trials}  day-counts: [${dayCounts.join(', ')}]`)
  console.log(
    `  thresholds: accuracy≥${THRESHOLDS.minAccuracy * 100}%  A/A-fail≤${THRESHOLDS.maxAaFailureRate * 100}%  top-d≥${THRESHOLDS.minTopCohenD}\n`,
  )

  const results: DayResult[] = []

  for (const dayCount of dayCounts) {
    process.stdout.write(`  Running ${trials} trials × ${dayCount} days ...`)
    const result = runTrialsForDayCount(trials, dayCount)
    results.push(result)
    console.log(
      ` ${result.verdict}  (accuracy=${(result.accuracy * 100).toFixed(1)}%  A/A-fail=${(result.aaFailureRate * 100).toFixed(1)}%  top-d=${result.topCohenD.toFixed(2)})`,
    )
  }

  // Summary table
  console.log(
    `\n  ${'Days'.padEnd(6)}  ${'Accuracy'.padEnd(10)}  ${'A/A Fail'.padEnd(10)}  ${'Top d'.padEnd(8)}  Verdict`,
  )
  console.log(`  ${'─'.repeat(56)}`)
  for (const r of results) {
    const acc = `${(r.accuracy * 100).toFixed(1)}%`
    const aa = `${(r.aaFailureRate * 100).toFixed(1)}%`
    const suffix = r.failReasons.length > 0 ? `  ← ${r.failReasons[0]}` : ''
    console.log(
      `  ${String(r.dayCount).padEnd(6)}  ${acc.padEnd(10)}  ${aa.padEnd(10)}  ${r.topCohenD.toFixed(2).padEnd(8)}  ${r.verdict}${suffix}`,
    )
  }

  // Feature effect sizes at max day-count
  const maxResult = results[results.length - 1]!
  console.log(`\n  Feature effect sizes at ${maxDays} days (Cohen's d, experienced vs new):`)
  const sortedFeatures = (Object.entries(maxResult.featureEffectSizes) as [ContinuousFeature, number][])
    .sort((a, b) => b[1] - a[1])
  for (const [feature, d] of sortedFeatures) {
    const bar = '█'.repeat(Math.min(20, Math.round(d * 4)))
    const expMean = maxResult.featureMeans.experienced[feature]
    const newMean = maxResult.featureMeans.new[feature]
    console.log(`    ${feature.padEnd(28)}  d=${d.toFixed(2).padStart(5)}  ${bar}  (exp:${expMean}  new:${newMean})`)
  }

  const overallVerdict = maxResult.verdict
  const overallFailReasons = maxResult.failReasons

  console.log(`\n  Overall verdict (${maxDays} days): ${overallVerdict}`)
  if (overallFailReasons.length > 0) {
    for (const reason of overallFailReasons) {
      console.log(`    ✗ ${reason}`)
    }
  } else {
    console.log('    All thresholds met — signal is sufficient to proceed.')
  }

  const report: PowerReport = {
    config: { trials, dayCounts, thresholds: THRESHOLDS },
    results,
    overallVerdict,
    overallFailReasons,
    generatedAt: new Date(Date.parse('2026-06-16')).toISOString(),
  }

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`\n  Report → ${outPath}`)

  process.exit(overallVerdict === 'PASS' ? 0 : 1)
}

// Only run when invoked directly (not when imported by a test)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
