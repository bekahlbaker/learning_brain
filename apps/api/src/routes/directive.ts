import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { BrainRequest } from '@adaptive/shared'
import { prisma } from '../db/client'
import { buildDirective } from '../lib/directive-builder'

export async function directiveRoute(app: FastifyInstance): Promise<void> {
  app.post('/directive', async (request: FastifyRequest<{ Body: BrainRequest }>, reply) => {
    const { userId } = request.body

    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return reply.status(404).send({ error: 'Learner profile not found' })
    }

    const masteryRows = await prisma.lessonMastery.findMany({
      where: { userId },
    })

    return reply.send(buildDirective(profile, masteryRows, request.body))
  })
}
