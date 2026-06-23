/**
 * B8 Power Analysis — smoke tests
 * Run with: tsx src/simulation/power.test.ts
 *
 * Verifies report shape and completion time. Does not assert a specific verdict —
 * the verdict is determined by the thresholds and the actual simulation data.
 */

import assert from 'node:assert/strict'
import { runTrialsForDayCount, THRESHOLDS, CONTINUOUS_FEATURES } from './power'

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

// ─── Fixture — run once, reuse across suites ──────────────────────────────────

const TRIALS = 10
const DAY_COUNT = 30

const start = Date.now()
const result = runTrialsForDayCount(TRIALS, DAY_COUNT)
const elapsed = Date.now() - start

// ─── Report shape ─────────────────────────────────────────────────────────────

describe('report shape', () => {
  it('returns a dayCount matching the input', () => {
    assert.equal(result.dayCount, DAY_COUNT)
  })

  it('accuracy is a number in [0, 1]', () => {
    assert.ok(typeof result.accuracy === 'number', 'accuracy must be a number')
    assert.ok(result.accuracy >= 0 && result.accuracy <= 1, `accuracy ${result.accuracy} out of range`)
  })

  it('aaFailureRate is a number in [0, 1]', () => {
    assert.ok(typeof result.aaFailureRate === 'number', 'aaFailureRate must be a number')
    assert.ok(
      result.aaFailureRate >= 0 && result.aaFailureRate <= 1,
      `aaFailureRate ${result.aaFailureRate} out of range`,
    )
  })

  it('topCohenD is a non-negative number', () => {
    assert.ok(typeof result.topCohenD === 'number', 'topCohenD must be a number')
    assert.ok(result.topCohenD >= 0, `topCohenD ${result.topCohenD} must be >= 0`)
  })

  it('verdict is PASS or FAIL', () => {
    assert.ok(
      result.verdict === 'PASS' || result.verdict === 'FAIL',
      `unexpected verdict: ${result.verdict}`,
    )
  })

  it('failReasons is an array', () => {
    assert.ok(Array.isArray(result.failReasons), 'failReasons must be an array')
  })

  it('failReasons is empty when verdict is PASS', () => {
    if (result.verdict === 'PASS') {
      assert.equal(result.failReasons.length, 0, 'PASS verdict must have no fail reasons')
    }
  })

  it('failReasons is non-empty when verdict is FAIL', () => {
    if (result.verdict === 'FAIL') {
      assert.ok(result.failReasons.length > 0, 'FAIL verdict must have at least one fail reason')
    }
  })
})

// ─── Feature effect sizes ─────────────────────────────────────────────────────

describe('feature effect sizes', () => {
  it('featureEffectSizes has an entry for every continuous feature', () => {
    for (const f of CONTINUOUS_FEATURES) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result.featureEffectSizes, f),
        `missing featureEffectSizes.${f}`,
      )
    }
  })

  it('all effect sizes are non-negative numbers', () => {
    for (const [f, d] of Object.entries(result.featureEffectSizes)) {
      assert.ok(typeof d === 'number' && d >= 0, `featureEffectSizes.${f} = ${d} must be >= 0`)
    }
  })

  it('featureMeans has experienced and new sub-objects with all features', () => {
    for (const persona of ['experienced', 'new'] as const) {
      for (const f of CONTINUOUS_FEATURES) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(result.featureMeans[persona], f),
          `missing featureMeans.${persona}.${f}`,
        )
        const v = result.featureMeans[persona][f]
        assert.ok(typeof v === 'number', `featureMeans.${persona}.${f} must be a number`)
      }
    }
  })
})

// ─── Threshold constants ──────────────────────────────────────────────────────

describe('threshold constants', () => {
  it('THRESHOLDS.minAccuracy is in (0, 1)', () => {
    assert.ok(THRESHOLDS.minAccuracy > 0 && THRESHOLDS.minAccuracy < 1)
  })

  it('THRESHOLDS.maxAaFailureRate is in (0, 1)', () => {
    assert.ok(THRESHOLDS.maxAaFailureRate > 0 && THRESHOLDS.maxAaFailureRate < 1)
  })

  it('THRESHOLDS.minTopCohenD is positive', () => {
    assert.ok(THRESHOLDS.minTopCohenD > 0)
  })
})

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('same trials + dayCount produces identical accuracy on a second run', () => {
    const result2 = runTrialsForDayCount(TRIALS, DAY_COUNT)
    assert.equal(result2.accuracy, result.accuracy, 'accuracy must be deterministic')
    assert.equal(result2.aaFailureRate, result.aaFailureRate, 'aaFailureRate must be deterministic')
    assert.equal(result2.topCohenD, result.topCohenD, 'topCohenD must be deterministic')
  })
})

// ─── Performance ─────────────────────────────────────────────────────────────

describe('performance', () => {
  it(`completes ${TRIALS} trials in under 30 seconds`, () => {
    assert.ok(elapsed < 30_000, `took ${elapsed}ms — expected < 30000ms`)
  })
})

// ─── Result summary ───────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`)
console.log(`  ${passed + failed} tests  ·  ${passed} passed  ·  ${failed} failed`)
console.log(`  ${TRIALS} trials × ${DAY_COUNT} days → verdict: ${result.verdict}  (${elapsed}ms)`)
console.log('─'.repeat(60))

if (failed > 0) {
  process.exit(1)
}
