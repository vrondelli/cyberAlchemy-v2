# C19–RWO–DomainSpec DAG Mapping

## One Physical Graph

The current L0 DAG and C19 stage program are logical inputs. The compiler must flatten them into one RWO graph. It must never invoke a second scheduler from inside an RWO node.

For each applicable stage `S`:

```text
gate.S
  -> work.S.1 ... work.S.n
  -> checkpoint.S
  -> gate.next-S
```

`gate.S` succeeds only when the exact C19 evaluation and offline task-loop composition both identify `S` as directly eligible with `authority_effect: none` and `effect_authorized: false`. A gate, block, human-test-ready, terminal-gate, identity mismatch, or stale digest produces no work command.

## Canonical Stage Vocabulary

| Order | C19 stage | L0 meaning |
|---:|---|---|
| 1 | `canonical-definitions` | Exact Rule, DS-D8, C19, D65, and D67 source selectors are current. |
| 2 | `product-ontology` | Selected Product Capability decisions and composition ownership are current. |
| 3 | `business-ontology` | Work-orchestration, task-loop, and meta-type enforcement records close at exact identities. |
| 4 | `domainspec-source` | Controlled-construction source and Rule authored meaning are complete. |
| 5 | `compiled-graph` | L0 work graph plus applicable obligations compile deterministically. |
| 6 | `system-ontology` | The flattened control/work graph is projected without invented authority. |
| 7 | `exact-implementation-binding` | Accepted binding envelope exists; one native helper authors the implementation candidate; parent joins it. |
| 8 | `static-conformance` | Shape, provenance, hostile, source-sensitivity, and protected-digest checks pass. |
| 9 | `runtime-evidence` | Native-language equivalence and contained CLI replay are observed. |

## Current L0 Node Migration

The existing `d65_stages` array describes relevance, not execution order. The successor source must add one singular `governance_stage` and preserve cross-cutting inputs under `d65_dependencies`.

| Current node | Successor placement |
|---|---|
| `L0-B00-01` | Preflight before `gate.canonical-definitions`; verifies selected chain but completes no stage. |
| `L0-B01-01` | Preflight diagnostic. |
| `L0-B01-02` | `exact-implementation-binding`; it is an implementation repair and cannot precede its binding gate. |
| `L0-B01-03` | `static-conformance` checkpoint input. |
| `L0-B02-01` | `canonical-definitions` when it only extracts existing meaning; stop if it requires definition mutation. |
| `L0-B02-02` | `exact-implementation-binding`; typed IR is implementation. |
| `L0-B03-01` | Split: authoring contract belongs to `domainspec-source`; implementation-facing tests belong to `static-conformance`. |
| `L0-B03-02` | `exact-implementation-binding`; generic dispatcher implementation. |
| `L0-B04-01` | Split into `domainspec-source`, `compiled-graph`, `system-ontology`, and later implementation work. |
| `L0-B04-02` | `exact-implementation-binding`, with the mandatory one-helper handoff. |
| `L0-B04-03` | `static-conformance`. |
| `L0-B04-04` | `runtime-evidence`. |
| `L0-B04-05` | `runtime-evidence`. |
| `L0-B04-06` | Post-runtime independent review before terminal packet. |
| `L0-EXIT-01` | Terminal evidence join; never automatic acceptance. |

## RWO Field Mapping

| L0 planning field | RWO field or adapter input |
|---|---|
| `id` | `node_id` |
| `depends_on` | `depends_on` after gate/checkpoint expansion |
| root or required join | `release.mode: root|all` |
| intentionally alternative evidence | `release.mode: any|quorum`, only when explicitly authored |
| `kind` | `contract` |
| executor identity | `role_id` |
| bounded retry policy | `max_attempts`; default 1 for repository mutation |
| read/write scope, checks, outputs, stop conditions | `static_input.work_contract` |
| source and predecessor digests | `static_input.identity_manifest` |

The compiled graph must add explicit `deadline_seconds`, `max_parallelism`, gate nodes, checkpoint nodes, and an immutable claim ceiling.

## Native Helper Boundary

RWO cannot directly invoke the Codex native helper operation. The binding node therefore has three structural steps:

```text
prepare-native-helper-contract
  -> pause-for-native-helper
  -> ingest-and-verify-helper-receipt
```

The parent performs the one-helper dispatch outside the RWO runtime, then resumes the same accepted-history stream with the exact receipt. Missing, changed, open, or unjoined helper evidence blocks continuation.

## Failure Semantics

- Gate failure: work nodes are not issued.
- Work failure: stage checkpoint is impossible; later gates remain `not_evaluable`.
- Retryable failure: retry only within declared attempts and deadline.
- Event identity reuse with changed content: conflict.
- Dependency artifact drift or path escape: terminal node failure.
- Authorization or write-scope expansion: stop and return to route selection.
- Human-test-ready or terminal-gate: no successor work command.
