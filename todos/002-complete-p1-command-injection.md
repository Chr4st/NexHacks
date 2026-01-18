---
status: complete
priority: p1
issue_id: "002"
tags: [security, code-review]
dependencies: []
---

# Command Injection in Report Opening

## Problem Statement

The CLI's `report --open` command passes user-controlled filenames to `child_process.execSync` without sanitization, enabling command injection.

## Findings

**From security-sentinel agent:**

- `cli.ts` uses `execSync` with user-controlled `reportPath`
- No escaping or validation of the path
- Could execute arbitrary commands with crafted filenames

## Proposed Solutions

### Solution 1: Use spawn with Array Arguments (Recommended)

Replace `execSync` with `spawn` using array arguments which don't go through shell:

```typescript
import { spawn } from 'child_process';
spawn('open', [reportPath], { detached: true, stdio: 'ignore' });
```

**Pros:** No shell interpretation, secure by design
**Cons:** None
**Effort:** Small
**Risk:** None

### Solution 2: Use the open Package

Use the `open` npm package which handles this safely.

**Pros:** Cross-platform
**Cons:** Extra dependency
**Effort:** Small
**Risk:** Low

## Technical Details

**Affected files:**
- src/cli.ts:380 (report --open command)

## Acceptance Criteria

- [x] No shell interpretation of paths
- [x] Commands with special characters in paths are safe
- [x] Works on macOS, Linux, Windows

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-17 | Created from code review | execSync with string interpolation is dangerous |
| 2026-01-17 | Fixed by replacing exec with spawn using array arguments | spawn with array args bypasses shell interpretation |

## Resources

- [Node.js child_process security](https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows)
