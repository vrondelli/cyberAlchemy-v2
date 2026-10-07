# Auth v2 meaning-trace semantic gap correction

Status: independently reviewed corrective plan, amended for witness and digest requirements. No meaning acceptance, all-context proof or F5 result.

## Finding and product frontier

The v2 typed provenance Rule requires a nonempty inbound `request_id`. The
existing BusinessMeaning/v1 draft says READY depends on unique qualifying rows
and exact same-row provenance, but does not explicitly state that `request_id`
must be nonempty. Its word “qualifying” does not enumerate the nonempty auth
evidence/session and route/scope/permission checks in the typed Rules. A
representable context with an empty request ID and otherwise valid unique rows
is denied by the current v2 kernel; whether the prose would require READY is
unresolved. Thus the current trace's “matches draft conditionally” wording is
too strong. Preserve the executable behavior and make this uncertainty visible.

## Dependency DAG

1. Recheck exact current draft, typed Rules, trace, generated runtime and
   wrapper evidence. Record the full qualifier inventory and blank-request-ID
   witness; distinguish ambiguity from an established contradiction.
2. Narrow the trace/report to exact selected AST, receipt and regeneration
   correspondence. Add an explicit unresolved prose-alignment status and the
   missing request-ID and qualifier-definition questions. Keep acceptance,
   preservation, neutral TDE and F5 fields false. Do not modify the meaning
   draft, source Rules, generated Rust or wrapper to settle the ambiguity.
3. Bind the corrective report bytes into the owner-review envelope. Prepare,
   but do not send or record as requested, the exact question for the human
   product owner: whether nonempty `request_id` and the complete typed
   qualifier set belong in the normative READY condition. Keep the decision
   status not-requested and acceptance null until a real answer arrives.
   Scope the draft's “current typed Rule” caveat explicitly to historical v1;
   it is not a statement about the repaired v2 source.
4. Extend tests for the exact qualifier inventory, blank-ID Deny behavior,
   narrowed claim, held-report and envelope tampering. Run the focused suite,
   v2 Cargo tests, v2 evidence check and historical meaning tests. The blank-ID
   witness uses exactly one fully qualifying authentication row and one fully
   qualifying route row, with every candidate value matching its source;
   assert direct generated-kernel DENY and wrapper zero downstream calls.
   Rebind the v2 candidate evidence test-file hash and update its factual
   9/9 wrapper/direct-kernel test count to the observed new count after the
   additive Rust witness. Update the trace test's asserted Cargo count,
   then the trace's pinned evidence SHA, materialize the held report,
   then update the envelope `trace_ref.sha256`, then the test's pinned envelope
   SHA, and only then validate and synchronize status.

## D65 lanes and exact write scope

- Product frontier: truthful, owner-reviewable semantic-gap evidence.
- Runnable product work: trace, held report, owner envelope, tests and status.
- Operational support: local Node/Cargo/CLI checks only.
- Causal blocker for all-context business preservation: normative meaning of
  nonempty identifiers and exactly qualifying resolver rows.
- Deferred residue: verified source-level algebra, Rust/wrapper preservation,
  accepted v4 claim, TDE-neutral derivation, post-TDE request, provider
  observation, F5, deployment and release.

Write only the trace/checker test and two report/envelope files in the Auth
formalization case, the additive v2 trusted-boundary Rust test and its exact
candidate-evidence digest, this plan, and the implementation status. Preserve
the existing meaning draft/checker, historical admission/receipts, v2 source,
generated target, wrapper production code and sibling checkouts.

## Claim ceiling and open questions

Passing checks establish exact current AST/receipt/regeneration identity and
finite local denial/acceptance witnesses. They do not establish agreement of
the prose draft with all typed contexts, owner acceptance, all-context
preservation, a FormalClaim/v4, neutral TDE set, EVF pass, F5 or
`runtime_guarantees_observed`.

### Open Questions

- Must `request_id` be nonempty for READY?
- Does “qualifying” mean precisely every nonempty/trust/completeness
  predicate in the two typed uniqueness Rules, including list multiplicity?
