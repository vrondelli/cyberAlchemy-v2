# Glossary — FormalClaim FOL Profile Extension

| Term | Plain meaning | Ownership | Link status and source |
| --- | --- | --- | --- |
| FormalClaim | The exact formal meaning asserted for a business meaning. | formal-claims-owner | linked — prior candidate `FormalClaim` contract |
| many-sorted FOL with equality | First-order logic with declared sorts, typed terms, equality, predicates, and first-order quantifiers. | formal-claims-owner for claim use | partial — DS-SFOL is bounded; this successor adds the expressive source profile |
| source semantics profile | The rules that say what a source formula means, independent of execution support. | formal-claims-owner | no-match — new candidate term in this successor |
| capability assessment | A versioned downstream statement of what admitted tools may soundly do with an exact claim. | validation-governance-owner | no-match — new candidate term in this successor |
| executable projection | A digest-bound representation admitted for deterministic evaluation over a declared boundary. | validation-governance-owner | partial — DS-SFOL has bounded typed logic; this contract generalizes the binding |
| solver admission | Permission for a particular theory profile and pinned provider runtime to receive a query. | validation-governance and runtime-risk owners | linked — EVF QF_LIA profile and runtime admission |
| `needs_formal` | TDE's fail-closed signal that it lacks a sound executable projection. | validation-governance-owner | linked — TDE ledger and SMT/FOL tower |
| domain closure | An explicit assumption that the domain contains only the declared named elements. | formal-claims-owner | no-match — new candidate semantic field |
| unique-name assumption | An explicit assumption that different constant names denote different values. | formal-claims-owner | no-match — new candidate semantic field |
| total function symbol | A function symbol that denotes a result for every typed argument tuple. | formal-claims-owner | no-match — standard source FOL semantics made explicit here |
| unknown | A provider could not establish sat or unsat under the exact run. | SMT-provider owner | linked — SMT/FOL tower; never pass |
| timeout | The bounded provider run exceeded its admitted time. | SMT-provider owner | linked — EVF runtime policy; never pass |
| proof-provider-required | The assessment routes the claim to a separately owned proof capability. | validation-governance-owner | no-match — new candidate classification |
| unsupported | The source is valid, but no exact admitted executable, solver, or proof profile matches its language or theory. | validation-governance-owner, with contributing profile owners | no-match — new candidate classification |
| indeterminate | Exact classification cannot conclude because evidence is missing, stale, contradictory, or inconclusive. | validation-governance-owner | no-match — narrowed candidate classification |

No term is promoted to a canonical glossary by this run.
