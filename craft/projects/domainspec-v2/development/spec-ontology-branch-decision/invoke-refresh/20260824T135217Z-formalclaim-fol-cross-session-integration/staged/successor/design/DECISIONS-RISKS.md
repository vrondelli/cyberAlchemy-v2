# Decisions, Risks, and Residue — @2 Refresh Successor

## Decisions

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D01 | Preserve the @1 source/assessment/projection split. | The cross-session response adds interfaces, not a reason to collapse meaning and capability. | selected candidate |
| D02 | FormalClaim owns the exact statement and selected logic-semantics profile. | One canonical semantic source prevents dual truth. | selected candidate |
| D03 | Do not claim every formal logic is FOL. | Temporal, fixed-point, closure, and higher-order semantics require separate profiles. | selected candidate |
| D04 | Keep `executable_profile` exclusively in capability assessment. | Executability changes independently from authored meaning. | selected candidate |
| D05 | Preserve canonical authored direction `ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning`. | Owner candidate contracts define direction and forbid authored inverses. | selected candidate |
| D06 | Define a future DS-SFOL single-authority migration contract. | Current `body.logic` design and FormalClaim cannot both be semantic authorities. | planned contract only |
| D07 | Use the explicit EVF -> adapter -> factory -> provider -> verified evidence -> EVF handle seam. | Each layer has a distinct owner and evidence meaning. | designed, unimplemented |
| D08 | Do not reuse the current graph-law provider receipt as SMT. | Its closed provider and native-result contracts admit only Datalog and Alloy semantics. | selected candidate |
| D09 | Keep the theorem-provider lane separate. | SMT/bounded evidence and proof have different semantics and ceilings. | designed, absent |
| D10 | Report capability state as current evidence, validated design, planned contract, or absent implementation. | “Designed” must not become “implemented.” | selected candidate |
| D11 | Give `sat` and `unsat` exact encoded-query ceilings. | Solver results are not global source truth. | selected candidate |
| D12 | Unknown, timeout, malformed, unsupported, error, stale, incomplete, identity mismatch, or ceiling inflation never passes. | Evidence must fail closed. | selected candidate |
| D13 | Skip a new Distill run with recorded bounded-delta rationale. | The @1 coherent unit remains intact; @2 closes three exact interfaces only. | selected candidate |

## Risks

| ID | Risk | Guardrail | Owner / future route | State |
| --- | --- | --- | --- | --- |
| R01 | “FormalClaim owns logic” is read as “all logic is FOL.” | Require explicit logic family/profile and route non-FOL semantics separately. | formal-claims/profile owners | designed |
| R02 | `executable_profile` leaks into source meaning. | Source schema forbids it; assessment owns it. | schema and validation-governance owners | planned witness |
| R03 | DS-SFOL `body.logic` becomes a second source. | Exactly-one source authority plus digest-bound projection/bijection/currentness checks. | formal-claims, DS-SFOL, node-schema, migration owners | migration unapplied |
| R04 | Relation edges are authored backwards or duplicated through inverses. | Exact endpoint/direction witnesses and authored-inverse prohibition. | relationship authority owner | planned witness |
| R05 | Adapter identity mapping is mistaken for solver semantics. | Separate obligation translation, factory evidence, provider meaning, and EVF interpretation. | EVF/factory/provider owners | designed |
| R06 | Candidate-local Z3 admission is called EVF SMT integration. | Capability-state table and current graph provider enum evidence. | EVF and runtime-risk owners | guarded |
| R07 | `unsat` is reported as an unbounded theorem. | Bind encoding/profile/domain/options and emit narrowest ceiling. | provider and EVF evidence owners | planned witness |
| R08 | Stale or foreign evidence joins. | Exact identity/currentness join across every source, request, lock, run, provider, and ceiling. | factory and evidence-adapter owners | planned witness |
| R09 | Bounded provider evidence substitutes for theorem proof. | Separate theorem contracts, owners, evidence types, and discharge boundary. | proof-provider and lifecycle owners | planned witness |
| R10 | Planned contracts are presented as current capabilities. | Four-state capability table plus honesty negative fixture. | design validator and parent reviewer | planned witness |
| R11 | Local Refresh apply is mistaken for admission or readiness. | Authority none and blocked domain gate in every result. | parent and future owner/verifier route | guarded |

## Residue

- No @2 source, assessment, projection, DS-SFOL migration, EVF request, adapter,
  SMT provider, factory binding, evidence handle, or theorem-provider schema is
  admitted or implemented.
- No provider is registered through this seam and no query or theorem is run.
- All planned witnesses remain unimplemented and unexecuted.
- @1 and frozen @4 remain unchanged; their acceptance cannot cover @2.
- Exact successor owner/verifier admission and future Plan/implementation
  evidence remain open domain gates.
