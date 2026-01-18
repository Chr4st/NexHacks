# FlowGuard AI - Agent Assignments (Parallel Execution)

**All 8 agents start Day 1 simultaneously using contract-based development!**

---

## Team A - Developer 1 (YOU)

### A1: MongoDB Core Infrastructure
- **AI Tool:** Claude Code Max
- **Branch:** `feat/mongodb-core`
- **Module:** Database layer + Interface contracts
- **Files:** `src/db/types.ts`, `src/db/client.ts`, `src/db/repository.ts`, `src/db/schemas.ts`
- **Priority:** Create and commit `types.ts` in Hour 1 so all other agents can use it
- **Strategy:** Export interfaces first, implement MongoDB connection after
- **Can Start:** ✅ Day 1 Hour 1

**Key Task:**
```bash
# Hour 1 - CRITICAL: Commit interface contracts immediately
git checkout -b feat/mongodb-core
# Create src/db/types.ts with ALL interfaces
git add src/db/types.ts
git commit -m "Add MongoDB interface contracts for parallel dev"
git push

# Rest of Day 1-3: Implement actual MongoDB connection
```

---

### A2: Vision Cache + Phoenix Experiments
- **AI Tool:** Claude Code Max
- **Branch:** `feat/vision-phoenix`
- **Module:** Vision analysis with caching + Phoenix A/B testing
- **Files:** `src/vision/`, `src/tracing/`, `scripts/*.py`
- **Strategy:** Uses **MongoMemoryServer** (in-memory MongoDB) for development
- **Can Start:** ✅ Day 1 (uses mocked MongoDB)

**Development Approach:**
```typescript
// Day 1-3: Use in-memory MongoDB
import { MongoMemoryServer } from 'mongodb-memory-server'
const mockMongo = await MongoMemoryServer.create()
const repository = new FlowGuardRepository(mockMongo.getUri())

// Day 4: Switch to real MongoDB (one line change!)
const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
```

**Spec:** `plans/parallel/AGENT-A2-vision-phoenix.md` (need to create by merging A2 + B1 from old)

---

### A3: CrUX + Wood Wide Analytics
- **AI Tool:** Gemini (Free)
- **Branch:** `feat/crux-woodwide`
- **Module:** Chrome UX Report + Wood Wide AI statistical analysis
- **Files:** `src/metrics/crux.ts`, `src/metrics/woodwide.ts`
- **Strategy:** Independent - no MongoDB dependency
- **Can Start:** ✅ Day 1 (completely independent)

**Development Approach:**
```typescript
// Works directly with external APIs
const cruxClient = new CruxClient(process.env.CRUX_API_KEY!)
const metrics = await cruxClient.getMetrics('https://example.com')

// No MongoDB needed - returns data directly
```

**Spec:** `plans/parallel/AGENT-7-crux-woodwide.md` → Rename to `AGENT-A3-crux-woodwide.md`

---

### A4: GitHub App + Webhooks
- **AI Tool:** Amp (Free)
- **Branch:** `feat/github-app-webhooks`
- **Module:** GitHub integration, PR comments, check runs
- **Files:** `src/github/`, `.github/workflows/flowguard.yml`
- **Strategy:** Independent webhook server
- **Can Start:** ✅ Day 1 (completely independent)

**Development Approach:**
```typescript
// Independent Express server receiving webhooks
const app = express()
app.post('/webhooks/github', async (req, res) => {
  // Verify signature, handle PR events
  // Can use fixture data for test results initially
})
```

**Spec:** `plans/parallel/AGENT-8-github-app.md` → Rename to `AGENT-A4-github-app.md`

---

## Team B - Developer 2 (PARTNER)

### B1: Next.js SaaS Frontend
- **AI Tool:** Cursor Pro
- **Branch:** `feat/nextjs-saas-frontend`
- **Module:** Production Next.js app (dashboard, flows, reports, settings)
- **Files:** `apps/web/` (entire Next.js application)
- **Strategy:** Uses API contracts with mock data initially
- **Can Start:** ✅ Day 1 (uses fixture data)

**Development Approach:**
```typescript
// Day 1-3: API routes return mock data
export async function GET() {
  const mockFlows = [
    { id: '1', name: 'Checkout Flow', status: 'passing' },
    { id: '2', name: 'Login Flow', status: 'failing' }
  ]
  return NextResponse.json({ flows: mockFlows })
}

// Day 4: Replace with real MongoDB queries
const flows = await repository.getFlowsByUser(userId)
return NextResponse.json({ flows })
```

**Spec:** `plans/parallel/AGENT-B1-nextjs-saas-frontend.md` ✅ Already created!

---

### B2: HTML Report Generator
- **AI Tool:** Cursor Pro
- **Branch:** `feat/html-reports`
- **Module:** Beautiful standalone HTML reports
- **Files:** `src/report/`, `src/report/templates/`
- **Strategy:** Works with fixture test results
- **Can Start:** ✅ Day 1 (uses sample data)

**Development Approach:**
```typescript
// Day 1-3: Use fixture data
import sampleResults from './fixtures/checkout-flow-results.json'

const report = await generateReport({
  flowRun: sampleResults.flowRun,
  historicalData: sampleResults.history,
  cruxMetrics: sampleResults.crux
})

// Day 4: Use real data from MongoDB
const flowRun = await repository.getTestResult(id)
const history = await repository.getRecentResults(flowName, 30)
```

**Spec:** `plans/parallel/AGENT-4-html-reports.md` → Rename to `AGENT-B2-html-reports.md`

---

### B3: CLI Commands Enhancement
- **AI Tool:** Gemini (Free)
- **Branch:** `feat/cli-commands`
- **Module:** CLI with analytics commands (trends, search, costs)
- **Files:** `src/cli.ts`, `src/commands/`
- **Strategy:** Uses **MongoMemoryServer** (in-memory MongoDB)
- **Can Start:** ✅ Day 1 (uses mocked MongoDB)

**Development Approach:**
```typescript
// Day 1-3: Use in-memory MongoDB with seeded data
import { MongoMemoryServer } from 'mongodb-memory-server'
const mockMongo = await MongoMemoryServer.create()
const repository = new FlowGuardRepository(mockMongo.getUri())

// Seed with sample data for testing
await seedSampleFlows(repository)

// Day 4: Switch to real MongoDB
const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
```

**Spec:** `plans/parallel/AGENT-3-cli-commands.md` → Rename to `AGENT-B3-cli-commands.md`

---

### B4: DigitalOcean Spaces Storage
- **AI Tool:** Amp (Free)
- **Branch:** `feat/do-spaces-storage`
- **Module:** S3-compatible cloud storage for screenshots/reports
- **Files:** `src/storage/`, `scripts/setup-droplet.sh`
- **Strategy:** Independent S3 client
- **Can Start:** ✅ Day 1 (completely independent)

**Development Approach:**
```typescript
// Works directly with DO Spaces API
const storage = new SpacesStorage({
  region: process.env.DO_SPACES_REGION!,
  accessKeyId: process.env.DO_SPACES_KEY!,
  secretAccessKey: process.env.DO_SPACES_SECRET!,
  bucket: process.env.DO_SPACES_BUCKET!
})

// Upload immediately - no dependencies
const url = await storage.uploadScreenshot('./screenshot.png', 'checkout-flow', 1)
```

**Spec:** `plans/parallel/AGENT-6-do-spaces.md` → Rename to `AGENT-B4-do-spaces.md`

---

## Day 1 Kickoff (Hour by Hour)

### Hour 1 (CRITICAL - Setup Phase)
**Everyone:**
1. Git pull latest main
2. Create your feature branch

**Agent A1 (Claude Code Max) - PRIORITY:**
1. Create `src/db/types.ts` with ALL interface contracts
2. Commit and push immediately
3. Notify team: "Interface contracts ready!"

**All Other Agents:**
1. Wait for A1's commit
2. Pull the interface contracts
3. Start implementing with mocks/fixtures

---

### Hours 2-24 (Day 1)
**All 8 agents work in parallel:**
- A1: Implements MongoDB connection and repository
- A2: Builds vision cache + Phoenix with MongoMemoryServer
- A3: Builds CrUX + Wood Wide clients
- A4: Builds GitHub webhook server
- B1: Builds Next.js frontend with mock API data
- B2: Builds HTML reports with fixture data
- B3: Builds CLI commands with MongoMemoryServer
- B4: Builds DO Spaces storage client

---

### Day 2-3 (Continue Parallel)
**Everyone completes their modules:**
- All agents working simultaneously
- Using mocks/fixtures
- No waiting for dependencies
- Daily sync at 9 AM

---

### Day 4 (Integration)
**Morning: Replace mocks with real implementations**
```bash
# A2, B3 (MongoMemoryServer users):
# Change one line:
- const repo = new FlowGuardRepository(mockMongo.getUri())
+ const repo = new FlowGuardRepository(process.env.MONGODB_URI!)

# B1 (Next.js):
# Replace mock data in API routes with real MongoDB queries

# B2 (HTML Reports):
# Replace fixture imports with real repository calls
```

**Afternoon: Merge all branches**
```bash
git checkout main
git merge feat/mongodb-core
git merge feat/vision-phoenix
git merge feat/crux-woodwide
git merge feat/github-app-webhooks
git merge feat/nextjs-saas-frontend
git merge feat/html-reports
git merge feat/cli-commands
git merge feat/do-spaces-storage
```

**Evening: Integration testing**

---

### Day 5 (Demo Day)
- Polish UI
- Prepare demo script
- Test end-to-end flow
- NexHacks presentation! 🏆

---

## Quick Reference: Who Runs What

| Agent | You/Partner | AI Tool | Module | Spec File |
|-------|-------------|---------|--------|-----------|
| A1 | **YOU** | Claude Code Max | MongoDB + Contracts | AGENT-1-mongodb-core.md |
| A2 | **YOU** | Claude Code Max | Vision + Phoenix | AGENT-A2-vision-phoenix.md (create) |
| A3 | **YOU** | Gemini | CrUX + Wood Wide | AGENT-A3-crux-woodwide.md |
| A4 | **YOU** | Amp | GitHub App | AGENT-A4-github-app.md |
| B1 | **PARTNER** | Cursor Pro | Next.js Frontend | AGENT-B1-nextjs-saas-frontend.md ✅ |
| B2 | **PARTNER** | Cursor Pro | HTML Reports | AGENT-B2-html-reports.md |
| B3 | **PARTNER** | Gemini | CLI Commands | AGENT-B3-cli-commands.md |
| B4 | **PARTNER** | Amp | DO Spaces | AGENT-B4-do-spaces.md |

---

## Dependencies Needed

```bash
# All agents (add to root package.json):
npm install mongodb mongodb-memory-server @types/node

# A2: Vision + Phoenix
pip install arize-phoenix anthropic

# A3: CrUX + Wood Wide
npm install axios

# A4: GitHub App
npm install @octokit/rest @octokit/auth-app express

# B1: Next.js Frontend
cd apps/web
npm install next react react-dom @clerk/nextjs
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install tailwindcss framer-motion lucide-react

# B2: HTML Reports
# (no new dependencies - uses built-in Node.js)

# B3: CLI Commands
npm install commander chalk cli-table3

# B4: DO Spaces
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Success Metrics

**End of Day 1:**
- [ ] A1 has committed interface contracts
- [ ] All 8 agents have their branches created
- [ ] All agents have basic structure in place

**End of Day 3:**
- [ ] All agents have completed their modules
- [ ] Tests passing with mocks/fixtures
- [ ] Ready for integration

**End of Day 4:**
- [ ] All branches merged
- [ ] Integration tests passing
- [ ] End-to-end flow works

**Day 5:**
- [ ] Demo ready
- [ ] NexHacks presentation polished
- [ ] $3,500+ in prizes won! 🏆

---

**Questions? Check:** `plans/PARALLEL_EXECUTION_PLAN.md`
