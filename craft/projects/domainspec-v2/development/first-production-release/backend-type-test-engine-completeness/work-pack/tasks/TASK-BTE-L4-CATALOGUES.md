---
task: TASK-BTE-L4-CATALOGUES
layer: L4
status: planned-owner-gated-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L4-CATALOGUES — Independent Denominators And Causal Selections

## Primary Behavior

Freeze six distinct nonempty validation-owned `O_spec` catalogues against one
exact L3 candidate/build context and bind the 13-row node-pattern and 16-row
relationship-composition selections without generator ownership.

## Consumes And Emits

Consumes exact L3 handles, formation/profile/node-pattern/relationship admission
handles where available, and semantic source handles. Emits validation-owned
catalogue instances, expected-case catalogues, node/relationship selections,
red matrices, membership digests, and freeze receipts under
`validation-inputs/catalogues/`. Engine code has read-only access.

## Required Catalogue Contracts

- `formation-criterion@1`: exact 16;
- `formation-structure@1`: exact 13;
- `node-kind-causality@1`: exact 13 implementing Decision 9;
- `node-instance-conformance@1`: exact graph node IDs;
- `relationship-family-causality@1`: exact admitted 16;
- `edge-instance-conformance@1`: exact graph edge IDs.

Each member declares stable obligation ID, governing handles/digests, source
anchors, roles, independent expectation, primary mutation, expected phase/code/
delta, evaluator interface, and lifecycle state.

## Ordered Rules And Failures

1. Resolve exact candidate context and relevant admission handle.
2. Author/freeze `O_spec` without importing or executing the BTE generator.
3. Require unique `coverage_key = catalogue_id + obligation_id`.
4. Freeze expected cases before any TestCase exists.
5. For node/relationship causality require canonical witness, active binding,
   observable effect, and removal delta.
6. Emit typed admission residue when a handle is absent; never convert it into a
   partial core pass.

Reject empty/missing/extra/duplicate/stale/mismatched members, generator-derived
expectations, self-freeze, absent effect/removal, endpoint/scope expansion,
wrong owner, or a TestCase predating the freeze. Per-catalogue validators and red
matrices must pass before any L5 SWU is instantiated.
