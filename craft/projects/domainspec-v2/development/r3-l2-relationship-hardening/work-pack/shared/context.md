---
module: r3-l2-relationship-hardening
status: draft
updatedAt: 2026-07-02
docType: shared-context
---

# Shared Context

> **2026-07-11 supersession:** The accepted Saga collapse cancels every Saga-law
> hardening route in this document. Saga-specific design text below is retained
> as historical planning evidence only; `WORK-PACK.md` owns the active route.


## Operating Boundary

R3H is a focused relationship-authority hardening package. It does not execute broader R3 closeout tasks
from `development/r3-closeout-plan/`, and it does not move authority into implementation.

## Source Anchors

| Anchor | Why It Matters |
| --- | --- |
| `projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/findings.md` | Latest findings to address. |
| `projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md` | Prior promotion rubric and root-placement decision. |
| `projects/domainspec-v2/development/reformulate-batch1/HANDOFF-novice-test-edge-findings.md` | Novice witness for Entity-to-Entity and Saga pressure. |
| `projects/domainspec-v2/definitions/relationships/relationships.yml` | Root machine authority. |
| `projects/domainspec-v2/definitions/relationships/relationships.md` | Root human companion. |
| `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md` | Implementation projection. |
| `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts` | Validator authority loader and endpoint checks. |
| `projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts` | Relationship validator tests. |

## Accepted Assumptions

- Root relationship authority is already active.
- Implementation projection is not authority.
- Human notation `Source --[verb]--> Target` remains useful display notation.
- The current graph row format remains `From | Edge | To` for this pass.

## Do Not Do In R3H

- Do not promote full category laws.
- Do not promote `depends-on`.
- Do not redefine Operation return types as relationship edges.
- Do not make `owned-by` authorable.
- Do not silently split `belongs-to` without a new owner decision.
