---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-003
swu: SWU-OCON-003
mode: lean
---

# Context Pack: SWU-OCON-003

## Task

Author the decision-gate and definitions-governance receipt for the
challenge-contract confidence wording tension. This SWU may not mutate
`NODE-MODEL.md` or `DEFINITIONS.md`; it only records the owner route needed
before SWU-OCON-004 can sync those source files.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Dependency satisfied. | SWU-OCON-002 receipt marks the package crosswalk complete. | covered |
| O2: Stay inside write scope. | Create a decision/definitions review receipt only; no source-model mutation. | covered |
| O3: Resolve canonical confidence wording. | Compare active D40 wording with the schema proposal's G7/G8 confidence placement rule. | covered |
| O4: Preserve no-third-axis rule. | Receipt must say challenge contract remains protocol-only and not a confidence axis. | covered |
| O5: Name allowed downstream files. | Receipt must list files SWU-OCON-004 may edit and files it must not edit. | covered |
| O6: Keep ontology out of owner role. | Receipt lives under authority definitions review, not under ontology as a decision owner. | covered |
| O7: Synchronize task evidence. | Work-pack, task, wave, execution pack, gap, and session receipt point to the review artifact. | covered |
| O8: Validate. | Run diff/whitespace checks and dispatch validation after edits. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | TASK-OCON-003 row, SWU-OCON-003 row, blockers. | Controls status, write scope, done criteria, and acceptance evidence. |
| `work-pack/tasks/TASK-OCON-003.md` | Blocker state and SWU-OCON-003 contract. | Defines the exact governance receipt and the no-`NODE-MODEL.md` rule. |
| `work-pack/waves/W2.md` | Promotion evidence and gate. | Confirms the owner receipt is the W2 unblocker. |
| `TASK-SESSION-SWU-OCON-002.md` | Gate verdict and synchronization. | Confirms dependency completion. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D23` | Evidence/commitment split. | Provides the existing authority lifecycle axis. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D40` | Challenge contract definition. | Provides the active challenge contract semantics and legacy wording. |
| `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Minimum challenge contract shape. | Shows the downstream schema text that must wait for SWU-OCON-004. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Candidate record shape. | Shows package-level reference to `confidence_reference`. |
| `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` | G7/G8 and worked example. | Records the proposed canonical fields and placement rule requiring a decision receipt. |
| `cyberAlchemy-v2/authority/definitions/reviews/README.md` | Review surface rule. | Confirms review artifacts are not canonical definitions. |
| prior memory boundary notes | ontology supporting role; v2 remains research-first until owner promotion. | Keeps the receipt consistent with earlier non-collapse boundaries. |

## Controlling Constraints

- Do not patch `cyberAlchemy-v2/ontology/NODE-MODEL.md` in this SWU.
- Do not patch `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` in this
  SWU.
- Do not create a live schema, validator, promotion verdict, or spec change.
- Keep challenge contract as a protocol for challenge/contradiction/validation
  and owner routing, not as a confidence score, verdict, residue store, or third
  confidence axis.
- Keep the receipt in an authority/definitions review surface so ontology does
  not become its own decision owner.

## Decision Frame

| Option | Result | Rationale |
| --- | --- | --- |
| Keep `veracidade` and `conviccao` as canonical forward fields. | rejected | Preserves old wording but conflicts with the schema proposal's G7/G8 route and makes source-local labels global. |
| Use `evidence_confidence` and `commitment_confidence` as canonical forward fields and remove active legacy support. | selected | Aligns with D23's evidence/commitment split, records the schema proposal's owner decision, and follows the owner update that no active consumer needs the legacy keys. |
| Remove all confidence references from challenge contract without a definitions note. | rejected | Aligns with strict node placement but would silently reverse active D40 without a definitions-governance receipt. |

## Strict Coverage

Strict coverage: pass. Every SWU obligation has source evidence, a bounded
write scope, and a validation surface. Runtime handoff is not used.
