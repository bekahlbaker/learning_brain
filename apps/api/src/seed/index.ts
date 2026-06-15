import { PrismaClient } from '@prisma/client'
import { ALL_PERSONAS } from '@adaptive/shared'

const prisma = new PrismaClient()

async function seed(): Promise<void> {
  console.log('Seeding personas...')

  for (const persona of ALL_PERSONAS) {
    const { phone, name } = persona.onboardingAnswers.profile

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name },
    })

    await prisma.learnerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        personaId: persona.personaId,
        teachingTone: persona.coldStart.teachingTone,
        explanationDepth: persona.coldStart.explanationDepth,
        overallMastery: 0,
      },
    })

    await prisma.onboardingAnswers.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        answers: persona.onboardingAnswers as object,
      },
    })

    console.log(`  ✓ ${persona.label}: ${name} (${phone}) — id: ${user.id}`)
  }

  console.log('Done.')
}

seed()
  .catch(console.error)
  .finally(() => void prisma.$disconnect())
