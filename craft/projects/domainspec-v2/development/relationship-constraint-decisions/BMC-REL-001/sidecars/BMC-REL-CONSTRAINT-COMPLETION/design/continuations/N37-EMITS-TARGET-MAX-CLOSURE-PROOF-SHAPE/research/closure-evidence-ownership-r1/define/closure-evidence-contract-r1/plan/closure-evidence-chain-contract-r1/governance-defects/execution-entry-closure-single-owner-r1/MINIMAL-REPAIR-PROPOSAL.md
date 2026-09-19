# Execution-entry closure single-owner repair proposal

## Root cause

Two independent mechanical defects block the rehearsal before any product work:

1. The command passes `machine/EXECUTION-ENTRY.json`, the strict generic
   `arcanum.work-pack-execution-entry/v1` selection projection, to a consumer
   that requires a separate normalized document containing
   `execution_entry_closure` and `units`. The generic schema is closed and must
   not be overloaded with those fields.
2. The Task Session closure validator and Invoke rehearsal then require at
   least two distinct lifecycle owners and two distinct owner-receipt schema
   identities. The selected EVF chain intentionally has one typed lifecycle
   closeout owner and one typed receipt identity across all four units. The
   referenced terminal contract explicitly admits one owner capability and,
   for the selected precloseout profile, requires exactly `["invoke"]`.

The second rule mistakes heterogeneous-frontier coverage from the original
synthetic fixture for a universal cardinality invariant. Exhaustive typed
coverage is required; owner heterogeneity is not.

## Minimal repair

1. Canonical Task Session validation must accept a nonempty homogeneous owner
   frontier when every unit remains completely typed and its owner identity is
   consistent with its native context and route partition.
2. Canonical Invoke rehearsal must resolve and schema-check every unit's owner
   closeout contract, compare every resolved schema identity to the unit's
   declared identity, and accept one or more distinct identities. It must not
   demand two.
3. Keep the historical `heterogeneous-owner-closeout` stage token for this
   patch to avoid an unrelated receipt-version migration. Document that the
   token means exhaustive typed owner-closeout coverage and does not impose a
   cardinality floor of two. A later deliberate schema version may rename it.
4. The Plan owner must deterministically produce a separate normalized closure
   source (for example `machine/EXECUTION-ENTRY-CLOSURE.json`) from the exact
   generic execution entry and audit bindings. `AUDIT-CONFIG.json` must bind
   `/execution_entry_closure` and `/units` from that same exact source, and the
   rehearsal command must use that source rather than the generic entry.
5. Do not invent a second owner or receipt identity. Do not modify the Option A
   selection receipt.

## Permanent regression fix

- Add a Task Session positive case with two units, one lifecycle owner, and one
  owner-receipt schema identity; require `closure_result=pass` while request
  eligibility remains independently blocked until its exact receipt exists.
- Add an Invoke end-to-end no-effect rehearsal fixture whose whole frontier
  uses the same valid owner schema; require every unit's schema to be resolved
  and checked and the owner-closeout stage to pass.
- Retain negative cases for missing owner identity, mismatched resolved schema
  identity, incomplete frontier coverage, stale exact refs, and fabricated
  extra owner identities.
- Add a producer/CLI regression proving the generic execution entry is not
  accepted as the normalized closure source and that the deterministic closure
  artifact is the source used by WPRA and rehearsal.

## Required revalidation after an authorized canonical repair

1. Run the focused Task Session execution-entry projection tests.
2. Run the Invoke execution-entry negative and new single-owner positive tests.
3. Run the full Invoke preacceptance-closure integration suite.
4. Regenerate installed Invoke and Task Session packages from canonical public
   source and prove byte parity/no-delta preview.
5. Regenerate the Plan normalized closure source and its exact refs.
6. Re-run generic execution-entry validation, WPRA, proof-only Implementation
   Readiness, and two no-effect rehearsals for SWU-CCE-002 through
   SWU-CCE-005.
7. Re-freeze and independently review the preacceptance graph before emitting
   any owner request.

This repair changes authority-bearing governance executables, so the automatic
mechanical-resume condition is not met even though the defect is
`mechanical_evidence_only`.
