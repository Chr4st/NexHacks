---
status: complete
priority: p2
issue_id: "003"
tags: [typescript, code-review]
dependencies: []
---

# Unsafe Type Assertions

## Problem Statement

Several files use `as` type assertions that bypass TypeScript's type checking, potentially masking runtime errors.

## Findings

**From kieran-typescript-reviewer agent:**

- `vision.ts` casts API response without validation
- `metrics.ts` casts CrUX response without validation
- Could crash at runtime if API responses don't match expected shape

## Proposed Solutions

### Solution 1: Runtime Validation with Zod (Recommended)

Add Zod schemas to validate API responses before using them:

```typescript
const VisionResponseSchema = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string()
  }))
});
```

**Pros:** Type-safe, runtime validation, self-documenting
**Cons:** More code
**Effort:** Medium
**Risk:** Low

### Solution 2: Type Guards

Create type guard functions for each response type.

**Pros:** Lightweight
**Cons:** More manual, error-prone
**Effort:** Medium
**Risk:** Medium

## Technical Details

**Affected files:**
- src/vision.ts:85 (Claude API response)
- src/metrics.ts:45 (CrUX response)
- src/metrics.ts:120 (Wood Wide response)

## Acceptance Criteria

- [x] All external API responses are validated
- [x] Type assertions are replaced with validated data
- [x] Invalid responses produce clear error messages

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-17 | Created from code review | External data should always be validated |
| 2026-01-17 | Implemented Solution 1 with Zod schemas | Added VisionResponseJsonSchema, CruxApiResponseSchema, and WoodWideResponseSchema with safeParse validation |

## Resources

- [Zod documentation](https://zod.dev/)
