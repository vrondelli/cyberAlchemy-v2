# TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER — Independent Proof Consumption

## Objective and mapping

- Slice/layer/wave: S-00D / L0D / W0D.
- Objective: prove that the private IOLM can consume exact successful DomainSpec
  executable-evidence handles without changing semantic identity, provenance,
  view parity, upstream verdicts, or authority.
- Machine source:
  `cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml`.
- Receipt shape:
  `cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/receipt.schema.json`.
- Status: both SWUs blocked by dependencies and unselected.

## Source contracts

- [SPEC — executable-evidence consumer contract](../../SPEC.md#domainspec-executable-evidence-consumer-contract)
- [Architecture — component contracts](../../ARCHITECTURE-BUNDLE.md#component-contracts)
- [Operations](../../operations.md)
- [Implementation layering — L0D](../../IMPLEMENTATION-LAYERING.md#layer-decisions)
- Accepted EVF decision:
  `projects/domainspec-v2/development/evolvable-validation-framework/decisions/2026-07-20-iolm-proof-role.md`.

Markdown explains the task but never supplies the machine handoff or receipt
shape. The YAML contract and JSON Schema above are controlling.

## SWU-IOLM-DSC-A — Narrow EVF consumer receipt

| Field | Contract |
|---|---|
| Dependencies | successful `SWU-GCP-001` / `evf-l0-core` receipt; `candidate-contract-handle`; passing `SWU-IOLM-00C-B` and 00C-C `candidate-substrate-handle`; explicit next-unit selection |
| Primary behavior | consume one exact EVF L0 evidence handle and prove that IOLM preserves its identities, relations, provenance, semantic bytes/hash, and graph/hierarchy/table/GET parity |
| Inputs | exact source, graph, obligation, test-case, binding, evaluator, execution, positive-receipt, and negative-receipt handles; contract digest; IOLM candidate substrate |
| Outputs | one fresh receipt conforming to `iolm-domainspec-evidence-consumer-receipt/v1` plus exact run artifacts |
| Write scope | `prototype/src/domainspec-consumer/`, `prototype/tests/domainspec-consumer/`, `prototype/runs/domainspec-consumer/<run-id>/` |
| Done criteria | exact handle/digest/freshness checks pass; imported IDs/relations/provenance remain unchanged; deterministic rebuild and semantic/view invariants pass; all eleven required negative classes are rejected |
| Acceptance evidence | schema-valid fresh IOLM receipt bound to `stage=evf-l0-core`, with explicit non-admission and no upstream writes |
| Validation surface | consumer contract validator, receipt-schema validation, deterministic replay, parity oracle, negative suite, write-scope diff |
| Execution owner | IOLM Task Session; private-learning-map-product-owner boundary |
| Handoff | return `iolm-evf-consumer-receipt-handle`; do not select DSC-B automatically |

### Claim boundary

This receipt proves only that one private real application consumed the exact
EVF executable-core proof without semantic or projection drift. It does not
prove BTE breadth, define the predicate or obligations, close FPR, or grant
authority, release, production, or publication state. Failure does not change
the upstream EVF verdict.

## SWU-IOLM-DSC-B — BTE breadth consumer rerun

| Field | Contract |
|---|---|
| Dependencies | DSC-A pass; green `SWU-BTE-008` / `verify:bte:core` receipt; exact fresh BTE core handle; explicit next-unit selection |
| Primary behavior | rerun the same consumer contract against the exact 13-kind, 16-signature BTE core evidence set |
| Inputs | BTE source/profile/registry/schema/graph, `O_spec`, `O_gen`, `T_gen`, `E_run`, binding, evaluator, mutation, and core-receipt handles plus the IOLM substrate |
| Outputs | a distinct fresh breadth receipt conforming to the same JSON Schema |
| Write scope | a new `prototype/runs/domainspec-consumer/<run-id>/` directory; minimal adapter/test extension only when required by the admitted breadth shape |
| Done criteria | `stage=bte-core`; 13/13 kinds and 16/16 signatures; exact denominator/test/result/digest comparison; deterministic projection/parity; all negative controls reject |
| Acceptance evidence | schema-valid `iolm-bte-consumer-receipt-handle` eligible for the IOLM slot in `SWU-BTE-010` |
| Validation surface | breadth contract validation, receipt-schema validation, exact-set comparison, deterministic replay, parity oracle, negative suite |
| Execution owner | IOLM Task Session; independent from BTE implementation/validation owner |
| Handoff | return only the fresh breadth receipt handle to `SWU-BTE-010`; never run or close BTE from IOLM |

### Claim boundary

This receipt proves bounded backend evidence was consumed without identity,
semantic, or projection drift. A DSC-A receipt, fixture, schema, stale run, or
BTE-authored receipt cannot substitute for it. Failure leaves the BTE core
receipt intact and blocks only consumer/terminal composition.

## Synchronization and completion

Execute DSC-A and DSC-B as separate Task Sessions separated by their exact
upstream gates. The task completes only when both independently fresh receipts
pass. It never mutates `projects/domainspec-v2/`, DomainSpec authority, FPR
lifecycle, Craft continuation, production, or publication state.
