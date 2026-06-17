import type { LearningEvent } from '@adaptive/shared'
import type { GeneratedHistory } from './types'

export interface ValidationError {
  rule: string
  detail: string
}

// Every event must have required base fields with non-null, non-empty values.
export function checkBaseFields(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (const evt of events) {
    const id = (evt as { eventId?: unknown }).eventId
    if (!id || typeof id !== 'string') {
      errors.push({ rule: 'base_fields', detail: `Event at seq ${evt.sequenceNumber} missing eventId` })
    }
    if (!evt.userId || typeof evt.userId !== 'string') {
      errors.push({ rule: 'base_fields', detail: `Event ${String(id)} missing userId` })
    }
    if (!evt.timestamp || typeof evt.timestamp !== 'string') {
      errors.push({ rule: 'base_fields', detail: `Event ${String(id)} missing timestamp` })
    }
    if (!evt.clientTimestamp || typeof evt.clientTimestamp !== 'string') {
      errors.push({ rule: 'base_fields', detail: `Event ${String(id)} missing clientTimestamp` })
    }
    if (typeof evt.sequenceNumber !== 'number') {
      errors.push({ rule: 'base_fields', detail: `Event ${String(id)} missing sequenceNumber` })
    }
    if (!evt.kind || typeof evt.kind !== 'string') {
      errors.push({ rule: 'base_fields', detail: `Event ${String(id)} missing kind` })
    }
  }
  return errors
}

// No two events may share the same eventId within a history.
export function checkEventIdUniqueness(events: LearningEvent[]): ValidationError[] {
  const seen = new Set<string>()
  const errors: ValidationError[] = []
  for (const evt of events) {
    const id = evt.eventId
    if (seen.has(id)) {
      errors.push({ rule: 'event_id_uniqueness', detail: `Duplicate eventId: ${id}` })
    }
    seen.add(id)
  }
  return errors
}

// Timestamps must never go backward across the event stream.
export function checkTemporalMonotonicity(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (let i = 1; i < events.length; i++) {
    const prev = Date.parse(events[i - 1].timestamp)
    const curr = Date.parse(events[i].timestamp)
    if (curr < prev) {
      errors.push({
        rule: 'temporal_monotonicity',
        detail: `Timestamp went backward: event ${events[i - 1].eventId} (${events[i - 1].timestamp}) → event ${events[i].eventId} (${events[i].timestamp})`,
      })
    }
  }
  return errors
}

// The generator's global sequence counter must increment by exactly 1 per event.
export function checkSequenceNumberMonotonicity(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (let i = 1; i < events.length; i++) {
    const expected = events[i - 1].sequenceNumber + 1
    if (events[i].sequenceNumber !== expected) {
      errors.push({
        rule: 'sequence_number_monotonicity',
        detail: `sequenceNumber gap: expected ${expected}, got ${events[i].sequenceNumber} at event ${events[i].eventId}`,
      })
    }
  }
  return errors
}

// Every session_started must be closed by exactly one session_ended.
export function checkSessionPairing(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  const open = new Set<string>()

  for (const evt of events) {
    if (evt.kind === 'session_started') {
      const sid = evt.sessionId ?? evt.eventId
      if (open.has(sid)) {
        errors.push({ rule: 'session_pairing', detail: `session_started for ${sid} while already open` })
      }
      open.add(sid)
    } else if (evt.kind === 'session_ended') {
      const sid = evt.sessionId ?? ''
      if (!open.has(sid)) {
        errors.push({ rule: 'session_pairing', detail: `session_ended for ${sid} with no matching session_started` })
      }
      open.delete(sid)
    }
  }

  for (const sid of open) {
    errors.push({ rule: 'session_pairing', detail: `session_started for ${sid} with no matching session_ended` })
  }

  return errors
}

// Every lesson_started must close with lesson_completed or lesson_abandoned.
// Lessons may be retried across sessions, so the same lessonId may appear multiple times.
export function checkLessonPairing(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  // Track currently-open lessons by lessonId. Since the generator is sequential
  // within a session (one lesson at a time), the same lessonId can't be open twice.
  const open = new Map<string, string>() // lessonId → eventId of the start

  for (const evt of events) {
    if (evt.kind === 'lesson_started') {
      if (open.has(evt.lessonId)) {
        errors.push({ rule: 'lesson_pairing', detail: `lesson_started for ${evt.lessonId} while already open (eventId: ${evt.eventId})` })
      }
      open.set(evt.lessonId, evt.eventId)
    } else if (evt.kind === 'lesson_completed' || evt.kind === 'lesson_abandoned') {
      if (!open.has(evt.lessonId)) {
        errors.push({ rule: 'lesson_pairing', detail: `${evt.kind} for ${evt.lessonId} with no matching lesson_started` })
      }
      open.delete(evt.lessonId)
    }
  }

  for (const [lessonId, startEventId] of open) {
    errors.push({ rule: 'lesson_pairing', detail: `lesson_started (${startEventId}) for ${lessonId} with no matching close` })
  }

  return errors
}

// Every level_completed must have a prior level_started for that level.
// Note: level_started does not require a matching level_completed — sessions
// can end before a level's review is reached, leaving levels unclosed.
export function checkLevelCompletedHasStarted(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  const started = new Set<string>()

  for (const evt of events) {
    if (evt.kind === 'level_started') {
      started.add(evt.levelId)
    } else if (evt.kind === 'level_completed') {
      if (!started.has(evt.levelId)) {
        errors.push({ rule: 'level_pairing', detail: `level_completed for ${evt.levelId} with no prior level_started` })
      }
    }
  }

  return errors
}

// Every app_opened must be closed by exactly one app_backgrounded.
export function checkAppPairing(events: LearningEvent[]): ValidationError[] {
  const errors: ValidationError[] = []
  let appOpen = false
  let openEventId = ''

  for (const evt of events) {
    if (evt.kind === 'app_opened') {
      if (appOpen) {
        errors.push({ rule: 'app_pairing', detail: `app_opened (${evt.eventId}) while app already open since ${openEventId}` })
      }
      appOpen = true
      openEventId = evt.eventId
    } else if (evt.kind === 'app_backgrounded') {
      if (!appOpen) {
        errors.push({ rule: 'app_pairing', detail: `app_backgrounded (${evt.eventId}) with no matching app_opened` })
      }
      appOpen = false
      openEventId = ''
    }
  }

  if (appOpen) {
    errors.push({ rule: 'app_pairing', detail: `app_opened (${openEventId}) with no matching app_backgrounded` })
  }

  return errors
}

// Run all checks and return combined errors. An empty array means the history is valid.
export function validateAll(history: GeneratedHistory): ValidationError[] {
  return [
    ...checkBaseFields(history.events),
    ...checkEventIdUniqueness(history.events),
    ...checkTemporalMonotonicity(history.events),
    ...checkSequenceNumberMonotonicity(history.events),
    ...checkSessionPairing(history.events),
    ...checkLessonPairing(history.events),
    ...checkLevelCompletedHasStarted(history.events),
    ...checkAppPairing(history.events),
  ]
}
