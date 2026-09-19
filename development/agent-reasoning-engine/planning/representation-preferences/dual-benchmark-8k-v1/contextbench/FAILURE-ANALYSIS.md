# Sealed Stage 1 ContextBench failure analysis

The invalid selections used real delivered read IDs. They failed because some
selected reads contained edited source lines that cannot map to the pinned base
revision. The empty selections had a different mechanism: no historical read IDs
remained visible in their terminal requests, despite earlier successful delivery.

Scope: original Stage 1 plus the separately preserved CB4 first model exposure.
No Stage 2 outcomes, gold, provider calls, or frozen source edits enter this
analysis. [FAILURE-ANALYSIS.json](FAILURE-ANALYSIS.json) records result hashes,
request/response bindings, exact diagnostics, selected ranges, source hashes and
budget state. [failure-analysis.mjs](failure-analysis.mjs) reconstructs these facts
using the existing delivery and source-provenance validators.

## Exact invalid-selection predicate

`diagnoseSourceSelection` rejects a selected delivered observation when its
projection has `unmapped_current_lines.length > 0`. The resulting code is
`final-selection.changed-source-lines`, under `/bindings/base_source_provenance`.
The mapping deliberately gives edited or inserted lines no pinned-base credit.

| Arm | Selected evidence that failed | Exact failure |
| --- | --- | --- |
| CB1 control | `lib/compress/zstd_compress_internal.h`, separate reads of lines 672 and 674 | Each read contains one changed line and no projectable source event. The third selected read, line 512, is unchanged and projectable. |
| CB3 control | `pkg/cmd/repo/view/view.go`, reads 159–225, 196, and 85 | Respectively 22, 1 and 1 changed lines. The large read also contains unchanged projectable fragments, but those do not make its changed lines valid. |
| CB3 treatment | `pkg/cmd/repo/view/view.go`, read 54–153 | Seven changed lines: 83–88 and 101. Its other selected read, `pkg/cmd/repo/view/http.go` lines 1–53, matches the base hash and is valid. |

All selected IDs in these three cases were confirmed delivered. Reconstruction
found no missing-ID, schema, JSON, path/body integrity or source-integrity error.
Although some selections have zero projectable events, the recorded rejection
predicate is **changed-source-lines**, not a separate no-projectable-source issue.
Both control and treatment on CB3 exhibit this mechanism; it is not unique to
compaction.

All three invalid selections occurred after cumulative-budget finalization had
disabled repository/recovery tools. `maximum_terminal_corrections` was zero, so
the rejected selection ended the episode. The validator's diagnostic was recorded
but not delivered to another model turn; no corrective base read followed under
this frozen protocol. This explains the immediate failure, without establishing which
earlier policy change would improve quality.

## Empty selections: two distinct stopping mechanisms

**CB1 treatment stopped early, without budget pressure.** It returned valid raw
JSON with an empty `context_read_ids` array after 12 calls and 29,593 tokens.
`finalizing` was false; the last admission still had 68,441 tokens available before
that call. Repository and recovery tools were available. This was neither malformed
plain prose nor forced budget exhaustion. Its four context recycles had left zero
previously delivered IDs in the terminal prompt, although the receipt ledger
contained 53 delivered reads. The empty selection was accepted by the schema but
classified `no_context_selected`. This early failure must not count as a successful
token-efficiency gain.

**Supplementary CB4 control stopped during budget-driven finalization.** It called
`submit_context_selection` with an empty ID array after 33 calls and 81,080 tokens.
The 14,000-token finalization reserve had activated, and only the terminal tool was
available. After eight recycles, its terminal request likewise contained zero
historically delivered IDs. Its statement that the session never delivered stable
read IDs is contradicted by 39 receipt-confirmed historical reads; the narrower
fact is that none were visible in the last request. Every recorded repository tool
operation succeeded. This is an evidence-retention/availability failure at a forced
terminal boundary, not a repository tool or schema failure.

The final-request observations do not prove the model's internal reason for
stopping or omitting IDs. They establish the available evidence and distinguish
early empty completion from forced finalization.

## H72 and competing explanations

The confirmed Round 55 H72 held-terminal review with request-local handles was
**not included** in this successor. Both arms ran full trajectories with
`decision_state=false`, `decision_state_handles=false`,
`task_state_projection=false`, and zero terminal corrections. The standard copied
episode does not inherit H72 merely because the historical benchmark confirmed it.
These results therefore do not revoke the earlier, differently scoped H72 finding.

Compaction preserves delivered source bytes and native receipt identity but also
changes repeated system/tool wording and metadata presentation. It could change
exploration or early stopping. Current paired trajectories cannot isolate that
effect from model variation, native recycling, edited-source selection, and the
common cumulative-budget policy. Reduced bytes per request can also fund additional
calls until the same budget threshold instead of reducing total spending.

General candidate hypotheses, to be separately registered after Stage 2:

- Combine receipt-bound, base-valid terminal handles with compaction in a matched
  factorial comparison. Count every review token; do not assume H72 transfers or
  that its extra calls preserve the 15% threshold.
- Check a held candidate's provenance before removing base/recovery tools, with
  bounded correction capacity. Never silently replace IDs, select oracle evidence,
  or discard relevant reads merely to satisfy validation.
- Separate instruction compaction from metadata-only compaction to test early
  stopping effects without task-specific prompts.
- Retain the null that lower per-call cost merely increases exploration under a
  common cumulative budget. Report actual calls and completion rather than forcing
  savings with a smaller treatment cap.

## Open Questions

- Can terminal state preserve *relevant* base-valid evidence, rather than simply
  increase syntactically valid selections?
- Does bounded recovery reduce these failures enough to offset its model tokens?
- Will Stage 2 reproduce the edited-source and empty-selection mechanisms?
- Which instruction changes affect stopping, independently of representation size?
