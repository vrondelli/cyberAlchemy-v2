# Worked Example: Poker Team Financial-Settlement Evidence

Status: proposed fixture contract
Source system: `validation/poker-team/`
Feature slice: `financial-settlement`

## Why This Example

Poker Team has a real, bounded mismatch that exercises the prototype without
inventing ontology truth:

- the O13 observability contract declares
  `business.avg_settlement_value` and
  `business.preview_before_settlement` as Gauges;
- the backend registers both as Histograms;
- the static observability audit records both type mismatches;
- the pipeline retains O8/O13 residue and ends at `FLAG`.

The ontology-oriented prototype should preserve this evidence lineage and
conflict. It must not decide whether Gauge or Histogram is semantically
correct; that remains with Poker Team's finance/backend observability owners.

## Source Bindings

| ID | Selector | Role | SHA-256 |
| --- | --- | --- | --- |
| `PT-SPEC` | `validation/poker-team/docs/features/financial-settlement/SPEC.md` | Feature and owner context | `10bcc4df404d4c43e0892153bf7daa8e7a037263d07b60acb1d9785e0423ae8b` |
| `PT-O13` | `validation/poker-team/docs/features/financial-settlement/observability.md` | Declared Gauge contracts | `7eba11d386d9425a9f57d20c062e33dca5c49256665293cfd21acef1864f4513` |
| `PT-CODE` | `validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts` | Runtime Histogram registrations | `6e1342c11a7d51f2c52b81f376da04da61166bf40b5cc170ac584a66a4cdba45` |
| `PT-AUDIT` | `validation/poker-team/docs/features/financial-settlement/OBSERVABILITY-REPORT.md` | Static comparison and typed mismatches | `2b9be4aae087ecc50b1bff451e86c13edd4411678311d8fb3b09c083afe50c39` |
| `PT-FINDINGS` | `validation/poker-team/docs/features/financial-settlement/PIPELINE-REPORT.md` | Pipeline synthesis and final `FLAG` | `4a1741cf93fa548d12c1d8a117a86170624c4d63df3d071d381ed2d429d418dc` |

## Candidate Evidence Nodes

The node kinds remain the finite prototype's four Evidence kinds. Poker Team
domain concepts such as `SettlementResult`, `GenerateSettlement`, and
`GetSettlementPreview` stay inside claims and source references; they do not
become newly admitted ontology kinds.

```json
{
  "schema_version": "candidate-v1",
  "nodes": [
    {
      "node_id": "S1",
      "kind": "session",
      "label": "Assemble the Poker Team financial-settlement evidence fixture"
    },
    {
      "node_id": "D1",
      "kind": "discovery",
      "label": "O13 declares avg settlement value and preview ratio as Gauges",
      "source_refs": ["PT-SPEC", "PT-O13"]
    },
    {
      "node_id": "R1",
      "kind": "research",
      "label": "Static audit compares the O13 declarations with backend instruments",
      "source_refs": ["PT-O13", "PT-CODE", "PT-AUDIT"]
    },
    {
      "node_id": "F1",
      "kind": "findings",
      "label": "Two O13 instrument-type mismatches remain; pipeline verdict is FLAG",
      "source_refs": ["PT-AUDIT", "PT-FINDINGS"]
    },
    {
      "node_id": "D2",
      "kind": "discovery",
      "label": "Backend registers both O13 instruments as Histograms",
      "source_refs": ["PT-CODE"]
    }
  ],
  "edges": [
    {"edge_id": "E1", "source": "S1", "predicate": "creates", "target": "D1"},
    {"edge_id": "E2", "source": "S1", "predicate": "creates", "target": "R1"},
    {"edge_id": "E3", "source": "R1", "predicate": "derives-from", "target": "D1"},
    {"edge_id": "E4", "source": "F1", "predicate": "derives-from", "target": "R1"},
    {"edge_id": "E5", "source": "D2", "predicate": "contradicts", "target": "D1"}
  ]
}
```

`creates` refers to creation of the candidate evidence nodes inside the
proposed fixture, not authorship of the underlying Poker Team source files.
Every full fixture node also carries the governance fields required by
`../define/domain.md#candidatenode`.

## Separate Relation Candidate

This candidate asks whether the runtime instrumentation discovery is a
specialization of the declared O13 contract:

```json
{
  "candidate_id": "C-SPECIALIZES-D2-D1",
  "source": "D2",
  "predicate": "specializes",
  "target": "D1",
  "expected_disposition": "policy-indeterminate",
  "expected_reason": "POLICY_OWNER_UNBOUND",
  "authority_effect": "none"
}
```

The relation may sound plausible, but this prototype has no enacted
`specializes` policy or owner. It therefore cannot enter `edges` or affect the
grounding closure.

## Expected Machine Result

```json
{
  "graph_disposition": {
    "disposition": "policy-pass",
    "reason": "POLICY_RULES_SATISFIED",
    "authority_effect": "none"
  },
  "candidate_dispositions": [
    {
      "candidate_id": "C-SPECIALIZES-D2-D1",
      "disposition": "policy-indeterminate",
      "reason": "POLICY_OWNER_UNBOUND",
      "authority_effect": "none"
    }
  ],
  "grounding_closure": {
    "nodes": ["D1", "R1", "F1"],
    "edges": ["E3", "E4"]
  },
  "non_composing_conflicts": ["E5"]
}
```

The graph can pass its finite structural policy while still preserving a real
domain conflict. `policy-pass` does not mean the Poker Team mismatch is
resolved.

## Expected Human View

```text
Poker Team / financial-settlement evidence

F1  Two O13 instrument-type mismatches remain; pipeline verdict FLAG
└─ derives-from R1  Static audit compares contract with backend
   └─ derives-from D1  O13 declares both instruments as Gauge

Conflict annotation
D2  Backend registers both instruments as Histogram
└─ contradicts D1                         [excluded from grounding closure]

Unruled candidate
D2 specializes D1                         POLICY-INDETERMINATE
Reason                                    POLICY_OWNER_UNBOUND

Authority effect                          NONE
Next owner                                Poker Team finance/backend observability
```

## Live Adjacent Verification

The existing Poker Team financial-settlement use cases were checked without
mutating that repository:

```text
Test files: 2 passed
Tests:      11 passed
```

Covered sources:

- `backend/src/use-cases/financial-settlement/generate-settlement.test.ts`
- `backend/src/use-cases/financial-settlement/get-settlement-preview.test.ts`

This confirms the selected execution and read-model use cases currently run. It
does not resolve the O13 Gauge/Histogram conflict and does not execute the
ontology candidate-graph prototype, which remains unimplemented.

## Negative Mutations

The same structural negatives remain useful over this concrete fixture:

| Case | Mutation | Diagnostic |
| --- | --- | --- |
| wrong direction | `R1 derives-from F1` | `EDGE_ENDPOINT_PAIR_FORBIDDEN` |
| grounding cycle | add `D1 derives-from R1` | `GROUNDING_CYCLE` |
| session claim | `S1 contradicts D1` | `SESSION_CLAIM_FORBIDDEN` |
| session as evidence | `D1 derives-from S1` | `SESSION_EVIDENCE_FORBIDDEN` |
| stored inverse | `F1 created-by S1` | `INVERSE_EDGE_DECLARATION` |

## What This Demonstrates

The example keeps five things separate:

1. Poker Team source contracts and runtime code;
2. candidate Evidence nodes that cite those sources;
3. a policy-valid grounding lineage;
4. a preserved, non-composing contract/runtime contradiction;
5. an indeterminate semantic relation that still needs an owner.

That separation is the useful prototype behavior. A generic document index or
schema validator would not preserve all five.
