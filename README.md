# FlowGuard AI

**AI-native UX testing platform that validates user flows with vision analysis.**

***Won NexHacks 2026 under the DevTools Main Track***

> Traditional E2E tests check if buttons click. FlowGuard checks if users can actually understand your UI.

## The Problem

Every team ships features that work perfectly in QA but confuse real users:

- CTAs that exist but aren't visually prominent
- Success messages that appear below the fold
- Mobile layouts where critical actions are obscured
- Forms that submit but provide no clear feedback

**FlowGuard catches UX bugs that functional tests miss.**

## How It Works

1. **Write intents, not selectors** — Describe what users should accomplish
2. **AI analyzes screenshots** — Claude vision evaluates UX like a human would
3. **Get clear verdicts** — Pass/fail with reasoning, not cryptic test output
4. **Track improvements** — Every decision traced to Arize Phoenix

```yaml
# flows/signup.yaml
name: mobile-signup
intent: "User on mobile can clearly find and tap the signup button"
url: https://myapp.com
viewport:
  width: 375
  height: 667
steps:
  - action: screenshot
    assert: "Signup CTA is visible without scrolling"
```

## Quick Start

```bash
# Install
npm install -g flowguard

# Initialize in your project
flowguard init

# Set your API key
export ANTHROPIC_API_KEY=your-key

# Run tests
flowguard run
```

## Features

- **Intent-based testing** — Tests survive redesigns, no selector maintenance
- **Vision AI analysis** — Claude 3.5 Sonnet evaluates screenshots for UX clarity
- **Cross-viewport testing** — Desktop, tablet, mobile in one flow
- **AI observability** — Full traces in Arize Phoenix for debugging
- **Real metrics** — CrUX data analyzed via Wood Wide AI
- **Beautiful reports** — Static HTML reports with embedded screenshots

## CLI Commands

```bash
# Initialize project
flowguard init

# Run all flows
flowguard run

# Run specific flow
flowguard run flows/signup.yaml

# Run with JSON output (for CI)
flowguard run --format json

# Skip vision analysis (faster)
flowguard run --no-vision

# Use mock data for demos
flowguard run --mock

# View reports
flowguard report --list
flowguard report --open
```

## Configuration

```json
// flowguard.config.json
{
  "version": 1,
  "flowsDir": "./flows",
  "reportsDir": "./reports"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key for vision analysis | Yes |
| `PHOENIX_ENDPOINT` | Arize Phoenix OTLP endpoint | No |
| `CRUX_API_KEY` | Google CrUX API key | No |
| `WOOD_WIDE_API_KEY` | Wood Wide AI API key | No |

## Flow Schema

```yaml
name: string          # Flow identifier
intent: string        # What user should accomplish (min 10 chars)
url: string           # Starting URL
viewport:             # Optional viewport
  width: number       # 320-3840
  height: number      # 480-2160
steps:
  - action: navigate|click|type|screenshot|wait|scroll
    target: string    # CSS selector or URL
    value: string     # Text to type or scroll amount
    assert: string    # What to verify in screenshot
    timeout: number   # Action timeout in ms
```

## Architecture

```
CLI → Flow Parser → Playwright Runner → Vision Analyzer → Report Generator
                                              ↓
                                        Arize Phoenix (Traces)
                                              ↓
                                        Wood Wide AI (Metrics)
```

### Stack

| Layer | Technology |
|-------|------------|
| CLI | Node.js, Commander.js |
| Core | TypeScript, Playwright |
| Vision | Anthropic Claude 3.5 Sonnet |
| Reports | Static HTML (self-contained) |
| Tracing | OpenTelemetry → Arize Phoenix |
| Metrics | CrUX API, Wood Wide AI |

## Sponsor Integrations

### Arize Phoenix ($1,000 Prize)

Every vision API call is traced with OpenTelemetry using OpenInference semantic conventions:

- Flow runs as parent spans, steps as children
- LLM call attributes: model, tokens, latency
- FlowGuard-specific: confidence, verdict, viewport

```bash
# Start Phoenix locally
docker run -p 6006:6006 arizephoenix/phoenix:latest

# Run FlowGuard with tracing
flowguard run
```

**Demo Story:** "We traced 100+ vision analysis calls. By comparing prompts in Phoenix, we improved accuracy from 72% to 89%."

### Wood Wide AI ($750 Prize)

Statistical analysis for UX improvement claims:

- CrUX metrics (LCP, CLS, INP) as structured input
- Significance testing for before/after comparisons
- Numeric grounding for "X% improvement" claims

**Demo Story:** "FlowGuard doesn't just say 'UX improved'—Wood Wide confirms it with 95% confidence based on real CrUX data."

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

## What FlowGuard Guarantees

FlowGuard does **not** guarantee:
- Better aesthetics
- Higher delight
- Perfect UX

It **does** guarantee:
- No silent UX regressions
- No loss of action visibility
- No missing confirmation feedback
- No increase in flow ambiguity
- No new cross-platform breakage

## License

MIT

---

Built for **NexHacks 2026** | Competing for Dev Tools, Arize Phoenix, and Wood Wide AI prizes
