---
tags: [ontology, pipeline, architecture]
node_type: discovery
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-04-07
timestamp: 2026-04-07T21:00:00-03:00
expires: 2026-06-06
conversation_id: k7m3p
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Corrected a silent data loss bug rendering the ontology graph structurally empty since pipeline inception, and produced the first operational visualization of the full ontology."
---

# Edge Extraction Fix & Ontology Visualization

**Date:** 2026-04-07 21:00 (UTC-3)
**Tags:** #ontology #pipeline #architecture

## Summary

This session addressed a critical gap in the ontology extraction pipeline: the edge parser was silently dropping all relationship edges from the dictionary files. Investigation revealed that the `EDGE_PATTERN` regex in `dictionary_extractor.py` only matched forward arrows (`→`/`->`), but the dictionaries extensively use reverse arrows (`←`) for relationships like `` `contained-by` ← Remessa ``. The fix updated the regex to capture both directions and handle parenthetical descriptions that follow each edge target.

After the fix, the registry went from 0 edges to 116 edges across 48 terms, with 114 resolving to known nodes. Two new test cases were added covering reverse and mixed-direction edges, and all 13 extractor tests pass.

Additionally, a standalone force-graph visualization (`ontology-explorer.html`) was created to make the operational ontology browsable — showing all terms as nodes colored by prefix (biz/sys), with directional edges, a sidebar search, and a click-to-inspect detail panel. A graph JSON file was also generated with short-name-to-full-name resolution logic to ensure edge targets map correctly to node IDs.

## Epistemic Impact

The implicit belief was that the extraction pipeline was producing a complete ontology registry. This session revealed the registry had 0 edges due to a silent regex failure — the entire operational ontology was structurally incomplete since the pipeline was first built. The `EDGE_PATTERN` regex was not aligned with actual dictionary syntax (reverse arrows `←` are the dominant relationship direction).

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `tools/ontology/extractors/dictionary_extractor.py` | Modified | `EDGE_PATTERN` regex extended to match `←`/`<-` in addition to `→`/`->`; was silently dropping all edges |
| `tools/ontology/tests/test_dictionary_extractor.py` | Modified | Two new test cases for reverse and mixed-direction edges |
| `generated/ontology-registry.json` | Regenerated | Edge count went from 0 to 116 across 48 terms |
| `generated/ontology-graph.json` | Created | Force-graph-compatible JSON with short-name resolution |
| `generated/ontology-explorer.html` | Created | Interactive force-graph visualization with sidebar search and detail panel |

## Connections

- contextualizes `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md`
- contextualizes `specs/ontology/docs/data-foundations/implementation-plan-extraction-pipeline.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Investigate 2 unresolved edge targets (not found in known nodes) | Session finding | Medium | Open |
| Add CI step to fail if edge count drops below threshold | Session insight: 0-edge bug went undetected | Medium | Open |
| Add regression test with real dictionary fixture excerpts | Session gap | Medium | Open |

## Open Questions

- Should the visualization be promoted to a stable location outside `generated/`, or is it fine as a CI artifact?
