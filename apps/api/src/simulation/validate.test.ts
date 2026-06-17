/**
 * B6 Validation Harness — run with: tsx src/simulation/validate.test.ts
 *
 * Minimal test runner using node:assert. No external test framework required.
 * Exit code 0 = all pass.  Exit code 1 = at least one failure.
 */

import assert from 'node:assert/strict'
import {
  ALL_PERSONAS,
  CURRICULUM,
  EXPERIENCED_PERSONA,
  NEW_PERSONA,
  DISENGAGED_PERSONA,
} from '@adaptive/shared'
import { generateHistory } from './generator'
import {
  validateAll,
  checkBaseFields,
  checkEventIdUniqueness,
  checkTemporalMonotonicity,
  checkSequenceNumberMonotonicity,
  checkSessionPairing,
  checkLessonPairing,
  checkLevelCompletedHasStarted,
  checkAppPairing,
} from './validate'
import type { GeneratedHistory } from './types'

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
const disengagedHistory = generateHistory(DISENGAGED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
const allHistories: GeneratedHistory[] = [experiencedHistory, newHistory, disengagedHistory]

// ─── A/A determinism ─────────────────────────────────────────────────────────

describe('A/A determinism', () => {
  it('same seed produces bit-identical output for experienced', () => {
    const h1 = generateHistory(EXPERIENCED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    const h2 = generateHistory(EXPERIENCED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    assert.equal(JSON.stringify(h1), JSON.stringify(h2))
  })

  it('same seed produces bit-identical output for new', () => {
    const h1 = generateHistory(NEW_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    const h2 = generateHistory(NEW_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    assert.equal(JSON.stringify(h1), JSON.stringify(h2))
  })

  it('same seed produces bit-identical output for disengaged', () => {
    const h1 = generateHistory(DISENGAGED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    const h2 = generateHistory(DISENGAGED_PERSONA, CURRICULUM, CONFIG, FIXED_TS)
    assert.equal(JSON.stringify(h1), JSON.stringify(h2))
  })
})

// ─── A/B variation ───────────────────────────────────────────────────────────

describe('A/B variation', () => {
  it('different seeds produce different event streams', () => {
    const h1 = generateHistory(NEW_PERSONA, CURRICULUM, { seed: 1, days: 30, startDate: '2026-05-17' }, FIXED_TS)
    const h2 = generateHistory(NEW_PERSONA, CURRICULUM, { seed: 2, days: 30, startDate: '2026-05-17' }, FIXED_TS)
    assert.notEqual(JSON.stringify(h1.events), JSON.stringify(h2.events))
  })

  it('different seeds produce different summaries', () => {
    const h1 = generateHistory(DISENGAGED_PERSONA, CURRICULUM, { seed: 1, days: 30, startDate: '2026-05-17' }, FIXED_TS)
    const h2 = generateHistory(DISENGAGED_PERSONA, CURRICULUM, { seed: 2, days: 30, startDate: '2026-05-17' }, FIXED_TS)
    const differ =
      h1.summary.totalEvents !== h2.summary.totalEvents ||
      h1.summary.finalOverallMastery !== h2.summary.finalOverallMastery ||
      h1.summary.activeDays !== h2.summary.activeDays
    assert.ok(differ, 'Expected at least one summary field to differ between seed:1 and seed:2')
  })

  it('same seed, different start date produces different timestamps', () => {
    const h1 = generateHistory(NEW_PERSONA, CURRICULUM, { seed: 1, days: 30, startDate: '2026-05-17' }, FIXED_TS)
    const h2 = generateHistory(NEW_PERSONA, CURRICULUM, { seed: 1, days: 30, startDate: '2026-04-01' }, FIXED_TS)
    assert.notEqual(h1.events[0]?.timestamp, h2.events[0]?.timestamp)
  })
})

// ─── Structural validation (all rules, all personas) ─────────────────────────

describe('structural validation', () => {
  it('experienced history passes all checks', () => {
    const errors = validateAll(experiencedHistory)
    assert.deepEqual(errors, [], `Unexpected errors:\n${errors.map(e => `  [${e.rule}] ${e.detail}`).join('\n')}`)
  })

  it('new history passes all checks', () => {
    const errors = validateAll(newHistory)
    assert.deepEqual(errors, [], `Unexpected errors:\n${errors.map(e => `  [${e.rule}] ${e.detail}`).join('\n')}`)
  })

  it('disengaged history passes all checks', () => {
    const errors = validateAll(disengagedHistory)
    assert.deepEqual(errors, [], `Unexpected errors:\n${errors.map(e => `  [${e.rule}] ${e.detail}`).join('\n')}`)
  })
})

// ─── Individual rule checks ───────────────────────────────────────────────────

describe('base fields', () => {
  it('all events have required base fields', () => {
    for (const h of allHistories) {
      const errors = checkBaseFields(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })

  it('all eventIds are non-empty strings', () => {
    for (const h of allHistories) {
      for (const evt of h.events) {
        assert.equal(typeof evt.eventId, 'string')
        assert.ok(evt.eventId.length > 0, `${h.personaId}: empty eventId`)
      }
    }
  })
})

describe('event ID uniqueness', () => {
  it('no duplicate eventIds in any history', () => {
    for (const h of allHistories) {
      const errors = checkEventIdUniqueness(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })
})

describe('temporal monotonicity', () => {
  it('timestamps never go backward', () => {
    for (const h of allHistories) {
      const errors = checkTemporalMonotonicity(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })
})

describe('sequence number monotonicity', () => {
  it('sequence numbers increment by 1 for every event', () => {
    for (const h of allHistories) {
      const errors = checkSequenceNumberMonotonicity(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })

  it('first event has sequenceNumber 1', () => {
    for (const h of allHistories) {
      assert.equal(h.events[0]?.sequenceNumber, 1, `${h.personaId}: first sequenceNumber`)
    }
  })
})

describe('session pairing', () => {
  it('every session_started has a matching session_ended', () => {
    for (const h of allHistories) {
      const errors = checkSessionPairing(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })

  it('session start and end counts match', () => {
    for (const h of allHistories) {
      const starts = h.events.filter(e => e.kind === 'session_started').length
      const ends = h.events.filter(e => e.kind === 'session_ended').length
      assert.equal(starts, ends, `${h.personaId}: ${starts} starts vs ${ends} ends`)
    }
  })
})

describe('lesson pairing', () => {
  it('every lesson_started closes with lesson_completed or lesson_abandoned', () => {
    for (const h of allHistories) {
      const errors = checkLessonPairing(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })
})

describe('level pairing', () => {
  it('every level_completed has a prior level_started', () => {
    for (const h of allHistories) {
      const errors = checkLevelCompletedHasStarted(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })
})

describe('app pairing', () => {
  it('every app_opened has a matching app_backgrounded', () => {
    for (const h of allHistories) {
      const errors = checkAppPairing(h.events)
      assert.deepEqual(errors, [], `${h.personaId}: ${errors[0]?.detail}`)
    }
  })

  it('app open and background counts match', () => {
    for (const h of allHistories) {
      const opens = h.events.filter(e => e.kind === 'app_opened').length
      const closes = h.events.filter(e => e.kind === 'app_backgrounded').length
      assert.equal(opens, closes, `${h.personaId}: ${opens} opens vs ${closes} closes`)
    }
  })
})

// ─── Mastery range ────────────────────────────────────────────────────────────

describe('mastery scores', () => {
  it('all lesson mastery scores are in [0, 100]', () => {
    for (const h of allHistories) {
      for (const [lessonId, m] of Object.entries(h.summary.lessonMastery)) {
        assert.ok(m.score >= 0 && m.score <= 100, `${h.personaId} lesson ${lessonId}: score ${m.score} out of range`)
      }
    }
  })

  it('finalOverallMastery is in [0, 100]', () => {
    for (const h of allHistories) {
      const s = h.summary.finalOverallMastery
      assert.ok(s >= 0 && s <= 100, `${h.personaId}: finalOverallMastery ${s} out of range`)
    }
  })
})

// ─── Experienced persona behavior ────────────────────────────────────────────

describe('experienced persona', () => {
  it('skips regular lessons — zero lesson_started events', () => {
    const lessonStarts = experiencedHistory.events.filter(e => e.kind === 'lesson_started')
    assert.equal(lessonStarts.length, 0, `Expected 0 lesson_started, got ${lessonStarts.length}`)
  })

  it('goes straight to level reviews — at least one level_review_started', () => {
    const reviewStarts = experiencedHistory.events.filter(e => e.kind === 'level_review_started')
    assert.ok(reviewStarts.length >= 1, 'Expected at least one level_review_started')
  })

  it('achieves high mastery (>70) given baseCorrectRate of 0.85', () => {
    assert.ok(
      experiencedHistory.summary.finalOverallMastery > 70,
      `Mastery ${experiencedHistory.summary.finalOverallMastery} not > 70`,
    )
  })

  it('completes the course in few sessions (at most 5)', () => {
    assert.ok(
      experiencedHistory.summary.totalSessions <= 5,
      `Expected <= 5 sessions, got ${experiencedHistory.summary.totalSessions}`,
    )
  })

  it('summary.totalLessons is 0 (no regular lessons counted)', () => {
    assert.equal(experiencedHistory.summary.totalLessons, 0)
  })
})

// ─── New persona behavior ─────────────────────────────────────────────────────

describe('new persona', () => {
  it('attempts regular lessons', () => {
    const lessonStarts = newHistory.events.filter(e => e.kind === 'lesson_started').length
    assert.ok(lessonStarts > 0, 'Expected at least one lesson_started')
  })

  it('uses hints frequently (hintFrequency 0.55)', () => {
    const hints = newHistory.events.filter(e => e.kind === 'hint_requested').length
    assert.ok(hints > 0, 'Expected at least one hint_requested')
  })

  it('has more hint_requested events than disengaged (0.55 vs 0.10)', () => {
    const newHints = newHistory.events.filter(e => e.kind === 'hint_requested').length
    const disengagedHints = disengagedHistory.events.filter(e => e.kind === 'hint_requested').length
    assert.ok(newHints > disengagedHints, `new ${newHints} hints not > disengaged ${disengagedHints}`)
  })
})

// ─── Disengaged persona behavior ──────────────────────────────────────────────

describe('disengaged persona', () => {
  it('abandons at least one lesson (abandonRate 0.45)', () => {
    const abandons = disengagedHistory.events.filter(e => e.kind === 'lesson_abandoned').length
    assert.ok(abandons > 0, 'Expected at least one lesson_abandoned')
  })

  it('abandons a higher fraction of started lessons than new (0.45 vs 0.08 abandon rate)', () => {
    const dStarts = disengagedHistory.events.filter(e => e.kind === 'lesson_started').length
    const dAbandons = disengagedHistory.events.filter(e => e.kind === 'lesson_abandoned').length
    const nStarts = newHistory.events.filter(e => e.kind === 'lesson_started').length
    const nAbandons = newHistory.events.filter(e => e.kind === 'lesson_abandoned').length
    // Guard: both personas must have at least attempted some lessons
    assert.ok(dStarts > 0, 'disengaged has no lesson_started events')
    assert.ok(nStarts > 0, 'new has no lesson_started events')
    const dRate = dAbandons / dStarts
    const nRate = nAbandons / nStarts
    assert.ok(dRate > nRate, `disengaged abandon rate ${dRate.toFixed(2)} not > new ${nRate.toFixed(2)}`)
  })
})

// ─── Cross-persona distinguishability ────────────────────────────────────────

describe('persona distinguishability', () => {
  it('experienced achieves higher mastery than new', () => {
    assert.ok(
      experiencedHistory.summary.finalOverallMastery > newHistory.summary.finalOverallMastery,
      `experienced ${experiencedHistory.summary.finalOverallMastery} not > new ${newHistory.summary.finalOverallMastery}`,
    )
  })

  it('experienced uses fewer hints than new', () => {
    const expHints = experiencedHistory.events.filter(e => e.kind === 'hint_requested').length
    const newHints = newHistory.events.filter(e => e.kind === 'hint_requested').length
    assert.ok(expHints < newHints, `experienced ${expHints} hints not < new ${newHints}`)
  })

  it('all three personas produce distinct total event counts', () => {
    const counts = allHistories.map(h => h.summary.totalEvents)
    const unique = new Set(counts)
    assert.equal(unique.size, 3, `Expected 3 distinct event counts, got ${[...unique].join(', ')}`)
  })
})

// ─── Event coverage ───────────────────────────────────────────────────────────

describe('event coverage', () => {
  it('experienced history contains level_review_started for all three levels', () => {
    const reviewLevelIds = new Set(
      experiencedHistory.events
        .filter(e => e.kind === 'level_review_started')
        .map(e => (e as { levelId: string }).levelId),
    )
    assert.ok(reviewLevelIds.has('level-1'), 'Missing level_review_started for level-1')
    assert.ok(reviewLevelIds.has('level-2'), 'Missing level_review_started for level-2')
    assert.ok(reviewLevelIds.has('level-3'), 'Missing level_review_started for level-3')
  })

  it('new history contains lesson_started for lesson-1-1', () => {
    const lessonIds = newHistory.events
      .filter(e => e.kind === 'lesson_started')
      .map(e => (e as { lessonId: string }).lessonId)
    assert.ok(lessonIds.includes('lesson-1-1'), 'Expected lesson-1-1 in lesson_started events')
  })

  it('all histories contain at least one app_opened event', () => {
    for (const h of allHistories) {
      assert.ok(h.events.some(e => e.kind === 'app_opened'), `${h.personaId}: no app_opened events`)
    }
  })
})

// ─── Result summary ───────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`)
console.log(`  ${passed + failed} tests  ·  ${passed} passed  ·  ${failed} failed`)
console.log('─'.repeat(60))

if (failed > 0) {
  process.exit(1)
}
