---
title: CRABS Audit and Proof Implementation Layering
status: construction-candidate
updatedAt: 2026-09-04
owner: CRABS audit requester
scope: research
authority_effect: none
---

# CRABS Audit and Proof Implementation Layering

## Context

- Target: CRABS commit `9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937`.
- User need: an audit and proof package whose claims remain tied to exact source
  bytes and the evidence semantics of each tool.
- Current risk: “proof” could incorrectly combine code review, tests, bounded
  model checking, and mathematical proof into one unbounded correctness claim.
- First selected problem: ordered-set merge commutativity, already identified as
  a high-severity convergence concern in the repository's Round 8 audit.

## Layer Boundary Heuristic

Each layer stops at the smallest unit that changes the next responsible
decision. Tool count is not a reason to enlarge a layer.

| Layer | Decision question | Minimum working unit | Visible outcome | Risk reduced | Main cost | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one current CRABS merge claim survives a concrete witness and bounded checking of the actual C function. | Two singleton replicas, native witness, CBMC check, exact receipt. | One reproducible counterexample or bounded no-counterexample result. | Audit prose may be stale or unsupported. | Source slicing and dependency modeling. | Repair, deepen, or stop. |
| L1 | After this layer, we know whether every implemented CRDT/OT merge satisfies commutativity, associativity, and idempotence at declared bounds. | Per-type property harnesses and CBMC/property-test matrix. | A typed convergence map rather than a blanket claim. | One merge path may hide failures in others. | State generators and normalization oracles. | Select repair candidates or narrow claims. |
| L2 | After this layer, we know whether authorization and untrusted-input paths fail safely in executable C. | Exact safety obligations, CBMC, sanitizers, and fuzzing for selected paths. | Concrete security findings with replayable evidence. | Memory or authorization defects may escape unit tests. | Environment, harnesses, and triage. | Remediate or proceed to temporal modeling. |
| L3 | After this layer, we know whether corrected abstract protocol rules satisfy mathematical and temporal obligations and still correspond to C. | Lean merge algebra, TLA+/TLC state model, and explicit refinement checks. | Separate theorem, temporal, and implementation receipts. | Abstract proofs may not describe executable behavior. | Formalization and correspondence evidence. | Prepare an audit candidate for independent review. |

## L0 Included Scope

- Exact CRABS commit and selected source hashes.
- OpenABE submodule identity, although OpenABE is not executed by this harness.
- Actual `crabs_ot_ordered_set_merge` implementation.
- Two replicas with one distinct live element each and absent position maps.
- Native C witness and CBMC 6.11.0 bounded execution.
- Dry-run schema fixtures before the live run.

## Explicitly Deferred

- CRABS source repair or pull request.
- Position-map behavior, allocation failure, associativity, and idempotence.
- Other CRDT/OT types and whole-state merging.
- Cryptographic, authorization, serialization, memory-safety, and temporal claims.
- Lean, TLA+/TLC, publication, security certification, and upstream disclosure.

## L0 Exit Evidence

- Status: complete for the declared two-singleton bound; result is a
  counterexample to ordered-set merge commutativity.
- Passing and deliberately failing run-schema fixtures behave as declared.
- Source, submodule, CBMC package, CBMC executable, and compiler identities are current.
- The native witness and CBMC agree on the bounded outcome.
- Raw process outputs and invocations are retained in append-only JSONL.
- The result summary does not exceed the obligation's claim ceiling.

## Non-Regression Guardrails

- Later layers retain exact source and runtime bindings.
- A CBMC no-counterexample result never becomes an unbounded proof.
- A Lean theorem never becomes evidence that the C implementation conforms.
- Existing audit prose is a source, not independent validation evidence.
- Repair, publication, and upstream communication require separate authorization.

## Recommended Next Layer

The next decision belongs to the CRABS owner: create a separately reviewed
repair candidate for this defect, or continue L1 against the unchanged source
to map other convergence laws and merge types. L1 must not silently prove a
different, corrected algorithm.
