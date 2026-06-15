import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { LearningEvent } from '@adaptive/shared'
import { prisma } from '../db/client'

export async function eventsRoute(app: FastifyInstance): Promise<void> {
  app.post('/events', async (request: FastifyRequest<{ Body: LearningEvent[] }>, reply) => {
    const events = request.body

    if (!Array.isArray(events) || events.length === 0) {
      return reply.status(400).send({ error: 'Body must be a non-empty array of events' })
    }

    const serverTime = new Date()

    await prisma.learningEvent.createMany({
      data: events.map((e) => ({
        eventId: e.eventId,
        userId: e.userId,
        sessionId: e.sessionId ?? null,
        kind: e.kind,
        payload: { ...e, timestamp: serverTime.toISOString() },
        clientTimestamp: new Date(e.clientTimestamp),
      })),
      skipDuplicates: true,
    })

    return reply.status(202).send({ accepted: events.length })
  })
}
