# Auth command-boundary same-row provenance v2 — candidate construction plan

Status: independently analyzed and plan-reviewed; no admission or F5 result.

## Product frontier

The admitted Auth definition requires command values from the same unique
qualifying authentication and route rows. The v1 typed provenance Rule uses
weaker independent `exists` witnesses and the v1 trusted constructor counts
weaker matches. Together they permit false READY at the kernel and false DENY
at the wrapper. Build a versioned, local successor for both surfaces without
editing any admitted or receipt-pinned v1 artifact.

## Dependency DAG

1. Preserve exact v1 source, generated Rust, trusted wrapper and receipts.
   Construct a separate `command-boundary-source-v2` with a distinct project
   ID. Keep feature/Rule/Operation selectors so it remains the same subject.
2. In v2 candidate provenance, require every auth and route `exists` witness
   to satisfy the complete qualifier of its corresponding `exactly_one` Rule:
   matching/nonempty evidence reference, trusted, nonempty session; matching/
   nonempty route, complete, nonempty scope reference and permission triple.
   Test structural equality of the qualifier subterms so later edits cannot
   silently diverge.
3. Invoke the current Craft DomainSpec CLI directly into a new, nonexistent
   `command-boundary-runtime-v2` target; run a second independent generation
   into a temporary target and compare exact generated files/receipt. Do not
   run Auth's legacy `scripts/build.ts`, which replaces historical targets.
4. Create `trusted-boundary-v2` bound to the new generated crate. Construct
   the candidate from the unique fully qualifying rows, not weaker matches.
   Test direct generated-kernel false-READY mutants and wrapper mixed-row
   false-DENY cases in both row orders. Include duplicate qualifying rows,
   direct candidate mismatch, downstream-call counts and exact values.
5. Record source/runtime/wrapper/test digests in a new candidate evidence
   binding and the repair status. Do not reuse old SFOL/TDE or D65 receipts as
   proof of the successor. Semantic owner acceptance, v4 preservation, TDE
   neutral derivation, post-TDE request and authenticated provider execution
   remain subsequent stages.

## D65 lanes and write scope

- Current frontier: testable same-row Auth source and wrapper successor.
- Runnable product work: source v2, clean generated runtime v2, wrapper v2,
  direct and integration regressions, exact candidate binding.
- Operational support: local compiler/Cargo tests only; no live service cutover.
- Causal blockers for F5: exact accepted DomainSpec meaning and all-context
  preservation, current proof context, neutral TDE producer, provider evidence.
- Deferred residue: system-ontology and D65 successor admission, service
  activation, E03/E05/L3X/P01–P03 requalification, deployment/release.

No v1 or admitted Auth source, generated Rust, historical receipt, old
diagnostic checker or sibling checkout may be edited by this unit.

## Open Questions

- Does the owner accept the exact intended same-row meaning once the successor
  has been tested, and what D65 successor admission route applies?
- Should the typed Rule language later acquire a reusable unique-witness
  binding, rather than duplicating qualifier predicates across Rules?
