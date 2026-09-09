---
tags: [pipeline, ccb, vault]
node_type: spec
is_session: true
layer: [domain, application]
nature: [technical, explanatory]
status: active
created: 2026-03-20
timestamp: 2026-03-20T13:47:00-03:00
expires: 2026-05-19
conversation_id: bd71a9f3-5ad4-4d6e-928a-977166d01e07
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/upload-flow-diagram.md"]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Refined the Remessa Upload pipeline flowchart by establishing correct Mermaid alignment, introducing non-XSS HTML tooltips, and rewriting the business rules documentation for clarity."
---

# Remessa Upload Flowchart Tuning

**Date:** 2026-03-20 13:47 (UTC-3)
**Tags:** #pipeline #ccb #vault

## Summary
The session focused on refining the Mermaid flowchart for the Document Upload and Processing Pipeline. The primary issue was that the layout stacked flow phases horizontally rather than vertically, and start nodes were unaligned. We solved this by using `flowchart TB` for the main canvas, `direction LR` for subgraphs, and joining subgraphs directly (`Fase1 ==> Fase2`) to force flawless X-axis alignment without node-skewing. Furthermore, since standard interaction tooltips (`click`) get blocked by strict Markdown viewers due to XSS protection, we implemented native hover tooltips directly inside the node labels using `<span title="...">`. Finally, the textual documentation defining each pipeline decision—especially the new global Universal Matching and company inference—was fully rewritten to replace corporate jargon with direct developer-level terminology.

### Mermaid Flowchart Alignment
- **Problem/Goal:** The user wanted the flowchart stages stacked vertically with internal flows horizontal, ensuring all initial phase starting points aligned perfectly on the X-axis. Previous configurations misaligned nodes.
- **Decision:** Shift layout to `flowchart TB` with embedded `direction LR` subgraphs. Prevent cross-node connections between subgraphs (`F1_End ==> F2_Start`) and use direct subgraph chaining (`Fase1 ==> Fase2`) to guarantee rigid left-alignment of the inner node blocks.
- **Changes:** Updated `upload-flow-diagram.md` with the new Mermaid layout.

### Native Node Tooltips
- **Problem/Goal:** Traditional Markdown viewers often refuse to execute Mermaid `click` interaction actions for tooltips.
- **Decision:** Move tooltip payloads into standard `title` attributes within `<span>` tags embedded natively inside the shape titles.
- **Changes:** Integrated `<span title='...'>Node Title</span>` inside the decision nodes (`{}`) in the flowchart logic.

### Technical Documentation Refinement
- **Problem/Goal:** The initial description of the decisions was unclear, verbose ("consultês"), and omitted recent Universal Match business logic additions.
- **Decision:** Explain the pipeline stages directly in developer terminology, outlining the precise triggers and logical criteria. Included the fallback sequence that infers the generating company and performs layout-agnostic parsing.
- **Changes:** Rewrote the entire documentation body in `upload-flow-diagram.md`.

## Key Decisions
- **Visualization:** Connected subgraphs holistically (`Fase1 ==> Fase2`) to manipulate the Force layout into vertical block stacking, achieving a perfect left alignment of internal flow starts.
- **UX Security:** Skipped `click` URL assignments and favored pure HTML injection via `<span>` into the Mermaid vertex label block, allowing naive viewers to offer tooltips securely.
- **Business Logic Coverage:** Updated the flow spec documentation explicitly to cover Universal Matching (company inference alongside regex fallback) and the exact parameters forming cross-check alignment.

## Files Changed 

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Fully replaced with adjusted Mermaid layout (nested TB/LR + span tooltips) and rewritten business rules plain-text definitions. |
