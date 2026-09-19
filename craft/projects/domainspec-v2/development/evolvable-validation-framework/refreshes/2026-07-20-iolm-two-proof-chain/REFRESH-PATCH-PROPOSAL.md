# Proposal-Only Patch: IOLM Two-Proof Chain

This is the exact target synchronization proposed from accepted
`DEC-GCP-002`. It is not an applied change. Historical receipts remain
immutable, and unrelated dirty-worktree changes remain outside scope.

## 1. EVF: preserve core proof and add a sibling consumer handoff

Signals: `RS-GCP-IOLM-001`, `002`, and `009`.

Proposed target files:

- `DESIGN.md`: add a "two-proof consumer boundary" after the receipt interface.
  IOLM accepts exact graph, obligation, TestCase, binding, evaluator, execution,
  mutation, and receipt handles. It cannot define the predicate, `O_spec`, core
  verdict, profile admission, or release state.
- `IMPLEMENTATION-LAYERING.md`: keep L0 exit evidence unchanged; add an
  independently gated L0C consumer branch. Both receipts are required only for
  the combined real-application composability claim.
- `PLAN.md`: add the IOLM handoff after S1 without making it an S1 dependency;
  preserve S2/S3 ordering and the later BTE breadth lane.
- `WORK-PACK.md`: record `DEC-GCP-002` as passed, preserve `SWU-GCP-001`
  atomicity, and add the IOLM receipt as an external handoff rather than an EVF
  implementation task.
- `work-pack/tasks/TASK-GCP-BREADTH.md`: distinguish the narrow IOLM receipt from
  the later BTE breadth consumer receipt.
- `work-pack/tasks/TASK-GCP-VERIFY.md`: verify the EVF receipt independently;
  verify the IOLM receipt only when it exists; never downgrade a valid EVF core
  receipt because IOLM is blocked.
- `work-pack/shared/DECISIONS.md`, `GAPS.md`, and `TRACEABILITY.md`: add accepted
  `DEC-GCP-002`; preserve `DEC-GCP-001`; map the two exact consumer runs and
  their independent blockers.

No source schema, engine code, evidence output, task status, or release state is
changed.

## 2. Private integration home: add machine-owned consumer contracts

Signals: `RS-GCP-IOLM-004`, `007`, and `009`.

New proposed machine artifacts under
`cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/`:

### `consumer-contract.yml`

Required contract fields:

- contract/version and `proof_role: independent-consumer`;
- allowed upstream stage: `evf-l0-core` or `bte-core`;
- exact source/profile/registry/schema/graph identities and raw digests;
- exact `O_spec`, `O_gen`, `T_gen`, `E_run`, binding, evaluator, mutation, and
  upstream receipt handles where present for the selected stage;
- declared `candidate` or `authoritative` posture and current
  `G-DSV2-SG` state;
- required IOLM checks: unchanged imported IDs/relations/provenance,
  deterministic rebuild, semantic-byte/hash invariance under learner/navigation
  changes, graph/hierarchy/table/GET parity, and typed negatives;
- owner and freshness identity for the independent IOLM run;
- revocation on any input, posture, contract, or output digest change; and
- forbidden claims: predicate authority, `O_spec` ownership, profile admission,
  FPR closure, semantic satisfiability, production, or publication.

### `receipt.schema.json`

Require run identity/freshness, contract version, upstream stage and exact
handle digests, IOLM snapshot/semantic/projection/view hashes, check verdicts,
negative results, residue, posture/non-admission, declared writes, and final
bounded verdict. Missing, empty, stale, fixture-only, self-authored upstream,
unknown-ID, parity, overlay mutation, or surviving-negative evidence must fail.

Markdown may explain these contracts, but YAML/JSON is the machine source for
the handoff and receipt shape.

Update `INTEGRATED-EVIDENCE-MANIFEST.yml` to reference both files and model two
IOLM receipt slots:

- `evf_l0_consumer`: optional for BTE terminal closure but required for the
  accepted narrow two-proof claim; and
- `bte_breadth_consumer`: required by `SWU-BTE-010` and terminal `verify:bte`.

## 3. IOLM: own the consumer behavior explicitly

Signals: `RS-GCP-IOLM-003`, `004`, and `005`.

Proposed design/plan updates:

- `SPEC.md`: add accepted `DEC-GCP-002`, the two consumer runs, their exact
  bounded claims, and the rule that IOLM may fail independently without
  changing the upstream core verdict.
- `ARCHITECTURE-BUNDLE.md`: add a DomainSpec evidence-handle adapter beside the
  candidate/authoritative graph adapters. It verifies and projects upstream
  evidence; it never derives or adjudicates upstream obligations.
- `operations.md`: add `ConsumeDomainSpecEvidenceHandle` and
  `EmitIndependentConsumerReceipt` with fail-closed inputs and no mutation.
- `IMPLEMENTATION-LAYERING.md`: add an L0D evidence-consumer lane after the
  candidate substrate; keep L0A authority rebind independent.
- `INVOKE-PLAN.md`, `EXECUTION-PACK.md`, `DISPATCH.json`,
  `DISTILL-VALIDATION.md`, and shared context/gaps/traceability: add the task,
  two SWUs, gates, receipts, and owner boundaries; update task/SWU counts
  exactly.
- `WORK-PACK.md`: add one task and two SWUs without selecting either.
- New wave: `work-pack/waves/W0D-DOMAINSPEC-CONSUMER.md`.
- New task:
  `work-pack/tasks/TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER.md`.

Proposed SWUs:

### `SWU-IOLM-DSC-A` — narrow EVF consumer receipt

- Dependencies: successful `SWU-GCP-001` receipt; IOLM candidate contract;
  compiled/parity-capable IOLM substrate (`00C-B` and `00C-C`).
- Primary behavior: consume one exact EVF handle, preserve identities and source
  provenance, prove semantic/view non-collapse, and emit one fresh IOLM receipt.
- Write scope: the new machine contract adapter/tests plus one run directory
  under `prototype/runs/domainspec-consumer/`; no DomainSpec writes.
- Done: deterministic pass plus missing/empty/stale/unknown-ID/parity/semantic-
  mutating-overlay negatives.
- Claim: the private IOLM consumed the exact executable-core proof without
  semantic drift; no BTE breadth, FPR, or production claim.

### `SWU-IOLM-DSC-B` — BTE breadth consumer rerun

- Dependencies: `DSC-A`, green `SWU-BTE-008`/`verify:bte:core`, and a fresh
  independently supplied BTE core handle.
- Primary behavior: rerun the same consumer contract against exact 13-kind,
  16-signature, obligation/test/execution/mutation handles.
- Write scope: a distinct run directory only plus minimal test/adapter extension
  when the breadth shape needs it.
- Done: fresh breadth receipt satisfying the IOLM part of the integrated
  consumer manifest.
- Claim: bounded backend evidence was consumed without projection drift; no
  semantic satisfiability or upstream admission claim.

Both SWUs remain blocked/unselected until their own dependencies pass.

## 4. BTE: bind to the concrete independent IOLM receipt

Signals: `RS-GCP-IOLM-006` and `007`.

The execution order and core task are already correct and stay unchanged.
Proposed pointer-only updates:

- `WORK-PACK.md`: make `SWU-BTE-010` depend on the fresh
  `SWU-IOLM-DSC-B` receipt matching `iolm-consumer/consumer-contract.yml`.
- `TASK-BTE-INTEGRATED-CONSUMER-MANIFEST.md`: require the versioned IOLM
  receipt schema and reject a narrow `DSC-A` receipt where the breadth receipt
  is required.
- `INTEGRATED-EVIDENCE-MANIFEST.yml`: reference the exact IOLM contract, receipt
  schema, owner SWU, run identity, and raw hashes.

BTE must not run IOLM, write its receipt, or accept fixtures/schemas as a fresh
consumer run.

## 5. X-ray: refresh only as a derived explanation

Signal: `RS-GCP-IOLM-008`.

After the planning/contract changes validate:

- `ARCHITECTURE-AND-DESIGN.lanes.json`: record accepted `DEC-GCP-002`, add the
  sibling IOLM consumer branch, and retain both current target blockers.
- `ARCHITECTURE-AND-DESIGN.html`: branch IOLM from the core receipt; label its
  cross-feature stop without marking the core chain blocked by it.
- `XRAY-RESULT.md`: update the architecture finding and validation inventory;
  retain seed/non-authority status.

Re-run the x-ray lane/HTML validator and inline JavaScript parse check.

## 6. Apply Boundary And Validation

Application requires the explicit message `apply-approved` or
`invoke refresh apply-approved` for this dated proposal. Apply must:

1. re-read target preimages and stop on overlapping drift;
2. patch only the targets above;
3. validate all YAML and JSON;
4. validate refreshed IOLM Dispatch Spec and Distill artifacts;
5. validate EVF/BTE link and identifier consistency;
6. validate the x-ray library/example and inline JavaScript;
7. run scoped `git diff --check`;
8. record observability; and
9. stop before task selection, implementation, test execution, or gate closure.
