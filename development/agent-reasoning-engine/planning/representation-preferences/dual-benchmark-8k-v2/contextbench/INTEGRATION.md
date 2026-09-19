# Base-valid terminal evidence candidate

This module supplies receipt-bound evidence after visible conversation recycling.
It is a construction candidate, not an executed benchmark or a perfect-score
claim. It makes no model calls, accesses no gold, edits no repository source and
changes no frozen v1 artifact. Eight local tests cover native receipt binding,
source projection, strict validation, omitted candidates and expanded native export.

## API

```js
const packet = await buildTerminalEvidenceFromCaptures({
  captures, receipts,                 // complete native archive, not visible history
  snapshots: source_context().snapshots,
  repoRoot: source_context().repoRoot, // immutable pinned-base checkout
  problem_statement: task.problem_statement,
  version: EXPANDED,                  // explicit successor, not frozen H72
  max_handles: 32,                    // allowed1..32
  max_state_bytes: 8192,
  max_state_tokens: 2048,
  measure_tokens: text => measure_index_tokens(text),
});
```

Only `packet.model.text` and `packet.model.tool` belong in the provider request.
Never serialize the entire packet into a prompt: `packet.private` holds exact
original read IDs, their provenance and unrendered archive candidates. Persist the
packet privately alongside the exact request receipt. State byte/token limits
bound only the added text; the complete actual request, including tool schema,
history and reserved output, still requires native admission at exactly8,000.

The lower-level `buildTerminalEvidence({reads,snapshots,repoRoot,...})` and
`projectDeliveredEvidence(...)` consume records from native `bindDelivery`.
They check read identity hashes and confirmed-receipt metadata, but callers must
not replace that trusted delivery reconstruction with arbitrary claimed reads.
The preferred capture-based builder reconstructs delivery itself. Tokenizer-only
captures or undelivered tool output cannot create eligible evidence.

For every read, the native `projectObservationsToBase` validates source paths,
snapshot hashes and exact bodies. A read containing **any** unmapped edited line
is excluded in its entirety. The module never silently selects its favorable
unchanged fragments. A read from a modified source file may be retained if all its
observed lines map unchanged to base; public state labels the exact projected
base coordinates, while its handle still resolves to the original delivered ID.
Integrity failures throw rather than masquerading as irrelevant evidence.

Candidates are ranked deterministically using only optional model-preferred valid
read IDs, public task wording, source width, receipt recency and path/read-ID ties.
Distinct paths receive a first pass; remaining valid ranges remain available.
This ranking is a hypothesis about useful presentation, not proof of relevance.

Default `version: H72` means the **exact existing H72 tool schema and three-handle
cap**. It reuses `terminalHandleTool` and `diagnoseTerminalHandles`. It does not
claim that this successor's candidate ranking and base projection reproduce the
entire frozen Round55 mechanism. `version: EXPANDED` explicitly supports1..32
handles through a separately named `submit_context_handles_v2` tool with strict
whole-envelope validation. Unknown/duplicate handles, extra fields, missing
summary, malformed JSON and wrong types fail. An empty list is schema-valid but
remains no selected context, never successful completion by definition.

The packet reports every exclusion and omitted eligible candidate. `offset` and
`fit.next_offset` allow deterministic page construction; request-local handles
are bound to their exact page, and using another page's packet for acceptance
fails. No runtime page-request tool or cross-page selection accumulator is supplied
here. Those would require a separately frozen policy. Neither the legacy three
handles nor the expanded bound may redefine perfect scoring around a small subset;
the full native denominator and gold metric remain unchanged. More than one page
may be necessary, and private archive availability is not equivalent to actual
model access to omitted evidence.

## Minimal runtime hooks

1. Hold the first terminal candidate **before accepting it**, including early raw
   JSON stops. Merely adding state when `finalizing` is true would miss v1 CB1's
   early empty completion. The existing
   [`episode-completion-readiness-v1.mjs`](../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-completion-readiness-v1.mjs)
   has `terminal-candidate-boundary`/`terminalReviewPending` logic that already
   retains this response without applying repository effects. Reuse that bounded
   boundary rather than inferring completion from archived evidence.
2. In its `renderPrompt`, replace the `buildDecisionState(...)` call and selected
   terminal-tool construction for the new version. Build from the complete
   receipt archive and `source_context()` before actual prompt capture. Append
   only public state; use `packet.model.tool`. Ensure terminal guidance names the
   provided tool rather than instructing the unavailable old ID-based tool. A
   packet that is not `ready` supplies no tool and must not fabricate evidence or
   count as repaired completion.
3. Associate the packet with the successful dispatched request using the same
   `bodyForReceipt` digest matching as `recordDecisionPresentation`; do not choose
   a packet merely because it was the last tokenizer candidate. Preserve the
   original private archive and source snapshots. No full read IDs are added by
   the model state or tool schema; inherited conversation IDs are a separate,
   explicitly controlled source of exposure.
4. On the handle terminal call, invoke
   `selectTerminalEvidenceSubmission({packet,captures,receipts,response_capture,
   snapshots,repoRoot})`. It verifies response/capture/receipt digests, confirms the
   exact state and tool in the successful request, rejects nonterminal captures,
   rechecks every private source binding and projection, validates the complete
   envelope, and calls native `diagnoseSourceSelection` on privately resolved IDs.
5. At export and independent reconstruction, call
   `exportTerminalEvidenceSelection({packet,captures,receipts,response_capture,
   source_snapshots,task},repoRoot)`. It uses unchanged native
   `exportCapturedContext` and the native scorer. Model selection is explicit;
   archive union never becomes an answer.

The existing
[`final-selection.mjs`](../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs)
and `exportModelSelectedContext` recognize only legacy `submit_context_handles`;
native H72 binding validation also rejects more than three bindings. **Do not feed
expanded packets through those unchanged entrypoints and claim wide support.**
This module provides a narrowly scoped expanded receipt-bound selector/exporter
for the integration call sites. The test with four independent delivered files
passes through that new selector and the unchanged native trajectory exporter,
not merely through a permissive schema mock. Legacy packets still use native
`selectTerminalHandleSubmission` after the additional packet checks.

No episode or orchestrator has yet been copied or changed for v2. The coordinator
must freeze the held-review policy, arm comparison, output/recovery behavior and
budget before any integration dispatch. Review/recovery tokens, failed calls,
state presentations and any extra model calls count toward the same cumulative
denominator. This candidate neither treats valid handles as verified code repair
nor weakens quality, completion,8K or15% requirements.

## Validation

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/terminal-evidence.test.mjs
```

Tests use synthetic local source files and synthetic **receipts**, without model
calls or gold. Their byte-based token measurer is a fixture stub, not measured
provider-token evidence. Actual8K admission remains an integration requirement.

## Open Questions

- Can the candidate retain relevant base evidence and meet unchanged perfect
  native quality rather than only improving schema/provenance validity?
- What bounded paging policy exposes all needed evidence without losing15%
  cumulative savings or leaking full identifiers into added state?
- Does a held review plus compaction remain token-efficient on full trajectories?
- How should separately registered output-cap recovery interact with the review?
