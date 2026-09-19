---
context_pack: SWU-CDSC-005
coverage: strict-local
source_count: 7
gate: PASS
---

# Context Pack: SWU-CDSC-005

## Objective

Produce the frozen F3 Savvy Page evidence receipt while preserving dispute and
untested substitution evidence.

## Controlling Sources

1. `WORK-PACK.md`
2. `work-pack/tasks/TASK-CDSC-FIXTURES.md#swu-cdsc-005---f3-savvy-page-receipt`
3. `fixtures/generation-001/fixture-manifest.yml` F3 row
4. `evaluation/validate-input.mjs`
5. `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515,571-710`
6. `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126-162`
7. `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`

## Boundaries

- Savvy is read-only; use only the frozen selectors.
- Write only the F3 evidence subtree, focused test, Task Session evidence, and
  evidence-backed status.
- Pattern pressure is not pattern admission. Filename and framework export do
  not establish identity.
- Do not fabricate screen-replacement or guard-mutation observations.

## Gate

Dependencies are complete and all pinned selectors are available. Untested
mutations are expected evidence residue, not a task blocker.
