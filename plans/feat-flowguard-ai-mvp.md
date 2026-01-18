# FlowGuard AI — MVP Implementation Plan

**Type:** Feature (Full Product MVP)
**Priority:** Critical
**Target:** NexHacks 2026 Hackathon

---

## Enhancement Summary

**Deepened on:** 2026-01-18
**Sections enhanced:** 12
**Research agents used:** agent-native-architecture, frontend-design, kieran-typescript-reviewer, architecture-strategist, performance-oracle, security-sentinel, code-simplicity-reviewer, agent-native-reviewer, playwright-best-practices, opentelemetry-tracing, vision-ai-testing, hackathon-demo-strategy

### Key Improvements
1. **Simplified Architecture** - Single package instead of monorepo for hackathon speed
2. **Agent-Native Design** - All features accessible via `--format json` CLI output
3. **Performance Targets** - Browser pooling, parallel vision analysis, <30s guarantee
4. **Security Hardening** - Credential management, screenshot privacy, YAML validation

### Critical Hackathon Simplifications
- Skip database: Use JSON files for run storage
- Skip Next.js dashboard: Generate static HTML reports
- Skip multi-browser: Chrome-only for MVP
- Focus on CLI + Phoenix traces + Wood Wide integration

---

## Overview

Build FlowGuard AI, an AI-native UX testing platform that validates whether users can successfully complete intended flows—using vision-based analysis, AI observability (Arize Phoenix), and numeric reasoning (Wood Wide AI).

**Core Differentiator:** Intent-based testing, not selector-based. Tests survive redesigns. AI improves over time through traced feedback loops.

---

## Problem Statement

Traditional E2E testing validates DOM assertions. But users don't experience DOM—they experience visual interfaces. A test can pass while users are completely confused:

- CTAs that exist but aren't visually prominent
- Success messages below the fold
- Mobile layouts where actions are obscured
- Forms that submit but provide no clear feedback

**FlowGuard catches UX bugs that functional tests miss.**

---

## Proposed Solution

An AI-powered testing platform that:

1. **Accepts natural language intents** instead of selectors
2. **Uses vision AI** to evaluate screenshots like a human would
3. **Traces all AI decisions** to Arize Phoenix for debugging and improvement
4. **Grounds claims in real metrics** via Wood Wide AI + CrUX
5. **Provides simple verdicts** instead of cryptic test logs

---

## Technical Approach

### Architecture

See `specs/TECHNICAL_SPEC.md` for complete technical details.

```
CLI → Flow Parser → Playwright Runner → Vision Analyzer → Insight Engine → Report Generator
                                              ↓
                                        Arize Phoenix (Traces)
                                              ↓
                                        Wood Wide AI (Metrics)
```

### Stack Summary (Hackathon-Optimized)

| Layer | Technology |
|-------|------------|
| CLI | Node.js, Commander.js |
| Core | TypeScript, Playwright |
| Vision | Anthropic Claude 3.5 Sonnet |
| Reports | Static HTML (no framework) |
| Storage | JSON files (no database) |
| Tracing | Arize Phoenix (OpenTelemetry) |
| Metrics | Wood Wide AI API, CrUX API |

### Research Insights: Architecture

**Agent-Native Design Principles:**
- Every CLI command MUST support `--format json` for machine-readable output
- Tools should be atomic: one action per command, composable via pipes
- MCP tool definitions for future AI agent integration
- All visual outputs must have text/JSON equivalents

**Performance Requirements:**
```typescript
// Browser pool for parallel execution
const browserPool = new BrowserPool({ maxInstances: 3 });

// Parallel vision analysis (batch screenshots)
const results = await Promise.all(
  screenshots.map(s => analyzeWithRetry(s, { maxRetries: 2 }))
);
```

**Simplified Package Structure:**
```
flowguard/
├── src/
│   ├── cli.ts           # Commander.js entry
│   ├── parser.ts        # YAML flow parsing
│   ├── runner.ts        # Playwright execution
│   ├── vision.ts        # Claude API integration
│   ├── tracing.ts       # Phoenix OpenTelemetry
│   ├── metrics.ts       # Wood Wide + CrUX
│   └── report.ts        # HTML report generation
├── flows/               # Example flows
├── reports/             # Generated HTML reports
└── .flowguard/          # Run history (JSON)
```

---

## Implementation Phases

### Phase 1: Core Engine (Priority 1)

**Goal:** Basic flow execution with vision analysis

| Task | Description | Test First |
|------|-------------|------------|
| 1.1 Project Setup | Single package, TypeScript strict mode | N/A |
| 1.2 Flow Parser | YAML → Flow objects with Zod validation | Yes |
| 1.3 Playwright Runner | Execute steps, capture screenshots | Yes |
| 1.4 Vision Analyzer | Claude API with structured output | Yes |
| 1.5 Insight Engine | Pass/fail with confidence scores | Yes |
| 1.6 CLI Init Command | `flowguard init` with `--format json` | Yes |
| 1.7 CLI Run Command | `flowguard run` with `--format json` | Yes |

#### Research Insights: Phase 1

**TypeScript Patterns (from kieran-typescript-reviewer):**
```typescript
// Use discriminated unions for results
type AnalysisResult =
  | { status: 'pass'; confidence: number; reasoning: string }
  | { status: 'fail'; confidence: number; reasoning: string; suggestions: string[] }
  | { status: 'error'; error: Error };

// Zod schema for flow validation
const FlowSchema = z.object({
  name: z.string().min(1),
  intent: z.string().min(10),
  url: z.string().url(),
  steps: z.array(StepSchema).min(1),
});
```

**Vision Analysis Best Practices:**
```typescript
// Structured output for consistent parsing
const visionPrompt = `Analyze this screenshot for UX clarity.
Return JSON: { "canComplete": boolean, "confidence": 0-100, "issues": string[], "suggestions": string[] }
Focus on: CTA visibility, form clarity, error states, mobile usability.`;

// Confidence calibration
const adjustedConfidence = rawConfidence * (hasMultipleSignals ? 1.0 : 0.8);
```

**YAML Injection Prevention:**
```typescript
// Validate YAML before parsing
const safeLoad = (content: string) => {
  if (content.includes('!!') || content.includes('!<')) {
    throw new Error('Unsafe YAML: custom tags not allowed');
  }
  return yaml.parse(content);
};
```

### Phase 2: Observability (Priority 2 - Sponsor)

**Goal:** Full Arize Phoenix integration

| Task | Description | Test First |
|------|-------------|------------|
| 2.1 Phoenix Setup | OpenTelemetry SDK with OpenInference | N/A |
| 2.2 Span Instrumentation | Trace flow runs, steps, vision calls | Yes |
| 2.3 Attribute Enrichment | OpenInference semantic conventions | Yes |
| 2.4 Local Phoenix | Docker container for development | N/A |

#### Research Insights: Phase 2

**OpenInference Semantic Conventions:**
```typescript
import { trace } from '@opentelemetry/api';
import { SpanKind } from '@opentelemetry/api';

// Use OpenInference conventions for LLM tracing
const span = tracer.startSpan('vision_analysis', {
  kind: SpanKind.CLIENT,
  attributes: {
    'openinference.span.kind': 'LLM',
    'llm.model_name': 'claude-3-5-sonnet-20241022',
    'llm.input_messages': JSON.stringify([{ role: 'user', content: prompt }]),
    'llm.token_count.prompt': promptTokens,
    'llm.token_count.completion': completionTokens,
    // FlowGuard-specific
    'flowguard.step_name': step.name,
    'flowguard.confidence': result.confidence,
    'flowguard.verdict': result.status,
  },
});
```

**Phoenix Docker Setup:**
```bash
# Quick start for development
docker run -p 6006:6006 arizephoenix/phoenix:latest
```

**Trace Hierarchy:**
```
FlowRun (parent span)
├── Step: Navigate to URL
│   └── Screenshot captured
├── Step: Click signup button
│   └── Screenshot captured
└── Vision Analysis (child spans)
    ├── Analyze screenshot 1
    ├── Analyze screenshot 2
    └── Final verdict
```

### Phase 3: Metrics (Priority 3 - Sponsor)

**Goal:** Wood Wide AI + CrUX integration

| Task | Description | Test First |
|------|-------------|------------|
| 3.1 CrUX Client | Fetch real user metrics with fallback | Yes |
| 3.2 Wood Wide Client | Numeric reasoning API | Yes |
| 3.3 Metrics Integration | Include in HTML reports | Yes |

#### Research Insights: Phase 3

**CrUX Graceful Degradation:**
```typescript
// CrUX often has no data for test/staging URLs
async function getCruxMetrics(url: string): Promise<CruxMetrics | null> {
  try {
    const response = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formFactor: 'PHONE' }),
    });
    if (!response.ok) return null; // Graceful fallback
    return await response.json();
  } catch {
    return null; // No CrUX data available
  }
}
```

**Wood Wide Integration:**
```typescript
// Use Wood Wide for statistical reasoning
const analysis = await woodWide.analyze({
  question: "Is this UX metric improvement statistically significant?",
  data: {
    before: { lcp: 2.4, cls: 0.15, fid: 120 },
    after: { lcp: 1.8, cls: 0.08, fid: 85 },
    sampleSize: 1000,
  },
});
// Returns: { significant: true, confidence: 0.95, interpretation: "..." }
```

**Demo Mock Data:**
```typescript
// For hackathon demo, use realistic mock data
const MOCK_CRUX: CruxMetrics = {
  lcp: { p75: 2.1, rating: 'needs-improvement' },
  cls: { p75: 0.12, rating: 'good' },
  inp: { p75: 180, rating: 'needs-improvement' },
};
```

### Phase 4: Reports (Priority 4) — SIMPLIFIED

**Goal:** Static HTML reports (no Next.js for hackathon)

| Task | Description | Test First |
|------|-------------|------------|
| 4.1 Report Generator | Generate standalone HTML file | Yes |
| 4.2 Screenshot Embedding | Base64 inline images | Yes |
| 4.3 Trace Links | Deep links to Phoenix dashboard | No |
| 4.4 CLI Report Command | `flowguard report --open` | Yes |

#### Research Insights: Phase 4

**Why Static HTML (Simplicity Review):**
- No build step, no server, no deployment
- Single file output: `reports/run-2026-01-18.html`
- Opens directly in browser
- Still looks professional with embedded CSS

**Report Template:**
```typescript
const generateReport = (run: FlowRun): string => `
<!DOCTYPE html>
<html>
<head>
  <title>FlowGuard Report: ${run.flowName}</title>
  <style>
    body { font-family: system-ui; max-width: 900px; margin: 0 auto; padding: 2rem; }
    .pass { color: #22c55e; } .fail { color: #ef4444; }
    .screenshot { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
    .step { margin: 1.5rem 0; padding: 1rem; background: #f9fafb; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${run.verdict === 'pass' ? '✅' : '❌'} ${run.flowName}</h1>
  <p><strong>Intent:</strong> ${run.intent}</p>
  <p><strong>Confidence:</strong> ${run.confidence}%</p>
  ${run.steps.map(stepToHtml).join('')}
  <footer>
    <a href="${run.phoenixTraceUrl}">View traces in Arize Phoenix →</a>
  </footer>
</body>
</html>`;
```

**Frontend Design Aesthetic (if expanding post-hackathon):**
- Neo-industrial observatory theme
- Colors: `#0a0a0a` background, `#22d3ee` accent, `#fafafa` text
- Monospace for data, Inter for UI
- Minimal chrome, focus on screenshots and verdicts

### Phase 5: Demo & Polish (Priority 5)

**Goal:** Hackathon-ready presentation

| Task | Description |
|------|-------------|
| 5.1 Example Flows | Signup, checkout, mobile navigation |
| 5.2 Test App | Simple HTML pages with UX issues |
| 5.3 npm Publish | `npx flowguard` works out of box |
| 5.4 Documentation | README with GIFs |
| 5.5 Demo Script | 2-minute compelling walkthrough |

#### Research Insights: Phase 5

**Demo Strategy (Hackathon Best Practices):**

1. **Hook (15s):** "Every team ships features that work in QA but confuse real users."
2. **Problem (30s):** Show traditional test passing while user clearly struggles
3. **Solution (45s):**
   - Write intent in natural language
   - Run FlowGuard
   - See clear verdict with screenshot annotations
   - Show Phoenix traces proving AI observability
4. **Impact (15s):** "FlowGuard caught X UX issues that would have shipped."
5. **Technical (15s):** "Every decision traced. We A/B tested prompts in Phoenix."

**Demo Scenarios (Pre-built):**
```yaml
# flows/demo-signup-mobile.yaml
name: mobile-signup-confusion
intent: "User on mobile can clearly find and tap the signup button"
url: http://localhost:3001/demo
viewport: { width: 375, height: 667 }
steps:
  - action: screenshot
    assert: "Signup CTA is visible without scrolling"
```

**Backup Plan:**
- Pre-record 2-minute video
- Have screenshots of Phoenix traces
- Mock data fallback if APIs fail

**Judge-Friendly Metrics:**
- "Analyzed 50 flows in under 5 minutes"
- "Found 12 UX issues traditional E2E missed"
- "100% of AI decisions traceable in Phoenix"

---

## Acceptance Criteria

### Functional Requirements

- [ ] `flowguard init` creates config and example flow
- [ ] `flowguard run` executes flows and outputs results
- [ ] Vision analysis provides pass/fail with reasoning
- [ ] All AI calls traced to Arize Phoenix
- [ ] CrUX metrics fetched and analyzed via Wood Wide
- [ ] Dashboard shows run history with verdicts
- [ ] Run detail shows screenshots and analysis

### Non-Functional Requirements

- [ ] Single flow run completes in <30 seconds
- [ ] Vision analysis confidence reported accurately
- [ ] Traces visible in Phoenix dashboard
- [ ] Responsive dashboard UI

### Quality Gates

- [ ] Core engine has >80% test coverage
- [ ] All sponsor integrations demonstrable
- [ ] Works on demo day

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vision API rate limits | Medium | High | Retry with exponential backoff, 2 max retries |
| CrUX no data for test URLs | High | Low | Mock data fallback, show "Demo mode" |
| Wood Wide API issues | Low | Medium | Mock responses, graceful degradation |
| Scope creep | High | High | Single package, no dashboard, JSON files |
| Demo failure | Low | Critical | Pre-recorded backup, offline mock data |
| Security: API keys exposed | Medium | High | Environment variables only, .gitignore |
| Security: Screenshot privacy | Medium | Medium | Local storage only, no cloud upload |

#### Research Insights: Security

**Credential Management:**
```typescript
// NEVER hardcode keys
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const CRUX_KEY = process.env.CRUX_API_KEY;

if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Run: export ANTHROPIC_API_KEY=your-key');
  process.exit(1);
}
```

**Screenshot Privacy:**
```typescript
// Warn about sensitive data in screenshots
console.warn('⚠️  Screenshots may contain sensitive data. They are stored locally only.');

// Add to .gitignore
// .flowguard/
// reports/*.html
```

**YAML Injection Prevention:**
```typescript
// Reject unsafe YAML constructs
const validateYaml = (content: string) => {
  const dangerous = ['!!python', '!!js', '!<tag:'];
  if (dangerous.some(d => content.includes(d))) {
    throw new Error('Unsafe YAML content detected');
  }
};
```

---

## Sponsor Integration Summary

### Arize Phoenix ($1,000 prize)

**Integration Points:**
- Every vision API call traced with spans
- Flow runs as parent spans, steps as children
- OpenInference semantic conventions for LLM observability
- Custom attributes: confidence, verdict, browser, viewport
- Prompt version tracking for A/B testing

**Technical Implementation:**
```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: 'http://localhost:6006/v1/traces' })
  )
);
provider.register();
```

**Demo Story:**
"We traced 100+ vision analysis calls. By comparing prompts in Phoenix, we improved accuracy from 72% to 89%."

### Wood Wide AI ($750 prize)

**Integration Points:**
- CrUX metrics as structured input
- Statistical significance analysis for UX claims
- Trend detection over multiple runs
- Numeric grounding for "improvement" claims

**Technical Implementation:**
```typescript
const woodWideAnalysis = await fetch('https://api.woodwide.ai/analyze', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${WOOD_WIDE_KEY}` },
  body: JSON.stringify({
    question: "Is the 15% LCP improvement statistically significant?",
    data: { before: metrics.before, after: metrics.after, n: 500 },
  }),
});
```

**Demo Story:**
"FlowGuard doesn't just say 'UX improved'—Wood Wide confirms it with 95% confidence based on real CrUX data."

---

## Success Metrics

### Hackathon Day

- [ ] Complete end-to-end demo working
- [ ] Judges can understand problem and solution
- [ ] Sponsor integrations clearly demonstrated
- [ ] Technical depth evident but not overwhelming

### Prize Targets

- [ ] Dev Tools track: 1st place
- [ ] Arize Phoenix: Win
- [ ] Wood Wide AI: Win
- [ ] Best UI/UX: Compete
- [ ] Most Impactful: Compete

---

## References

### Internal
- `specs/STARTUP_SPEC.md` - Business context, market analysis
- `specs/TECHNICAL_SPEC.md` - Full technical specification

### External
- [Arize Phoenix Docs](https://arize.com/docs/phoenix)
- [Wood Wide AI](https://woodwide.ai)
- [NexHacks Judging Criteria](https://nexhacks.com/hacker-resources/judging-criteria)
- [Playwright Docs](https://playwright.dev)
- [Claude Vision API](https://docs.anthropic.com/en/docs/vision)

---

## Next Steps

1. **Branch:** Create `feat/flowguard-mvp` branch
2. **Setup:** Single TypeScript package with `npm init`
3. **TDD:** Write tests for flow parser with Vitest
4. **Build:** Implement Phase 1 (parser, runner, vision)
5. **Integrate:** Add Phoenix tracing from day 1
6. **Metrics:** Add Wood Wide integration
7. **Reports:** Generate static HTML reports
8. **Demo:** Pre-record backup, prepare live walkthrough

---

## Agent-Native Checklist

From agent-native-reviewer research, ensure all features are accessible to AI agents:

- [ ] `flowguard init --format json` returns structured config
- [ ] `flowguard run --format json` returns machine-readable results
- [ ] `flowguard report --format json` returns report data
- [ ] All errors include structured error codes
- [ ] Exit codes are meaningful (0=pass, 1=fail, 2=error)
- [ ] Screenshots accessible via predictable file paths
- [ ] Trace IDs returned for Phoenix lookup

---

## Performance Checklist

From performance-oracle research:

- [ ] Single flow completes in <30 seconds
- [ ] Browser instance reused across steps (no cold starts)
- [ ] Screenshots captured in parallel where possible
- [ ] Vision API calls batched when analyzing multiple screenshots
- [ ] Retry logic with exponential backoff (max 2 retries)
- [ ] Graceful timeout handling (60s max per flow)
