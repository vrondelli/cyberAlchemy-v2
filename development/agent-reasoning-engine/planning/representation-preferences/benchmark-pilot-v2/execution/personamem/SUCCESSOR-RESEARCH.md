# External memory successor investigation

Status: read-only source investigation and protocol proposal. No generation,
tokenizer or judge calls were made for this investigation. Authority effect none.
The original pilot results and task selections remain unchanged.

## Existing mechanisms that can accept visible history

Paths below are relative to the repository root. Each is source evidence rather
than a claim that the whole benchmark integration already exists.

| Mechanism | Concrete interface and evidence | Capability and limitation |
| --- | --- | --- |
| Durable reasoning ledger | `implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs`: `appendReasoningStateEvent`, `sealReasoningStateEpoch`, `replayReasoningStateEpoch`, `appendReasoningStateReduction` | Stores arbitrary object content with event digests, source references and epochs. Can record visible dated utterances without inventing lessons or consent. Reduction explicitly records retained/omitted event digests and is nongenerative. It does not decide semantic relevance or extract facts. |
| Persistent session facade | `implementation/agent-reasoning-engine/packages/coding-agent-runtime/integrated-context.mjs`: `openPersistentCodingSession().session.record` | Accepts event kind, object content and provenance; appends, seals and checkpoints using file storage and a writer lock. Its consumer name is coding-agent; use the underlying generic ledger for a clean external-history adapter. |
| Generic context projection | `implementation/agent-reasoning-engine/packages/context-basis-runtime/src/context-compaction-projection.mjs`: `projectCompactionAwareContext` | Accepts source epoch and generic events, retains recent units, folds older content into previews/references, and preserves a source manifest. A caller can map dated utterances directly. Defaults are byte limits, not token admission. No preference extraction, semantic update resolution or retrieval service is supplied. |
| Recycling and exact recovery | `implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs`: controller archive, `readEvidence`, `generate`, `prepareSharedBoundary` | Archives complete history with SHA references and exposes bounded exact reads. It performs measured dispatch admission and preserves crash boundaries. The fixture/task-state requirements and tool-cycle lifecycle are coding-specific; a generic chat-history adapter is still needed. |
| Retrieval provenance boundary | `implementation/agent-reasoning-engine/packages/coding-agent-runtime/kite-retrieval-v1/adapter.mjs`: `createRetrievalAdapter` | Verifies allowlisted source files and hydrates exact UTF-8 spans from an injected backend. Native limits: 64 files, 16 spans/result, 8,192 serialized evidence bytes. README explicitly says contract prototype, not integrated Kite. A real ranking/index backend is absent. |
| GLM recent-observation projector | `implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/retention.mjs`: `projectRecentObservationsV2` | Handles at most 12 coding history entries and tool-result references. It is not a ready general chat-memory ingestion system. |

These mechanisms require no inferred preference consent because storing source
observations is different from activating a persistent personalization lesson.
The benchmark's privacy/forgetting instructions remain visible evidence to be
respected at answer time. Do not promote source utterances to confirmed lessons.
An experiment must state whether forgetting means suppressing personalization or
physical deletion; these tasks measure the former, not verified storage erasure.

## Measured source-volume accounting

Evidence: `personamem/context-admission.json` and
`longmemeval/preflight/result.json` in the parent execution directory. Counts are
from actual provider tokenization of current complete visible request messages.

| Branch | Four task inputs | Sum per traversal | Two arms × two repetitions | Original branch ceiling | Remaining before any outputs |
| --- | --- | ---: | ---: | ---: | ---: |
| LongMemEval | 3,836 / 6,990 / 11,261 / 6,856 | 28,943 | 115,772 | 204,800 | 89,028 |
| PersonaMem | 31,629 / 31,844 / 32,127 / 32,078 | 127,678 | 510,712 | 204,800 | −305,912 |

The four-traversal source volume is the baseline lower-bound budget estimate when
**each model arm reads every source token once in each repetition**. It excludes
carry-forward notes, repeated prompts, generated answers and judging. It is not a
formal tokenizer lower bound for a different serialization: chunk boundaries and
chat framing change exact counts. Every successor must tokenize the actual chunks.
The PersonaMem deficit is over 305,000 tokens, so ordinary chunk framing cannot
make the all-history protocol feasible within 204,800. Cached input still counts.

Even LongMemEval needs budget design. Adding sixteen 1,024-token answers and
sixteen maximum judge calls at 4,096 input + 512 output gives 205,884 tokens before
additional sequential-ingestion notes and prompts. Those are worst-case reservation
caps, not predicted actual consumption. A smaller predeclared judge/answer cap and
measured chunk schedule can fit; confirm admission prospectively, never drop calls
after results to rescue the budget.

At an idealized 7,168-token raw-chunk capacity, LongMemEval needs at least
1+1+2+1=5 chunks per four-task traversal; PersonaMem needs at least 5+5+5+5=20.
Across four traversals that is at least 20 and 80 chunk exposures respectively.
Real chunk capacity is lower after instructions, memory and framing. These counts
are planning estimates from full-request token counts, not a frozen schedule.

## Concrete equal-access 8K sequential protocol

This is a successor to the unchanged-system pilot. Freeze it before any model call.

1. Keep the selected task IDs and persona splits. Use only admissible dated source
   turns; remove PersonaMem's oracle system message with the existing exact digest
   record. Do not use answer-session IDs, related-snippet labels, preferences or gold.
2. Map each visible turn into a ledger event containing task-local subject, original
   date if present, role, source byte offsets, content and content digest. Give both
   arms access to the same ordered source snapshot. Preserve contradictory or updated
   statements in order. Do not synthesize dates for PersonaMem.
3. Partition chronologically using a frozen tokenizer policy independent of the
   final answer and gold. Prefer whole turns; split an overlength turn into exact
   ordered text spans with offsets. Fix a raw-source target of at most 5,500 tokens,
   reserve at most 1,024 tokens for prior retained state plus instructions/framing,
   and 512 output tokens for each ingestion step. Measure the whole request; reject
   any chunk above 7,168 input rather than truncate it.
4. Both arms process every chunk once in the same order. The final query is withheld
   during ingestion in both arms to measure general memory rather than oracle query
   extraction. Use the same model, sampling, note budget and task boundaries.
5. Control carries the previous bounded model-authored notes. Treatment carries
   notes with source-event references and the existing ARE ledger/projection/recovery
   boundary. This isolates provenance/recovery support rather than merely giving one
   arm memory. A candidate adapter must validate referenced event IDs and keep claims
   distinguishable from source evidence. Note extraction is new experimental wiring;
   the current representation learner does not provide it automatically.
6. At the final question, give both arms the same retrieval opportunity against the
   same immutable archive and identical maximum recovered-source token allowance.
   Compare control's ordinary text notes against ARE's source-linked notes. If the
   intended comparison instead forbids archive access for control, label it explicitly
   as memory-versus-no-memory, not an equivalent retrieval control.
7. Count every ingestion input/output, repeated state, recovery-driven generation,
   final answer and judge call. Tokenizer diagnostics remain separate. No retries.
   Freeze per-call and total reservations; failed and unknown calls retain their
   dispositions. For any failed source-exposure step, do not claim complete exposure.
8. Judge the original external task answers, blinded to arm, with preserved native
   category meaning; report exposure, source retrieval, quality, completion and total
   model tokens separately. State that sequential ingestion is an adapted protocol.

This requires a PersonaMem budget successor. It is inappropriate to silently use
unused LongMemEval or selectivity tokens to relax a fixed per-branch ceiling.

## Lower-token alternative under the original ceiling

A separate deterministic archival/retrieval experiment can avoid full model reads.
Both arms ingest every source turn into the same source store without model calls;
at query time both get the same deterministic ranked candidates. Control receives
exact source excerpts; treatment receives ARE's projected evidence and provenance.
Ranking must use only the visible query/history, with a frozen general ranking rule,
not the benchmark gold. The existing ledger and retrieval provenance adapter can
support this, but there is no inspected ready backend to claim as integrated Kite.

A 16-answer schedule can then fit the original ceiling with bounded retrieved input
and calibrated judge caps. This is equal **source availability**, not equal model
exposure to every history token. It tests retrieval/projection behavior and is not a
substitute result for the original all-history or sequential-retention protocol.
Using a larger context also requires a successor and still pays the full-history
logical input volume; it does not solve the original PersonaMem token ceiling.

## Recommendation and DAG dependencies

Proceed with admitted LongMemEval pilot tasks under their unchanged source contract
while preserving the fourth task's exact overlength disposition. Do not count the
missing task as a scored pass. For a complete four-task follow-up: protocol/budget
selection → generic visible-history event adapter → deterministic chunking and
full-source coverage checks → control/treatment memory wiring → judge calibration
and budget reservation → independent review/freeze → paired external task run →
category scores, total tokens and exposure analysis → reviewed hypothesis decision.

PersonaMem's full sequential branch needs an explicit larger-budget successor or
an explicitly different retrieval protocol. Original selectivity success cannot
close this external-memory frontier.

## Open Questions

The coordinator must choose the causal contrast: provenance/recovery support versus
ordinary memory, or memory versus none. What exact smaller judge cap is sufficient
for the selected LongMemEval answer rubrics? Which token budget is authorized for a
PersonaMem full-exposure successor? Does general retrieval indexing deserve its own
hypothesis before an external paired test? None is resolved by local contract tests.
