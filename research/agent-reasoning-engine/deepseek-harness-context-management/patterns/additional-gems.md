# Additional DSH gems for reusable ARE reasoning state

The primary product proposition is not context caching. It is reuse of the
explicit reasoning state that produced context. These DeepSeek Harness patterns
are mechanisms that can make that proposition efficient, reconstructable, and
safe. Statuses are research recommendations only.

## Product capability map

| Product capability | Product value | Supporting DSH gems |
|---|---|---|
| Reasoning State Ledger | Preserve one canonical append-only history of explicit reasoning products | risk-aligned durability, complete dynamic snapshots |
| Reasoning State Projection | Derive exact consumer views without rewriting history | versioned projection unit, stable ordered prompt registry |
| Reasoning State Currentness | Reuse unchanged work and invalidate only intersecting dependencies | cache behind never ahead, request-series header |
| Reasoning State Reconstruction | Prove what context and configuration actually crossed a model boundary | dispatch reconstruction invariant, log-derived LLM fixtures |
| Reasoning State Retrieval | Recover omitted, shadowed, or historical reasoning without bloating inline context | exact-history query, disposable derived index |
| Reasoning State Import | Reuse another stream's evidence without inheriting its instructions or authority | caller-derived retrieval authority, untrusted immutable reference |
| Reasoning State Reduction | Fit a consumer budget while preserving mandatory meaning and visible loss | deterministic reduction ladder |
| Reasoning State Affinity | Measure and exploit exact request-prefix reuse without confusing cache identity with truth | request-series header, replay-aware measurement |
| Reasoning State Branching | Continue from a sealed completed frontier with freshly bound capabilities | completed-prefix fork |

| Pattern | DSH mechanism | ARE reuse | Status |
|---|---|---|---|
| Risk-aligned durability | Flush before model request, top-level tool effect, and next step | Checkpoint context/request evidence before irreversible ambiguity | borrow-carefully |
| Complete dynamic snapshot | Append a full snapshot only when rendered meaning changes | Emit successor Context Snapshot events, not per-field deltas | borrow-carefully |
| Request-series header | Log provider/model/system/tools/config and inherit while equal | Add exact cache-affinity header beside Context Envelope | borrow-carefully |
| Dispatch reconstruction invariant | Compare sent request with log-derived messages and header | Verify wrapper output at the app-server seam | promotion-candidate |
| Versioned projection unit | Pure synchronous fold, same-reference no-op, `asOfSeq` | Separate route, dependency, envelope, and usage projections | borrow-carefully |
| Cache behind, never ahead | Flush log before checkpoint and fail soft | Projection loss may cost time, never correctness | borrow-carefully |
| Exact-history query | Search and trace shadowed/log-only events | Keep retrieval independent of the bounded Context Envelope | borrow-carefully |
| Disposable derived index | Reconcile SQLite from source revisions; stale cursors fail | Build retrieval indexes from context events, never treat them as truth | borrow-carefully |
| Caller-derived retrieval authority | Model cannot choose workspace authority or backend cursors | Resolve context import scope outside model arguments | borrow-carefully |
| Untrusted immutable reference | Snapshot once, bound bytes, prevent recursive inclusion, escape framing | Import other ARE streams without importing their authority | promotion-candidate |
| Deterministic reduction ladder | prune → remeasure → summarize only if needed | exclude optional diagnostics → spill → structural prune → bounded summary | promotion-candidate |
| Replay-aware measurement | Provider usage anchors only exact canonical envelope | Attach usage to exact request-affinity header | borrow-carefully |
| Completed-prefix fork | Copy only balanced completed turns; fresh tools and authority | Context fork at sealed epoch, with explicit capability rebinding | analogy-only |
| Log-derived LLM fixtures | Derive call streams from recorded chunks; sidecar unreconstructable failures | Deterministic Codex/app-server replay fixtures | promotion-candidate |
| Stable ordered prompt registry | Named sections, deterministic ordering, duplicate rejection | Give each ARE context contributor one stable slot and owner | borrow-carefully |

## Highest-value next additions

The most valuable additions to the current ARE product, in implementation
order, are:

1. **Reasoning State Ledger** — append-only events plus sealed epoch identities;
   this creates the reusable asset on which the other capabilities depend.
2. **Reasoning State Checkpoint** — risk-aligned durability barriers before a
   model request, top-level effect, and continuation step.
3. **Reasoning State Reconstruction** — prove that the dispatched request equals
   the selected state projection plus its exact provider, model, system, tool,
   and configuration header.
4. **Reasoning State Currentness** — compare selected dependencies and create a
   successor only for intersecting changes; unrelated drift remains diagnostic.
5. **Reasoning State Retrieval** — query exact current, shadowed, and log-only
   history independently of the bounded inline Context Envelope.
6. **Reasoning State Import** — capture a bounded immutable reference to another
   stream without importing its instructions, permissions, or authority.
7. **Reasoning State Reduction** — deterministic loss accounting and an explicit
   block when mandatory reasoning state cannot fit the consumer budget.
8. **Reasoning State Affinity** — a request-series header and replay-aware usage
   measurements so byte caching accelerates verified state reuse.
9. **Reasoning State Branching** — fork only from a sealed, balanced frontier and
   bind fresh tools and authority for the successor.
10. **Reasoning State Replay Fixtures** — derive model-call tests from the event
    log so context and app-server integration can be replayed byte-for-byte.

The first three form the minimum product vertical:

```text
append explicit reasoning events
  -> seal a reusable epoch
  -> project and reconstruct the exact model request
```

Caching should be added after this invariant exists. Otherwise the system can
reuse bytes without proving that it reused the reasoning state those bytes were
supposed to represent.

## Misuse warnings

- Do not flush before every event; bind durability cost to replay risk.
- Do not use full-value snapshots for large immutable payloads; use content
  addresses and complete reference sets.
- Do not allow a model to provide authority-bearing retrieval cursors or scope.
- Do not call a derived SQLite index, spill artifact, or projection checkpoint
  canonical context.
- Do not call a Context Envelope the complete reasoning state; it is one bounded
  consumer projection of a sealed epoch.
- Do not equate identical prompt bytes with identical reasoning provenance or
  currentness.
- Do not inherit tool/effect authority merely because a fork inherited context.
- Do not treat deterministic token estimates as billing-grade usage.
