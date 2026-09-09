---
tags: [extraction-pipeline, mermaid, flowchart]
node_type: spec
is_session: true
layer: ontology
nature: explanatory
status: active
created: 2026-04-07
timestamp: 2026-04-07T12:00:00-03:00
expires: 2026-06-06
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md]
promoted_candidates: []
expected_importance: 3
importance_rationale: "Improved diagram clarity and doc structure but introduced no new architectural understanding — a presentation refinement."
---

# Extraction Pipeline Mermaid Flow

**Date:** 2026-04-07 12:00 (UTC-3)
**Tags:** #extraction-pipeline #mermaid #flowchart

## Summary

Short session adding a Mermaid flowchart to the extraction pipeline discovery doc. The first version was too complex — 7 subgraphs (Sources, Extractors, Validation, Registry, Trigger, CI/CD, Embedding) with 15 nodes made it hard to follow the actual execution sequence.

The diagram was simplified to an 8-node linear flow: commit → changed? → extractors (parallel) → orphan check → registry → embed → pgvector. Documentation was rewritten as a sequential narrative (starts at commit, ends at semantic search) instead of glossary-style sections.

Minor workflow issue: edits were initially applied to worktree branch `claude/serene-bohr` instead of `main` — user wanted changes on main directly.

## Epistemic Impact

No foundational beliefs challenged. The conceptual understanding of the pipeline did not change — only its representation. The rewrite from glossary-style to sequential narrative makes the doc easier to navigate.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md` | Modified | Replaced 7-subgraph/15-node Mermaid diagram with 8-node linear flow; restructured documentation from glossary to sequential narrative |

## Connections

- contextualizes: `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md`
