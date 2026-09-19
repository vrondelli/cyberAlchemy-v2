# I06 — combined application join

Date: 2026-09-17. Status: I06 scoped construction complete. Authority effect: none.
I07 and later obligations remain in EXECUTION-DAG.json. This is not a runnable
whole-application, release, deployment or runtime-observation claim.

## Implemented boundary

DomainSpec compileApplicationRuntimeBindingV1 joins the existing checked
application graph/binding to an explicit provider-pack selection. Every actual
kernel binding is followed through its realization and provider profile. Kind,
concern and required capabilities must agree with the selected pack role.
A compatible unused profile cannot hide an incompatible bound profile.
The current provider generator and join share the required capability definitions.

The result retains domain/integration graph identity, provider-selection identity,
the per-binding provider assignments and a deterministic digest. It is immutable,
formation-only, and claims no runtime observations. The public root API and
whole-application facade expose the same implementation.

Alch's public adapter also validates Operation request contracts against the
executable selection and rejects a runtime/executable target mismatch.
compileApplicationWhole combines the already-lowered persistence, messaging and
API compositions with explicit source-bound disclosure/ORODI inputs. It requires
an explicitly selected runtime and exact prepared executable/graph custody.
It does not invent absent partitions or start any provider.

## Current evidence

- Backend fixture: all five existing integration bindings resolve for each of
  TypeScript, Python and Rust; repeatability and immutable results checked.
- Hostile cases: compatible unused profile decoy, missing required capability,
  unsupported provider, forged domain graph, wrong executable target and wrong
  Operation request parameter reject.
- Alch whole-application boundary rejects incomplete partitions, malformed or stale
  observation inputs and forged executable preparation.

The same-source positive fixture now starts from one Alch source and explicit
synthetic author/evidence choices. It includes Entity, Value Object, FormalClaims,
Rules, Operations, optional Query, identity-carrying Event, Mappings, named public
Interface contracts, persistence, publication/subscription, inbound/outbound API
and a runtime profile. Its generated domain graph joins all five provider bindings
through the public compiler. Optional Query cardinality, Event identity references,
qualified public payload types and both Operation request consumers are asserted.

The external API alias companion now explicitly binds both contract_ref and
interface_ref (source Interface name). The earlier lowerer incorrectly equated
the external contract with the domain Interface. Full-graph testing exposed that
gap; the repair preserves the existing backend distinction. Wrong role, conflated
identity and the earlier scalar alias reject.

The whole-result currentness check passes on exact input and rejects changed,
missing or extra files. A different runtime selection preserves the domain graph
but invalidates the prior whole result. Unresolved domain references, stale
partition hashes, normalized declaration collisions and forged graph/preparation
snapshots reject. Existing native messaging and Entity/Value Object API scenarios
remain regression evidence, not provider execution.

The three predecessor integration fixture builders were extracted unchanged
except for the explicit API Interface binding, then reused by the combined source.
No test imports another test module. Temporary graph outputs have scoped cleanup.

## Protocol-consumer inventory for I07

| Contract | Current inspected consumer | Remaining obligation |
| --- | --- | --- |
| Public Mapping v3 | application-graph runtime bindings, I04 native paths and the combined same-source fixture preserve qualified contracts | Retain those identities in provider composition |
| Query v2 optional | typed-backend/contracts.ts, project-model.ts and the combined same-source fixture preserve explicit optional cardinality; all three Query planners select query-cardinality-extension | Exercise the generated provider path without reverting to list |
| Query semantic oracle | verification/reconciled-query-reference.ts now distinguishes optional absence, one projection and QUERY_CARDINALITY after validation/filtering | Closed for the independent oracle; retain whole-application coverage in I07 |
| TypeScript Query observer | verification/reconciled-query-runner.ts now observes null or one projected object for optional results; list roots reject | Focused baseline and seven semantic mutants pass; whole-application use remains in I07, other native languages not claimed |
| Query verifier case construction | verification/reconciled-query-controls.ts delegates to that reference | Extend witness and mutation coverage; native generation alone cannot satisfy public verification |

This inventory identifies live code gaps, not a completed verification claim.
Python/Rust observer parity remains in later target coverage and must be checked,
not inferred from TypeScript.

## Next construction work

Continue I07: public CLI/loading, optional Query verification and the runnable
whole-application scenario. The fixture's backend companion data is explicit test
input; it does not satisfy I07's requirement to derive internal contracts for users.

The full 37-node goal remains unchanged. No new product decision is required.
Operational O01 remains separate and affects P02, not this construction step.
Remaining decisions and obligations are owned by CURRENT-REVIEW-AND-PLAN.md and
EXECUTION-DAG.json.
