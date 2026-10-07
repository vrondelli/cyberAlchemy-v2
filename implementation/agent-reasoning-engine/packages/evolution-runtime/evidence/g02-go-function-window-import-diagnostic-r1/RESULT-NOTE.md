# G02 Go function-window diagnostic r1

## Result

On the already-exposed Flipt import/export task `SWE-Bench-Pro__go__maintenance__bugfix__153337fe`, the ARE-only function-window variant produced native Span-F1 **0.60691** and File-F1 **0.69231**, with a valid final context selection. It used 92,260 known model tokens and 132.992 arm seconds. The earlier matched ARE arm scored 0.40703 / 0.30000; its matched DSH arm scored 0.43204 / 0.30000. This is an exposed mechanism diagnostic, not a prospective matched-pair win.

The candidate adds source-only Go import/export function windows to the generalized cross-layer hint selector. The initial episode packet still delivered only 50 lines for each focused read due to the packet reader's per-read cap, but the final selection covered nine files, including CLI commands, core implementation, tests, and fixtures. The improvement therefore cannot yet be attributed specifically to a larger initial packet.

Full immutable run evidence is on the VPS at `/opt/are-benchmark-runs/g02-cross-layer-flipt-import-gofunc-diag-r1/`, including `FREEZE.json`, `ARE-SETTLEMENT.json`, `evidence/run/prediction.json`, `evidence/run/events.jsonl`, and `evidence/run/native-score.json`. The ranker SHA-256 is `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`.

## Open Questions

- Does a 100-line focused Go packet improve or regress this already-exposed diagnostic?
- Does the mechanism generalize to an untouched source-only Go task in a matched ARE/DSH pair?
