# Stage 08 - Distill Repair

Status: pass
Capability: distill
Mode: validate
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Repair Decision

Accept the design with four repairs:

1. Name the owner-held unit: `authority_artifact_lifecycle_envelope`.
2. Treat ontology references as projections or candidate links only.
3. Add conflict and unknown-source blocking rules to the multi-provenance model.
4. Route discipline provenance to discipline-governance because disciplines do
   not yet have an import/source-ledger equivalent.

## Repaired Protocol

```text
SourceArtifact(s)
  -> import/evidence staging
  -> authority_artifact_lifecycle_envelope
  -> owning governance route
  -> owner decision / PromotionRecord
  -> authority artifact
  -> optional ontology projection/read model
```

Ontology may appear in two places:

- before promotion, as an ontology candidate that helps condense meaning and
  request an owner gate;
- after or beside owner state, as a generated/queryable projection of the
  lifecycle envelope.

Ontology does not sit between owner decision and authority artifact as an
authority gate.

## Recomposition Check

| Requirement | Result |
| --- | --- |
| Definitions can have many sources. | pass: source set lives in envelope and owner decision. |
| Constitutions can have many sources. | pass: source set plus conflict status can carry rule families and private/public posture. |
| Disciplines can have recurring-practice provenance. | flag: model supports it, but discipline-governance must add the import/source-ledger pattern. |
| Ontology can search and explain. | pass: ontology refs/projections are allowed. |
| Ontology cannot promote. | pass: owner gate and `PromotionRecord` stay outside ontology authority. |

## Verdict

Pass. The repair closes the design ambiguity. The remaining discipline source
ledger gap is a next route, not a blocker for this refine result.
