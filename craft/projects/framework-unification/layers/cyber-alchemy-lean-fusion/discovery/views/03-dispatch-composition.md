# View 03 — Dispatch composition

> Parent: [`../MAP.md`](../MAP.md). Axis: how multi-agent dispatches are composed.
> **This view is mostly WRITTEN already — it is a pointer, not a re-derivation.**

## EVIDENCE (owned, anchored)

Owned in full by `Arcanum/TO-VLAD/DISPATCH-COMPOSITION-MODEL.md` (consolidates
TO-VLAD6 + TO-VLAD8 + composition slice of TO-VLAD7). Load-bearing results:

- **Four-level ontology** Dispatch → Wave → Layer → Agent, with typed edges forming
  a DAG (DCM §1). The load-bearing distinction is **Layer-inside-Wave** — a review
  wave can stack several layers (correctness/security/style) under one purpose.
- **Typed edges, single bounded cycle** (DCM §2): `consumes` / `reviews` (DAG) +
  `reopens` (the sole back-edge, capped by `loop_cap`, closing with a typed
  exit_reason). The global topology enums (`sequential|zig-zag|parallel|pipeline`)
  **dissolve** into emergent properties of the edge set.
- **The mode-conflation finding** (DCM §4 — the load-bearing analytical result):
  `mode` jams five categories (cardinality / interaction-pattern / topology /
  function / overlay) into one field. Proof the categories are real: Arcanum's
  `robot-talks` *sigil* IS domainspec's `robot-talks` *mode value* — same thing,
  two homes.
- **Strategy as a typed (role-set, grader) object** (DCM §3): `research` is the only
  fully-real strategy on disk (in domainspec's `research-constitution.md`); `code`
  and `experiment` are marked **FORECAST — not real**.
- **Lanes (on the Wave) vs Roles (on the Agent)** kept as two crossing axes (DCM §5);
  orchestrator/synthesizer are parent-skill functions, **not** child agents.

## INFERENCE / SEAM (open debts, from DCM §11)

- **`OQ-mixed-dag-schema` is reopened, not settled** — a typed DAG breaks base rule
  R30 (composition is linear). Carried as open debt with a real cost (R30 linearity
  is load-bearing for premise P-SS-9). Collapse pressure: the moment a synthesize
  layer needs two non-adjacent upstream inputs, linear N−1 either forces a false
  ordering or smuggles the edge into prose.
- **`loop_cap` default** — proposed 1, no usage data; mechanism settled, value open.
- **`experiment` peer vs sub-mode of `research`** — two signals pull opposite ways,
  undecided.
- **Single-synthesizer bias bottleneck** (DCM §5) — mechanical-handoff framing holds
  only while synthesis is mechanical; genuine N-wave synthesis must become a wave
  with its own `reviews` edge. Mark the transition; don't let it happen silently.

## STATUS

**WRITTEN (design).** No new document needed. Any change routes to
`DISPATCH-COMPOSITION-MODEL.md` as owner.

## ROUTE

Read DCM directly. Open debts above are tracked in DCM §11 — do not re-open them
here.
