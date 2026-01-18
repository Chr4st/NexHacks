# Frontend-Backend Integration & Observability

## Summary

Connected FlowGuard frontend to MongoDB backend and added Datadog/Browserbase integrations.

## Changes Made

### Frontend-Backend Connection
- **Dashboard components**: Connected stats, activity feed, recent runs to MongoDB APIs
- **Flow pages**: Connected to MongoDB repository (GET/PUT/DELETE)  
- **Reports pages**: Connected to MongoDB results
- **API Keys**: New endpoints for API key CRUD operations

### Datadog Integration (Web App)
- Created `apps/web/src/lib/datadog.ts` - APM initialization & helpers
- Created `apps/web/src/lib/api-middleware.ts` - Middleware wrapper for tracing
- Features: APM traces, custom metrics, structured logging, error tracking

### Browserbase Integration (CLI)
- Created `src/runner-browserbase.ts` - Cloud browser execution
- Optional mode via `EXECUTION_MODE=cloud` environment variable  
- Session recordings and replay URLs

## Environment Variables

```bash
# Datadog (optional, production only)
DD_API_KEY=your-key
DD_SITE=us5.datadoghq.com
DD_SERVICE=flowguard-web

# Browserbase (optional, for cloud execution)
EXECUTION_MODE=local # or 'cloud'
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=...
```

## Files Modified
- `apps/web/src/components/dashboard/stats-cards.tsx`
- `apps/web/src/components/dashboard/activity-feed.tsx`
- `apps/web/src/components/dashboard/recent-runs.tsx`
- `apps/web/src/app/(dashboard)/flows/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/reports/page.tsx`
- `apps/web/src/app/api/flows/[id]/route.ts`

## Files Created
- `apps/web/src/app/api/api-keys/route.ts`
- `apps/web/src/app/api/api-keys/[id]/route.ts`
- `apps/web/src/lib/datadog.ts`
- `apps/web/src/lib/api-middleware.ts`
- `src/runner-browserbase.ts`
