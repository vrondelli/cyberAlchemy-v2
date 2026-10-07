# Gold-free terminal-selection replay on exposed Go trajectory

This post-run diagnostic reused the completed G02 Go trajectory. The replay
script selected only receipt-confirmed reads: the model's original final IDs,
plus a read for a unique source path or basename it explicitly mentioned in
its terminal summary, plus a delivered `_test.go` sibling of a selected Go
file. It used no gold labels for selection and made no model request. Native
gold was used only afterward by the unchanged scorer. Because variants were
tested after inspecting the exposed run, none is a prospective benchmark win.

| Variant | Added paths | Span-F1 | File-F1 |
| --- | ---: | ---: | ---: |
| Original native selection | 0 | 0.20528 | 0.55556 |
| Summary/sibling, widest read | 3 | 0.20067 | 0.76190 |
| Summary/sibling, narrowest read | 3 | 0.21164 | 0.76190 |
| Narrowest with one read per path | 3 | 0.07224 | 0.76190 |
| Pinned DSH control | — | 0.25710 | 0.73684 |

The three additions were a configuration fixture, OCI source test, and gRPC
construction file. Summary-linked recovery improved file coverage beyond DSH,
but did not restore span accuracy. Collapsing all previously selected reads to
one per path destroyed span coverage. The immediate bottleneck is therefore
not just omitted final paths; the model needs better evidence acquisition and
localization of the relevant lines. Do not promote a terminal-union rule from
this replay.

The [replay script](../../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-unique-path-r1/replay-summary-selection.mjs)
and this directory's predictions, selector analyses, and native scores retain
the exact variant outputs. The original model cost and wall time are unchanged;
offline scoring is not a new paid run.

## Open Questions

Can a prospective, label-free acquisition/localization mechanism improve
Span-F1 on an untouched matched task while retaining the observed token and
wall-time advantage?
