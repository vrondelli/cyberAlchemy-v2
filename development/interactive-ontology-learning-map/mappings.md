# Mappings

## Source-to-plane mapping

| Source object | Internal plane | Candidate projection form |
|---|---|---|
| Markdown file/revision/heading | L0 Source | `SourceArtifact`, `SourceAnchor` |
| Owner-produced DomainSpec `Sg` node | L1 Semantic | unchanged namespaced semantic record |
| Owner-produced DomainSpec `Sg` admitted relation | L1 Semantic | unchanged imported source-local relation |
| Missing/empty `Sg` or unapproved local mapping | L4 Operational + L2 Epistemic | blocking residue/challenge; excluded from semantic relations |
| Formal result or cited correspondence | L2 Epistemic | claim with proof domain/scope |
| CAV2 owner route/gate/decision | L3 Governance | referenced governance record; no inferred verdict |
| Craft context/artifact/condition/residue | L4 Operational | source-preserving operational record |
| Focus question/learn-next/layout | L5 Projection | learner/navigation/layout record |

## View mapping

The same stable ID may be referenced by multiple views, but only an admitted relation ID may enter `semanticView.relationIds`. Learner propositions and navigation edges have their own IDs and `semantic: false`. Layout coordinates are keyed by snapshot and layout-policy version and never enter semantic hashing.

## Witness mapping

| Witness row | Projection classification | Semantic export |
|---|---|---|
| Exact admitted edge from bounded FPR-04 `Sg` | `ImportedDomainSpecRelation` | yes, unchanged after receipt/import validation |
| Incompatible or unapproved local edge label | `AttemptedRelation` + residue (`EGI-010`) | no |
| Missing or empty required `Sg` | blocking input residue (`EGI-008`) | no |
| Node/field/direction/edge/quotient mutant | failed independent retraction receipt (`EGI-011`) | no |

Feature SPEC tables remain source anchors and learner explanation material. They
are not an alternate path for reconstructing admitted DomainSpec relations.
