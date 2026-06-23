import type { PersonaId } from '@adaptive/shared'
import type { BehavioralFeatures } from './features'

/**
 * Rule-based persona classifier derived from the known behavior profile thresholds
 * in personas.ts. Returns the most likely PersonaId given extracted event features.
 *
 * Decision order:
 *   1. Skip behavior (directive-triggered review) → experienced only
 *   2. Everything else → new
 */
export function classifyPersona(features: BehavioralFeatures): PersonaId {
  if (features.skipBehaviorPresent) return 'experienced'
  return 'new'
}
