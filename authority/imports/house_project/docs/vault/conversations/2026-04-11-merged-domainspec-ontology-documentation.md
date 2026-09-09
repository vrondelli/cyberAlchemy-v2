---
tags: [domainspec, ontology, domain-tagging, pipeline, specification-driven-development]
node_type: discovery
is_session: true
layer: ontology, architecture
nature: procedural, reference
status: active
created: 2026-04-11
timestamp: 2026-04-11T14:00:00-03:00
expires: 2026-06-10
conversation_id: merged-domainspec
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Established DomainSpec as operational methodology with concrete pipeline (spec.yaml generation), 164% growth in tagged functions, and architectural decisions that govern all future domain documentation."
---

# DomainSpec & Ontology — Setup to Pipeline Implementation

## Summary

Four sessions over April 10-11 took DomainSpec from concept to operational pipeline. Created framework docs and ran a 61% alignment audit, designed feature-centric documentation with per-domain SPEC.md files, implemented domain tagging in the database (domain column on embedding_anchor, 105 anchors tagged), and built the @edge tag architecture with a generated spec.yaml pipeline that grew tagged functions from 11 to 29 and ontology anchors from 11 to 122. Key architectural decision: spec.yaml is generated from code tags + dictionary + GitNexus, never hand-maintained.

## Files touched

- `specs/ontology/docs/domainspec/` (INDEX.md, README.md, FRAMEWORK.md, ALIGNMENT.md, TIER-1/2/3 plans)
- `EmbeddingAnchorRecord` model — added `domain` field
- `embedding_anchor` table — added `domain` column + index
- Registry builder — added `_infer_domain_from_file_path()`
- Per-domain `spec.yaml` (generated output)
- `specs/ontology/possible_constitutions/domainspec/domainspec-workflow-constitution.md`
- `docs/vault/dictionary-business.md` (4 new terms: Identificacao, Holerite, Averbacao, Antifraude)
- `document_validation` domain files (18 new @biz/@sys tags)
