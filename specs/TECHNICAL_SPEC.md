
# FlowGuard AI — Technical Specification

**Version:** 2.0  
**Date:** January 2026  
**Target:** NexHacks 2026 Hackathon MVP  

---

## Executive Technical Summary

FlowGuard AI extends traditional end-to-end testing by combining **Playwright-native automation**, **manual-first test generation**, **UX risk detection**, and **production-signal-driven prioritization**.

Unlike conventional E2E tools that require developers to pre-author scripts, FlowGuard allows developers to **manually complete a flow once**, after which FlowGuard generates:

- Stable Playwright test scripts
- UX risk analysis beyond functional assertions
- Production-aware prioritization via Datadog
- Fully traced AI decisions via Arize Phoenix
- PR-ready developer feedback via DevSwarm

This document defines the **complete technical architecture**, **code-level structure**, and **integration strategy** for the MVP.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                 FlowGuard AI                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────┐   ┌────────────────────┐   ┌──────────────────────────────┐ │
│  │   CLI    │──▶│   Flow Engine      │──▶│  Playwright MCP Runner        │ │
│  └──────────┘   │ (Manual-First +    │   │ (Record + Replay + Baseline) │ │
│       │          │  YAML Optional)   │   └──────────────────────────────┘ │
│       │          └────────────────────┘              │                   │
│       │                                               ▼                   │
│       │                                   ┌──────────────────────────┐   │
│       │                                   │ Screenshot Checkpoints    │   │
│       │                                   └──────────────────────────┘   │
│       │                                               │                   │
│       │                                               ▼                   │
│       │                     ┌────────────────────────────────────────┐  │
│       │                     │ UX Risk Analyzer                         │  │
│       │                     │ - Deterministic heuristics (primary)     │  │
│       │                     │ - Vision model (optional)                │  │
│       │                     └────────────────────────────────────────┘  │
│       │                                               │                   │
│       │                                               ▼                   │
│       │                                   ┌──────────────────────────┐   │
│       │                                   │ Arize Phoenix (Tracing)   │   │
│       │                                   └──────────────────────────┘   │
│       │                                               │                   │
│       ▼                                               ▼                   │
│  ┌──────────────┐               ┌────────────────────────────────────┐  │
│  │ Dashboard     │◀─────────────│ Insight Engine (Pass/Fail + Report) │  │
│  │ (Optional)    │               └────────────────────────────────────┘  │
│       │                                               │                   │
│       │                                               ▼                   │
│       │                         ┌────────────────────────────────────┐  │
│       │                         │ Datadog Trigger Engine              │  │
│       │                         │ (What to test, when)                │  │
│       │                         └────────────────────────────────────┘  │
│       │                                               │                   │
│       │                                               ▼                   │
│       │                         ┌────────────────────────────────────┐  │
│       └────────────────────────▶│ DevSwarm PR Feedback Generator      │  │
│                                 └────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────┐     ┌──────────────────────────────────┐   │
│  │ CrUX Client (Optional)   │────▶│ Wood Wide AI (Optional Analytics) │   │
│  └──────────────────────────┘     └──────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Runtime

| Layer | Technology | Rationale |
|------|------------|-----------|
| Language | TypeScript | Type safety, refactorability |
| Runtime | Node.js 20+ | Playwright compatibility |
| Package Manager | pnpm | Fast installs, monorepo |

### Execution & Automation

| Component | Technology | Rationale |
|---------|------------|-----------|
| Browser Automation | Playwright | Stable, fast |
| Execution Layer | Playwright MCP | Standardized runtime |
| Recording | Playwright codegen | Low-flake generation |

### Observability & Sponsors

| Component | Technology | Purpose |
|---------|------------|--------|
| AI Tracing | Arize Phoenix | Trace UX + AI decisions |
| Trigger Signals | Datadog | Decide what to test |
| Developer Agent | DevSwarm | PR-ready feedback |
| Metrics Reasoning | Wood Wide AI (optional) | Numeric claims |
| Real User Data | CrUX API (optional) | Production context |

---

## Project Structure

```
flowguard/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
│
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── manual.ts
│   │   │   │   ├── run.ts
│   │   │   │   ├── datadog.ts
│   │   │   │   └── report.ts
│   │   │   └── utils/
│   │   │       ├── config.ts
│   │   │       └── git.ts
│   │   └── package.json
│   │
│   ├── core/
│   │   ├── src/
│   │   │   ├── flow/
│   │   │   │   ├── parser.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── validator.ts
│   │   │   ├── runner/
│   │   │   │   ├── recorder.ts
│   │   │   │   ├── executor.ts
│   │   │   │   ├── browser.ts
│   │   │   │   ├── screenshot.ts
│   │   │   │   └── baselines.ts
│   │   │   ├── ux/
│   │   │   │   ├── heuristics.ts
│   │   │   │   ├── vision.ts
│   │   │   │   └── types.ts
│   │   │   ├── insight/
│   │   │   │   ├── engine.ts
│   │   │   │   ├── reporter.ts
│   │   │   │   └── types.ts
│   │   │   ├── tracing/
│   │   │   │   ├── phoenix.ts
│   │   │   │   └── spans.ts
│   │   │   ├── triggers/
│   │   │   │   └── datadog.ts
│   │   │   ├── devswarm/
│   │   │   │   └── comment.ts
│   │   │   └── metrics/
│   │   │       ├── crux.ts
│   │   │       └── woodwide.ts
│   │   └── package.json
│   │
│   └── db/ (optional)
│       ├── src/
│       │   ├── schema.ts
│       │   └── client.ts
│       └── package.json
│
├── apps/
│   └── web/ (optional MVP)
│
├── flows/
│   └── examples/
│       ├── signup.flow.yaml
│       └── checkout.flow.yaml
│
└── specs/
    └── TECHNICAL_SPEC.md


```
