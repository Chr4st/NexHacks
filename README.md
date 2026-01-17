# NexHacks

# FlowGuard AI — Full Product Context

## What FlowGuard AI is
FlowGuard AI is a **developer tool** that makes the visual and UX side of applications testable and enforceable, the same way logic and APIs already are.

It validates whether **intended user flows still work visually** across browsers and devices, catches UX regressions early, and can certify real improvements using real-user performance data.

This is not a design tool and not a UX “judge.”  
It’s a **guardrail** for experience correctness.

---

## The core problem
Most frontend bugs don’t break functionality — they break **user understanding**.

Common failures:
- CTAs exist but aren’t visible
- Forms submit but give no clear feedback
- Layouts break on mobile or Safari
- UX degrades quietly while tests pass

Today:
- Unit tests don’t see UX
- E2E tests assert selectors, not visibility
- QA/design feedback arrives late
- Fixes are subjective and slow
- Regressions reappear because nothing enforces them

UX correctness is not owned anywhere in the dev lifecycle.

---

## The key insight
Developers don’t need to be UX experts — they need **fast, objective feedback** when the experience breaks.

Instead of asking:
> “Is this good UX?”

FlowGuard asks:
> “Does this change still satisfy the intended user flow, without increasing confusion or failure risk?”

That question *is* testable.

---

## What FlowGuard actually guarantees
FlowGuard does **not** guarantee:
- better aesthetics
- higher delight
- perfect UX

It **does** guarantee:
- no silent UX regressions
- no loss of action visibility
- no missing confirmation
- no increase in flow ambiguity
- no new cross-platform breakage

And when conditions are met, it can also certify **measurable UX improvement**.

---

## How “improvement” is defined (no BS)
Improvement is **not taste-based**.

A change is considered an improvement only if:
1. No experience constraints regress, **and**
2. Real-user performance signals improve

Real-user signals are grounded in the **:contentReference[oaicite:0]{index=0} (CrUX)**:
- layout stability (CLS)
- responsiveness (INP)
- perceived load (LCP)

This makes improvement claims defensible even if the system isn’t perfect.

---

## How the product works (conceptually)

### 1. Intent instead of selectors
Developers describe what a flow should accomplish in plain language:
> “User signs up and clearly sees success.”

This is a hypothesis, not truth.

---

### 2. Visual execution
Agents run the flow visually across:
- Chromium, Firefox, WebKit
- desktop + mobile viewports

They check:
- visibility of primary actions
- clarity of feedback
- progress through the flow
- dead ends or ambiguity

DOM is optional. Vision is primary.

---

### 3. Experience safety
Every run is compared against:
- the last known good version
- other browsers and viewports

If any invariant regresses, the run fails.
This blocks silent UX degradation.

---

### 4. Evidence-backed improvement
If safety holds, FlowGuard checks whether:
- real-user UX metrics improved
- platform divergence decreased

Only then is a change labeled an improvement.

---

## Why long-context reasoning matters
UX failures are rarely local.
They depend on:
- multiple steps
- multiple browsers
- historical behavior
- prior fixes
- real-user metrics over time

That’s a **large context problem**.

---

## Why token compression is critical
FlowGuard assembles a large “run packet” containing:
- flow intent
- constraints
- step summaries across platforms
- visual descriptions
- historical diffs
- CrUX snapshots

This context is compressed using **:contentReference[oaicite:1]{index=1}** before reasoning.

Compression:
- removes low-signal tokens
- preserves output quality
- reduces cost
- enables reasoning over entire UX timelines

Without compression, FlowGuard would be forced into shallow, brittle analysis.

---

## How DevSwarm fits
FlowGuard is built the same way it operates: as a swarm.

Using **:contentReference[oaicite:2]{index=2}**:
- each subsystem is developed in parallel
- each agent owns a single responsibility
- branches map directly to runtime components

This enables fast iteration and mirrors the system’s architecture.

---

## What FlowGuard replaces in practice
Without FlowGuard:
- UX issues are found late
- feedback is subjective
- fixes aren’t enforced
- regressions repeat

With FlowGuard:
- UX breaks fail CI
- evidence is automatic
- fixes become durable
- experience correctness becomes enforceable

It removes wasted cycles, not people.

---

## Who this is for
- Frontend engineers
- Product teams
- Design systems
- Teams shipping UI frequently
- Orgs without deep UX bandwidth

---

## What FlowGuard is not
- Not a design generator
- Not an auto-redesign system
- Not a UX “score”
- Not a replacement for designers

It’s a **safety layer**, not an artist.

---

## Why this can be a real business
Every team ships UI.
Every team breaks UX accidentally.
No tool today owns experience regressions.

FlowGuard fits naturally into:
- CI pipelines
- frontend teams
- fast-moving product orgs
- design systems

Long-term, it becomes standard to ask:
> “Did we break the experience?”

…and have a real answer.

---

## Tech stack & architecture

### Development workflow (DevSwarm)
FlowGuard AI is built using **:contentReference[oaicite:0]{index=0}** to develop the system the same way it operates: as a swarm.

- Multiple AI coding agents run in true parallel
- Each subsystem lives on its own isolated Git branch
- Agents work independently and merge cleanly
- No context switching, faster iteration in 24 hours

Branches map directly to system components:
- `agent/runner`
- `agent/vision`
- `agent/flow-eval`
- `agent/crux`
- `agent/compression`
- `agent/web-ui`

---

### Frontend
- **Next.js + TypeScript**
- Tailwind CSS
- Flow definition UI
- Run history + report viewer

---

### Backend / API
- **Node.js (TypeScript)**
- Job orchestration API
  - create runs
  - track status
  - fetch reports
- CI-friendly pass/fail output

---

### Execution layer
- **Playwright**
  - Chromium
  - Firefox
  - WebKit (Safari-like)
- Viewport matrix (mobile / tablet / desktop)
- Generates screenshots and traces per step

---

### Visual understanding
- Vision-capable model
- Used to:
  - detect primary actions (CTAs, forms)
  - check visibility and obstruction
  - identify UI states (loading, success, error)
- DOM used only as an optional assist, not source of truth

---

### Flow reasoning
- Lightweight state machine / graph evaluator
- Tracks:
  - step progression
  - dead ends
  - ambiguity (“no clear next action”)
  - confirmation clarity
- Compares against previous runs and platforms

---

### UX improvement grounding
- **Chrome UX Report (CrUX) API**
- Pulls real-user Core Web Vitals distributions
- Used to validate that changes improve real-world UX signals
- Enables evidence-backed improvement claims

---

### Token compression (critical component)
FlowGuard relies on **:contentReference[oaicite:1]{index=1}** to make long-context reasoning feasible.

Before evaluation, we assemble a large “run packet”:
- flow intent + constraints
- multi-browser step summaries
- visual descriptions of screenshots
- historical run diffs
- CrUX metrics snapshots

This packet is compressed before being passed to the reasoning model:
- removes redundant / low-signal tokens
- preserves output quality
- dramatically reduces input cost
- enables reasoning over entire UX timelines

Without compression, this system wouldn’t scale.

---

### Storage
- Supabase Postgres + Storage (runs, reports, artifacts)
  - or SQLite + local filesystem for fast demo

---

### Deployment
- Vercel (frontend + API)
- Dockerized runner (local or small VM)

---

### End-to-end flow
1. Developer defines flow intent
2. Run is triggered (CI or UI)
3. Playwright executes across browsers/viewports
4. Visual + flow evaluators analyze results
5. Context is compressed and reasoned over
6. Report generated with evidence
7. CI gates on pass/fail
