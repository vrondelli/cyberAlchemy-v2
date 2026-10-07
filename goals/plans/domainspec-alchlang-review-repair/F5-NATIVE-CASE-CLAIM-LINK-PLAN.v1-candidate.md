# F5 local observation to case-claim link — construction plan

Date: 2026-10-03. Status: reviewed candidate implementation unit, not F5
qualification or an EVF evidence join.

## Product frontier

The v3 AlchLang case-claim bridge checks caller-reported outputs and remains
`BLOCKED`. The opt-in request-bound native runner produces replayable *local*
outputs and also remains non-satisfying. Join these exact surfaces so a
self-consistent reported claim can be compared with what the selected local
adapter actually emitted. This is a consistency diagnostic, not provider or
oracle verification.

## Dependency DAG

1. **Revalidate both sources.** Re-run the current v3 structural case-claim
   join. Re-execute and compare the supplied native receipt through its
   currentness verifier. Snapshot and recheck caller input objects and source
   Map/Buffer bytes across the asynchronous replay.
2. **Bind the shared scope.** Require the whole finalized-request ref,
   obligation-set and runtime refs, case-domain and witness-set digests, and
   each sorted obligation/case/witness row to match. Do not infer that the
   local executable equals the selected provider runtime.
3. **Compare native outputs.** Compare canonical JSON native output for every
   observed case with the selected v3 case claim. An observed disagreement is
   `contradicted` even if a later case is incomplete; otherwise a replayed run
   that ends before all cases is `incomplete`.
   Only a complete local run with all outputs equal is
   `claim-vs-local-output-consistent`. Invalid, stale, missing, extra, forged
   or drifted input remains an error, not a comparison result.
4. **Keep the ceiling.** Emit no EVF artifact or normalized provider pass.
   Every result states `domain_join_status: BLOCKED`,
   `can_satisfy_obligation: false`, and no provider equivalence, oracle truth,
   network/memory enforcement or `runtime_guarantees_observed` claim. A
   self-consistent false claim that matches an equally false local adapter
   output is still non-satisfying.
5. **Validate.** Synthetic tests exercise matching two-case output, a
   self-consistent reported/output contradiction, incomplete run, changed
   request/case/witness identity, forged receipt, replay nondeterminism, and
   no promotion. Run focused tests and TypeScript typecheck; report broader
   qualification separately.

## Review and D65 lanes

Independent implementation analysis found no eligible accepted non-synthetic
DomainSpec-v4 FormalClaim/TDE-neutral set in the current checkout. The Auth
SFOL eight-case precursor is not this chain; R4's meaning is still an owner
decision. Independent plan review accepted this local consistency unit only
with exact shared-scope checks and the non-voting ceiling above. It specifically
requires self-consistent contradictory case-claim artifacts in tests, so the
comparison—not the older structural validator—detects the discrepancy.

- Current product frontier: request-bound local observation versus v3
  reported-case consistency.
- Runnable product work: implement the bounded link and separating tests;
  independently review the final bytes.
- Operational support: an independently authenticated and isolated provider
  route is needed for later satisfying F5, not this local diagnostic.
- Causal blocker for satisfaction: accepted claim/projection/preservation,
  TDE-neutral derivation and executable oracle, provider identity and policy
  evidence remain absent.
- Deferred residue: E03/E05/L3X/P01-P03 requalification, release and
  deployment after a genuine successor exists.

## Open Questions

- Which accepted non-synthetic claim and TDE producer will supply the first
  eligible request and oracle?
- Which independently authenticated provider route can replace the local
  adapter diagnostic without treating output agreement as semantic truth?
