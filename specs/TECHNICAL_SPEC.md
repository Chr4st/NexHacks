# FlowGuard AI — Technical Specification (Updated for MVP + Low-Debug)

**Version:** 2.0  
**Date:** January 2026  
**Target:** NexHacks 2026 Hackathon MVP  
**Core Product Promise:** *Zero scripts upfront. Test manually once. FlowGuard generates Playwright automation + UX risk detection.*

---

## Architecture Overview

This architecture preserves the original “full” structure, but updates key pieces to align with the startup spec:
- **Manual-first** recording (no scripts upfront)
- **Codebase-aware interpretation** (lightweight, reliable)
- **Datadog as trigger + prioritization** (not required to run)
- **Arize Phoenix** for end-to-end observability of AI/UX decisions
- **DevSwarm** converts findings into PR-ready feedback (human-in-the-loop)
- **Wood Wide AI + CrUX** only where it’s actually stable and demoable

┌────────────────────────────────────────────────────────────────────────────┐
│ FlowGuard AI │
├────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────┐ ┌───────────────────┐ ┌───────────────────────────────┐ │
│ │ CLI │──▶│ Flow Engine │──▶│ Playwright MCP Runner │ │
│ └──────────┘ │ (Manual-First) │ │ (Record + Replay + Baselines) │ │
│ │ └───────────────────┘ └───────────────────────────────┘ │
│ │ │ │ │
│ │ │ ▼ │
│ │ │ ┌──────────────────────────────┐ │
│ │ │ │ Screenshot Checkpoints │ │
│ │ │ │ (Key steps + viewports) │ │
│ │ │ └──────────────────────────────┘ │
│ │ │ │ │
│ │ ▼ ▼ │
│ │ ┌──────────────────┐ ┌──────────────────────────────┐ │
│ │ │ Codebase Scanner │ │ UX Risk Analyzer │ │
│ │ │ (routes + UI map)│ │ (Heuristics + optional Vision)│ │
│ │ └──────────────────┘ └──────────────────────────────┘ │
│ │ │ │
│ │ ▼ │
│ │ ┌──────────────────────────────┐ │
│ │ │ Arize Phoenix │ │
│ │ │ (Tracing: inputs/outputs) │ │
│ │ └──────────────────────────────┘ │
│ │ │ │
│ ▼ ▼ │
│ ┌──────────────┐ ┌───────────────────────────────────┐ │
│ │ Dashboard │◀────────────────│ Insight Engine (Pass/Fail + Report)│ │
│ │ (Optional MVP)│ └───────────────────────────────────┘ │
│ └──────────────┘ │ │
│ │ ▼ │
│ │ ┌───────────────────────────────────┐ │
│ │ │ Datadog Trigger + Prioritizer │ │
│ │ │ (What flows to test + when) │ │
│ │ └───────────────────────────────────┘ │
│ │ │ │
│ │ ▼ │
│ │ ┌───────────────────────────────────┐ │
│ └─────────────────────────▶│ DevSwarm PR Feedback Generator │ │
│ │ (Actionable next steps) │ │
│ └───────────────────────────────────┘ │
│ │
│ ┌───────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ CrUX Client (Optional) │────▶│ Wood Wide AI (Optional reasoning) │ │
│ │ (real-user perf metrics) │ │ (trend + significance claims) │ │
│ └───────────────────────────┘ └───────────────────────────────────┘ │
│ │
└────────────────────────────────────────────────────────────────────────────┘

---

## Technology Stack

### Core Runtime
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript | Type safety, fast iteration |
| **Runtime** | Node.js 20+ | Playwright compatibility |
| **Package Manager** | pnpm | Fast, efficient monorepo support |

### CLI & Core
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **CLI Framework** | Commander.js | Simple, stable |
| **Config Parser** | js-yaml (optional) | Keep YAML support for flows, but MVP can run without |
| **Browser Automation** | Playwright | Reliable, fast |
| **MCP Runner** | Playwright MCP | Standard execution layer |
| **Vision (optional)** | Claude (Vision) | Only for high-level semantic checks |

### Dashboard (Optional for MVP)
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Next.js 14 (App Router) | Easy deploy if needed |
| **Styling** | Tailwind CSS | Rapid UI |
| **Components** | shadcn/ui | Clean visuals |

### Backend & Data (MVP-Friendly)
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Storage** | Local filesystem | Lowest debug, fastest |
| **Database (optional)** | SQLite (dev) / Turso (prod) | Add after demo if needed |
| **ORM (optional)** | Drizzle | Type-safe if DB is used |
| **Storage (optional)** | S3 | Post-hackathon scalability |

### Observability & Sponsors
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **AI Tracing** | Arize Phoenix | Trace all AI/UX decisions |
| **Dev Agent Output** | DevSwarm | Turn findings into PR feedback |
| **Trigger Signals** | Datadog | Decide what to test + when |
| **Numeric Reasoning (optional)** | Wood Wide AI API | Trend/stat claims for judges |
| **Real user metrics (optional)** | CrUX API | Baseline performance context |

---

## Project Structure (Monorepo, Still Familiar)

flowguard/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
│
├── packages/
│ ├── cli/
│ │ ├── src/
│ │ │ ├── index.ts
│ │ │ ├── commands/
│ │ │ │ ├── init.ts # optional YAML scaffolding
│ │ │ │ ├── manual.ts # NEW: manual-first record
│ │ │ │ ├── run.ts # replay flows (headless)
│ │ │ │ ├── datadog.ts # NEW: trigger-based run
│ │ │ │ └── report.ts
│ │ │ └── utils/
│ │ │ ├── config.ts
│ │ │ └── git.ts # branch/commit metadata
│ │ └── package.json
│ │
│ ├── core/
│ │ ├── src/
│ │ │ ├── flow/
│ │ │ │ ├── parser.ts # YAML → Flow objects (optional in MVP)
│ │ │ │ ├── types.ts
│ │ │ │ └── validator.ts
│ │ │ ├── scanner/
│ │ │ │ ├── codebase.ts # NEW: routes + UI map (lightweight)
│ │ │ │ └── types.ts
│ │ │ ├── runner/
│ │ │ │ ├── recorder.ts # NEW: manual-first recorder
│ │ │ │ ├── executor.ts # replay + orchestration
│ │ │ │ ├── browser.ts
│ │ │ │ ├── screenshot.ts
│ │ │ │ └── baselines.ts # baseline approval/update
│ │ │ ├── ux/
│ │ │ │ ├── heuristics.ts # deterministic checks (primary)
│ │ │ │ ├── vision.ts # optional semantic checks
│ │ │ │ └── types.ts
│ │ │ ├── insight/
│ │ │ │ ├── engine.ts # pass/fail gating
│ │ │ │ ├── reporter.ts # md + json output
│ │ │ │ └── types.ts
│ │ │ ├── tracing/
│ │ │ │ ├── phoenix.ts # Arize Phoenix
│ │ │ │ └── spans.ts
│ │ │ ├── triggers/
│ │ │ │ ├── datadog.ts # NEW: fetch signals + decide flows
│ │ │ │ └── types.ts
│ │ │ ├── devswarm/
│ │ │ │ └── comment.ts # NEW: PR comment generator
│ │ │ └── metrics/
│ │ │ ├── crux.ts
│ │ │ └── woodwide.ts
│ │ └── package.json
│ │
│ └── db/ (optional)
│ ├── src/
│ │ ├── schema.ts
│ │ └── client.ts
│ └── package.json
│
├── apps/
│ └── web/ (optional MVP)
│ ├── app/
│ ├── components/
│ └── package.json
│
├── flows/ (optional in MVP)
│ └── examples/
│ ├── signup.flow.yaml
│ └── checkout.flow.yaml
│
└── specs/
├── STARTUP_SPEC.md
└── TECHNICAL_SPEC.md

---

## Core UX: Zero Scripts Upfront (Manual-First)

### Why Manual-First is Low-Debug
- No selector guessing upfront
- No test authoring friction
- The developer does the “real” flow once
- FlowGuard turns it into stable automation

### CLI Entry Point
```bash
flowguard manual --name checkout --url "$BASE_URL/checkout" --viewports desktop,mobile --headed
Generated Outputs
tests/generated/checkout.spec.ts
.flowguard/runs/<runId>/screens/*.png
.flowguard/runs/<runId>/report.json
.flowguard/runs/<runId>/report.md
Flow Definition Schema (Still Supported)
YAML flows stay supported, but MVP does not require them.
name: user-signup
version: 1
description: User registration flow

intent: |
  User signs up and clearly sees a success confirmation message.

url: ${BASE_URL}/signup

steps:
  - name: page-load
    action: navigate
    assert:
      - "Signup form is visible and accessible"
      - "Email and password fields are clearly labeled"

  - name: fill-form
    action: fill
    inputs:
      - selector: "[name='email']"
        value: "test@example.com"
      - selector: "[name='password']"
        value: "SecurePass123!"
    assert:
      - "Submit button is enabled and prominent"

  - name: submit
    action: click
    target: "button[type='submit']"
    wait: networkidle
    assert:
      - "Success message is clearly visible"
      - "User understands registration is complete"

browsers:
  - chromium

viewports:
  - name: desktop
    width: 1920
    height: 1080
  - name: mobile
    width: 375
    height: 812

baseline:
  auto_update: false
  branch_aware: true

tags:
  - critical
Codebase Interpretation (Lightweight + Reliable)
FlowGuard “interprets the codebase” in a low-debug way:
Detect routes
Detect primary entrypoints
Map likely CTAs (buttons/links/forms) via static heuristics
MVP Scanner Behavior
Next.js: parse app/ routes + pages/ routes
React: detect common patterns (<Link>, <button>, forms)
Output: a “UI map” used only to improve:
naming (run labels)
checkpoint selection
stable selector preference
This is not deep program analysis. It’s a reliability-first map to reduce flake.
Playwright MCP Runner (Record + Replay)
Recording (Manual-first)
Launch headed Chromium
Developer performs flow
Capture steps + checkpoint screenshots
Generate Playwright spec.ts
Replay (CI)
Headless Chromium
Strict timeouts
Retry policy: disabled in MVP (avoid masking issues)
Screenshot Checkpoints (High Signal, Low Flake)
Checkpoints are captured:
after navigation
after key user actions (click/submit)
when network becomes idle
on explicit manual “checkpoint” hotkey
Each checkpoint stores:
screenshot path
URL
viewport name
timestamp
DOM summary (optional, small)
UX Risk Analyzer (Deterministic First)
To minimize debugging, FlowGuard uses a two-layer system:
Layer 1: Deterministic UX Heuristics (Primary)
Examples:
Below-the-fold success message: bounding box + viewport height
Primary CTA not prominent: size + contrast heuristic
Missing feedback after submit: no visible status change
Competing primary CTAs: multiple large buttons in same region
Mobile obstruction: CTA overlapped or off-screen
Layer 2: Optional Vision Model (Only for “Ambiguous”)
Only run vision for:
“prominence” disputes
unclear feedback semantics
multi-step confirmations
Vision is not required for every step. That’s how you keep the MVP stable.
Vision Prompt System (Optional)
export const SYSTEM_PROMPT = `You are FlowGuard, an expert UX reviewer.
Evaluate from a user's perspective. Be strict but fair.
Return only JSON that matches the schema.`;

export const ANALYSIS_PROMPT = `Analyze screenshot for UX compliance.

Intent:
{intent}

Step:
{stepName}

Assertions:
{assertions}

Return JSON:
{
  "verdict": "pass" | "fail" | "warning",
  "confidence": 0.0-1.0,
  "issues": [{ "severity": "critical"|"major"|"minor", "description": "...", "recommendation": "..." }],
  "summary": "..."
}`;
Insight Engine (Pass/Fail + Report)
Output Contract
“pass” means safe to merge
“warning” means mergeable but flagged
“fail” means block merge (configurable)
Report Files
report.json: machine-readable
report.md: PR-ready summary
Datadog Integration (Trigger + Prioritizer)
Datadog is not required to run FlowGuard, but it makes FlowGuard smarter and more realistic:
companies without QA often already have Datadog
Datadog tells FlowGuard what to test first
What Datadog Does in FlowGuard
Detect incident-like signals:
increased 4xx/5xx on key endpoints
latency spikes on route loads
increased front-end error rates
Map signals to likely affected flows/routes
Trigger targeted FlowGuard runs:
“rerun checkout flow on mobile viewport”
“verify confirmation state after form submit”
MVP Datadog Mode
flowguard datadog --service webapp --since 30m
if there are signals → run impacted flows
if no signals → no-op or run “smoke flow” (configurable)
Arize Phoenix Integration (Sponsor)
Phoenix traces every meaningful decision so you can prove:
what input produced what output
where false positives happen
improvements over time
Tracing Strategy
root span: flow_run
child spans: step_run, screenshot_capture, ux_heuristics, vision_analysis, report_generation
attributes include:
flow name
run id
commit sha
browser + viewport
verdict + confidence
DevSwarm Integration (Sponsor)
DevSwarm converts the report into concise, actionable feedback.
Responsibilities
explain what changed
why it’s risky
what class of fix is typical
Output
Markdown PR comment body (no code modifications)
Optional: checklist + next steps
Wood Wide AI + CrUX (Optional Enhancers)
These are optional for MVP because they’re more finicky:
CrUX may not have data for low-traffic sites
Wood Wide is best used for demo claims
If used:
Pull CrUX metrics for the tested URL
Compare previous run vs current run
Wood Wide generates:
significance
trend direction
confidence interval narrative
Environment Variables
# Required
BASE_URL=http://localhost:3000

# Vision (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Arize Phoenix
PHOENIX_API_KEY=...
PHOENIX_COLLECTOR_ENDPOINT=...

# Datadog
DD_API_KEY=...
DD_APP_KEY=...
DD_SITE=datadoghq.com
DD_SERVICE=webapp

# DevSwarm
DEVSWARM_API_KEY=...

# Optional
CRUX_API_KEY=...
WOODWIDE_API_KEY=...
Implementation Priority (Hackathon MVP)
Phase 1 — Core (Must Have)
Manual-first runner (flowguard manual)
Playwright test generation
Checkpoint screenshots
Deterministic UX heuristics
Markdown + JSON report
Phase 2 — Sponsors (Must Have)
Phoenix tracing + spans
DevSwarm PR comment generator
Phase 3 — Datadog (High Value)
Datadog trigger mode (fetch signals + map to flows)
Phase 4 — Optional Enhancers
Vision model on ambiguous cases
CrUX + Wood Wide metrics
Testing Strategy (Low Debug)
Unit Tests
Heuristic checks (pure functions)
Report generation
Datadog signal parsing
Integration Tests
Playwright screenshot capture (mock website)
Phoenix span creation (local exporter)
End-to-End Tests
One demo site (stable)
One real project (internal)
One Datadog-triggered run (mock response)
