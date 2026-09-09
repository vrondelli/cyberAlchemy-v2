# Domain Model

## Core Records

| Record | Meaning | Authority |
| --- | --- | --- |
| `VerifiedRunHandle` | immutable path, run ID, receipt digest, verifier version, and pass result | evidence admission into OEW only |
| `SourceEvidenceNode` | exact candidate item with original kind, ID, claim, and source refs | candidate run bundle |
| `SourceEvidenceEdge` | exact candidate relation, direction, policy result, and diagnostics | candidate run bundle |
| `PresentationNode` | Understand-Anything-compatible visual projection | OEW read model |
| `PresentationEdge` | generalized layout/search relation plus sidecar pointer | OEW read model |
| `EvidenceSidecar` | lossless mapping from presentation objects to exact source facts | OEW adapter evidence |
| `ViewState` | filters, selected object, mode, and tour step | ephemeral local UI state |
| `CodeContextNode` | optional UA-generated file/function/class fact | external code-context lane only |
| `EvidenceCodeLink` | explicit reviewed mapping between evidence and code context | candidate mapping, never semantic admission |

## Namespaces

- `evidence:*` — exact candidate graph nodes and relations.
- `presentation:*` — generalized UA-compatible objects.
- `code:*` — optional Understand-Anything code graph objects.
- `view:*` — ephemeral interface state.
- `receipt:*` — verifier and adapter evidence.

Namespace crossing requires an explicit mapping record. Shared visual proximity
is not a relation.

## Invariants

1. Every presentation object has exactly one source or explicit aggregate
   mapping.
2. Exact candidate relation and generalized presentation type are distinct
   fields.
3. `authority_effect` is always displayed and must remain `none` for admitted
   L0 input.
4. A policy-indeterminate edge cannot receive an admitted/verified visual
   status.
5. Code-context nodes never enter evidence grounding closure.
6. View state is not durable evidence.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
