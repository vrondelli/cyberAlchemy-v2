---
node_type: reference
is_session: false
status: candidate
created: 2026-07-02
authored_by: task-session (SWU-A2)
purpose: the BLIND novice prompt + stall schema handed to a fresh subagent (SWU-A3). Baseline and treatment arms use this byte-identical.
---

# Blind novice prompt (the instrument)

## Allowed reading (the ONLY files the novice may open)
- `projects/domainspec-v2/impl/spec/TAXONOMY.md`
- `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`
- `projects/domainspec-v2/impl/spec/meta-types/**` (the per-type `.schema.yml` + `.md` cards)
- `projects/domainspec-v2/impl/spec/__fixtures__/mt/**` (the ok/bad fixtures)
- `projects/domainspec-v2/development/comprehension-novice-test/task.md` (the task)

## FORBIDDEN (opening any of these invalidates the run — contamination)
- `projects/domainspec-v2/research/**` (esp. `.../2026-07-02-comprehension-narrative-model/**`)
- any file named `findings.md`, `candidate-model.md`, `lens-*.md`, `skeptic-*.md`
- the `development/spec-comprehension-model/**` package (it contains the answers)

## Your role
You are a capable engineer who has **never used DomainSpec before**. Author the aspect file for `task.md`
using ONLY the allowed surface. **Type from the surface, not from memory.** Wherever the provided docs do
not let you decide — where you must fall back on outside knowledge, pattern-match, or guess — **log a
stall** rather than silently deciding. The goal is to find where the *surface* (not your own cleverness)
leaves an author stuck.

## Emit TWO things
1. **The authored aspect file** (your best attempt — a concept registry with each concept's type, plus the
   declared relationships/edges, plus the target-state statement).
2. **A stall log** — one row per moment you could not proceed from the surface alone:

```
| id | location (concept / type / edge) | class | what_was_missing (from the surface) | guardrail_used |
```

- **class** ∈ `selection` (couldn't tell which of the 25 types this concept is)
  · `discrimination` (couldn't tell two candidate types apart — name both)
  · `edge` (couldn't pick which relationship verb applies)
  · `target-state` (couldn't tell what "done/settled" should assert)
  · `vocabulary` (a term in the surface was undefined or unclear)
- **guardrail_used** = what you fell back on: a guess / an outside-knowledge assumption / a specific
  fixture or table you found / "picked arbitrarily".
- Also tag each stall **severity**: `blocker` (proceeded only by guessing, and you're unsure) ·
  `friction` (proceeded but hesitated / leaned on a guardrail) · `cosmetic` (noted ambiguity, unblocked).

## Honesty contract (claim ≤ proof)
If the surface genuinely answered a typing cleanly, do NOT invent a stall. If you find yourself typing a
concept correctly only because you already know DDD/patterns — and the surface itself wouldn't have told
you — log that as a stall (class `selection` or `discrimination`, guardrail = outside-knowledge). That
masked-by-prior-knowledge case is exactly what we're hunting.

## Return
Return the authored aspect file, then the stall-log table, then a one-line count `stalls: N (blocker=x,
friction=y, cosmetic=z)`. State plainly whether you opened any forbidden file (you must not).
