# Lean Ontology Evidence Compiler Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `69641073ff96d5a3d58c265e2cc6e132749dcc206474306537c051dc664db16a`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `lean-ontology-evidence-compiler.CandidateTypedEdge` | Value Object | Carry one proposed directed source-kind, predicate, and target-kind triple without treating it as an admitted ontology relation. |
| `lean-ontology-evidence-compiler.EvidencePackage` | Entity | Preserve one immutable validation request, its exact Lean bindings, candidate edge, selected direction rule, and authority ceiling. |
| `lean-ontology-evidence-compiler.LeanDeclarationBinding` | Value Object | Identify one exact Lean declaration by repository, commit, path, blob, qualified name, declaration kind, line, and declaration-line digest. |
| `lean-ontology-evidence-compiler.OntologyEvidenceCompilerInterface` | Interface | Expose one technology-neutral local read-only typed-edge validation operation without selecting network transport or external effects. |
| `lean-ontology-evidence-compiler.TypedEdgeValidationResult` | Value Object | Return deterministic candidate status, rejection codes, request digest, resolved selector names, claim ceiling, and authority effect none. |
| `lean-ontology-evidence-compiler.ValidateTypedOntologyEdge` | Query | Validate exact Lean declaration closure and the selected typed-edge direction rule without mutating sources or granting authority. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `lean-ontology-evidence-compiler.edge.interface-exposes-validate` | `lean-ontology-evidence-compiler.OntologyEvidenceCompilerInterface` | `exposes` | `lean-ontology-evidence-compiler.ValidateTypedOntologyEdge` |
| `lean-ontology-evidence-compiler.edge.package-contains-binding` | `lean-ontology-evidence-compiler.EvidencePackage` | `contains` | `lean-ontology-evidence-compiler.LeanDeclarationBinding` |
| `lean-ontology-evidence-compiler.edge.package-contains-edge` | `lean-ontology-evidence-compiler.EvidencePackage` | `contains` | `lean-ontology-evidence-compiler.CandidateTypedEdge` |
| `lean-ontology-evidence-compiler.edge.package-contains-result` | `lean-ontology-evidence-compiler.EvidencePackage` | `contains` | `lean-ontology-evidence-compiler.TypedEdgeValidationResult` |
| `lean-ontology-evidence-compiler.edge.validate-reads-package` | `lean-ontology-evidence-compiler.ValidateTypedOntologyEdge` | `reads` | `lean-ontology-evidence-compiler.EvidencePackage` |

This file is generated; edit machine sources and rebuild.
