# Recoverable history projection prototype

Status: bounded offline implementation; no episode integration or model execution.

Inherited objective: [successor plan](../../PLAN.md), preserving perfect native quality, completion, 8,000-token request admission and at least 15% cumulative model input plus output reduction. Proposed method: [NEXT-EXPERIMENT.md](../NEXT-EXPERIMENT.md). Byte evidence: [INPUT-ATTRIBUTION.md](../INPUT-ATTRIBUTION.md).

Hypothesis: retaining two recent complete assistant/tool exchanges and protected pending first-delivery exchanges, while preserving user/system messages and immutable recovery references, can reduce repeated input without losing recoverability. Null: older context remains necessary, or recovery and rediscovery offset the input reduction or harm completion/quality. This pure prototype tests structural correctness only; it cannot reject the performance null.

Scope: pure `projectHistory`, immutable inputs, exact retained messages, complete multi-tool exchanges (including failed tool results), protected pending first delivery, explicit omission/byte diagnostics and unchanged opaque archive references. Malformed exchanges fail closed. Oversize pending content remains intact; downstream admission must reject or invoke a separately validated deferral policy. No paging implementation, discovery reminders, runtime hooks, providers, gold, token estimates or acceptance changes.

Dependency DAG: define exchange/pending contracts → implement pure grouping and projection → test pairing, protected content, roles, immutable references and byte reconciliation → root review → separately authorized integration/admission evaluation. Integration and performance evaluation are not part of this task.

## Additive recovery-index prototype

Authorized next bounded step: receipt-bind the complete historical observation archive → fingerprint a deterministic immutable snapshot → construct bounded pages and snapshot/version-bound cursors → resolve only a listed opaque handle through native historical recovery → test complete traversal, strict requests/cursors, stale snapshots, source edits and explicit unfit progress → root review. No episode integration follows automatically.

Pages must contain at most 16 entries, 1,024 serialized UTF-8 bytes and 256 caller-measured tokens. These are page limits, not complete-request 8K admission. All confirmed observations remain reachable through paging; an entry that cannot fit yields explicit unfit with no automatic retry cursor. No current disk reads, gold, provider calls or performance claim. The injected test measurer is a fixture, never provider-token evidence.

## Additive receipt-bound session controller

Next authorized DAG: existing immutable snapshot/page → prepare public page → exact successful model-receipt acknowledgement → validated recover/list requests → stage page transition for next prepare → tests for undelivered/failed receipts, traversal, refresh and multi-call ordering → root review. Only `recovery-session.mjs` and tests are added; no episode edits or providers. Refresh requires the acknowledged final page and an explicit null cursor. Current acknowledged page remains active for the entire tool batch; staged transitions do not silently change handle meanings mid-request.

## Open Questions

Does retention increase later recovery cost or lose comparison context? How should the integration bind pending receipt identities and archive paging? The parent method owns these questions; no byte measurement is a token-saving claim.
