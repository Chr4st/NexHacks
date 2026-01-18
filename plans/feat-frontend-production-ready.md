# Frontend Production-Ready Plan

## Overview

Transform the FlowGuard frontend from demo state to production-ready by:
1. Connecting all UI components to real MongoDB data
2. Implementing AI cost tracking and display
3. Building a complete API key management system
4. Adding webhook configuration for branch-specific events
5. Exposing Browserbase/Datadog integration settings
6. Modernizing the UI with animations and polish

---

## Phase 1: Real Data Connection (Priority: Critical)

### 1.1 Replace Hardcoded Dashboard Stats

**File:** `apps/web/src/components/dashboard/stats-cards.tsx`

Current hardcoded values:
```typescript
return {
  totalFlows: 12,
  successRate: 87,
  testsThisMonth: 145,
  totalSteps: 580,
  costThisMonth: 12.45,
};
```

**Implementation:**
- Create API route `apps/web/src/app/api/stats/route.ts`
- Query MongoDB collections: `flows`, `flow_executions`, `usage_events`
- Use Clerk's `auth()` to get `orgId` for multi-tenant filtering
- Aggregate real metrics:
  ```typescript
  const stats = await db.collection('flow_executions').aggregate([
    { $match: { tenantId: orgId, createdAt: { $gte: startOfMonth } } },
    { $group: {
      _id: null,
      totalRuns: { $sum: 1 },
      passedRuns: { $sum: { $cond: [{ $eq: ['$verdict', 'pass'] }, 1, 0] } }
    }}
  ]).toArray();
  ```

### 1.2 Replace Hardcoded Flows List

**File:** `apps/web/src/app/api/flows/route.ts`

Current mock data returns fake flows. Replace with:
```typescript
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  const db = await getDatabase();

  const flows = await db.collection('flows')
    .find({ tenantId: orgId })
    .sort({ updatedAt: -1 })
    .toArray();

  return Response.json(flows);
}
```

### 1.3 Replace Hardcoded Cost Chart

**File:** `apps/web/src/components/analytics/cost-chart.tsx`

Connect to `usage_events` collection:
```typescript
const costs = await db.collection('usage_events').aggregate([
  { $match: { tenantId: orgId, eventType: 'vision_call' } },
  { $group: {
    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
    totalCost: { $sum: '$cost' },
    totalTokens: { $sum: '$tokens' }
  }},
  { $sort: { _id: 1 } }
]).toArray();
```

---

## Phase 2: AI Costs Dashboard (Priority: High)

### 2.1 What Are AI Costs?

AI costs track spending on:
- **Vision API calls**: Claude analyzing screenshots for UX issues ($0.003-0.01 per image)
- **Flow analysis**: Claude analyzing DOM snapshots, network logs ($0.001-0.005 per call)
- **Token usage**: Input/output tokens consumed per analysis

### 2.2 Cost Tracking Implementation

**New API Route:** `apps/web/src/app/api/costs/route.ts`

```typescript
export async function GET(request: Request) {
  const { orgId } = await auth();
  const db = await getDatabase();

  // Daily costs for last 30 days
  const dailyCosts = await db.collection('usage_events').aggregate([
    { $match: {
      tenantId: orgId,
      eventType: { $in: ['vision_call', 'flow_analysis'] },
      timestamp: { $gte: thirtyDaysAgo }
    }},
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      visionCost: { $sum: { $cond: [{ $eq: ['$eventType', 'vision_call'] }, '$cost', 0] } },
      analysisCost: { $sum: { $cond: [{ $eq: ['$eventType', 'flow_analysis'] }, '$cost', 0] } },
      totalCost: { $sum: '$cost' },
      callCount: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]).toArray();

  return Response.json({ dailyCosts, totalThisMonth, projectedMonth });
}
```

### 2.3 Cost Dashboard Component

**New Component:** `apps/web/src/components/analytics/costs-dashboard.tsx`

Features:
- Recharts area chart showing daily costs (vision vs analysis breakdown)
- Month-to-date total with projection
- Cost per flow average
- Alert threshold configuration

---

## Phase 3: API Key Management (Priority: High)

### 3.1 What Are API Keys Used For?

FlowGuard API keys enable:
1. **CI/CD Integration**: Trigger flows from GitHub Actions, GitLab CI, Jenkins
2. **Programmatic Access**: Run flows via REST API from external systems
3. **Webhook Authentication**: Verify incoming webhook payloads
4. **External Dashboards**: Query flow results from custom dashboards

### 3.2 API Key Schema

**Add to:** `src/db/schemas.ts`

```typescript
export interface ApiKey {
  _id: ObjectId;
  tenantId: string;
  name: string;
  keyPrefix: string;      // "fg_live_" or "fg_test_"
  keyHash: string;        // SHA-256 hash of full key
  lastFourChars: string;  // Display as "fg_live_...abc1"
  permissions: ('flows:read' | 'flows:write' | 'flows:execute' | 'reports:read')[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;      // Clerk userId
}
```

### 3.3 API Key Routes

**Create:** `apps/web/src/app/api/api-keys/route.ts`

```typescript
// POST - Create new API key
export async function POST(request: Request) {
  const { orgId, userId } = await auth();
  const { name, permissions, expiresInDays } = await request.json();

  // Generate key: fg_live_ + 32 random chars
  const rawKey = `fg_live_${crypto.randomBytes(24).toString('base64url')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey: ApiKey = {
    tenantId: orgId,
    name,
    keyPrefix: 'fg_live_',
    keyHash,
    lastFourChars: rawKey.slice(-4),
    permissions,
    expiresAt: expiresInDays ? addDays(new Date(), expiresInDays) : undefined,
    createdAt: new Date(),
    createdBy: userId,
  };

  await db.collection('api_keys').insertOne(apiKey);

  // Return full key ONLY on creation (never stored)
  return Response.json({ ...apiKey, key: rawKey });
}

// GET - List API keys (without full key)
// DELETE - Revoke API key
```

### 3.4 API Key UI Page

**Rewrite:** `apps/web/src/app/(dashboard)/api-keys/page.tsx`

Features:
- List existing keys with name, permissions, last used, created date
- Create new key modal with:
  - Name input
  - Permission checkboxes
  - Expiration selector (never, 30d, 90d, 1y)
- Copy key dialog (shows once on creation)
- Revoke/delete confirmation
- Usage examples for curl, GitHub Actions

---

## Phase 4: Webhook & Branch Configuration (Priority: Medium)

### 4.1 Webhook Purpose

Enable FlowGuard to receive push events from GitHub/GitLab to:
- Trigger flows automatically on specific branches
- Run regression tests on PRs
- Deploy preview environments

### 4.2 Webhook Configuration Schema

**Add to:** `src/db/schemas.ts`

```typescript
export interface WebhookConfig {
  _id: ObjectId;
  tenantId: string;
  name: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  secret: string;           // Webhook secret for verification
  branches: string[];       // ['main', 'develop', 'release/*']
  triggerFlows: string[];   // Flow IDs to run on push
  enabled: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}
```

### 4.3 Webhook Routes

**Create:** `apps/web/src/app/api/webhooks/config/route.ts` (CRUD)
**Create:** `apps/web/src/app/api/webhooks/github/route.ts` (Receiver)

GitHub webhook handler:
```typescript
export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();

  // Verify signature
  const config = await findWebhookConfig(/* from payload */);
  const expected = `sha256=${crypto.createHmac('sha256', config.secret).update(body).digest('hex')}`;

  if (signature !== expected) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = JSON.parse(body);
  const branch = payload.ref.replace('refs/heads/', '');

  // Check branch filter
  if (!matchesBranchPattern(branch, config.branches)) {
    return Response.json({ skipped: true, reason: 'Branch not configured' });
  }

  // Trigger configured flows
  for (const flowId of config.triggerFlows) {
    await queueFlowExecution(flowId, { trigger: 'webhook', branch });
  }

  return Response.json({ triggered: config.triggerFlows.length });
}
```

### 4.4 Webhook UI

**Create:** `apps/web/src/app/(dashboard)/webhooks/page.tsx`

Features:
- List configured webhooks
- Create webhook modal:
  - Name
  - Provider selection (GitHub/GitLab)
  - Branch patterns (multi-select with wildcards)
  - Flow selection (which flows to trigger)
- Webhook URL + secret display
- Setup instructions per provider
- Recent trigger history

---

## Phase 5: Integration Settings (Priority: Medium)

### 5.1 Browserbase Integration

Agent A9 already implemented `src/browserbase/client.ts` and `pool.ts`. Need UI to:
- Configure API key and project ID
- View session pool status
- Toggle cloud vs local execution

**Create:** `apps/web/src/app/(dashboard)/settings/integrations/browserbase/page.tsx`

```typescript
// Settings form
<IntegrationCard
  name="Browserbase"
  description="Cloud browser infrastructure for parallel test execution"
  logo="/integrations/browserbase.svg"
  status={isConfigured ? 'connected' : 'disconnected'}
>
  <Input label="API Key" type="password" name="BROWSERBASE_API_KEY" />
  <Input label="Project ID" name="BROWSERBASE_PROJECT_ID" />
  <Select label="Region" options={['us-east', 'us-west', 'eu-west']} />
  <div className="mt-4">
    <h4>Session Pool Status</h4>
    <p>Active: {poolStatus.active} / {poolStatus.max}</p>
    <p>Available: {poolStatus.available}</p>
  </div>
</IntegrationCard>
```

### 5.2 Datadog Integration

Agent A9 implemented `src/datadog/tracer.ts`, `metrics.ts`, `logger.ts`. Need UI to:
- Configure DD_API_KEY, DD_APP_KEY
- Select environment/service tags
- View recent trace samples

**Create:** `apps/web/src/app/(dashboard)/settings/integrations/datadog/page.tsx`

---

## Phase 6: Frontend Beautification (Priority: Medium)

### 6.1 Modern UI Patterns (Linear/Vercel/pointer.so style)

**Sidebar Enhancement:**
- Collapsible sidebar with icons
- Active state with subtle gradient
- Keyboard shortcuts hints
- Command palette (Cmd+K)

**Component Library Upgrades:**
- Replace basic components with shadcn/ui variants
- Add Framer Motion page transitions
- Implement skeleton loaders
- Dark mode with proper color tokens

### 6.2 Animation System

**Add:** `apps/web/src/lib/animations.ts`

```typescript
import { Variants } from 'framer-motion';

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
```

### 6.3 Dashboard Redesign

**Stats Cards:**
- Gradient backgrounds with subtle animation
- Trend indicators (up/down arrows with percentages)
- Sparkline mini-charts

**Flow List:**
- Card-based layout with hover effects
- Status badges with colors
- Quick action buttons (run, edit, delete)
- Drag-and-drop reordering

**Charts:**
- Recharts with custom tooltips
- Animated data transitions
- Responsive breakpoints

### 6.4 Command Palette

**Create:** `apps/web/src/components/command-palette.tsx`

```typescript
// Cmd+K to open
// Search flows, navigate, trigger actions
<CommandDialog>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandGroup heading="Navigation">
      <CommandItem>Dashboard</CommandItem>
      <CommandItem>Flows</CommandItem>
      <CommandItem>Analytics</CommandItem>
    </CommandGroup>
    <CommandGroup heading="Actions">
      <CommandItem>Run all flows</CommandItem>
      <CommandItem>Create new flow</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

## Implementation Order

### Week 1: Data Foundation
1. [ ] Create stats API route with real MongoDB queries
2. [ ] Replace flows API with real data
3. [ ] Connect cost chart to usage_events collection
4. [ ] Add tenantId filtering across all queries

### Week 2: API Keys & Costs
5. [ ] Implement API key schema and routes
6. [ ] Build API key management UI
7. [ ] Create costs dashboard with breakdown
8. [ ] Add cost projection logic

### Week 3: Webhooks & Integrations
9. [ ] Implement webhook config schema
10. [ ] Build GitHub webhook receiver
11. [ ] Create webhook configuration UI
12. [ ] Add Browserbase settings page
13. [ ] Add Datadog settings page

### Week 4: Polish
14. [ ] Upgrade to shadcn/ui components
15. [ ] Add Framer Motion animations
16. [ ] Implement command palette
17. [ ] Dark mode refinement
18. [ ] Responsive design pass

---

## Files to Create

```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── stats/route.ts
│   │   ├── costs/route.ts
│   │   ├── api-keys/route.ts
│   │   └── webhooks/
│   │       ├── config/route.ts
│   │       └── github/route.ts
│   └── (dashboard)/
│       ├── webhooks/page.tsx
│       └── settings/integrations/
│           ├── browserbase/page.tsx
│           └── datadog/page.tsx
├── components/
│   ├── analytics/costs-dashboard.tsx
│   ├── api-keys/
│   │   ├── api-key-list.tsx
│   │   ├── create-key-modal.tsx
│   │   └── key-display.tsx
│   ├── webhooks/
│   │   ├── webhook-list.tsx
│   │   └── create-webhook-modal.tsx
│   └── command-palette.tsx
└── lib/
    └── animations.ts
```

## Files to Modify

```
apps/web/src/
├── components/
│   ├── dashboard/stats-cards.tsx (remove hardcoded)
│   └── analytics/cost-chart.tsx (connect to API)
├── app/
│   ├── api/flows/route.ts (real MongoDB)
│   └── (dashboard)/api-keys/page.tsx (full implementation)
└── lib/
    └── mongodb.ts (add multi-tenant helpers)

src/db/
├── schemas.ts (add ApiKey, WebhookConfig)
└── repository.ts (add new methods)
```

---

## Success Criteria

- [ ] Dashboard shows real stats from MongoDB (not hardcoded)
- [ ] Cost chart displays actual AI spending from usage_events
- [ ] Users can create, view, and revoke API keys
- [ ] API keys work for authenticating external API calls
- [ ] Webhooks can be configured for specific branches
- [ ] GitHub push events trigger configured flows
- [ ] Browserbase settings can be configured in UI
- [ ] Datadog settings can be configured in UI
- [ ] UI feels modern with smooth animations
- [ ] Command palette works with Cmd+K
- [ ] All pages have proper loading states
- [ ] Dark mode works consistently

---

## Dependencies

**Existing (already installed):**
- `@clerk/nextjs` - Authentication
- `mongodb` - Database
- `recharts` - Charts

**To Add:**
- `cmdk` - Command palette
- `framer-motion` - Animations (likely already present)
- Ensure shadcn/ui components are up to date
