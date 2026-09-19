# Glossary Consistency — FormalClaim Lean/EVF @3

Status: pass for candidate authoring; no promotion

| Term | Define use | Design use | Result |
| --- | --- | --- | --- |
| FormalClaim | one canonical proposition and selected semantics | source payload | consistent |
| formal-language profile | FOL, Lean/DTT, or separately admitted family | source-profile binding | consistent |
| source proposition | canonical environment-bound meaning | separate from declaration/proof | consistent |
| theorem declaration | evidence target | request/receipt identity only | consistent |
| type theory | Lean proof foundation | provider/source formalism | distinct from DS-D8 endpoint typing |
| category theory | optional admitted local model | category profile | not global EVF/DomainSpec structure |
| native Lean binding | direct source-to-request path | path A | consistent |
| translated Lean binding | governed semantic projection | path B | consistent |
| theorem-checked | bounded formal proof outcome | EVF provider receipt | not runtime conformance/discharge |
| `formalizes` | FormalClaim to BusinessMeaning | unchanged canonical direction | consistent |
| `derived_from` | ProofObligation to FormalClaim | unchanged canonical direction | consistent |

Collision checks pass: `SchemaInstance.Schema`, residue predicate schema, and
tower predicate category remain distinct; graph endpoint type-checking is not
Lean's foundational type theory; a theorem name is not proposition identity;
research wording is not proof evidence.

No canonical glossary or ontology bytes change.
