# Glossary — FormalClaim Multi-Formalism and Lean Extension @3

| Term | Plain meaning | Owner | Status |
| --- | --- | --- | --- |
| `FormalClaim` | One exact canonical formal proposition plus the selected semantics needed to interpret it. | formal-claims owner | candidate extension |
| formal-language profile | Versioned interpretation contract for one formal language, such as many-sorted FOL or Lean dependent type theory. | profile owner; formal-claims owner selects it | candidate |
| dependent type theory | Lean's proof foundation, where propositions are types and proofs are terms; distinct from DomainSpec endpoint typing. | Lean/provider foundation owner | admitted source-profile candidate |
| source proposition identity | Environment-bound digest of the canonical proposition/type; never only pretty text, path, or theorem name. | formal-claims/profile owner | candidate |
| proof declaration identity | Exact Lean declaration and elaborated type inspected as provider evidence; not source meaning. | Lean provider owner | planned |
| `FormalClaimLeanBinding/v1` | Exact bridge from a native or translated FormalClaim proposition to one Lean theorem request. | formal-claims and proof-provider boundary owners | planned |
| native Lean binding | Direct binding when the FormalClaim source already selects Lean/DTT. | formal-claims owner | planned path A |
| translated Lean binding | Accepted semantic mapping from a non-Lean source proposition to a Lean proposition. | source, mapping, and formal-claims owners | planned path B |
| category-model profile | Admission record specifying objects, morphisms, equality, identities, composition, laws, interpretation, owner, ceiling, and counterexamples. | model-profile owner | planned |
| typed-graph fragment | A graph with endpoint typing but no global category-law claim. | DomainSpec relationship owner | current-safe classification |
| `SchemaInstance` profile | Bounded category model where schemas are small categories and instances are functors into `Type`. | Lean formalization owner | existing proof substrate, not yet EVF-admitted |
| `LeanProviderManifest/v1` | Planned exact admission of one Lean toolchain/project/provider boundary. | provider lifecycle owner | planned |
| `LeanTheoremRequest/v1` | Exact request binding obligation, proposition, declaration target, environment, assumptions, and ceiling. | EVF/proof-provider boundary owner | planned |
| `LeanTheoremReceipt/v1` | Exact build, theorem-type, axiom-closure, currentness, and result evidence. | Lean provider owner | planned |
| theorem-checked | Exact requested proposition checked under the declared Lean environment and allowed axioms. | Lean provider and EVF interpretation owners | planned bounded outcome |
| runtime conformance | Separate evidence connecting the formal model to exact current parser, adapters, runtime, deployment, and observations. | runtime/conformance owner | separate future lane |
| `formalizes` | Authored relation from FormalClaim to BusinessMeaning. | formal-claims owner plus business-fidelity acceptance | existing candidate direction |
| `derived_from` | Authored relation from ProofObligation to FormalClaim. | validation governance | existing candidate direction |
| research input | Candidate evidence that can inform a claim or model; never proof or ontology authority by itself. | research owner | non-authority |

No definition, ontology, provider, proof, or runtime surface is promoted by this candidate.
