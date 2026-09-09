# Operations

| Operation | Inputs | Output | Invariants |
|---|---|---|---|
| `VerifyDomainSpecGraphInput` | exact FPR-01/02/03 receipts plus bounded FPR-04 `Sg`, quotient, and retraction receipts | immutable readiness/input handle or named block | read-only; missing/empty/mismatched evidence cannot pass |
| `ImportDomainSpecGraph` | verified readiness/input handle | unchanged imported nodes/relations/provenance | no feature-SPEC reconstruction; no local relation admission |
| `CompileProjection` | verified DomainSpec input, allowed non-DomainSpec manifest, pinned revisions, candidate schema, extractor version | immutable projection snapshot | deterministic; read-only; unresolved references explicit |
| `ValidateSourceRecords` | extracted records, anchors | source gate receipt | every record resolves; no source meaning rewritten |
| `ValidateRelations` | imported DomainSpec relations plus other source-local signatures/candidates | preserved admitted relations + attempted-relation residue | no imported edge changes; endpoint/mapping rejection never enters semantic export |
| `BuildSemanticView` | unchanged imported `Sg` plus validated other source-local material | deterministic private semantic bytes + hash | independent of learner/navigation material; not a DomainSpec authority claim |
| `BuildLearnerView` | stable IDs, focus questions, labeled propositions | learner materialization | no authority or semantic mutation |
| `BuildNavigationView` | stable IDs, prerequisites, journey policy | navigation materialization | every edge marked non-semantic |
| `PrecomputeLayout` | snapshot ID, semantic neighborhood, versioned policy | stable coordinates | deterministic ordering and policy versioning |
| `ServeReadQuery` | snapshot ID plus query parameters | immutable response + ETag | GET only; no authority action |
| `SelectLens` | stable selected ID, lens | equivalent spatial/hierarchy/table detail | selection preserved across lenses |
| `RunChallengeView` | record/claim ID | evidence, assumptions, counterevidence, route | does not adjudicate the challenge |
| `ConsumeDomainSpecEvidenceHandle` | exact `evf-l0-core` or `bte-core` handle plus contract/posture/freshness identities | verified read-only evidence envelope or named block | no upstream writes; exact IDs/provenance/digests; stage-specific handles; narrow receipt cannot satisfy breadth slot |
| `EmitIndependentConsumerReceipt` | verified evidence envelope plus IOLM snapshot, semantic/projection hashes, parity and negative results | fresh receipt matching `iolm-domainspec-evidence-consumer-receipt/v1` | IOLM owns only the consumer run; no predicate, `O_spec`, profile, FPR, release, production, or publication authority |

Mutation operations such as `Promote`, `EditSource`, `AdjudicateChallenge`, and `Publish` are forbidden in this package.
