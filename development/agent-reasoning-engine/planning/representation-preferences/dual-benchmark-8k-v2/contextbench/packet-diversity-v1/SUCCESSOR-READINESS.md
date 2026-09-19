# Packet successor readiness

The additive `preflight-v2.mjs` and `live-v2.mjs` are offline-tested instrumentation, not a live approval. Frozen predecessor code and results remain unchanged. No model, tokenizer, network, evaluator-reference or live-freeze operation was performed for this implementation.

Preparation restores the complete archived terminal delivery, including terminal-only reads, while retaining the original prefix candidate ranking. All eight donor closures and restored file hashes are bound; native projection is checked again before each model dispatch. Preparation uses the native tokenizer interface, a shared 256-invocation ceiling and abort signal. Its settlement statement follows actual awaited operations; an uncooperative preparation dependency can still delay completion, rather than falsely report settled work.

The live wrapper verifies the v2 freeze and preparation, runs the fixed sixteen slots with two workers, and reserves at most 128,000 new model tokens. Prefix cost remains separately visible. SIGINT, SIGTERM, shared infrastructure failure and the one-hour deadline abort further dispatch. The pool itself races the bounded drain deadline; actual pending promises are awaited for at most 60 seconds after abort. Unresolved work produces a failed sixteen-slot snapshot with conservative unknown reservations and `transport_settled:false`, which the scorer must reject. Late callbacks cannot mutate the sealed snapshot. Known native usage survives malformed aggregates and wrapper persistence errors through the attached in-memory seal.

Wrapper artifact writes use exclusive creation, file fsync and parent-directory fsync. Inherited per-request native journals retain their existing synchronous-write behavior. This does not promise recovery from SIGKILL, process termination before a seal, or host failure; persisted native evidence remains necessary for reconciliation.

The parent-owned `freeze-live-v2.mjs` uses the expected v2 schema, preparation closure bindings, prospective native records and review scope. It includes `score-v2.mjs` and transitive local imports. The builder was inspected, not executed. Its creation of a freeze remains a separate reviewed boundary.

## Validation

Fifteen focused synthetic successor tests pass: complete sixteen-slot native-fixture execution; both signals; received and unknown usage; source-proof rejection; actual-promise drain; uncooperative slot deadline; malformed accounting recovery; persistence error preservation; default fsync; original-freeze rejection; complete source byte checks; and partial preparation failures. Native fixture HTTP is intercepted in memory, without sockets or credentials. Exact implementation and test hashes are recorded in `SUCCESSOR-TEST-RESULTS.json`.

## Open Questions and remaining gates

- Independent successor runtime/scorer review must complete before any freeze or live use.
- Actual successor tokenizer preparation has not run; original preflight approval is insufficient for this code and request-complete source restoration.
- A fresh preparation, exact source/review binding, continuity validation and separately approved v2 freeze are required before dispatch.
- Native host/guest storage admission remains required; the parent currently holds live work because the host guard fails.
- Unknown or infrastructure-failed trials remain inconclusive; unsettled seals cannot be scored. This packet-component diagnostic cannot establish the whole-trajectory 15% objective.
