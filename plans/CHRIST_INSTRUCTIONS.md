# DevSwarm Instructions for CHRIST (Team B)

**Your Mission:** Run 4 AI agents in parallel on DevSwarm.ai to build FlowGuard's frontend and user-facing features

---

## Your 4 Agents

| Agent | AI Tool | Branch | Module | Priority |
|-------|---------|--------|--------|----------|
| **B1** | Cursor Pro | `feat/nextjs-saas-frontend` | Next.js SaaS App | 🎨 Main Customer Interface |
| **B2** | Cursor Pro | `feat/html-reports` | HTML Report Generator | Beautiful reports |
| **B3** | Gemini | `feat/cli-commands` | CLI Commands | Developer interface |
| **B4** | Amp | `feat/do-spaces-storage` | DO Spaces Storage | Start anytime |

---

## Phase 1: Setup (Before You Start)

### 1. Get API Keys Ready

Create a file: `.env.christ` with:

```bash
# Required
MONGODB_URI=mongodb+srv://...
ANTHROPIC_API_KEY=sk-ant-...

# For B1 (Next.js Frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For B4 (DO Spaces)
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=<access-key>
DO_SPACES_SECRET=<secret-key>
DO_SPACES_BUCKET=flowguard-artifacts
DO_SPACES_CDN_ENDPOINT=https://flowguard-artifacts.nyc3.cdn.digitaloceanspaces.com
```

### 2. Clone Repo

```bash
cd ~/Desktop/Coding
git clone <your-repo-url> NexHacks-DevSwarm
cd NexHacks-DevSwarm
```

### 3. Wait for Jibril's A1 Commit (Hour 1)

**IMPORTANT:** Before starting B1 and B3, wait for Jibril to commit `src/db/types.ts`

You'll get a message: "✅ Interface contracts ready!"

Then pull:
```bash
git pull origin main
```

---

## Phase 2: Agent B1 (Next.js SaaS Frontend) - MAIN DELIVERABLE 🎨

**AI:** Cursor Pro
**Branch:** `feat/nextjs-saas-frontend`
**Spec:** `plans/parallel/AGENT-B1-nextjs-saas-frontend.md`

### DevSwarm Setup

1. **Create New Agent in DevSwarm:**
   - Name: `FlowGuard-B1-Frontend`
   - AI: Cursor Pro
   - Branch: `feat/nextjs-saas-frontend`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-B1-nextjs-saas-frontend.md`
   - Upload `src/db/types.ts` (from Jibril's A1)

3. **Initial Prompt:**

```
You are Agent B1 building the Next.js SaaS Frontend for FlowGuard.

Read the spec at plans/parallel/AGENT-B1-nextjs-saas-frontend.md

This is the MAIN CUSTOMER INTERFACE - make it stunning!

Build a production-grade Next.js 15 app with:

Directory: apps/web/

Pages:
- Landing page (hero, features, pricing)
- Dashboard (stats cards, charts, activity feed)
- Flows page (list, create, edit, run)
- Reports page (view test results, screenshots)
- Analytics (success rate charts, cost analytics)
- Settings (profile, team, billing, API keys)

Tech Stack:
- Next.js 15 + App Router
- TailwindCSS + shadcn/ui
- Framer Motion (animations)
- Clerk (authentication)
- API routes with MOCK DATA initially

IMPORTANT: Use mock data in API routes for Day 1-3:
```typescript
export async function GET() {
  const mockFlows = [
    { id: '1', name: 'Checkout Flow', status: 'passing' },
    { id: '2', name: 'Login Flow', status: 'failing' }
  ]
  return NextResponse.json({ flows: mockFlows })
}
```

Day 4: We'll replace with real MongoDB queries.

Make it BEAUTIFUL, RESPONSIVE, and PRODUCTION-READY!
```

4. **Monitor Progress:**
   - ✅ Day 1: Landing page + dashboard shell
   - ✅ Day 2: All pages with mock data
   - ✅ Day 3: Authentication + polish
   - ✅ Day 4: Real MongoDB integration
   - ✅ Lighthouse score >90!

---

## Phase 3: Agent B2 (HTML Reports) - START ANYTIME

**AI:** Cursor Pro
**Branch:** `feat/html-reports`
**Spec:** `plans/parallel/AGENT-B2-html-reports.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-B2-Reports`
   - AI: Cursor Pro
   - Branch: `feat/html-reports`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-B2-html-reports.md`

3. **Initial Prompt:**

```
You are Agent B2 building the HTML Report Generator for FlowGuard.

Read the spec at plans/parallel/AGENT-B2-html-reports.md

Build beautiful standalone HTML reports (NOT Next.js):
- Embedded CSS (modern, responsive)
- Embedded JavaScript (interactive)
- <100KB total file size
- Print-friendly
- Dark mode support

Use FIXTURE DATA for Day 1-3:
```typescript
// Create fixtures/sample-test-results.json
const fixtureResults = {
  flowRun: {
    flowName: 'Checkout Flow',
    passed: true,
    totalSteps: 5,
    passedSteps: 5,
    duration: 3200
  },
  history: [/* 30 days of results */]
}

const report = await generateReport({
  flowRun: fixtureResults.flowRun,
  historicalData: fixtureResults.history
})
```

Day 4: Replace with real MongoDB queries.

Make it STUNNING - this is what judges will see!
```

4. **Monitor Progress:**
   - ✅ Day 1: Base template + styles
   - ✅ Day 2: Charts + interactivity
   - ✅ Day 3: CrUX integration + polish
   - ✅ Day 4: Real data integration

---

## Phase 4: Agent B3 (CLI Commands) - WAIT FOR A1 TYPES

**AI:** Gemini (Free)
**Branch:** `feat/cli-commands`
**Spec:** `plans/parallel/AGENT-B3-cli-commands.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-B3-CLI`
   - AI: Gemini
   - Branch: `feat/cli-commands`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-B3-cli-commands.md`
   - Upload `src/db/types.ts` (from Jibril's A1)

3. **Initial Prompt:**

```
You are Agent B3 building CLI Commands for FlowGuard.

Read the spec at plans/parallel/AGENT-B3-cli-commands.md

Build CLI commands: trends, search, costs

IMPORTANT: Use MongoMemoryServer for Day 1-3:
```bash
npm install mongodb-memory-server
```

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server'

const mockMongo = await MongoMemoryServer.create()
const repository = new FlowGuardRepository(mockMongo.getUri())

// Seed with sample data for testing
await seedSampleFlows(repository)
```

Day 4: Swap to real MongoDB (one line change).

Commands:
- flowguard trends <flow> --days 30 --format json
- flowguard search <query> --limit 10
- flowguard costs --start 7d --group-by day

All must support --format json for agent-native output!
```

4. **Monitor Progress:**
   - ✅ Day 1: CLI structure + MongoMemoryServer
   - ✅ Day 2: All commands with mock data
   - ✅ Day 3: Tests passing, JSON output working
   - ✅ Day 4: Real MongoDB integration

---

## Phase 5: Agent B4 (DO Spaces) - START ANYTIME

**AI:** Amp (Free)
**Branch:** `feat/do-spaces-storage`
**Spec:** `plans/parallel/AGENT-B4-do-spaces.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-B4-Storage`
   - AI: Amp
   - Branch: `feat/do-spaces-storage`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-B4-do-spaces.md`

3. **Initial Prompt:**

```
You are Agent B4 building DigitalOcean Spaces Storage for FlowGuard.

Read the spec at plans/parallel/AGENT-B4-do-spaces.md

This module is INDEPENDENT - S3-compatible storage only.

Build:
1. Spaces client (src/storage/spaces.ts) using AWS SDK
2. Upload utilities (screenshots, reports)
3. Signed URL generation
4. Cleanup automation
5. Droplet setup script (scripts/setup-droplet.sh)

Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

This is for the DigitalOcean $500 sponsor prize - make it cloud-native!
```

4. **Monitor Progress:**
   - ✅ Day 1: Spaces client working
   - ✅ Day 2: Upload + CDN URLs
   - ✅ Day 3: Cleanup + droplet script
   - ✅ Tests with mock S3 passing

---

## DevSwarm Tips

### Running Multiple Agents

1. **Open 4 browser tabs** (one per agent)
2. **Name them clearly:** B1-Frontend, B2-Reports, B3-CLI, B4-Storage
3. **Start B1 first** (main deliverable)
4. **Start B2, B4 anytime**
5. **Start B3 after** Jibril commits A1 types

### Managing Progress

**Check commits:**
```bash
git fetch --all
git log --oneline --graph --all
```

**Daily standup (9 AM):**
- Open all 4 DevSwarm tabs
- Ask each agent: "What's your status? What's blocking you?"
- Share updates with Jibril

### Cost Management

**Cursor Pro (B1 + B2):**
- Use generously for frontend excellence
- Focus on B1 (main customer interface)
- B2 is static HTML, should be fast

**Gemini + Amp (B3 + B4):**
- Free tiers - use liberally

---

## Integration Checklist (Day 4)

### Morning: Replace Mocks

**B1 (Next.js):**
```typescript
// In apps/web/src/app/api/flows/route.ts
// Remove:
const mockFlows = [...]

// Add:
import { FlowGuardRepository } from '@/lib/mongodb'
const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
const flows = await repository.getFlowsByUser(userId)
```

**B2 (HTML Reports):**
```typescript
// In src/report/generator.ts
// Remove:
import fixtureResults from './fixtures/sample-test-results.json'

// Add:
const flowRun = await repository.getTestResult(id)
const history = await repository.getRecentResults(flowName, 30)
```

**B3 (CLI):**
```typescript
// In src/commands/trends.ts
// Remove:
const mockMongo = await MongoMemoryServer.create()
const repository = new FlowGuardRepository(mockMongo.getUri())

// Add:
const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
```

**B4 (DO Spaces):**
- No changes needed - already using real S3!

### Afternoon: Merge Branches

```bash
git checkout main
git pull

# Merge in order (after Jibril merges A1-A4):
git merge feat/nextjs-saas-frontend
git merge feat/html-reports
git merge feat/cli-commands
git merge feat/do-spaces-storage

# Resolve conflicts
git push
```

### Evening: Test Integration

```bash
# Test Next.js app
cd apps/web
npm run dev
# Open http://localhost:3000

# Test CLI
flowguard trends checkout-flow
flowguard search "login"
flowguard costs --start 7d

# Test reports
node scripts/generate-test-report.js

# Test uploads
node scripts/test-spaces-upload.js
```

---

## Success Metrics

**End of Day 1:**
- [ ] B1 has landing page + dashboard shell
- [ ] All 4 branches created
- [ ] Basic structure in place

**End of Day 3:**
- [ ] B1: Full Next.js app with mock data, beautiful UI
- [ ] B2: HTML reports generator complete
- [ ] B3: All CLI commands working with MongoMemoryServer
- [ ] B4: DO Spaces client functional

**Day 4:**
- [ ] All mocks replaced with real MongoDB
- [ ] All branches merged to main
- [ ] Next.js app deployed
- [ ] End-to-end flow works

**Day 5:**
- [ ] Next.js app is STUNNING (Lighthouse >90)
- [ ] Demo ready
- [ ] Judges are impressed! 🏆

---

## Emergency Contacts

**If blocked:**
1. Check `plans/AGENT_ASSIGNMENTS.md`
2. Ask agent: "What's blocking you? How can we unblock?"
3. Coordinate with Jibril if needed
4. Focus on B1 (most important)

**Partner (Jibril):**
- Wait for his A1 types commit (Hour 1)
- Daily sync at 9 AM
- Share frontend progress for motivation!

---

## Quick Command Reference

```bash
# Start all agents (open 4 DevSwarm tabs)
B1: Cursor Pro → feat/nextjs-saas-frontend
B2: Cursor Pro → feat/html-reports
B3: Gemini → feat/cli-commands
B4: Amp → feat/do-spaces-storage

# Monitor progress
git fetch --all
git log --oneline --graph --all

# Day 4 integration
git checkout main
git merge feat/nextjs-saas-frontend
git merge feat/html-reports
git merge feat/cli-commands
git merge feat/do-spaces-storage

# Test Next.js app
cd apps/web && npm run dev

# Deploy to Vercel
vercel deploy --prod
```

---

## Special Focus: B1 (Next.js Frontend)

This is **THE MAIN DELIVERABLE** judges will see!

### Must-Have Features:
- ✅ Beautiful landing page (hero, features, pricing)
- ✅ Functional dashboard (stats, charts, activity)
- ✅ Flow management (list, create, run)
- ✅ Report viewing (results, screenshots, trends)
- ✅ Authentication working (Clerk)
- ✅ Fully responsive (mobile → desktop)
- ✅ Dark mode support
- ✅ Smooth animations
- ✅ Loading states everywhere
- ✅ Error handling with toasts

### Polish Checklist:
- [ ] Lighthouse score >90 (all categories)
- [ ] No console errors
- [ ] Fast page loads (<2s)
- [ ] Beautiful gradients
- [ ] Consistent spacing
- [ ] Professional typography
- [ ] Hover states on buttons
- [ ] Accessible (WCAG AA)

**Make it STUNNING! This wins prizes! 🎨**

---

**You've got this! Let's build an amazing frontend! 🚀**
