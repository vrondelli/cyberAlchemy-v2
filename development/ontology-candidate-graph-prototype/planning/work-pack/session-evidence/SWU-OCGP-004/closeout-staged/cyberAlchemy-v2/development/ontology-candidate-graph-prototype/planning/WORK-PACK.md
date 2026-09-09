---
work_pack_id: WP-OCGP-001
status: implementation-in-progress
complexity: medium
output_mode: split
selected_swu: none
implementation_authorized: false
---

# Ontology Candidate Graph Prototype Work Pack

## Control Fields

| Field | Value |
| --- | --- |
| `workPackGateStatus` | `SWU-OCGP-004` completed; series controller may open `SWU-OCGP-005` from captured user authorization |
| `artifactAuthored` | true |
| `registryReleased` | false |
| `mutationRuntimeReady` | false |
| `closeoutSyncStatus` | `SWU-OCGP-004` synchronized by `invoke:refresh:apply-approved` |
| `activeLayerWindow` | policy complete; projection next |
| `recommendedFirstSWU` | completed through `SWU-OCGP-004`; next candidate: `SWU-OCGP-005` |
| `executionPackRef` | [`EXECUTION-PACK.md`](EXECUTION-PACK.md) |
| `layeringRef` | [`IMPLEMENTATION-LAYERING.md`](IMPLEMENTATION-LAYERING.md) |
| `manifestRef` | [`work-pack/swu-manifest.json`](work-pack/swu-manifest.json) |
| `claimCeiling` | private finite candidate-graph prototype planning only |

## Objective

Create the smallest runtime witness that can answer, reproducibly and without
authority inflation:

1. whether a finite four-kind candidate graph satisfies a named closed policy;
2. why the result is pass, fail, or indeterminate;
3. what admitted evidence lineage is projected; and
4. whether the run left governed inputs unchanged.

## Delivery Boundary

Future private implementation root:

`cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/`

Node 22 ESM and built-in modules only. The plan creates no writer outside a new
run directory. These namespaces are forbidden to every SWU:

- `cyberAlchemy-v2/ontology/**`
- `cyberAlchemy-v2/authority/**`
- `validation/poker-team/**`
- `arcanum/**`
- `.arcanum/inventory/**`
- any IOLM or promotion state

## Task Board

| Task | Layer | SWUs | Dependency | Contract |
| --- | --- | --- | --- | --- |
| `TASK-OCGP-CARRIER-001` | L0A | `001` | approved Plan + Task Session selection | [`task`](work-pack/tasks/TASK-OCGP-CARRIER-001.md) |
| `TASK-OCGP-GRAPH-001` | L0B | `002`, `003` | L0A, then ordered internal dependency | [`task`](work-pack/tasks/TASK-OCGP-GRAPH-001.md) |
| `TASK-OCGP-POLICY-001` | L0C | `004` | L0B | [`task`](work-pack/tasks/TASK-OCGP-POLICY-001.md) |
| `TASK-OCGP-PROJECTION-001` | L0C | `005` | policy disposition | [`task`](work-pack/tasks/TASK-OCGP-PROJECTION-001.md) |
| `TASK-OCGP-EVIDENCE-001` | L1/L2 | `006`, `007`, `008` | L0C, then explicit per-SWU dependencies | [`task`](work-pack/tasks/TASK-OCGP-EVIDENCE-001.md) |
| `TASK-OCGP-VERIFY-001` | closure | none; closeout-only exemption | all nine terminal receipts | [`task`](work-pack/tasks/TASK-OCGP-VERIFY-001.md) |

## Atomic SWU Board

| SWU | One primary behavior | Status | Deterministic successor candidate |
| --- | --- | --- | --- |
| `SWU-OCGP-001` | parse and validate the closed candidate-v1 carrier | completed; terminal receipt pass | `002` |
| `SWU-OCGP-002` | enforce declared edge endpoint and inverse rules | completed; terminal receipt pass | `003` |
| `SWU-OCGP-003` | compute grounding closure and reject grounding cycles | completed; terminal receipt pass | `004` |
| `SWU-OCGP-004` | return one typed finite policy disposition | completed; terminal receipt pass | `005` |
| `SWU-OCGP-005` | project admitted research lineage without conflict composition | dependency-ready successor candidate | `006` |
| `SWU-OCGP-006` | write one canonical create-only run bundle | dependency-blocked | `007` |
| `SWU-OCGP-007` | attest protected-input digest preservation and denied write | dependency-blocked | `008` |
| `SWU-OCGP-008` | independently verify one terminal run bundle | dependency-blocked | `009` |
| `SWU-OCGP-009` | compare canonical bodies across two fresh equivalent runs | dependency-blocked | closure task |

“Successor candidate” means the only next dependency-ready unit that may be
offered for explicit human selection. It is never auto-selected or auto-run.

## Poker Team Worked Acceptance

The planned positive case copies the Design’s synthetic O13 settlement facts:

- `S1` evaluation session;
- `D1` observability report;
- `R1` monitoring decision;
- `F1` gauge implementation;
- `D2` contradictory histogram evidence.

Grounding closure is `F1 → R1 → D1`. `D2 contradicts D1` remains visible but
does not compose into the lineage. The positive expected disposition is
`policy-pass`; a separate `specializes(D2,D1)` witness must return
`policy-indeterminate/POLICY_OWNER_UNBOUND`.

This is a candidate-graph example. It neither repairs nor accepts Poker Team.

## Gates

| Gate | Condition | On failure |
| --- | --- | --- |
| `G-OCGP-SELECT` | exactly one dependency-ready SWU explicitly named by the user | no Task Session |
| `G-OCGP-PREFLIGHT` | exact write scope, absent/present baselines, toolchain, source digests, and closeout targets bound | no source mutation |
| `G-OCGP-ATOMIC` | selected unit retains one behavior and independent validation | refresh Plan |
| `G-OCGP-BOUNDARY` | forbidden selectors are read-only and protected set is explicit | stop |
| `G-OCGP-TEST` | selected SWU validation command passes | no terminal pass receipt |
| `G-OCGP-CLOSEOUT` | terminal receipt validates, Invoke Refresh updates only admitted targets, owner receipt emitted | no successor eligibility |
| `G-OCGP-PROMOTION` | separate ontology/promotion owner decision | retain candidate wording |

## Task Session Closeout Synchronization

Every mutation-capable SWU uses the exact row in
[`swu-manifest.json`](work-pack/swu-manifest.json):

- source terminal receipt:
  `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/<SWU-ID>/terminal-receipt.json`;
- session result:
  `planning/work-pack/session-evidence/<SWU-ID>/TASK-SESSION-RESULT.md`;
- owner receipt:
  `planning/work-pack/session-evidence/<SWU-ID>/INVOKE-REFRESH-RECEIPT.json`;
- planning targets: this work pack, the parent task, the layer wave, and the SWU
  manifest;
- Craft targets: `none` because this package has no scoped Craft ledger.

At Task Session preflight, each exact target is bound to its current SHA-256 or
the literal `ABSENT`. Closeout permits only status, evidence link, evidence
digest, blocker, and next-candidate fields. It forbids scope, acceptance,
authority, policy, promotion, publication, and automatic selection changes.
`invoke:refresh:apply-approved` validates and applies the approved closeout
delta; a missing or mismatched baseline blocks before mutation.

## Validation Strategy

See [`VALIDATION-STRATEGY.md`](VALIDATION-STRATEGY.md). Each fixture changes one
condition, every output uses canonical UTF-8 JSON, producer and verifier are
separate modules, and two fresh run roots must yield byte-identical canonical
bodies.

## Residue

| Residue | Owner | Route |
| --- | --- | --- |
| L3 static HTML and human inspection | UX/product reviewer | later Invoke Plan |
| IOLM adapter and product repair | IOLM/Poker Team owners | separate work unit |
| `specializes` policy owner | ontology edge-law owner | decision gate |
| semantic admission/promotion | ontology/authority owners | separate lifecycle |
| general ontology, learned scoring, hierarchy | future research and product owners | outside prototype |

## Current State

`SWU-OCGP-001` through `SWU-OCGP-004` completed with passing terminal receipts and owner closeout.
The work pack remains intentionally unselected between Task Sessions:
`selected_swu=none` and `implementation_authorized=false`. The captured
user-authorized series may open `SWU-OCGP-005` through a fresh Task Session;
the successor still requires its own preflight and mutation-admission receipt.
