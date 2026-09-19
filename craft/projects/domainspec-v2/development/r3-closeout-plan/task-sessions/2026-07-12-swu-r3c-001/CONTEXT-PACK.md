---
task: SWU-R3C-001
mode: standard
strict_coverage: pass
created: 2026-07-12
artifact_role: task-session-evidence
---

# Context Pack: SWU-R3C-001

## Objective

Make `check-code-tag-composability.ts` load current root DS-D8 relationship
authority instead of owning a static pre-R3 endpoint-rule table. Preserve the
existing call-direction checks where code semantics are known and expose
unsupported active signatures as coverage gaps.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-001 | Consume root relationship authority without mutating it. | `definitions/relationships/relationships.yml`; `loadRelationshipAuthority()` | covered |
| O-002 | Remove or derive the static endpoint-rule table. | current checker static `ComposabilityRule[]`; task algorithm | covered |
| O-003 | Classify active, generated, deprecated, deferred, and unknown labels. | root authority sections; task edge cases | covered |
| O-004 | Preserve call-direction semantics for supported signatures. | current CT-COMP-001..009 behavior; existing tests | covered |
| O-005 | Report authority path, active signature count, and unsupported active signatures. | SWU done criteria; focused JSON output contract | covered |
| O-006 | Stay inside the SWU write boundary. | checker path plus optional shared loader import | covered |
| O-007 | Keep existing behavior green. | `npm --prefix projects/domainspec-v2/impl run tags:test` | covered |

## Selected Sources

1. `development/r3-closeout-plan/WORK-PACK.md` — selected-first row, done
   criteria, validation, and synchronization obligation.
2. `work-pack/tasks/TASK-R3C-EDGE.md` — algorithm, edge cases, write scope, and
   no-authority-mutation guardrail.
3. `work-pack/waves/W0.md` — entry/exit gate.
4. `work-pack/shared/context.md` — current authority and non-reopen boundary.
5. `impl/governance/tags/tools/check-code-tag-composability.ts` — sole primary
   implementation target.
6. `impl/tools/lib/relationship-signatures.ts` — existing root-authority
   loader and active-signature validation.
7. `impl/governance/tags/tools/lib/code-tag-rules.ts` — current normalized type
   and root-authority adapter precedent.
8. `impl/governance/tags/tools/tests/code-tag-composability.test.ts` — existing
   behavior contract.
9. `definitions/relationships/relationships.yml` — read-only root DS-D8
   authority: 30 active signatures, one generated view, one deprecated alias,
   and three deferred candidates.

## Resolved Context Drift

`W0.md` still says `signature_count=31`. Current root authority, the verified
SGRM result, Craft, and the approved APE refresh agree on 30. Authority
precedence resolves the entry gate to: the checked-in root file must have a
self-consistent `signature_count`, currently 30. This is a stale planning
projection, not a blocker and not permission to edit authority.

## Execution Decisions

- Reuse `loadRelationshipAuthority()`; do not add another parser.
- Generate endpoint rules from active root signatures.
- Keep a narrow call-semantics map only for signatures whose source-to-target
  call direction is known. This map is implementation behavior, not edge
  authority.
- Reject generated, deprecated, deferred, unknown, and wrong-endpoint authored
  edges in strict mode.
- Report active signatures lacking call semantics as explicit non-blocking
  coverage gaps.
- No subagents, runtime adapter, or human decision is needed for this local
  fallback SWU.

## Write Scope

- Allowed: `projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts`.
- Optional only if necessary: imports from
  `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`.
- Task evidence and synchronization:
  `development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-001/` and
  the SWU row/status in `development/r3-closeout-plan/WORK-PACK.md`.
- Read-only: root DS-D8 authority, definitions, APE package, and existing
  fixtures/tests.

## Validation Surface

- `npm --prefix projects/domainspec-v2/impl run tags:test`
- focused checker JSON over an existing composability example/extraction
- JSON assertions for authority path, active signature count, and coverage gaps
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- `git diff --check` over the SWU scope

## Gate Verdict

PASS. Dependencies are satisfied, current authority is available and
self-consistent, the stale 31-count entry projection is resolved by source
precedence, the write scope is bounded, and validation is available.
