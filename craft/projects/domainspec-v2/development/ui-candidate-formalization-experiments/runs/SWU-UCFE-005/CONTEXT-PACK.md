---
task: SWU-UCFE-005
mode: lean
status: blocked
strict_coverage: block
handoff: none
authority: session-evidence
created_at: 2026-07-12
---

# SWU-UCFE-005 Context Pack

## Scope

Select and pin one real independently authored Form corpus in a second
implementation style. Stop before mutation when no candidate source,
authorship evidence, or style evidence has been supplied.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume accepted corpus A generation. | `runs/SWU-UCFE-004/receipt.json` | covered |
| O2 | Receive one explicit corpus-B repository and source path. | no supplied source; no corpus-B folder | block |
| O3 | Verify an accessible immutable revision and file digests. | cannot evaluate without O2 | block |
| O4 | Record author identity evidence independent of `author:body-war`. | no supplied author evidence | block |
| O5 | Verify a style different from `static-dom-javascript`. | no supplied implementation evidence | block |
| O6 | Separate literal facts from candidate projection. | executable only after O2-O5 | block |
| O7 | Reject forks, aliases, generated fixtures, adapted fixtures, and filename inference. | governing contract available | covered |
| O8 | Publish a candidate-local immutable receipt or stop BLOCK. | BLOCK branch selected | covered |

Coverage: 3/8 obligations covered. The missing obligations are external source
evidence, not discoverable implementation details.

## Selected Context

| Source | Selector | Obligations |
| --- | --- | --- |
| `work-pack/tasks/TASK-UCFE-EVIDENCE.md` | SWU-UCFE-005 | O2-O8 |
| `runs/SWU-UCFE-004/receipt.json` | accepted corpus A identity and residue | O1, O4, O5 |
| `experiments/form/corpora/corpus-a/generation-001/attestation.json` | one corpus/author/style baseline | O1, O4, O5 |
| `work-pack/shared/gaps.md` | GAP-UCFE-001 | O2-O5 |
| `SOURCE-CONTRACTS.md` | external material remains in owning repository | O2, O3, O6 |

## Gate Verdict

BLOCK. No consequential corpus-B mutation may begin. There is no blocker-level
decision to adjudicate; the required evidence is absent.

## Unblock Contract

Supply all of:

1. Repository location and accessible immutable revision.
2. Exact source file paths and bounded selectors containing real Form behavior.
3. Source file digests or permission to calculate them from the supplied
   revision.
4. Author identity evidence and an attestation that the author is independent
   of `author:body-war`.
5. Implementation-style evidence showing a style other than
   `static-dom-javascript`.
6. Confirmation that the source is real project material, not a fork/alias of
   Body War, generated fixture, adapted fixture, or framework-name inference.

Once supplied, rerun `task-session` for `SWU-UCFE-005` only.
