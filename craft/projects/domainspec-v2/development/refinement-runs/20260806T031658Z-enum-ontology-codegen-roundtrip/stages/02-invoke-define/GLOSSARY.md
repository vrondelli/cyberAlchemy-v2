# Local Glossary — Architecture Realization

These definitions explain this refinement run. They do not promote terms into
the canonical DomainSpec or Arcanum vocabularies.

| Term | Plain meaning | Precise meaning here | Misuse warning |
| --- | --- | --- | --- |
| architecture realization | Turning a domain definition into an approved code shape | Deterministic mapping from an authorized definition through a target profile into source plus evidence | Not application generation or proof of business behavior |
| canonical Enum definition | The owner-approved statement of an Enum and its members | Portable semantic source carrying stable concept/member identity, values, provenance, and version | Generated or observed code cannot define it |
| architecture obligation | One thing the realization must prove | Stable-key expected property or relation bound to a definition and target profile | A test result is not the obligation |
| `A_spec` | The expected obligation set | Independently frozen `ArchitectureObligationCatalogue` | The generator cannot author it |
| recomposed obligations | What raw build and observation evidence actually supports | Exact obligation-key and metadata projection independently derived from raw handles | Count equality is insufficient |
| realization case | One instruction for one obligation | Pre-run object binding inputs, roles, expected phase/code, mutation family, and scope | It contains no pass/fail result |
| realization IR | The boundary between meaning and emitter | Versioned normalized record used by one or more language backends when evidence justifies it | Must not copy TypeScript syntax into portable ontology |
| emitter | The target source writer | Deterministic component that maps admitted realization data to source and provenance manifest | Cannot decide expected proof results |
| observation | What the adapter sees in code | Typed facts and diagnostics projected from real source with provenance | Cannot establish canonical meaning |
| independent evaluator | The component judging conformance | Evaluator that consumes frozen expectations and allowlisted raw evidence without generator imports | Separate file alone does not prove independence |
| causal mutation | A deliberate defect with one intended failure | Fresh child-lineage change with declared obligation, phase, diagnostic, and semantic delta | Any failure or wrong-reason death is not a kill |
| proof receipt | Bounded evidence envelope | Digest-bound record over obligation, result, mutation, tool, and scope handles | Cannot admit or promote itself |
| replay | Recomputing the proof independently | Verification of raw bytes, bindings, joins, scopes, mutations, and receipt digest | Re-reading a pass field is not replay |

