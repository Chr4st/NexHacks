---
status: complete
priority: p2
issue_id: "004"
tags: [performance, code-review]
dependencies: []
---

# No Browser Pooling

## Problem Statement

Each flow execution launches a new browser instance, causing O(n) overhead for n flows. This significantly slows down batch testing.

## Findings

**From performance-oracle agent:**

- `runner.ts` calls `chromium.launch()` for every flow
- No reuse of browser instances across flows
- Launching Chromium takes ~500ms-2s per instance

## Proposed Solutions

### Solution 1: Browser Singleton (Recommended for Hackathon)

Keep a single browser instance and reuse it, creating new contexts per flow:

```typescript
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch();
  }
  return browserInstance;
}
```

**Pros:** Simple, significant speedup
**Cons:** Need to handle cleanup
**Effort:** Small
**Risk:** Low

### Solution 2: Full Pool Implementation

Create a proper pool with configurable size.

**Pros:** More flexible, production-ready
**Cons:** Over-engineering for hackathon
**Effort:** Large
**Risk:** Medium

## Technical Details

**Affected files:**
- src/runner.ts:35 (browser launch)
- src/cli.ts (run command)

## Acceptance Criteria

- [x] Browser is reused across flows
- [x] Each flow gets isolated context
- [x] Browser is properly closed on CLI exit
- [ ] At least 50% speedup on multi-flow runs

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-17 | Created from code review | Browser pooling is standard optimization |
| 2026-01-17 | Implemented Solution 1 | Browser singleton with context isolation per flow |

## Implementation Details

**Changes made:**

1. `src/runner.ts`:
   - Added module-level `browserInstance` variable
   - Created `getBrowser()` function for singleton pattern
   - Created `closeBrowser()` export for cleanup
   - Modified `executeFlow()` to use browser contexts instead of new browsers
   - Context provides isolation between flows (cookies, storage, etc.)

2. `src/cli.ts`:
   - Added import for `closeBrowser`
   - Added signal handlers for SIGINT/SIGTERM cleanup
   - Added cleanup call before process.exit in run command

## Resources

- [Playwright browser contexts](https://playwright.dev/docs/browser-contexts)
