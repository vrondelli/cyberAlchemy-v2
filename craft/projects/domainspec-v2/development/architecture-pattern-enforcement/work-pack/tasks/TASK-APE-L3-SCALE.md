# TASK-APE-L3-SCALE — Turn one proof into repeatable progression

Layer: L3. Wave: W4. Status: planned.

## Objective

After Enum closes, generate exact active-type coverage, calculate evidence
burden for missing realization types, prepare one next-type lifecycle packet,
and aggregate only completed type receipts in CI.

## Burden model

For each uncovered active type, report—not silently score away—the required:

- structural property/operator additions;
- relation existence/cardinality/graph obligations;
- callable/static-type observations;
- effect and runtime planes;
- unsupported/native complexity;
- owner decisions and unresolved semantic conflicts.

A deterministic recommendation may use a documented lexicographic order over
these dimensions. Ties require owner selection. The output recommends; it does
not activate.

## Smallest Working Units

### SWU-APE-SCALE-001 — Exact realization coverage

- Primary behavior: generate the active-13 realization coverage projection
  from current registries and ontology.
- Dependencies: Enum closeout.
- Write scope: generated APE coverage JSON/Markdown and canvas read-model inputs
  only.
- Done: exact ID equality, one row per active backend type, tombstone/UI
  exclusions, seven missing after Enum.
- Split analysis: enumeration and exact comparison are one deterministic
  projection behavior.
- Acceptance evidence: regenerated output twice with identical bytes.
- Verification: coverage generator/check command.
- Owner: Task Session.

### SWU-APE-SCALE-002 — Evidence-burden recommendation

- Primary behavior: produce a transparent next-type recommendation from the
  exact uncovered set and burden dimensions.
- Dependencies: SCALE-001.
- Write scope: APE recommendation artifact and receipt only.
- Done: every uncovered type has explicit dimension evidence; ties and unknowns
  are preserved; one recommendation or one owner-decision block is emitted.
- Split analysis: per-type rows are inputs to one comparison decision and have
  no independent lifecycle effect.
- Acceptance evidence: deterministic ranking plus perturbation/tie negatives.
- Verification: burden model fixture/review check.
- Owner: Task Session; owner decides ties.

### SWU-APE-SCALE-003 — Next-type instance packet

- Primary behavior: instantiate one MTCI-derived existing-type realization
  packet for the owner-selected next type.
- Dependencies: SCALE-002 and explicit owner selection.
- Write scope: `architecture-pattern-enforcement/instances/<selected-type>/plan/**` only.
- Done: canonical digests, applicability, gaps, first candidate SWU, and claim
  ceiling are present; new-type admission steps are omitted unless a semantic
  delta is discovered.
- Split analysis: the packet is one bounded planning artifact; it executes no
  ontology or source mutation.
- Acceptance evidence: package schema and Design/Plan readiness review.
- Verification: Invoke validation for the instance packet.
- Owner: Invoke/Task Session planning owner.

### SWU-APE-SCALE-004 — Completed-type CI aggregation

- Primary behavior: make CI consume only current independently replayed type
  completion receipts while showing incomplete/unsupported types explicitly.
- Dependencies: SCALE-003; at least Enum completion receipt.
- Write scope: exact APE-owned CI integration files selected by preflight; no
  unrelated repository workflow.
- Done: missing/stale/extra/duplicate/unreplayed receipt blocks; incomplete
  types cannot disappear or count as pass.
- Split analysis: receipt selection and gate result are one CI behavior; project
  rollout remains deferred.
- Acceptance evidence: green Enum-only aggregate and seeded stale/missing/extra
  red cases.
- Verification: focused CI-equivalent command plus scoped workflow lint.
- Owner: Task Session with CI owner review.

## Failure modes

Hard-coded counts, hidden unsupported types, heuristic order without evidence,
automatic next-type activation, copying MTCI new-type admission blindly, or CI
counting authored receipts without replay blocks.
