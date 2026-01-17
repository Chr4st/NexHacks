# NexHacks

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
