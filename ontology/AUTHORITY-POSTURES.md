# Authority Postures

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

Authority postures describe how a source, candidate, artifact, or projection
may be relied on. They are reviewable model concepts, not tags that grant trust.

## Posture Contract

| Field | Meaning |
| --- | --- |
| `posture_id` | Local identifier. |
| `label` | Human-readable posture. |
| `applies_to` | Source, candidate, artifact, projection, or runtime evidence. |
| `allowed_use` | What the posture permits. |
| `blocked_use` | What the posture forbids. |
| `owner_route` | Who may change the posture or promote it. |

## Candidate Postures

| Posture ID | Label | Applies to | Allowed use | Blocked use |
| --- | --- | --- | --- | --- |
| `posture.original-authority` | Original Authority | source artifact | Cite as source authority for its own scope. | Treat as v2 authority without import/promotion. |
| `posture.evidence` | Evidence | source, validation, runtime, research | Support candidates and gates. | Replace owner decision. |
| `posture.template` | Template | pattern or scaffold source | Reuse structure with attribution. | Copy semantics as canon. |
| `posture.research` | Research | findings, reviews, audits | Support design and owner review. | Become spec or definition automatically. |
| `posture.generated` | Generated Projection | generated mirror/read model | Search, navigation, projection after trace. | Canonical source. |
| `posture.private-evidence` | Private Evidence | parent/private source | Local reasoning under boundary. | Public artifact without scrub. |
| `posture.public-framework` | Public Framework | public Arcanum source | Public-safe framework evidence. | Private v2 authority by proximity. |
| `posture.unknown` | Unknown | unresolved source | Flagged staging only. | Promotion or public reuse. |

## Public/Private Rule

Any posture that touches private implementation evidence, validation evidence,
telemetry, sessions, or parent-local research must route through decision-gate
before public use.

## Confidence Boundary

Posture is not confidence. Confidence records evidential strength or commitment
strength. Posture records allowed reliance and boundary.
