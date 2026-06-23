/**
 * B5 Synthetic Learner Generator — CLI entry point
 *
 * Usage:
 *   tsx src/simulation/run.ts [options]
 *
 * Options:
 *   --seed <n>          Seed for the PRNG (default: 1)
 *   --days <n>          Days to simulate (default: 30)
 *   --start-date <d>    ISO 8601 start date, e.g. 2026-05-17 (default: 30 days before today)
 *   --out <dir>         Output directory (default: ./generated)
 *   --persona <id>      Run only this persona: experienced | new
 *
 * Output files:
 *   <out>/<personaId>-seed-<seed>.json
 *
 * Example — reproducible A/A test pair:
 *   tsx src/simulation/run.ts --seed 1
 *   tsx src/simulation/run.ts --seed 2
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_PERSONAS, CURRICULUM } from '@adaptive/shared'
import type { LearnerPersona } from '@adaptive/shared'
import { generateHistory } from './generator'
import type { SimulatorConfig } from './types'

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

function parseArgs(): {
  seed: number
  days: number
  startDate: string
  outDir: string
  personaFilter: string | null
} {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag)
    return idx !== -1 ? argv[idx + 1] : undefined
  }

  const seed = Number(get('--seed') ?? 1)
  const days = Number(get('--days') ?? 30)

  // Default start date: <days> days before a fixed reference so the output is
  // deterministic without access to the real clock.
  const startDateArg = get('--start-date')
  let startDate: string
  if (startDateArg) {
    startDate = startDateArg
  } else {
    // Offset from a fixed epoch so reruns produce the same timestamps
    const referenceEpoch = Date.parse('2026-06-16')
    const d = new Date(referenceEpoch - days * 86_400_000)
    startDate = d.toISOString().slice(0, 10)
  }

  const outDir = get('--out') ?? './generated'
  const personaFilter = get('--persona') ?? null

  return { seed, days, startDate, outDir, personaFilter }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const { seed, days, startDate, outDir, personaFilter } = parseArgs()

  const curriculum = CURRICULUM
  mkdirSync(outDir, { recursive: true })

  const personas: LearnerPersona[] = personaFilter
    ? ALL_PERSONAS.filter(p => p.personaId === personaFilter)
    : ALL_PERSONAS

  if (personas.length === 0) {
    console.error(`Unknown persona "${personaFilter}". Valid values: experienced, new`)
    process.exit(1)
  }

  const config: SimulatorConfig = { seed, days, startDate }

  // Stamp the generation time from the fixed epoch to keep output deterministic
  const generatedAt = new Date(Date.parse('2026-06-16')).toISOString()

  console.log(`Generating synthetic histories — seed:${seed}  days:${days}  start:${startDate}\n`)

  for (const persona of personas) {
    const history = generateHistory(persona, curriculum, config, generatedAt)

    const filename = `${persona.personaId}-seed-${seed}.json`
    const outPath = join(outDir, filename)
    writeFileSync(outPath, JSON.stringify(history, null, 2), 'utf-8')

    const s = history.summary
    console.log(`  ${persona.label.padEnd(12)} → ${outPath}`)
    console.log(`    activeDays:${s.activeDays}  sessions:${s.totalSessions}  lessons:${s.totalLessons}  events:${s.totalEvents}  mastery:${s.finalOverallMastery}`)
  }

  console.log('\nDone.')
}

main()
