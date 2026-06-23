# Adaptive Learning Coach — Integrated Build Order (Loop × Brain)

This plan maps the **Learning Loop** steps to the **Brain** steps and sequences them into a single build. It tells you which steps are on a strict critical path (must be done in order) and which can run in parallel or in any order. Read it alongside the two companion summaries; it does not replace them, it orders them.

## The two step lists (for reference)

**Loop steps**
- **L1** — Author the curriculum/content for the topic.
- **L2** — Build the onboarding UI (phone login, name, settings dashboard).
- **L3** — Build the learning-session UI (flash cards, structured question types).
- **L4** — Integrate the AI teacher layer (best model, prompt-driven, streaming).
- **L5** — Wire event emission to the brain.
- **L6** — Build the progress dashboard (renders brain scores + short-term evolution).
- **L7** — Build the admin/debug dashboard (renders the brain's simulated long-term history).

**Brain steps**
- **B1** — Learner-state schema (personas, onboarding-preference defaults).
- **B2** — Deterministic decision/adaptation rules.
- **B3** — 0–100 mastery scoring.
- **B4** — Event capture + taxonomy (+ seeded simulated events).
- **B5** — Synthetic learner generator.
- **B6** — Validation harness + A/A test.
- **B7** — Machinery validation (pattern recovery).
- **B8** — Monte Carlo power analysis (build gate).
- **B9** — Offline predictor validation on existing analytics.
- **B10** — Define outcome, baseline, promotion gate.
- **B11** — First learned signal in shadow mode.
- **B12** — Live A/B test + promotion on lift.
- **B13** — (optional) Tiny human pilot.
- **B14** — (ongoing) Instrument signals from day one.

## The single most important finding: settle the shared contract first

Neither plan has an explicit "contract" step, but the dependency analysis shows one hiding underneath both. The Loop and Brain couple at three points, and almost every other step depends on these being agreed:

1. **The concept model** — topic, concepts, prerequisites, assessments (produced by L1). The Brain's schema (B1), scoring (B3), and synthetic generator (B5) all consume it.
2. **The onboarding question set** — shared by the onboarding UI (L2) and the learner-state schema (B1).
3. **The event taxonomy + the Loop↔Brain directive contract** — what events look like (consumed by L5, B2, B4, B5) and what a "directive + scores" response looks like (rendered by L3, L4, L6).

Until these three are settled, everything downstream is guesswork. They are cheap to agree and they unlock parallel work, so they are **Wave 0** and they block the rest.

## The build in waves

Within a wave, items run in parallel. Waves are sequential. Two tracks are assumed — a Loop/app track and a Brain track — but the validation work (Track C below) is independent enough to hand to a third person if you have one.

### Wave 0 — Settle the contract (blocks everything) ✅ COMPLETED

- ✅ **L1** author content and define the concept/prerequisite/assessment structure.
- ✅ Agree the **onboarding question set**.
- ✅ Design the **event taxonomy** and the **Loop↔Brain directive contract**.

The taxonomy point is load-bearing: the Brain plan warns that sequence and timing not logged can't be reconstructed later, so decide granularity here, not after L5.

### Wave 1 — Foundations, three parallel tracks

**Track A (Loop UI)** ✅ COMPLETED — built against mocked directives:
- ✅ **L2** onboarding UI.
- ✅ **L3** flash-card session UI.
- ✅ **L4** AI teacher integration.

**Track B (Brain foundation)** ✅ COMPLETED — B1 first, then it unblocks B2/B3:
- ✅ **B1** learner-state schema.
- ✅ **B4** event capture implementation.

**Track C (Brain pre-user validation)** — fully independent of the Loop UI; needs only the concept model and taxonomy from Wave 0:
- ✅ **B5 → B6 → B7** (a strict chain: generator, then harness/A/A, then pattern recovery).
- ✅ **B8** power analysis.
- **B9** offline predictor on existing analytics.

### Wave 2 — Decision logic and integration (the join)
- **B2** rules (after B1) — now produces real directives.
- **B3** mastery scoring (after B1 + concepts).
- **L5** wire event emission (after L3 exists and the taxonomy is built in B4).
- Integration: swap L3/L4 mocks for real **B2** directives; wire **L6** to real **B2/B3** output; feed **B4** seeded events into **L7**.

(L6 and L7 can be *scaffolded* in Wave 1 against fake data; only their integration lands here.)

### Wave 3 — Live PoC, then the learned/proof phase
- The **deterministic PoC is now demonstrable** — this satisfies the PoC success criteria in both summaries.
- **B14** has been running since the moment L5/B4 went live; keep it on.
- **B10** define outcome, baseline, and the promotion gate — and consult the **B8** result here as a go/no-go before investing further.
- **B11** first learned signal in shadow mode (needs the live PoC accruing real events past the data threshold, plus the B6 harness).
- **B12** live A/B test and promotion on lift.
- **B13** optional pilot, around B11/B12.

## What must be done in order (critical paths)

These chains are strict — each step needs the previous one's output:

1. **Content → Brain foundation → decisions → rendering:**
   L1 → B1 → B2 → (L3/L4 integration) → L6. Also L1 → B3 → L6.
2. **Taxonomy → capture → emission / history:**
   taxonomy → B4 → L5 (also needs L3); B4 (seeded events) → L7.
3. **Validation machinery chain:**
   taxonomy + concepts → B5 → B6 → B7.
4. **Proof chain:**
   B8 → B10 → B11 → B12, where B11 additionally requires the live PoC running and the B6 harness.

## What you can do in any order (parallel-safe)

- **The entire pre-user validation track (B5→B6→B7, plus B8 and B9) runs concurrently with the whole Loop build.** It touches no Loop UI and only needs Wave 0 outputs. This is your biggest parallelization win — and it's the work that produces real proof of the machinery before any user exists.
- **B8 and B9** are independent of each other; either first.
- **L2** is independent of L3/L4 once the onboarding questions are agreed; build it whenever convenient.
- **L6 and L7 UI shells** can be built any time against mock data; only their integration is ordered (Wave 2).
- **Within Track A**, L3 and L4 can proceed together against mocked directives; neither blocks the other for the build phase.

## Two scheduling cautions

- **B8 is a gate, not just a parallel task.** It can be computed early, but its *output* must be read before committing to B11/B12. If the power analysis says your PoC audience can't reach significance, you learn it before building the live model rather than after.
- **The deterministic PoC (end of Wave 2) is a complete, demonstrable milestone on its own.** Everything in Wave 3 is the learned/proof layer on top. If the demo deadline arrives early, you can show a coherent product at the Wave 2 boundary and continue the proof work afterward.

--

# Adaptive Learning Coach Platform — Learning Loop (Teacher & Experience)

Companion document: Decision & Adaptation Layer ("The Brain") — Project Summary. This document and that one are designed to be read together and built in tandem.

## Scope of This Document

This summary covers the Learning Loop — the learner-facing adaptive teaching experience and the application that delivers it, with an LLM acting as the teacher.

All decision-making, scoring, profile computation, and behavior-driven adaptation — collectively "the brain" — are deliberately out of scope here and live in the companion Decision & Adaptation Layer document. The Learning Loop treats the brain as a separate component it integrates with through a clean contract:

- The loop emits behavioral events as the learner interacts.
- The brain returns directives, mastery scores, profile updates, and recommendations.
- The loop renders those results into teaching and UI.

The loop never decides or scores. The brain never speaks to the learner.

## Vision

Deliver a learning experience that feels like a personal teacher rather than a traditional LMS: responsive and tailored in tone and pacing to the individual.

Instead of pushing every learner through the same fixed Lesson → Quiz → Pass → Next path, the experience adapts to how the learner actually behaves in it. The Learning Loop is responsible for observing the learner, delivering instruction, and presenting the adapted experience. The decisions about how to adapt — based on observed behavior — are made by the separate adaptation component (the brain) documented in the companion summary.

The system does not simply present content — it adapts the experience to the individual. (How that adaptation is decided is the subject of the companion document.)

## Goals

### Immediate Goal

A validation-first proof of concept that, on the experience side, demonstrates:

- Phone login and settings-based onboarding
- Adaptive lesson delivery
- Personalized teaching styles and tone
- A learner-facing progression experience
- Visibly different journeys for different learners (driven by the brain, rendered by the loop)
- Profile and progress visualization, including evolution over time

### What "Production-Quality PoC" Means

When production quality conflicts with validation speed, validation wins. "Production-quality" means clean code and patterns at a small, well-structured scope that could be grown later — not production architecture, scale, or analytics.

### Long-Term Goal

The learning coach can grow into a real learning product, but it is also the controlled domain in which the team demonstrates a broader capability: building products whose experience adapts to how people actually behave in them. The lasting asset is the team's skill at building and proving these adaptive experiences — not a reusable model or platform. That framing is detailed in the companion document.

## The Experience Loop

Observe → [Build Profile] → Deliver → [Measure / Adjust] → Continue

The Learning Loop owns Observe (capturing events), Deliver (teaching), Continue, and all rendering. The bracketed steps — building the profile and measuring/adjusting — are performed by the brain; the loop simply hands over events and renders what comes back.

## Key Features

### Onboarding (Login & Settings)

Onboarding happens through a phone-number login flow rather than a conversation or a form: the learner enters their phone number, receives a code, and the code is validated. On successful login, the learner is asked for their name in a single text input. They are then presented with a settings dashboard that shows all onboarding questions (e.g., Are you new to this topic? How confident are you? What are your goals? Do you have a deadline? How much time can you spend daily?) as options they can update. Every option defaults to the middle of its range: a slider from 1–7 is preset to 4, a slider from 1–10 is preset to 5, and a four-button choice is preset to the second option. The loop captures the name and these settings and passes them to the brain, which builds the initial profile.

### Adaptive Lesson Delivery

Lessons are presented as flash cards, with one lesson card shown on the screen at a time. The lesson details (level, etc.) show at the top of the card, the image or text below, and then the question and possible answer options below. The loop renders the brain's chosen content, format, and explanation depth. Only structured question types are delivered (multiple choice, scenario-based, knowledge checks); free-form responses are excluded from the PoC.

### The Teacher (LLM Layer)

The LLM is the presentation layer — the part the learner reads. It generates the lesson content shown on the cards, explains concepts, phrases hints, and adapts tone (patient for a nervous beginner, terse and challenging for an expert). It owns how things are said, never what happens next. It does not score answers, decide routing, or update the profile.

In the loop, it is the brain's mouthpiece: it receives a structured directive ("explain this concept simply with a worked example, encouraging tone" or "be brief, pose a challenge") and renders it into teaching. Anything the interaction produces is captured as events and returned to the brain.

### Progress Visualization

Learners can see a roadmap, completed lessons, current mastery (value from the brain), recommended next steps (from the brain), and the content library.

### Profile Evolution Views (Display Only)

- Short-term — during the session: the audience watches the experience change live as the brain reacts (e.g., a recommendation shifts after a run of misses).
- Long-term — simulated history: an admin panel renders an accelerated arc (e.g., Day 1 → Day 30) built from stored events.

Both are visualizations; the underlying values and the simulated history are produced by the brain.

## Technical Architecture (Loop)

### Frontend

Stack: Next.js, React, TypeScript, TailwindCSS, React Query.

Core screens:

- Onboarding (Login & Settings)
- Learning Session (Flash Cards)
- Progress Dashboard
- Admin / Debug Dashboard (renders the brain's data, including the simulated-history view)

### Backend (Loop-Owned)

Stack: Node.js, Next.js API Routes, PostgreSQL, Prisma ORM (shared store).

Loop services:

- AI Teacher Service — prompts the foundation model, renders directives into teaching.
- Session orchestration — runs the live interaction.
- Event capture — emits Learning Events to the brain.
- Progress / Profile presentation — displays brain-supplied scores and profile state.

(Decision Engine, mastery scoring, and profile computation are brain services — see the companion document.)

### AI / Teacher Layer

Use a strong existing foundation model — quality over cost — reached by API and driven by prompts (not fine-tuning) for the PoC. Responses are streamed so the live demo stays responsive. The AI acts as teacher, coach, and presenter only; it makes no business decisions and does not grade.

### Contract With the Brain

The loop sends events and a "what's next?" request; the brain returns a directive plus updated scores/profile; the loop renders the result. The brain is the source of truth for state and routing.

## Data Model (Loop-Owned / Shared)

- Users — account information.
- Lessons — content, concepts, prerequisites, assessments (team-authored).
- Progress (presentation) — completion and status; the mastery score value comes from the brain.
- Learning Events — emitted by the loop as the learner acts (answered correctly/incorrectly, requested help, abandoned lesson, completed lesson, revisited, etc.). The brain consumes these; the event schema design lives in the companion document.

(The Learner Profile store and schema are owned by the brain.)

## Content Scope

5–10 lessons on a single simple topic, structured into concepts, prerequisites, and assessments. Structured question types only. Because explanation correctness rides on the LLM, content review of the small demo course remains important.

## Risks (Loop)

### AI Hallucinations / Explanation Correctness

The LLM teacher can produce incorrect or inconsistent explanations. Mitigation: structured outputs, content review of the demo course, and exclusion of free-form grading (a brain concern — see companion doc). Explanation correctness still depends on the model.

### Demo Latency

"Best available model" often means slower responses, which matters in a live demo. Mitigation: stream responses; treat perceived responsiveness as a UX requirement distinct from cost.

### Feature Creep

Mitigation: validation wins over production quality; scope is deliberately minimal.

(Data privacy and over-personalization are primarily brain-stage concerns and are covered in the companion document.)

## Recommended PoC Scope (Loop)

- Course: one simple, self-authored topic.
- Lessons: 5–10 maximum.
- Personas: three seeded learners (Experienced, New) — divergence driven by the brain.
- Audience: internal leadership.
- Core demonstration (loop-side): login and settings-based onboarding → render the brain's directive as teaching on flash cards → present questions (structured types) → emit events → display the brain's recommendation, updated mastery, and progress → show short-term (live) and long-term (simulated) profile evolution.

## Success Criteria (Loop)

Internal leadership can clearly see that:

- The experience feels like a responsive personal teacher, not a static LMS.
- The same content produces visibly different experiences for different learners (decisions from the brain, rendered live).
- Both the live session and the long-term view are legible and compelling.
- The clean, minimal architecture could grow into a real product and demonstrates a capability the team can apply to other products: experiences that adapt to real user behavior.

(Criteria about decision correctness, the adaptation logic, and how its lift is validated are in the companion document.)

## Implementation Plan (Loop — Built in Tandem With the Brain)

1. Author the curriculum/content for the chosen topic.
2. Build the onboarding UI — phone-number login, name input, and settings dashboard (captures inputs for the brain).
3. Build the learning-session UI — flash cards (structured question types).
4. Integrate the AI teacher layer (best available model; prompt-driven; streaming).
5. Wire event emission to the brain.
6. Build the progress dashboard (renders brain-supplied scores and short-term evolution).
7. Build the admin/debug dashboard (renders the brain's simulated long-term history).

(Brain-side steps — profile schema, decision engine, scoring, seeded personas, simulated-event generation — are in the companion document and proceed in parallel.)

--

# Adaptive Learning Coach Platform — Decision & Adaptation Layer ("The Brain")

Companion document: Learning Loop (Teacher & Experience) — Project Summary. This document and that one are designed to be read together and built in tandem.

> **Revision note (this version).** The plan has been updated to harden the rules → learned transition. Three things changed. (1) The stress point in that transition is now named explicitly: *predictive accuracy is not interventional lift*, and the two must never be confused at the promotion gate. (2) A clear line is drawn around what synthetic data can and cannot prove — it can validate the machinery, it can never prove an adaptation helped real people. (3) The Implementation Plan now includes a pre-user validation track that produces real proof of the *machinery and the method* before a single live user exists, and a power analysis that is run *before* any model is built. Every implementation step now specifies the data needed, the tools needed, its success metric, and its risks.

## Scope of This Document
This summary covers the Decision & Adaptation Layer — "the Brain" — the part of the system that decides how the experience adapts in response to the learner's actual behavior in the product.

The framing has been deliberately narrowed. The thing this work is meant to prove is a capability:

**We can build products whose experience adapts to how people actually behave in them.**

The learning coach is the controlled domain we use to demonstrate that capability — a proving ground we fully own — not a product we intend to resell and not a reusable model. The brain reacts to live behavioral signals (what the user does), not to inferred traits and not to static attributes. We track actual behavior and adapt the experience to it.

The brain never speaks to the learner. It consumes events emitted by the Learning Loop and returns directives, scores, and recommendations. The learner-facing experience is in the companion Learning Loop document.

## What This Layer Is — and Is Not
It is: a decision and adaptation layer built bespoke to this product and its users, and a demonstration that the team can build behavior-adaptive experiences and prove they help.

It is not: a reusable model, a portable "brain," a cross-project or cross-client asset, or an attempt to infer hidden traits. Every project will be different, because adaptation is grounded in that particular product and its particular user set.

The lasting asset is the team's repeatable method and judgment — how to instrument a product, choose the behavioral signals that matter, close the observe-decide-adapt loop, and measure whether the adaptation moved the outcome. The skill travels; no model or dataset does.

## What the Brain Owns
- Learner state — stated preferences from onboarding, observed behavior, and mastery.
- Mastery scoring.
- Decision / adaptation logic — what experience to serve next, based on behavior.
- Event capture — the behavioral signal the brain reacts to (and later learns from).
- The measurement discipline that proves an adaptation actually helped.

## The Contract With the Loop
```
Loop emits events → Brain updates state → Brain decides next directive
   → Brain returns directive + scores → Loop renders
```
The brain is the single source of truth for state and routing, which keeps the system debuggable — every adaptation traces to a rule, a score, or a measured signal, not an improvisation. The deterministic core remains the guardrail and fallback: any learned signal runs behind it, and rules enforce floors such as minimum competency so it can never degrade the experience.

## Two Horizons (and the Sequencing Rule)
**PoC brain (now):** deterministic rules + mastery scoring + onboarding-preference defaults. It reacts to behavior via rules.

**Learned brain (next):** once enough per-user behavioral data has accrued (threshold TBD), the brain shifts from defaults to learned, behavior-driven adaptation — every target chosen so that it is observable and validatable.

**Validation-first applies throughout:** a learned signal replaces a default only once it beats that default on a defined outcome. Until then it runs in shadow/advisory mode.

**The promotion gate (the stress point, made explicit).** Moving a signal from shadow mode to driving live decisions is where this project is most likely to quietly go wrong. In shadow mode you can cheaply measure whether the model *predicts* what happens — did the struggle model correctly call the misses that then occurred? That number sits right there in the logs. It is *not* proof that acting on the prediction helps. A model can predict struggle with high accuracy and the review it triggers can still fail to raise mastery, or demoralize the learner and lower it. Predictive accuracy answers "can it predict"; only a live test answers "did the intervention help." The rule of this gate: **a signal is promoted on demonstrated interventional lift, never on shadow-mode predictive accuracy.** This is the same counterfactual problem the Analytics section quarantines, reappearing one layer in.

## What You Can Prove Before You Have Users
This section exists because the proof discipline above requires real users, and the PoC begins with none. The line is firm:

**Synthetic data can prove the machinery works. It can never prove the adaptation helps real people.** If you generate simulated learners from your own assumptions and then "measure" lift on them, the lift is just your assumption handed back to you — it contains zero information about real learners. Any outcome claim derived from simulated users is circular and must never be presented as proof.

What synthetic and offline work *can* prove, solo and now:
- **The learning machinery learns.** Generate learners from a *known* process and check that the predictor recovers the hidden structure and the held-out labels. Answers "can we build code that learns when there is signal."
- **The validation apparatus is sound and honest.** Build the shadow → score → promote → fallback pipeline and confirm it behaves correctly, including reporting *no* effect when fed data with no effect (A/A).
- **What proving the real thing will cost.** A Monte Carlo power analysis tells you the users-and-weeks needed to detect a plausible lift — before any model is built.

What it cannot do: tell you whether your assumptions about real learners are right (e.g., that struggling learners benefit from review rather than disengaging). Only real humans reveal that.

## Learner State (The Brain's Data)
The brain maintains, per learner: stated preferences (captured at onboarding), observed behavior (derived from events), and mastery scores. Three seeded starting profiles (Experienced, New) act as cold-start stand-ins for the demo.

To be explicit: this state records what the learner has done, not a guess at how they "innately" learn.

## Decision / Adaptation Logic

### PoC — Deterministic Rules
Rules decide: continue, review, skip ahead, change question type, or provide additional explanation — driven by observed behavior. Legible, testable, reproducible.
```js
if (correctAnswersInRow >= 4) {
  return "offer_skip_ahead";
}

if (incorrectAnswersInRow >= 3) {
  return "review_previous_concept";
}
```
**Honesty note:** "struggling → review" and "run of correct → skip" are rules, not learned models. They should not be described as the brain "learning." Their genuine learned upgrade is mastery/knowledge-tracing prediction — anticipating struggle before the misses pile up, or personalizing the thresholds per user. Note also that these rules are a *strong* baseline; the learned model must beat them, and that headroom may be small.

### Learned — Behavior-Driven and Validatable
This is the genuinely learned, per-user layer, chosen specifically because every target here has an observable label:
- **Timing.** Prompt or surface lessons at the times a user has actually shown they engage (observed app-open behavior). Label: did they open/engage? Exploration here is cheap and the effect is easy to A/B-test. **Lead with this** — the label is fast and high-frequency, so it reaches statistical power soonest.
- **Predictive struggle / mastery (knowledge tracing).** Predict difficulty before it shows up as repeated misses; personalize skip/review thresholds. Label: later correctness/recall. Slower to validate because the label arrives later.

## Mastery Scoring (PoC)
A simple 0–100 score per concept, derived from correctness, consistency, and retries. Coarse and legible by intent.

| Outcome | Points |
|---|---|
| Correct on first try | +10 |
| Correct after a hint | +7 |
| Correct after review | +5 |
| Incorrect | +0 |

## Sample Learner Journeys (Brain-Driven)
Each persona is a seeded starting profile; the journey is produced live by the engine reacting to behavior, not by a script.
- **Experienced:** high confidence, prior experience → initial assessment, skip known material, focus on weak areas.
- **New:** no prior experience, low confidence → more guidance, additional examples, confidence-building feedback.

The point of the demo is that the same content produces divergent paths that emerge from the engine reacting to behavior — not three pre-built replays.

## Event Capture — The Behavioral Signal
Events are what the brain reacts to and, in the learned phase, learns from. They should be captured per-user, per-concept, timestamped, with outcomes (correct/incorrect, hint used, review taken), intervals (time since last seen), and context (format shown, abandonment, help requested, app-open time).

Decide the taxonomy and granularity early — sequence and timing that aren't logged can't be reconstructed later. The same event store also powers the simulated-history view via seeded events.

## Using Analytics to Lower Cold-Start (Diagnosis, Not Validation)
Existing product/usage data is used for two jobs, both clearly bounded. First, *diagnosis*: previewing where users drop off and which paths are complicated, so the adaptive effort can be aimed at the problem areas particular to that project. Second, *offline prediction*: training and checking the struggle/mastery predictor against real, already-collected labels (did flagged learners later struggle?).

The hard line: history tells you where the problem is, that a path is hard, and whether the model can *predict* on real behavior. It cannot tell you that a given intervention *fixed* it, because observational data never shows the counterfactual. So diagnosis and offline prediction come from analytics; proof of lift comes from the live loop. Those jobs stay separate.

## The Method (The Actual Deliverable)
What compounds across projects is the method, applied bespoke each time. Its shape:
1. Define the outcome for this product (completion, mastery, retention, reduced drop-off at the known problem area).
2. Define the baseline to beat (the current/default experience, or the stated-preference defaults).
3. Instrument the behavioral signals that matter for this product — this is where the team's judgment lives.
4. Use analytics to target the problem areas and lower cold-start.
5. **Run a power analysis before building** — estimate the plausible lift and back out the users and weeks needed to detect it. If that exceeds the audience available, you have found the failure cheaply.
6. Serve defaults while behavior accrues, then switch to learned adaptation past the threshold — only where it beats the baseline.
7. Measure the lift with a live test — the only thing that actually proves the adaptation helped.

Measurement is part of the method, not an afterthought. The claim worth owning is not "we adapt experiences to behavior" — it is "we adapt experiences to behavior and can show it improved the outcome." That proof discipline is the differentiator.

## Tech Stack (Brain)
- **PoC brain:** deterministic rules and scoring in the application's TypeScript/Node layer; PostgreSQL/Prisma for state, progress, and the event log.
- **Learned phase:** a lightweight, per-product behavioral model — most likely a small Python service (scikit-learn): supervised prediction for struggle/mastery, and simple timing optimization (a light bandit is reasonable for send-time, where exploration is cheap). Batch/shadow scoring before anything drives a live decision, a basic evaluation harness, and an A/B path to measure lift.
- **New for the pre-user track:** a synthetic learner generator (a known generative process such as Bayesian Knowledge Tracing — `pyBKT` or hand-rolled), and a power-analysis capability (Monte Carlo with `numpy`; `statsmodels`/`scipy` or an online calculator for quick checks).

Build the smallest model that answers the question, not infrastructure. Do not build yet: feature store, data warehouse, scaled real-time serving, heavy reinforcement learning, pipeline orchestration. Settle the TypeScript ↔ Python boundary only when a learned model first enters.

## Risks & Red Flags (Brain)

**Skipping the measurement — highest residual risk.** Bespoke-per-project work with no shared model tempts teams to skip the baseline and the before/after under deadline, leaving you shipping adaptation you can't prove helped. *Mitigation:* bake "define the outcome, hold a baseline, measure the lift" into the standard method as a non-optional step.

**Predictive accuracy mistaken for interventional lift — the promotion-gate trap.** Shadow-mode accuracy is cheap and tempting; it is not evidence the intervention helps. *Mitigation:* promote a signal only on a live before/after test, never on shadow accuracy. Write this into the method as a hard rule.

**Synthetic results mistaken for proof.** A lift measured on simulated learners is your own assumption echoed back. *Mitigation:* synthetic and observational results are labeled "machinery / prediction only" and are never presented as proof an adaptation helped.

**Two-front data scarcity.** The learned brain needs per-user *depth* to personalize and cross-user *breadth* to prove lift, and the bespoke/cold-start/no-reuse design amortizes neither. With small effects against a good rule baseline, the required sample may exceed the audience. *Mitigation:* power analysis before build (go/no-go); lead with the fast-label timing signal; aim the first signal at the biggest known drop-off where headroom — and therefore detectable effect — is largest.

**Dressing rules up as ML.** Calling threshold rules "the model learning" is an oversell in miniature. Be precise about which parts are rules and which are genuinely learned.

**Validation requires the live loop, not history.** Observational analytics can scope the problem and test prediction but cannot prove an intervention worked. Keep diagnosis and proof separate.

**Cold-start — per-project and bounded.** Each new product starts cold for its own users; defaults plus analytics targeting shorten the window, but learning a per-user pattern (timing especially) still needs sustained real usage. *Mitigation (already chosen):* stated-preference defaults + a data threshold before handing over.

**Privacy / consent.** Tracking behavior — including when a person uses the app — is a consent matter, sharper for employee/corporate data. Low for the internal PoC; real at product/client stage.

**Over-personalization.** Behavior-reactive routing can trap users in comfortable paths or starve them of necessary challenge. *Mitigation:* minimum-competency floors.

**Positioning / commoditization.** Rules-and-segment routing is available off the shelf. Our value is the judgment layer — which signals to watch, how to design the adaptive response — plus the proof, sitting on top of those tools, not a novel algorithm.

**Resolved by the narrowed framing.** Dropping reuse dissolves the cross-client data-rights problem, the domain-transfer risk, and the unvalidatable "learns how you learn" target.

## The Lasting Asset
Not a model, not a dataset, not a reusable platform. The asset is the team's repeatable craft: instrumenting a product, choosing the behavioral signals that matter, closing the observe-decide-adapt loop, and proving the adaptation moved the outcome.

## Success Criteria (Brain)
- **PoC:** decisions are legible and reproducible; the same content yields divergent, emergent journeys from behavior; the engine demonstrably reacts to behavior in real time.
- **Capability proof:** the team can instrument a product, choose the right signals, close the loop, and show that a learned adaptation beat a baseline on a defined outcome — on a controlled domain we own. That turns the leadership question from the unanswerable "will this product succeed" into the answerable "can we build this well enough to offer it?"
- **Pre-user proof (new):** before any live audience exists, the machinery recovers known patterns, the validation harness is demonstrably sound and honest, and the exact live test required to prove lift is specified with its cost in users and weeks. A clean null result from an honestly run live test still counts as a methodological success.

---

# Implementation Plan (Brain — Built in Tandem With the Loop)

The plan is sequenced in three phases: **Phase 0** builds the deterministic foundation; **Phase 1** is the new pre-user validation track, doable solo with no live audience; **Phase 2** is the method applied live, with the proof discipline enforced. Every step lists the data, tools, success metric, and risks.

## Phase 0 — Deterministic Foundation

### Step 1 — Design the learner-state schema
Define per-learner state: stated preferences, observed behavior, mastery; include the three seeded personas and onboarding-preference defaults.
- **Data needed:** the onboarding question set; the list of concepts/skills; definitions of the three personas.
- **Tools needed:** PostgreSQL, Prisma, TypeScript/Node.
- **Success metric:** schema stores and retrieves a full learner state round-trip; the three personas instantiate cleanly as distinct cold-start states.
- **Risks:** schema too rigid to absorb new event types later. *Mitigation:* keep observed-behavior fields additive and versioned.

### Step 2 — Build the deterministic decision/adaptation rules
Implement continue / review / skip / change-format / explain-more as legible threshold rules over observed behavior.
- **Data needed:** current learner state and the recent event sequence.
- **Tools needed:** TypeScript/Node.
- **Success metric:** every decision is traceable to a specific rule and threshold; given a fixed event sequence the engine is fully reproducible.
- **Risks:** rules quietly described as "learning." *Mitigation:* label them as rules in code comments and docs.

### Step 3 — Implement the 0–100 mastery scoring model
Score per concept from correctness, consistency, and retries per the points table.
- **Data needed:** per-concept outcome events (first-try, after-hint, after-review, incorrect).
- **Tools needed:** TypeScript/Node; Postgres for persistence.
- **Success metric:** scores move in the intended direction on hand-built event sequences; identical inputs always yield identical scores.
- **Risks:** coarse score masks meaningful differences. Accepted for PoC by intent; revisit only if it blocks a decision.

### Step 4 — Implement event capture and taxonomy
Capture per-user, per-concept, timestamped events with outcomes, intervals, and context; seed simulated events for the long-term view.
- **Data needed:** the full event taxonomy decided up front (outcomes, intervals, context including app-open time, abandonment, help requested, format shown).
- **Tools needed:** TypeScript/Node, Postgres; an event-log table.
- **Success metric:** a session replays exactly from the event log; nothing a later model needs (sequence, timing) is missing.
- **Risks:** under-logging that can't be reconstructed later. *Mitigation:* err toward capturing more context fields than currently used.

## Phase 1 — Pre-User Validation Track (solo, no live audience)

### Step 5 — Build a synthetic learner generator
Generate event streams from a *known* generative process (e.g., BKT with set learn/slip/guess parameters) so there is a ground truth to recover.
- **Data needed:** chosen generative parameters; the concept list and event taxonomy from Step 4.
- **Tools needed:** Python (`pyBKT` or hand-rolled), `numpy`; writes into the same event-log format as Step 4.
- **Success metric:** generated streams are statistically consistent with the target parameters (refitting recovers them within tolerance); output is indistinguishable in format from real captured events.
- **Risks:** the generator encodes the same assumptions the model will be tested on, making recovery trivial and meaningless. *Mitigation:* generate with a richer/different process than the predictor under test; hold out data for evaluation.

### Step 6 — Build and verify the validation harness (incl. A/A)
Build the shadow-log → score-against-labels → promotion-gate → rule-fallback pipeline end to end and prove it behaves correctly.
- **Data needed:** synthetic event streams from Step 5, including an A/A variant where the intervention does nothing.
- **Tools needed:** Python (scikit-learn for scoring, `scipy`/`statsmodels` for the significance test); the Node decision engine for the fallback path.
- **Success metric:** shadow logging captures predictions correctly; the A/A test reports no significant effect at the expected false-positive rate; a deliberately broken model is caught and overridden by the competency floor.
- **Risks:** a harness that reports lift when none exists will later validate noise. The A/A test is the specific guard against this and is non-optional.

### Step 7 — Machinery validation: pattern recovery
Train the struggle/mastery predictor on synthetic data and confirm it recovers the known signal.
- **Data needed:** held-out synthetic streams from Step 5 with known latent structure.
- **Tools needed:** Python, scikit-learn.
- **Success metric:** held-out predictive performance (AUC / precision-recall) materially above chance and above the Step 2 rule baseline on data where signal is known to exist.
- **Risks:** strong synthetic performance read as evidence the adaptation helps real users. It is not — this proves the code learns, nothing about real-world lift. Label results accordingly.

### Step 8 — Monte Carlo power analysis (build gate)
Simulate the live experiment to estimate the users and weeks needed to detect a plausible lift, before building the live model.
- **Data needed:** an assumed baseline outcome rate (from existing analytics where possible), a plausible effect-size range, and expected traffic.
- **Tools needed:** Python (`numpy` Monte Carlo; `statsmodels`/`scipy` or an online sample-size calculator for cross-checks).
- **Success metric:** a defensible N-and-duration estimate per target lift, and a clear go/no-go on whether the PoC audience can reach significance.
- **Risks:** required N exceeds the available audience. This is a *finding*, not a failure — surfacing it here is the cheapest possible derisking. *Response:* shrink to the largest-headroom target or the fastest-label signal (timing) before proceeding.

### Step 9 — Offline predictor validation on existing analytics
Train and check the predictor against real, already-collected behavior and labels.
- **Data needed:** existing product/usage data with real outcomes (did flagged learners later struggle); consent/permission to use it.
- **Tools needed:** Python, scikit-learn; access to the analytics store.
- **Success metric:** predictor beats the rule-threshold baseline at predicting later struggle on held-out *real* users.
- **Risks:** observational data presented as proof of intervention lift — the counterfactual is absent. This answers "can it predict," never "did it help." Keep that label on it.

## Phase 2 — Method Applied Live (proof discipline enforced)

### Step 10 — Define outcome, baseline, and the promotion gate
Fix the demo's outcome and the baseline to beat (rules / stated-preference defaults), and codify the promotion rule.
- **Data needed:** the chosen outcome definition; the current/default experience as the baseline; the power-analysis result from Step 8.
- **Tools needed:** documentation; the harness from Step 6.
- **Success metric:** outcome, baseline, target lift, required N, and the "promote on lift, never on shadow accuracy" rule are written down and agreed before the live phase.
- **Risks:** the gate erodes under deadline. *Mitigation:* make it a non-optional, pre-registered step.

### Step 11 — Add the first learned signal in shadow mode
Run the first signal (timing first, by preference) silently against live behavior; measure predictive accuracy only.
- **Data needed:** accruing live behavioral events past the data threshold.
- **Tools needed:** the Python service; the shadow path of the Step 6 harness.
- **Success metric:** shadow predictions are logged and scored against realized labels; predictive accuracy meets a pre-set bar. Explicitly *not* a promotion decision.
- **Risks:** treating this accuracy as the green light to ship. It is necessary, not sufficient.

### Step 12 — Live A/B test and promotion on lift
Run the pre-registered live test; promote only if interventional lift is demonstrated.
- **Data needed:** enough exposed users and realized outcomes to hit the power target from Step 8.
- **Tools needed:** the A/B path; `scipy`/`statsmodels` for the analysis; rule fallback as the control/floor.
- **Success metric:** the pre-registered lift is detected at the chosen power, or an honest null is recorded; promotion happens only on detected lift.
- **Risks:** underpowered test, peeking, or post-hoc metric changes. *Mitigation:* fix N, metric, and stopping rule in advance.

### Step 13 (optional) — Tiny human pilot before the scaled test
A handful of real people, for qualitative reality-checks and real training data — not significance.
- **Data needed:** 5–20 recruited participants with consent.
- **Tools needed:** the live loop; lightweight session observation.
- **Success metric:** surfaces obvious failures the simulator could not (e.g., review demoralizing struggling learners) and yields real events for training.
- **Risks:** mistaking a tiny sample for proof. It is a reality check, not a validation.

### Step 14 (ongoing) — Instrument behavioral signals from day one
Keep capturing the full signal set even while only the deterministic brain runs.
- **Data needed:** continuous event stream across all phases.
- **Tools needed:** the Step 4 capture system.
- **Success metric:** by the time the learned phase begins, the history needed to train it already exists.
- **Risks:** deferring instrumentation and losing reconstructable history. *Mitigation:* this step starts at day one and never stops.
