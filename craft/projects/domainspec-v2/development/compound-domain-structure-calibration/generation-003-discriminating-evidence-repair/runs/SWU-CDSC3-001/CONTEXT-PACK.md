---
artifact_id: CDSC3-SWU001-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-001
mode: deep
strict_coverage: pass
created_at: 2026-07-12T18:00:00Z
---

# SWU-CDSC3-001 Context Pack

## Summary

- Files selected: 18.
- Obligation coverage: 100 percent.
- Handoff pack: none; execution is local.
- Runtime adapter: none.
- Blockers: zero.
- Noise rule: only selectors that control imports, targets, validation, write
  scope, or synchronization are admitted.

## Obligation Matrix

| ID | Obligation | Controlling Evidence | Status |
| --- | --- | --- | --- |
| O1 | Bind exact generation-2 tail and protected predecessors. | `generations/index.json`; generation-2 run/provenance; SWU contract steps 1 and 7 | covered |
| O2 | Derive exactly six targets from parent substitution text only. | `SPEC.md#Atomic-Target-Contract`; parent F3 `semantic.S` | covered |
| O3 | Preserve target order, polarity, modality, and one-field provenance. | `SPEC.md#Decomposition-Rules`; SWU contract steps 2-3 | covered |
| O4 | Import M1/M2 and generation-2 overlay/projection without reinterpretation. | frozen receipts and generation-2 audit | covered |
| O5 | Keep UI corpus/policy/dossier at `DEFER`/`missing` authority. | UI corpus generation 002, dossier-policy evaluation, dossier v2, integrated audit | covered |
| O6 | Reject every declared negative vector before browser work. | SWU contract step 6; existing generation-2 direct-validator pattern | covered |
| O7 | Keep schema and direct-validator vocabulary aligned. | generation-2 JSON-compatible `.yml` schemas and contract tests | covered |
| O8 | Write only SWU001 contracts, validators, fixtures, tests, and run evidence. | task write scope; work-pack mutation authority | covered |
| O9 | Prove all imported bytes unchanged and hand only exact handles to SWU002. | task done criteria and handoff | covered |

## Selected Sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `WORK-PACK.md` | frontmatter, SWU manifest, global done contract, blockers, handoff | O1, O5, O8, O9 |
| `work-pack/tasks/TASK-CDSC3-CONTRACTS.md` | SWU001 objective through handoff | O1-O9 |
| `SPEC.md` | Immutable Inputs, Atomic Target Contract, Decomposition Rules | O1-O5 |
| `IMPLEMENTATION-PLAN.md` | Source Anchors, Contract And Import Proof | O1, O4, O5 |
| `DECISION-LEDGER.md` | DEC-CDSC3-001 through 011 | O1, O5, O8 |
| `generations/index.json` | exact two-entry tail | O1, O9 |
| `evidence/generation-001/f3-savvy-page/receipt.json` | `record_id`, `generation_id`, `semantic.S` | O2, O3 |
| generation-2 M1 receipt | envelope and `semantic.mutation_id` | O4 |
| generation-2 M2 receipt | envelope and `semantic.mutation_id` | O4 |
| generation-2 adjudication overlay | envelope and unresolved coordinates | O4 |
| generation-2 compatibility receipt | envelope and projection handle | O4 |
| generation-2 F3 result | outcome and projection binding | O1, O4 |
| generation-2 run receipt | generation tail, suite verdict, input handles | O1, O4 |
| generation-2 provenance manifest | layer handles and prohibited inferences | O1, O4, O9 |
| generation-2 independent audit | closure and replay verdict | O1, O4 |
| UI corpus generation 002 | corpus count and source handle only | O5 |
| UI dossier-policy and dossier v2 | `defer`, `missing`, and prohibited inferences | O5 |
| UI integrated audit result/manifest | mechanical pass boundary only | O5 |

## Constraints

- `.yml` contracts remain JSON-compatible, matching the local calibration
  convention and avoiding a new parser dependency.
- Target digests are SHA-256 over the exact UTF-8 canonical proposition text.
- Parent-field digests are SHA-256 over the exact selected parent string.
- Direct validators enforce exact keys and exact ordered vocabularies in
  addition to schema vocabulary checks.
- UI integrated-audit `pass` means mechanical audit pass only; it cannot lift
  dossier `DEFER`, portability `missing`, or independent-positive `missing`.
- No browser package, source harness, observation evidence, generation result,
  or authority artifact may be created.

## Validation Surface

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/import-target-contract.test.mjs
```

Completion additionally requires byte rehashing, schema/direct vocabulary
parity, negative-vector coverage, scoped diff checks, task/work-pack status
synchronization, Task Session receipt, and observability.

## Excluded Candidates

- Savvy source slices: browser/source behavior begins in SWU003, not SWU001.
- Browser manifests and Playwright packages: owned by SWU002.
- Generation-3 evaluator or overlay code: owned by SWU007/008.
- UI formation internals beyond imported status surfaces: separate owner.
