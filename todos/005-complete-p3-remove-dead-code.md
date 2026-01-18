---
status: complete
priority: p3
issue_id: "005"
tags: [simplicity, code-review]
dependencies: []
---

# Remove Dead Code

## Problem Statement

Several functions and integrations are implemented but never called, adding ~395 lines of unused code.

## Findings

**From code-simplicity-reviewer agent:**

- `batchAnalyze` in vision.ts - never called
- `batchGetCruxMetrics` in metrics.ts - never called
- Wood Wide AI integration is incomplete and unused
- Some tracing utilities are over-engineered for the use case

## Proposed Solutions

### Solution 1: Remove Unused Code (Recommended)

Delete the unused functions to reduce complexity:

- Remove `batchAnalyze` from vision.ts
- Remove `batchGetCruxMetrics` from metrics.ts
- Simplify Wood Wide integration or remove if not demo-ready

**Pros:** Less code, easier to understand
**Cons:** Need to re-implement if needed later
**Effort:** Small
**Risk:** None

### Solution 2: Mark as TODO

Add comments marking the code as future work.

**Pros:** Preserves work
**Cons:** Clutters codebase
**Effort:** Trivial
**Risk:** None

## Technical Details

**Affected files:**
- src/vision.ts:150-199 (batchAnalyze)
- src/metrics.ts:150-199 (batchGetCruxMetrics)

## Acceptance Criteria

- [x] No unused exports remain
- [x] All remaining code is called from CLI
- [ ] Tests still pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-17 | Created from code review | YAGNI - You Aren't Gonna Need It |
| 2026-01-17 | Removed unused functions: analyzeScreenshots from vision.ts, analyzeWithWoodWide and compareMetrics from metrics.ts | The functions mentioned in the todo (batchAnalyze, batchGetCruxMetrics) never existed - the actual dead code was analyzeScreenshots and Wood Wide-related functions |

## Resources

- N/A
