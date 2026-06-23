/**
 * B7 Pattern Recovery — run with: tsx src/simulation/recover.test.ts
 *
 * Verifies that behavioral signals embedded in synthetic event streams are
 * recoverable from raw events alone. Passing this harness proves the event
 * taxonomy carries enough signal for the Brain's decision logic.
 * Exit code 0 = all pass.  Exit code 1 = at least one failure.
 */

import assert from 'node:assert/strict'
import {
  CURRICULUM,
  EXPERIENCED_PERSONA,
  NEW_PERSONA,
} from '@adaptive/shared'
import type { PersonaId } from '@adaptive/shared'
import { generateHistory } from './generator'
import { extractFeatures } from './features'
import { classifyPersona } from './recover'

// ─── Tiny test runner ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
let currentSuite = ''

function describe(name: string, fn: () => void): void {
  currentSuite = name
  fn()
}

function it(name: string, fn: () => void): void {
  const label = currentSuite ? `${currentSuite} > ${name}` : name
  try {
    fn()
    console.log(`  ✓  ${label}`)
    passed++
  } catch (err) {
    const msg = err instanceof assert.AssertionError ? err.message : String(err)
    console.error(`  ✗  ${label}`)
    console.error(`     ${msg}`)
    failed++
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CONFIG = { seed: 1, days: 30, startDate: '2026-05-17' }
const FIXED_TS = '2026-06-16T00:00:00.000Z'

const experiencedHistory = generateHistory(EXPERIENCED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
const newHistory = generateHistory(NEW_PERSONA, CURRICULUM, CONFIG, FIXED_TS)

const experiencedFeatures = extractFeatures(experiencedHistory)
const newFeatures = extractFeatures(newHistory)

// ─── Feature snapshot table ───────────────────────────────────────────────────

console.log('\nFeature snapshot (seed 1):')
console.log('─'.repeat(80))

function fmtRow(f: ReturnType<typeof extractFeatures>): string {
  return [
    f.personaId.padEnd(12),
    `abandon=${f.lessonAbandonRate.toFixed(2)}`,
    `hint=${f.hintRate.toFixed(2)}`,
    `correct1st=${f.correctOnFirstTryRate.toFixed(2)}`,
    `latency=${Math.round(f.medianAnswerLatencyMs)}ms`,
    `dwell=${Math.round(f.medianContentDwellMs)}ms`,
    `skipPresent=${String(f.skipBehaviorPresent)}`,
  ].join('  ')
}

console.log(` ${fmtRow(experiencedFeatures)}`)
console.log(` ${fmtRow(newFeatures)}`)
console.log('─'.repeat(80))

// ─── Base seed classification ─────────────────────────────────────────────────

describe('base seed recovery (seed 1)', () => {
  it('classifies experienced correctly', () => {
    const predicted = classifyPersona(experiencedFeatures)
    assert.equal(predicted, 'experienced', `Got ${predicted}`)
  })

  it('classifies new correctly', () => {
    const predicted = classifyPersona(newFeatures)
    assert.equal(predicted, 'new', `Got ${predicted}`)
  })
})

// ─── Multi-seed recovery ──────────────────────────────────────────────────────

describe('multi-seed recovery (seeds 1–5)', () => {
  const SEEDS = [1, 2, 3, 4, 5]
  const PERSONAS: { persona: typeof EXPERIENCED_PERSONA; expected: PersonaId }[] = [
    { persona: EXPERIENCED_PERSONA, expected: 'experienced' },
    { persona: NEW_PERSONA, expected: 'new' },
  ]

  for (const { persona, expected } of PERSONAS) {
    it(`all seeds recover ${expected}`, () => {
      const misclassified: number[] = []
      for (const seed of SEEDS) {
        const h = generateHistory(
          persona,
          CURRICULUM,
          { seed, days: 30, startDate: '2026-05-17' },
          FIXED_TS,
        )
        const features = extractFeatures(h)
        const predicted = classifyPersona(features)
        if (predicted !== expected) misclassified.push(seed)
      }
      assert.equal(
        misclassified.length,
        0,
        `Misclassified on seeds: ${misclassified.join(', ')}`,
      )
    })
  }
})

// ─── Experienced feature ranges ───────────────────────────────────────────────

describe('experienced feature ranges', () => {
  it('has skip behavior present', () => {
    assert.ok(experiencedFeatures.skipBehaviorPresent, 'Expected skipBehaviorPresent = true')
  })

  it('has at least one directive-triggered review', () => {
    assert.ok(
      experiencedFeatures.directiveReviewCount >= 1,
      `directiveReviewCount = ${experiencedFeatures.directiveReviewCount}`,
    )
  })

  it('has low abandon rate (< 0.15)', () => {
    assert.ok(
      experiencedFeatures.lessonAbandonRate < 0.15,
      `abandon rate ${experiencedFeatures.lessonAbandonRate.toFixed(2)} not < 0.15`,
    )
  })

  it('has low hint rate (< 0.15)', () => {
    assert.ok(
      experiencedFeatures.hintRate < 0.15,
      `hint rate ${experiencedFeatures.hintRate.toFixed(2)} not < 0.15`,
    )
  })

  it('has high correct-on-first-try rate (> 0.65)', () => {
    assert.ok(
      experiencedFeatures.correctOnFirstTryRate > 0.65,
      `correct first try ${experiencedFeatures.correctOnFirstTryRate.toFixed(2)} not > 0.65`,
    )
  })
})

// ─── New persona feature ranges ───────────────────────────────────────────────

describe('new persona feature ranges', () => {
  it('has no skip behavior', () => {
    assert.ok(!newFeatures.skipBehaviorPresent, 'Expected skipBehaviorPresent = false')
  })

  it('has high hint rate (> 0.35)', () => {
    assert.ok(
      newFeatures.hintRate > 0.35,
      `hint rate ${newFeatures.hintRate.toFixed(2)} not > 0.35`,
    )
  })

  it('has low abandon rate (< 0.15)', () => {
    assert.ok(
      newFeatures.lessonAbandonRate < 0.15,
      `abandon rate ${newFeatures.lessonAbandonRate.toFixed(2)} not < 0.15`,
    )
  })

  it('has slow answer latency (median > 10000ms)', () => {
    assert.ok(
      newFeatures.medianAnswerLatencyMs > 10_000,
      `median latency ${newFeatures.medianAnswerLatencyMs}ms not > 10000ms`,
    )
  })

  it('has long content dwell (median > 15000ms)', () => {
    assert.ok(
      newFeatures.medianContentDwellMs > 15_000,
      `median dwell ${newFeatures.medianContentDwellMs}ms not > 15000ms`,
    )
  })
})

// ─── Cross-persona distinguishability ────────────────────────────────────────

describe('feature distinguishability', () => {
  it('new has higher hint rate than experienced', () => {
    assert.ok(
      newFeatures.hintRate > experiencedFeatures.hintRate,
      `new ${newFeatures.hintRate.toFixed(2)} not > experienced ${experiencedFeatures.hintRate.toFixed(2)}`,
    )
  })

  it('new has longer answer latency than experienced', () => {
    assert.ok(
      newFeatures.medianAnswerLatencyMs > experiencedFeatures.medianAnswerLatencyMs,
      `new ${newFeatures.medianAnswerLatencyMs}ms not > experienced ${experiencedFeatures.medianAnswerLatencyMs}ms`,
    )
  })

  it('new has longer content dwell than experienced', () => {
    assert.ok(
      newFeatures.medianContentDwellMs > experiencedFeatures.medianContentDwellMs,
      `new ${newFeatures.medianContentDwellMs}ms not > experienced ${experiencedFeatures.medianContentDwellMs}ms`,
    )
  })

  it('experienced has higher correct-on-first-try rate than new', () => {
    assert.ok(
      experiencedFeatures.correctOnFirstTryRate > newFeatures.correctOnFirstTryRate,
      `experienced ${experiencedFeatures.correctOnFirstTryRate.toFixed(2)} not > new ${newFeatures.correctOnFirstTryRate.toFixed(2)}`,
    )
  })
})

// ─── Result summary ───────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`)
console.log(`  ${passed + failed} tests  ·  ${passed} passed  ·  ${failed} failed`)
console.log('─'.repeat(60))

if (failed > 0) {
  process.exit(1)
}
