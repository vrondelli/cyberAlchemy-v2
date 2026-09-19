# Glossary — FormalClaim Logic-Semantics and FOL Profile Extension @2

| Term | Plain meaning | Owner | Status |
| --- | --- | --- | --- |
| `FormalClaim` | One exact formal statement plus the selected semantics needed to interpret it. | formal-claims owner | existing candidate node, extended by this successor |
| logic-semantics profile | A contract describing what a statement means; FOL is one possible family, not all logic. | formal-claims owner for selected claim use; profile owner for profile contract | candidate |
| many-sorted FOL with equality | First-order logic with typed sorts, terms, predicates, equality, and first-order quantifiers. | FOL profile owner and formal-claims owner for use | candidate source profile |
| capability assessment | Immutable statement of what exact admitted downstream profiles can soundly do with one claim. | validation governance | candidate |
| `executable_profile` | A downstream profile used to classify or project a claim for execution; never source meaning. | validation governance/profile owner | assessment-only |
| executable projection | Digest-bound bounded representation with declared purpose, preservation direction, domain, assumptions, and evidence. | validation governance | candidate |
| DS-SFOL authority migration | Future rule making DS-SFOL `body.logic` a projection of one FormalClaim instead of a second authority. | formal-claims, DS-SFOL, node-schema, migration, and validation owners | proposed, unapplied |
| `formalizes` | Authored relation from FormalClaim to BusinessMeaning. | formal-claims owner with separate business-fidelity acceptance | existing candidate direction |
| `derived_from` | Authored relation from ProofObligation to FormalClaim. | validation governance | existing candidate direction |
| EVF evidence handle | Immutable bounded join over exact source, obligation, request, provider/factory evidence, currentness, and ceiling. | EVF evidence owner | planned, absent |
| provider | Versioned solver/checker implementation that owns its native result semantics. | provider owner | family-specific |
| factory | Lifecycle owner for provider selection from a registry, lock, run, replay, verification, currentness, and evidence publication. | architecture-conformance factory owner | implemented lifecycle; this seam unbound |
| theorem-provider lane | Separate route for proof evidence over exact assumptions and obligations. | proof-provider owner | designed/planned, absent here |
| `sat` | A model exists for the exact encoded query and profile; at most a candidate witness/counterexample. | provider and EVF interpretation owners | bounded evidence only |
| `unsat` | No model exists for the exact encoded query and profile; not automatically a global theorem. | provider and EVF interpretation owners | bounded evidence only |
| non-pass | Unsupported, unknown, timeout, malformed, stale, incomplete, identity-mismatched, or ceiling-inflated evidence. | producing and consuming validators | must fail closed |
| capability state | One of current evidence, validated design, planned contract, or absent implementation. | artifact owner with independent validator | non-collapsing status |

No glossary term is promoted by this Refresh.
