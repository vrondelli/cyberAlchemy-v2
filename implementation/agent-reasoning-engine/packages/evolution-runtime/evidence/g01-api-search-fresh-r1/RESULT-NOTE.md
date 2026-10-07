# G01 API-search fresh-task screen — failed activation, no matched claim

The frozen `intent-anchor-api-search-r1` candidate ran on source-only
`Multi-SWE-Bench__go__maintenance__bugfix__250649eb` with GLM-5.3-Flash and
the 8K context bound. Its prediction was [sealed](CANDIDATE-SEAL-r2.json)
before pinned native scoring. The [prediction](candidate-prediction-r2.json)
and [native score](candidate-native-score-r2.json) give final Span-F1 `0` and
File-F1 `0` (also Symbol/Line-F1 `0`). It used 11 model calls and 30,650
known model input/output tokens; maximum reserved input was 4,808 tokens.

The candidate made **zero** API-search acquisitions. GLM searched `PublicKey`
under `pkg/cmd/secret`; the search returned `pkg/cmd/secret/set/http.go` and
`pkg/cmd/secret/set/set.go`, the two gold files, but the rule did not match
the compound identifier to the objective phrase “public key.” The shared
source-neighborhood policy also excludes `pkg/` paths. GLM later read both
files, and trajectory coverage reached both files, but terminally selected
only `pkg/cmd/ssh-key/add/add.go:58-97`. The final selected context therefore
missed the gold entirely. The attempted patch and intermediate reads are not
a final-context quality win.

The paired control did not yield a native-scored row: attempt 1 failed a
terminal delivery join; after a shared runtime fix and paired refreeze,
attempt 2 selected no context handle and could not export a prediction. The
candidate is a **candidate-only diagnostic**, not a matched comparison.
Neither control attempt is assigned a fabricated zero score. The remote
receipts and original/refrozen configurations remain under
`/opt/are/evolution-runtime/g01-api-search-fresh-r1/`; the local
[control](CONTROL-FREEZE-r2.json) and [candidate](CANDIDATE-FREEZE-r2.json)
freezes identify the successful runtime snapshot.

Decision: reject this candidate as an accuracy claim. An opt-in
`intent-anchor-api-search-r2` now recognizes objective-grounded compound
identifiers and admits bounded `pkg/` source reads; unit and episode-delivery
tests pass, but it has no live score. The next G01 dispatch requires a
different untouched task and a scoreable control preflight; alternatively
pivot to the G02 cross-repository frontier. This Go task is now exposed and
cannot support a prospective gain claim.

## Open Questions

- Can a gold-blind compound-identifier rule activate on a fresh task without
  spending the read cap on generic symbols?
- Should final selection prefer relevant delivered base reads over an
  unrelated handle, and how can that be tested without label leakage?
- Which untouched task has a scoreable matched control under the current
  terminal-selection contract?
