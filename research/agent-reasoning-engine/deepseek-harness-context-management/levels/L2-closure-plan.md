# L2 — closure and experiment plan

## Vertical 1: canonical context stream

1. Define a context-event vocabulary and strict append invariants.
2. Split context events from turn/semantic diagnostic events, while allowing
   explicit cross-references.
3. Add prefix cuts with sequence, head digest, and selected-dependency digest.
4. Fold an exact prefix into byte-identical existing Context Envelope v1
   records; preserve compatibility before introducing any successor schema.
5. Add a fail-soft projection checkpoint cache.
6. Add complete-value projection events and same-reference no-op behavior for
   unrelated event types.

## Vertical 2: stable Codex projection

1. Render a fragment from a projection checkpoint through a versioned,
   canonical renderer.
2. Record system-context, ordered tool-schema, route/provider/model, call
   configuration, fragment, and renderer digests as a complete request-affinity
   header.
3. For plan-bound turns, reuse the exact checkpoint only after currentness
   comparison. For interaction-bound turns, append new events while retaining
   the predecessor prefix.
4. Append invalidation events for selected-source drift; do not rewrite the
   predecessor envelope or events.
5. At dispatch, verify the emitted request against the event-derived messages
   and folded request-affinity header.

## Vertical 3: bounded history

1. Trigger pressure before the existing 32 KiB hard limit.
2. Shadow only explicitly selected context ranges.
3. Bind summary output to exact source event identities and keep the raw log.
4. Reject summaries that drop mandatory authority, contradiction, gap, or
   provenance fields.
5. Keep exact-history retrieval independent of compacted model context.
6. Prefer exclusion, spill, and deterministic pruning before any generative
   summary.

## Vertical 4: retrieval and replay

1. Provide exact prefix/event reads independent of the model-visible surface.
2. Add a disposable search index reconciled from context-stream revisions.
3. Bind cursors to exact index generations and fail stale.
4. Derive retrieval authority from the calling consumer, not model arguments.
5. Build event-derived mock Codex transcripts; represent non-reconstructable
   failures in explicit sidecars.

## Vertical 5: semantic durability

1. Flush the context prefix and request-affinity header before model dispatch.
2. Flush a proposed effect record before an external-effect-capable body runs.
3. Recover incomplete operations as typed unknown outcomes, not implicit
   retries.

## Experiment matrix

| Case | Expected local result | Provider evidence needed |
|---|---|---|
| Append one interaction event | Old event prefix unchanged | cache-read tokens after first request |
| Identical plan-bound turn | Same projection checkpoint and bytes | cache-read tokens or explicit unavailability |
| Unrelated source drift | Same selected prefix; diagnostic append | no invalidation attributable to context |
| Selected definition drift | Successor event and checkpoint | invalidation begins at changed projection point |
| System prompt/tool schema change | New affinity epoch | previous prefix may be partially/non-reusable |
| Provider/model route change | New affinity epoch | no reuse assumption |
| Compaction | Raw log unchanged; derived surface replaced | reuse only before first shadowed token |
| Projection-cache loss | Same derived bytes after replay | provider result should be unchanged |
| System/tool/route change | New request-affinity header | cache reuse not assumed past first changed byte |
| Crash before request dispatch | Durable proposed request, typed recovery | no duplicate model call without explicit policy |
| Imported context | Immutable bounded untrusted snapshot | no inherited instructions or permissions |
| Search source changes between pages | stale-cursor failure | no shifted mixed-generation result |

## Measurements

- exact request-fragment digest and longest-common-prefix bytes;
- projection fold duration and checkpoint hit rate;
- total input tokens and provider-reported cached input tokens;
- end-to-end latency and cost when the provider reports it;
- deterministic replay across fresh processes;
- storage growth and compaction frequency.
