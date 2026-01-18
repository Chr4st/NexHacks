# FlowGuard AI — 8-Agent Parallel Execution Plan

**Platform:** DevSwarm.ai
**Team:** 2 developers × 4 AI agents each = 8 parallel streams
**Timeline:** 4-5 days to completion
**Strategy:** Minimize merge conflicts through module isolation

---

## Agent Allocation Strategy

### Team A (Developer 1 - YOU)

| Agent | AI Tool | Branch | Module | Start Day 1 |
|-------|---------|--------|--------|-------------|
| **A1** | Claude Code Max | `feat/mongodb-core` | MongoDB + API contracts | ✅ Provides interfaces |
| **A2** | Claude Code Max | `feat/vision-phoenix` | Vision cache + Phoenix experiments | ✅ Uses mock MongoDB |
| **A3** | Gemini | `feat/crux-woodwide` | CrUX + Wood Wide analytics | ✅ Independent APIs |
| **A4** | Amp | `feat/github-app-webhooks` | GitHub App + webhooks | ✅ Independent |

### Team B (Developer 2 - PARTNER)

| Agent | AI Tool | Branch | Module | Start Day 1 |
|-------|---------|--------|--------|-------------|
| **B1** | Cursor Pro | `feat/nextjs-saas-frontend` | Next.js SaaS app | ✅ Uses API contracts + mocks |
| **B2** | Cursor Pro | `feat/html-reports` | HTML report generator | ✅ Uses sample data |
| **B3** | Gemini | `feat/cli-commands` | CLI commands | ✅ Uses mock MongoDB |
| **B4** | Amp | `feat/do-spaces-storage` | DO Spaces storage | ✅ Independent |

---

## Module Ownership Matrix

| Module | Directory | Agent | Strategy | Can Start |
|--------|-----------|-------|----------|-----------|
| **MongoDB Core** | `/src/db/` | A1 | Exports interfaces first, impl after | ✅ Day 1 |
| **Vision + Phoenix** | `/src/vision/`, `/src/tracing/`, `/scripts/` | A2 | Uses mock MongoDB (in-memory) | ✅ Day 1 |
| **CrUX + Wood Wide** | `/src/metrics/` | A3 | Independent API clients | ✅ Day 1 |
| **GitHub App** | `/src/github/` | A4 | Independent webhook server | ✅ Day 1 |
| **Next.js Frontend** | `/apps/web/` | B1 | Uses API contracts + mock data | ✅ Day 1 |
| **HTML Reports** | `/src/report/` | B2 | Works with fixture data | ✅ Day 1 |
| **CLI Commands** | `/src/commands/` | B3 | Uses mock MongoDB (in-memory) | ✅ Day 1 |
| **DO Spaces** | `/src/storage/` | B4 | Independent S3 client | ✅ Day 1 |

---

## Detailed Agent Specifications

### Agent A1: MongoDB Core Infrastructure 🔴 CRITICAL PATH

**AI:** Claude Code Max (50% budget)
**Branch:** `feat/mongodb-core-infrastructure`
**Priority:** P0 (Foundation)

**Files to Create:**
- `src/db/client.ts` - Database connection singleton
- `src/db/schemas.ts` - TypeScript interfaces for all collections
- `src/db/repository.ts` - Repository pattern (CRUD operations)
- `src/db/setup.ts` - Collection creation, indexes
- `src/db/__tests__/repository.test.ts` - Full test suite
- `src/db/README.md` - Usage documentation
- `src/db/index.ts` - Public exports

**Deliverables:**
1. Time-series collection for test results
2. Vision cache collection with TTL
3. Flow definitions collection
4. Usage events tracking
5. Repository with all CRUD methods
6. 100% test coverage

**Interface for Other Agents:**
```typescript
export class FlowGuardRepository {
  async saveTestResult(result: TestResult): Promise<void>;
  async getCachedVisionResult(hash, assertion, model, version): Promise<VisionCache | null>;
  async cacheVisionResult(result): Promise<void>;
  async saveFlow(flow): Promise<string>;
  async getFlow(name): Promise<FlowDefinition | null>;
  async getCostByFlow(start, end): Promise<CostAnalysis[]>;
}
```

**Acceptance:** All tests pass, documentation complete, no dependencies on other code

---

### Agent A2: Phoenix Experiments & Evaluation

**AI:** Claude Code Max
**Branch:** `feat/phoenix-experiments-evaluation`
**Priority:** P1 (Sponsor track)

**Files to Create:**
- `src/tracing/phoenix-eval.ts` - Experiment runner
- `scripts/create_benchmark_dataset.py` - Python script
- `scripts/evaluate_vision_accuracy.py` - Python evaluation
- `src/tracing/__tests__/phoenix-eval.test.ts`
- `docs/PHOENIX_EXPERIMENTS.md` - Documentation

**Deliverables:**
1. Benchmark dataset creation (50+ examples)
2. Experiment execution framework
3. A/B testing infrastructure
4. Accuracy measurement utilities
5. Integration with existing tracing code

**Interface for Other Agents:**
```typescript
export class PromptOptimizer {
  async runExperiment(promptVersion, dataset): Promise<ExperimentResult>;
  async runABTest(promptA, promptB): Promise<ABTestResult>;
  async getBestPrompt(dataset): Promise<string>;
}
```

**Dependencies:** MongoDB (for storing experiments)
**Acceptance:** Can run experiments, measure accuracy >85%, Python scripts work

---

### Agent A3: CLI Commands Enhancement

**AI:** Gemini (Free tier)
**Branch:** `feat/cli-commands-mongodb`
**Priority:** P1

**Files to Modify:**
- `src/cli.ts` - Add new commands
- `src/config.ts` - Environment validation

**Files to Create:**
- `src/commands/trends.ts`
- `src/commands/search.ts`
- `src/commands/costs.ts`
- `src/commands/__tests__/trends.test.ts`

**Deliverables:**
1. `flowguard trends <flow>` - Show historical success rate
2. `flowguard search <query>` - Search flows by intent
3. `flowguard costs [--start] [--end]` - Cost analytics
4. All commands support `--format json`

**Interface Changes:**
```typescript
// Add to commander.js
program
  .command('trends <flow>')
  .option('--format <format>', 'Output format', 'pretty')
  .action(async (flow, options) => { ... });
```

**Dependencies:** MongoDB repository (A1)
**Acceptance:** All commands work, JSON output, tests pass

---

### Agent A4: HTML Report Generation

**AI:** Cursor Pro
**Branch:** `feat/html-report-generator`
**Priority:** P2

**Files to Modify:**
- `src/report.ts` - Enhance with MongoDB data

**Files to Create:**
- `src/report/templates.ts` - HTML templates
- `src/report/charts.ts` - Trend visualizations
- `src/report/__tests__/report.test.ts`

**Deliverables:**
1. Enhanced HTML reports with historical trends
2. CrUX metrics display
3. Wood Wide insights integration
4. Responsive design
5. Print-friendly styles

**Interface:**
```typescript
export async function generateEnhancedReport(
  flowRun: FlowRun,
  historicalData: TestResult[],
  cruxMetrics?: CruxMetrics,
  woodWideInsights?: WoodWideAnalysis
): Promise<string>;
```

**Dependencies:** MongoDB (for historical data)
**Acceptance:** Beautiful reports, works offline, <100KB file size

---

### Agent B1: Vision Analysis + Cache Integration

**AI:** Claude Code Max
**Branch:** `feat/vision-cache-integration`
**Priority:** P0 (Core feature)

**Files to Modify:**
- `src/vision.ts` - Add cache lookup
- `src/security.ts` - Screenshot hashing

**Files to Create:**
- `src/vision/cache.ts` - Cache utilities
- `src/vision/__tests__/cache.test.ts`

**Deliverables:**
1. SHA-256 screenshot hashing
2. Cache-before-API-call logic
3. Cache hit/miss metrics
4. Prompt versioning support
5. Cost tracking per call

**Interface:**
```typescript
export async function analyzeWithCache(
  screenshotPath: string,
  assertion: string,
  options: { promptVersion: string; model: string }
): Promise<VisionResult & { cached: boolean; cost: number }>;
```

**Dependencies:** MongoDB repository (A1)
**Acceptance:** >80% cache hit rate in tests, cost reduced by 80%

---

### Agent B2: DigitalOcean Spaces Storage

**AI:** Cursor Pro
**Branch:** `feat/do-spaces-storage`
**Priority:** P1

**Files to Create:**
- `src/storage/spaces.ts` - S3-compatible client
- `src/storage/__tests__/spaces.test.ts`
- `scripts/setup-droplet.sh` - Droplet provisioning

**Deliverables:**
1. Upload screenshots to DO Spaces
2. Upload reports to DO Spaces
3. CDN URL generation
4. Private ACL with signed URLs
5. Droplet setup automation

**Interface:**
```typescript
export class SpacesStorage {
  async uploadScreenshot(path, flowName): Promise<string>;
  async uploadReport(html, reportId): Promise<string>;
  async getSignedUrl(key, expiresIn): Promise<string>;
}
```

**Dependencies:** None (independent)
**Acceptance:** Can upload files, generate URLs, tests with mock S3

---

### Agent B3: CrUX + Wood Wide Analytics

**AI:** Gemini
**Branch:** `feat/crux-woodwide-analytics`
**Priority:** P1 (Sponsor tracks)

**Files to Create:**
- `src/metrics/crux.ts` - CrUX API client
- `src/metrics/woodwide.ts` - Wood Wide client
- `src/metrics/__tests__/crux.test.ts`
- `src/metrics/__tests__/woodwide.test.ts`

**Deliverables:**
1. CrUX metrics fetcher with graceful fallback
2. Wood Wide statistical analysis
3. Significance testing utilities
4. Trend detection
5. Mock data for demos

**Interface:**
```typescript
export class CruxClient {
  async getMetrics(url, formFactor): Promise<CruxMetrics | null>;
  async getHistoricalTrend(url, days): Promise<CruxTrend>;
}

export class WoodWideClient {
  async analyzeSignificance(before, after, n): Promise<Analysis>;
  async detectAnomalies(timeSeries): Promise<Anomaly[]>;
}
```

**Dependencies:** None
**Acceptance:** Can fetch CrUX data, Wood Wide integration works, fallback to mocks

---

### Agent B4: GitHub App + Webhooks

**AI:** Amp (Free tier)
**Branch:** `feat/github-app-webhooks`
**Priority:** P2

**Files to Create:**
- `src/github/webhook-handler.ts` - Webhook verification & handling
- `src/github/auth.ts` - GitHub App authentication
- `src/github/server.ts` - Express webhook server
- `.github/workflows/flowguard.yml` - GitHub Actions
- `src/github/__tests__/webhook.test.ts`

**Deliverables:**
1. Webhook signature verification
2. PR comment generation
3. Check runs creation
4. GitHub Actions workflow
5. Installation flow documentation

**Interface:**
```typescript
export class GitHubWebhookHandler {
  verifySignature(payload, signature): boolean;
  async handlePullRequest(payload): Promise<void>;
  async postComment(owner, repo, prNumber, body): Promise<void>;
  async createCheckRun(owner, repo, sha, results): Promise<void>;
}
```

**Dependencies:** None
**Acceptance:** Webhooks work, signature verification passes, Actions run

---

## Dependency Graph

```
Day 1 - ALL 8 AGENTS START IN PARALLEL! 🚀
├─ Team A (You):
│  ├─ A1: MongoDB Core ──────────► Exports interfaces/types first
│  ├─ A2: Vision + Phoenix ──────► Uses in-memory mock MongoDB
│  ├─ A3: CrUX + Wood Wide ──────► Independent (external APIs only)
│  └─ A4: GitHub App ────────────► Independent (webhook server)
│
└─ Team B (Partner):
   ├─ B1: Next.js Frontend ──────► Uses API contracts + fixture data
   ├─ B2: HTML Reports ───────────► Uses sample test result fixtures
   ├─ B3: CLI Commands ───────────► Uses in-memory mock MongoDB
   └─ B4: DO Spaces ──────────────► Independent (S3-compatible)

Day 2-3 (Continue in parallel):
└─ All agents complete their modules with mocks/fixtures

Day 4 (Integration):
├─ A1 provides real MongoDB connection
├─ Replace mocks with real implementations
├─ Merge all branches
└─ Integration testing

Day 5 (Demo):
└─ NexHacks presentation ready! 🏆
```

---

## Parallel Execution Strategy (Contract-Based Development)

### Phase 0: Interface Contracts (Hour 1)

**Agent A1 creates and commits interface contracts immediately:**

```typescript
// src/db/types.ts - Committed first, all agents use this
export interface FlowGuardRepository {
  // Flows
  saveFlow(flow: FlowDefinition): Promise<string>
  getFlow(id: string): Promise<FlowDefinition | null>
  getFlowsByUser(userId: string): Promise<FlowDefinition[]>

  // Test results
  saveTestResult(result: TestResult): Promise<void>
  getRecentResults(flowName: string, limit: number): Promise<TestResult[]>
  getSuccessRateTrend(flowName: string, days: number): Promise<TrendDataPoint[]>

  // Vision cache
  getCachedVisionResult(hash: string, assertion: string, model: string, version: string): Promise<VisionCache | null>
  cacheVisionResult(entry: VisionCacheEntry): Promise<void>

  // Analytics
  getCostAnalysis(startDate: Date, endDate: Date, flowName?: string): Promise<CostAnalysisItem[]>
}

// Export all type definitions
export interface FlowDefinition { /* ... */ }
export interface TestResult { /* ... */ }
export interface VisionCache { /* ... */ }
// ... all other types
```

**All agents immediately use these contracts with mocks:**

### Mock Strategy for Each Agent

**A2 (Vision + Phoenix):**
```typescript
// Uses in-memory mock MongoDB
import { MongoMemoryServer } from 'mongodb-memory-server'

const mockMongo = await MongoMemoryServer.create()
const mockRepo = new FlowGuardRepository(mockMongo.getUri())
```

**A3 (CrUX + Wood Wide):**
- No MongoDB dependency - independent API clients
- Works with external APIs directly

**A4 (GitHub App):**
- No MongoDB dependency - independent webhook server
- Can use fixture data for testing

**B1 (Next.js Frontend):**
```typescript
// API routes use mock data initially
export async function GET() {
  // TODO: Replace with real MongoDB query
  const mockFlows = [
    { id: '1', name: 'Checkout Flow', lastRun: new Date(), status: 'passing' },
    { id: '2', name: 'Login Flow', lastRun: new Date(), status: 'failing' }
  ]
  return NextResponse.json({ flows: mockFlows })
}
```

**B2 (HTML Reports):**
```typescript
// Uses fixture test results
import fixtureResults from './fixtures/sample-test-results.json'

const report = await generateReport({
  flowRun: fixtureResults.checkoutFlow,
  historicalData: fixtureResults.history
})
```

**B3 (CLI Commands):**
```typescript
// Uses in-memory mock MongoDB (same as A2)
const mockMongo = await MongoMemoryServer.create()
```

**B4 (DO Spaces):**
- No MongoDB dependency - independent S3 client
- Works immediately

### Integration (Day 4)

1. **A1 finishes real MongoDB implementation**
2. **All agents replace mocks:**
   - A2: `MongoMemoryServer` → `process.env.MONGODB_URI`
   - B1: Mock API data → Real MongoDB queries
   - B3: `MongoMemoryServer` → `process.env.MONGODB_URI`

3. **No code changes needed** - just swap connection strings!

---

## Merge Strategy

### Phase 1: Foundation (Day 1-2)
```bash
# 1. A1 merges first (foundation)
git checkout main
git merge feat/mongodb-core-infrastructure

# 2. Independent modules merge
git merge feat/phoenix-experiments-evaluation
git merge feat/do-spaces-storage
git merge feat/crux-woodwide-analytics
git merge feat/github-app-webhooks
```

### Phase 2: Integration (Day 3)
```bash
# 3. Modules that depend on MongoDB
git merge feat/vision-cache-integration
git merge feat/cli-commands-mongodb
git merge feat/html-report-generator
```

### Conflict Resolution Protocol

**If conflicts occur:**
1. **Module boundaries** - Each agent owns different files
2. **Shared interfaces** - Use `src/types.ts` for shared types
3. **Import conflicts** - Use absolute imports (`import { ... } from './db/repository.js'`)

**Likely conflicts:**
- `package.json` - Merge dependencies manually
- `src/types.ts` - Combine type definitions
- `README.md` - Combine documentation

---

## Communication Protocol

### Daily Standups (15 min)
**Time:** 9 AM daily
**Format:**
- What I completed yesterday
- What I'm working on today
- Any blockers or dependencies

### Slack Channels
- `#flowguard-team-a` - Developer 1's 4 agents
- `#flowguard-team-b` - Developer 2's 4 agents
- `#flowguard-integration` - Cross-team coordination
- `#flowguard-blockers` - Urgent issues

### Pull Request Protocol
```
Title: [Agent X] Brief description
Labels: agent-a1, mongodb, critical-path

Body:
## Summary
What this PR does

## Testing
How to test

## Dependencies
Requires: #PR-123 (Agent A1)

## Integration Notes
How other agents can use this code
```

---

## Testing Strategy

### Unit Tests (Each Agent)
```bash
# Agent runs tests before PR
npm test src/db  # A1
npm test src/tracing  # A2
npm test src/cli  # A3
# etc.
```

### Integration Tests (Post-Merge)
```bash
# After all merges complete
npm run test:integration

# End-to-end test
npm run test:e2e
```

### Test Data Sharing
- **Shared fixtures:** `/tests/fixtures/`
- **Mock MongoDB:** Each agent uses in-memory MongoDB for tests
- **No shared state:** Tests must be independent

---

## Environment Setup (All Agents)

### Required API Keys
```bash
# Minimum for development
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# Optional (for specific agents)
DO_SPACES_KEY=...  # Agent B2
CRUX_API_KEY=...  # Agent B3
WOOD_WIDE_API_KEY=...  # Agent B3
GITHUB_APP_ID=...  # Agent B4
```

### Shared `.env.example`
Create once, all agents use:
```bash
# See plans/TECHNICAL_REQUIREMENTS.md for full list
```

---

## Success Criteria

### Individual Agent Success
- [ ] All unit tests pass (100% coverage target)
- [ ] TypeScript compiles with no errors
- [ ] Documentation complete (`README.md` in module)
- [ ] PR approved by at least 1 other developer
- [ ] No dependencies on unmerged code

### Integration Success
- [ ] All 8 branches merged to `main`
- [ ] Full test suite passes
- [ ] End-to-end flow works (GitHub PR → Test → Report)
- [ ] No merge conflicts remain
- [ ] Ready for NexHacks demo

---

## Timeline

| Day | Team A | Team B | Integration |
|-----|--------|--------|-------------|
| **1** | A1, A2 start | B2, B3, B4 start | Daily sync |
| **2** | A3, A4 start (depend on A1) | B1 starts (depends on A1) | A1 merges first |
| **3** | Testing & PR reviews | Testing & PR reviews | Merge wave 1 |
| **4** | Integration testing | Integration testing | Merge wave 2 |
| **5** | Demo prep | Documentation | Final integration tests |

---

## Agent-Specific Quick Start

### For Agent A1 (MongoDB Core)
```bash
git checkout -b feat/mongodb-core-infrastructure
npm install mongodb
# See plans/parallel/AGENT-1-mongodb-core.md for full spec
```

### For Agent A2 (Phoenix)
```bash
git checkout -b feat/phoenix-experiments-evaluation
docker run -p 6006:6006 arizephoenix/phoenix:latest
# Install Python dependencies
pip install arize-phoenix anthropic
```

### For Agent A3 (CLI)
```bash
git checkout -b feat/cli-commands-mongodb
# Wait for A1 to merge first
# See detailed spec (create next)
```

### For Agent A4 (Reports)
```bash
git checkout -b feat/html-report-generator
# Wait for A1 to merge first
```

### For Agent B1 (Vision Cache)
```bash
git checkout -b feat/vision-cache-integration
# Wait for A1 to merge first
```

### For Agent B2 (DO Spaces)
```bash
git checkout -b feat/do-spaces-storage
npm install @aws-sdk/client-s3
# Get DO Spaces keys
```

### For Agent B3 (Analytics)
```bash
git checkout -b feat/crux-woodwide-analytics
# Get CrUX API key, request Wood Wide access
```

### For Agent B4 (GitHub App)
```bash
git checkout -b feat/github-app-webhooks
npm install @octokit/rest @octokit/auth-app
# Create GitHub App
```

---

## Next Steps

1. ✅ Review this parallel execution plan
2. ✅ Assign agents to developers
3. ✅ Set up DevSwarm.ai workspace
4. ✅ Create all 8 branches
5. 🚀 Day 1: Start independent agents (A1, A2, B2, B3, B4)
6. 🚀 Day 2: Start dependent agents (A3, A4, B1) after A1 merges
7. 🚀 Day 3-4: Integration and testing
8. 🚀 Day 5: NexHacks demo ready

**Detailed specs for each agent available in:**
- `plans/parallel/AGENT-1-mongodb-core.md` ✅ Created
- `plans/parallel/AGENT-2-phoenix-experiments.md` (create next)
- ... (7 more to create)

Would you like me to generate all 8 detailed specs now, or start with these and iterate?
