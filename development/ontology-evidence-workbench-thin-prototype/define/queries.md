# Queries: OEW Thin Prototype

## PokerEvidenceJourney

**Type:** Query (read-only)  
**Actor:** evidence reviewer

### Input

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| runId | string | yes | Exact admitted adapter run |
| selectedSourceRef | enum | yes | Opens at `F1` |
| surface | enum | yes | graph, outline, or table |

### Output

| Field | Source | Meaning |
| --- | --- | --- |
| trust status | adapter receipt | Exact source/run identity |
| grounding path | graph plus sidecar | F1 → R1 → D1 |
| conflict residue | graph plus sidecar | D2 remains visible |
| source identity | sidecar | Poker-Team path and digest |
| authority effect | sidecar/receipt | Always `none` |

### Invariants

- Graph, outline, and table preserve the same selected source reference.
- Unknown deep links recover visibly to F1.
- A failed bundle validation renders no graph behind the error.
- No view exposes edit, accept, promote, or publish actions.
