# DevSwarm Instructions for JIBRIL (Team A)

**Your Mission:** Run 4 AI agents in parallel on DevSwarm.ai to build FlowGuard's backend infrastructure

---

## Your 4 Agents

| Agent | AI Tool | Branch | Module | Priority |
|-------|---------|--------|--------|----------|
| **A1** | Claude Code Max | `feat/mongodb-core` | MongoDB + Interface Contracts | 🔴 CRITICAL - Start First! |
| **A2** | Claude Code Max | `feat/vision-phoenix` | Vision Cache + Phoenix | Start after A1 commits types |
| **A3** | Gemini | `feat/crux-woodwide` | CrUX + Wood Wide Analytics | Start anytime |
| **A4** | Amp | `feat/github-app-webhooks` | GitHub App + Webhooks | Start anytime |

---

## Phase 1: Setup (Before You Start)

### 1. Get API Keys Ready

Create a file: `.env.jibril` with:

```bash
# Required for all agents
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...

# For A2 (Phoenix)
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces

# For A3 (CrUX + Wood Wide)
CRUX_API_KEY=<google-api-key>
WOOD_WIDE_API_KEY=<wood-wide-key>

# For A4 (GitHub)
GITHUB_APP_ID=<app-id>
GITHUB_PRIVATE_KEY_PATH=./github-app-private-key.pem
GITHUB_WEBHOOK_SECRET=<webhook-secret>
```

### 2. Start Phoenix (Docker)

```bash
docker run -d -p 6006:6006 arizephoenix/phoenix:latest
```

### 3. Clone Repo

```bash
cd ~/Desktop/Coding
git clone <your-repo-url> NexHacks-DevSwarm
cd NexHacks-DevSwarm
```

---

## Phase 2: Agent A1 (MongoDB Core) - START FIRST! 🔴

**AI:** Claude Code Max (50% budget)
**Branch:** `feat/mongodb-core`
**Spec:** `plans/parallel/AGENT-A1-mongodb-core.md`

### DevSwarm Setup

1. **Create New Agent in DevSwarm:**
   - Name: `FlowGuard-A1-MongoDB`
   - AI: Claude Code Max
   - Branch: `feat/mongodb-core`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-A1-mongodb-core.md`
   - Upload `plans/TECHNICAL_REQUIREMENTS.md`
   - Upload `plans/AGENT_ASSIGNMENTS.md`

3. **Initial Prompt:**

```
You are Agent A1 building MongoDB Core Infrastructure for FlowGuard.

CRITICAL FIRST TASK (Hour 1):
Create src/db/types.ts with ALL interface contracts and commit immediately so other agents can use them.

Read the spec at plans/parallel/AGENT-A1-mongodb-core.md

Steps:
1. Create src/db/types.ts with FlowGuardRepository interface and all type definitions
2. Git commit and push this file IMMEDIATELY
3. Then implement the full MongoDB client, schemas, repository, and tests

Use the exact interfaces from the spec. Other agents are waiting for this!
```

4. **Monitor Progress:**
   - ✅ Hour 1: Interface contracts committed
   - ✅ Day 1-2: MongoDB connection implemented
   - ✅ Day 3: Tests passing, documentation complete
   - ✅ Day 4: Ready to merge

---

## Phase 3: Agent A2 (Vision + Phoenix) - START AFTER A1 COMMITS

**AI:** Claude Code Max (50% budget)
**Branch:** `feat/vision-phoenix`
**Spec:** `plans/parallel/AGENT-A2-vision-phoenix.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-A2-Vision-Phoenix`
   - AI: Claude Code Max
   - Branch: `feat/vision-phoenix`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-A2-vision-phoenix.md`
   - Upload `src/db/types.ts` (from A1's commit)

3. **Initial Prompt:**

```
You are Agent A2 building Vision Cache + Phoenix Experiments for FlowGuard.

Read the spec at plans/parallel/AGENT-A2-vision-phoenix.md

IMPORTANT: Use MongoMemoryServer for Day 1-3 development:
- Install: npm install mongodb-memory-server
- Create in-memory MongoDB for testing
- Day 4: We'll swap to real MongoDB (one line change)

Build:
1. Vision caching with SHA-256 hashing (src/vision/cache.ts)
2. Phoenix experiment framework (src/tracing/phoenix-eval.ts)
3. Python benchmark dataset script (scripts/create_benchmark_dataset.py)
4. A/B testing utilities
5. Full test coverage

Target: 80% cache hit rate + 85% accuracy on benchmarks
```

4. **Monitor Progress:**
   - ✅ Day 1: Vision cache with MongoMemoryServer working
   - ✅ Day 2: Phoenix experiments running
   - ✅ Day 3: Python scripts complete, >85% accuracy
   - ✅ Day 4: Swap to real MongoDB, tests passing

---

## Phase 4: Agent A3 (CrUX + Wood Wide) - START ANYTIME

**AI:** Gemini (Free)
**Branch:** `feat/crux-woodwide`
**Spec:** `plans/parallel/AGENT-A3-crux-woodwide.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-A3-Analytics`
   - AI: Gemini
   - Branch: `feat/crux-woodwide`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-A3-crux-woodwide.md`

3. **Initial Prompt:**

```
You are Agent A3 building CrUX + Wood Wide Analytics for FlowGuard.

Read the spec at plans/parallel/AGENT-A3-crux-woodwide.md

This module is INDEPENDENT - no MongoDB dependency.

Build:
1. CrUX API client (src/metrics/crux.ts) to fetch Chrome User Experience metrics
2. Wood Wide AI client (src/metrics/woodwide.ts) for statistical analysis
3. Mock data generators for demos
4. Graceful fallbacks when APIs unavailable

You'll integrate with external APIs directly. Follow the spec exactly!
```

4. **Monitor Progress:**
   - ✅ Day 1: CrUX client working
   - ✅ Day 2: Wood Wide integration complete
   - ✅ Day 3: Mock data + fallbacks working
   - ✅ Tests passing

---

## Phase 5: Agent A4 (GitHub App) - START ANYTIME

**AI:** Amp (Free)
**Branch:** `feat/github-app-webhooks`
**Spec:** `plans/parallel/AGENT-A4-github-app.md`

### DevSwarm Setup

1. **Create New Agent:**
   - Name: `FlowGuard-A4-GitHub`
   - AI: Amp
   - Branch: `feat/github-app-webhooks`

2. **Upload Context:**
   - Upload `plans/parallel/AGENT-A4-github-app.md`

3. **Initial Prompt:**

```
You are Agent A4 building GitHub App + Webhooks for FlowGuard.

Read the spec at plans/parallel/AGENT-A4-github-app.md

This module is INDEPENDENT - webhook server only.

Build:
1. GitHub App authentication (src/github/app.ts)
2. Webhook verification + handler (src/github/webhook-handler.ts)
3. Express server (src/github/server.ts)
4. PR comment generator (src/github/comment-generator.ts)
5. GitHub Actions workflow (.github/workflows/flowguard.yml)

Install: npm install @octokit/rest @octokit/auth-app express

Follow the spec exactly!
```

4. **Monitor Progress:**
   - ✅ Day 1: Webhook server running
   - ✅ Day 2: PR comments working
   - ✅ Day 3: Check runs created
   - ✅ GitHub Actions workflow complete

---

## DevSwarm Tips

### Running Multiple Agents

1. **Open 4 browser tabs** (one per agent)
2. **Name them clearly:** A1-MongoDB, A2-Vision, A3-Analytics, A4-GitHub
3. **Start A1 first**, wait for types commit
4. **Start A2-A4 in parallel** after A1 commits

### Managing Progress

**Check commits:**
```bash
# See what each agent has committed
git fetch --all
git log --oneline --graph --all
```

**Daily standup (9 AM):**
- Open all 4 DevSwarm tabs
- Ask each agent: "What's your status? What's blocking you?"
- Share updates with Christ (your partner)

### Cost Management

**Claude Code Max (A1 + A2):**
- You have 50% total budget split between 2 agents
- Monitor usage in DevSwarm
- If running low, prioritize A1 (critical path)

**Gemini + Amp (A3 + A4):**
- Free tiers - use liberally
- Good for independent modules

---

## Integration Checklist (Day 4)

### Morning: Replace Mocks

**A2 only** (A3, A4 have no mocks):
```typescript
// In src/vision/cache.ts and src/tracing/phoenix-eval.ts
// Find:
const mockMongo = await MongoMemoryServer.create()
const repository = new FlowGuardRepository(mockMongo.getUri())

// Replace with:
const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
```

### Afternoon: Merge Branches

```bash
git checkout main
git pull

# Merge in order:
git merge feat/mongodb-core
git merge feat/vision-phoenix
git merge feat/crux-woodwide
git merge feat/github-app-webhooks

# Resolve conflicts
git push
```

### Evening: Test Integration

```bash
npm test
npm run test:integration
npm run build

# Test end-to-end flow:
flowguard run checkout-flow
flowguard trends checkout-flow
```

---

## Success Metrics

**End of Day 1:**
- [ ] A1 committed interface contracts (Hour 1)
- [ ] All 4 branches created
- [ ] All agents have basic structure

**End of Day 3:**
- [ ] A1: MongoDB fully implemented
- [ ] A2: Vision cache + Phoenix experiments working
- [ ] A3: CrUX + Wood Wide clients complete
- [ ] A4: GitHub webhooks functional

**Day 4:**
- [ ] All mocks replaced with real implementations
- [ ] All branches merged to main
- [ ] Integration tests passing

**Day 5:**
- [ ] Demo ready
- [ ] NexHacks presentation polished! 🏆

---

## Emergency Contacts

**If blocked:**
1. Check `plans/AGENT_ASSIGNMENTS.md`
2. Ask agent: "What's blocking you? How can we unblock?"
3. Coordinate with Christ if needed
4. Worst case: Skip non-critical features, focus on core

**Partner (Christ):**
- Share A1's interface contracts commit ASAP
- Daily sync at 9 AM
- Share any blockers immediately

---

## Quick Command Reference

```bash
# Start all agents (open 4 DevSwarm tabs)
A1: Claude Code Max → feat/mongodb-core
A2: Claude Code Max → feat/vision-phoenix
A3: Gemini → feat/crux-woodwide
A4: Amp → feat/github-app-webhooks

# Monitor progress
git fetch --all
git log --oneline --graph --all

# Day 4 integration
git checkout main
git merge feat/mongodb-core
git merge feat/vision-phoenix
git merge feat/crux-woodwide
git merge feat/github-app-webhooks

# Test everything
npm test
npm run build
```

---

**You've got this! 🚀 Let's build FlowGuard!**
