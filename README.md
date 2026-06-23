# Brain

> The decision and adaptation layer for the Adaptive Learning Coach — and the part of this side project I actually built it to learn.

## What this is

**Brain** is the server-side half of an experimental **Adaptive Learning Coach** — a validation-first proof of concept that adapts lesson delivery, tone, and pacing to each learner's behavior in real time.

The system is split into two services with a deliberately strict separation of concerns:

- **The Loop** ([separate repo](../learning-loop)) — the learner-facing app. Handles phone-number onboarding, flash-card lesson delivery, behavioral event emission, and rendering whatever the Brain tells it to. It teaches, but it never *decides*.
- **The Brain** (this repo) — consumes the stream of `LearningEvent`s the Loop emits and returns `BrainDirective`s: routing decisions, teaching tone, and mastery scores. It decides, but it never speaks to the learner.

The Brain holds learner state (profiles, per-lesson mastery, onboarding answers, the raw event log), turns that state into directives, and — just as importantly — carries the machinery to *prove* its adaptations are real before any of them are trusted: a synthetic learner generator, a validation harness, pattern-recovery tests, and a Monte Carlo power analysis that acts as a build gate.

## Why I built it

This is a **side project, and the Brain is the whole reason it exists**. The goals, in priority order:

1. **Understand how to work *with* AI as a building block**, not just consume it. The hard, interesting question is the boundary between deterministic application logic and probabilistic model output — where a model is allowed to influence the experience, and where it explicitly is not. In this system the Brain owns every *decision*, and the LLM (over in the Loop) is confined to phrasing teaching feedback. Drawing that line cleanly was the point.
2. **Build a decision and adaptation layer from scratch.** Turning a stream of behavioral events into mastery scores and routing directives — and structuring it so a deterministic rules-based version can later be swapped for a learned one without the Loop noticing — is the genuinely unfamiliar work, and where most of the effort goes.
3. **Practice a validation-first discipline.** Before believing any adaptation works, the harness has to show it: A/A tests to confirm no false signal, pattern-recovery tests to confirm the machinery detects effects that are really there, and a power analysis to decide whether there's enough signal to justify building a live model at all. Decisions are measured and proven, not assumed.

It is **not** production software and isn't trying to be. The point is the experiment and the architecture.

## Tech stack & why

| Choice | What it's for | Why |
| --- | --- | --- |
| **Fastify** | HTTP API (`/events`, `/directive`) | A small, fast, low-ceremony Node server — exactly enough to expose two endpoints without the weight of a full framework getting in the way of the actual work. |
| **Prisma + PostgreSQL** | Learner state & event store | Learner profiles, per-lesson mastery, onboarding answers, and the raw event log need durable, queryable, relational storage. Prisma's typed client keeps the data layer honest against the same TypeScript contract the rest of the system shares. |
| **TypeScript** | Everything | The Loop↔Brain contract lives in shared types. Strong typing across the service boundary is what lets the two halves evolve independently without silently drifting apart. |
| **`@adaptive/shared`** (workspace package) | The shared contract | `LearningEvent`, `BrainDirective`, `BrainRequest`, the curriculum, and the seeded personas live in one package consumed by both repos, so neither side can change the contract unilaterally. |
| **`tsx`** | Dev runtime & scripts | Runs the server and every simulation/validation script straight from TypeScript with no build step — fast iteration on the parts that change most. |
| **Docker Compose** | Local Postgres | One command to stand up the database; nothing about the data layer depends on host setup. |

The deliberate constraint throughout: **the Brain decides, the Brain never speaks.** It scores and routes; it never generates a word the learner sees.

## How it works

Two endpoints, both backed by Postgres:

- **`POST /events`** — the Loop posts a batch of `LearningEvent`s; the Brain stamps server time and persists them (idempotent on `eventId`).
- **`POST /directive`** — given a `userId`, the Brain reads the learner's profile and per-lesson mastery and returns a `BrainDirective` (teaching tone, explanation depth, routing, mastery).

Directive logic currently lives in [`src/lib/directive-builder.ts`](apps/api/src/lib/directive-builder.ts) as deterministic rules — the baseline that a learned signal is meant to beat later, on demonstrated lift rather than on shadow-mode accuracy.

The validation machinery is independent of the live server and runs as scripts (see below): a seeded PRNG drives a synthetic learner generator, feature extraction turns simulated event streams into signals, and the harness runs A/A, pattern-recovery, and power-analysis tests over them.

## Getting started

Requires Node 20.

```bash
yarn install                 # workspace install (also runs prisma generate)
docker compose up -d         # start local Postgres on :5435
yarn workspace @adaptive/brain-api db:migrate   # apply schema
yarn workspace @adaptive/brain-api dev          # start the API on :3001
```

Set `DATABASE_URL` in the API app's environment to point at the Compose Postgres (`postgresql://brain:brain@localhost:5435/brain_dev`).

### Validation & simulation scripts

Run from `apps/api`:

```bash
yarn seed        # seed personas / learner state
yarn simulate    # run the synthetic learner simulation
yarn power       # Monte Carlo power analysis (the build gate)
yarn test        # validation harness: A/A test, pattern recovery, power
```

## Project structure

```
apps/api/
  prisma/         schema.prisma + migrations (User, LearnerProfile, LessonMastery, OnboardingAnswers, LearningEvent)
  src/
    index.ts      Fastify server bootstrap
    routes/       /events ingestion and /directive endpoints
    lib/          directive-builder — deterministic decision rules
    db/           Prisma client
    seed/         learner-state seeding
    simulation/   synthetic generator, feature extraction, PRNG, and the
                  validate / recover / power harness + tests
packages/shared/  @adaptive/shared — the Loop↔Brain contract
                  (events, brain, curriculum, onboarding types + personas)
```

## Status

Active learning project. The deterministic decision layer, event capture, learner-state schema, and the full pre-user validation chain (synthetic generator → A/A → pattern recovery → power analysis) are the current focus. The live A/B test and first learned signal are staged behind the power-analysis gate — a model only gets promoted on demonstrated lift, never on shadow-mode predictive accuracy. See [`packages/shared/project-summary.md`](packages/shared/project-summary.md) for the full integrated Loop × Brain build order.
