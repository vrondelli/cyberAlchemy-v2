# Independent episode: preserve transport reasoning fields

Status: additive v2 correction with three passing scripted integration groups. Independent review pending. No provider calls, benchmark scores or changes to frozen v1 sources.

## Defect and correction

The public response capture intentionally contains only role, content and tool_calls. The v1 episode reused that public capture as the next assistant message, thereby omitting any transport reasoning_content field. The new baseline integration test exposed this distinction. A separate regression was run against the unchanged v1 independent episode and failed: the next investigation prompt had undefined reasoning_content instead of the original value.

[independent-episode-v2.mjs](independent-episode-v2.mjs) changes only the message returned by its generate helper: conversation replay uses the original parsed final_bytes message and finish_reason. Receipt-bound public response capture remains unchanged and is still the final-selection verification input. Phase budgets, branch isolation, source tools, findings, selection semantics and failure handling are unchanged. No extra reasoning is generated or summarized.

The final_bytes object comes from the same native driver result already bound to the successful receipt. The existing transport validates reasoning_content when supplied. Scripted fixtures validate replay preservation; actual provider qualification remains separate.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/independent-reasoning-replay.test.mjs
```

Three groups pass against v2: the complete eight-call episode preserves the original reasoning field in each investigator's next request, keeps isolated histories and exports native evidence; invalid plan/window stops; provider/persistence failure preserves costs. The first group was observed to fail against v1 before switching the test import to v2.

## Integration and open questions

The old native driver wrapper and prepared independent runner still import v1. The coordinator must introduce an additive common episode wrapper/source runner selecting v2 and the minimal-history episode before live qualification. V1 is retained as frozen evidence, not silently rewritten. This correction does not provide bounded independent branch histories or prove real GLM quality, efficiency or provider protocol acceptance. Those remain exact campaign prerequisites. D:/WSL admission remains required for live work; C: is excluded. Release/deployment remain deferred.
