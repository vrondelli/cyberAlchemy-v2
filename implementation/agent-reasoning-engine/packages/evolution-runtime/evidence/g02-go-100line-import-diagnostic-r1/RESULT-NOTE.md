# G02 Go 100-line packet diagnostic r1

## Result

On the already-exposed Flipt import/export task `SWE-Bench-Pro__go__maintenance__bugfix__153337fe`, the ARE-only 100-line focused-Go packet variant produced native Span-F1 **0.49316** and File-F1 **0.45455**, with a valid final context selection. It used 168,246 known model tokens and 145.758 arm seconds. The otherwise identical 50-line function-window candidate scored **0.60691 / 0.69231**, with 92,260 tokens and 132.992 seconds. The larger packet therefore regressed on every measured dimension in this diagnostic; retain the 50-line candidate pending fresh matched evidence.

The initial packet receipt confirms four focused Go reads of up to 100 lines, within the packet byte bound. Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-import-go100-diag-r1/`, including the frozen source hashes, initial source packet in `evidence/run/events.jsonl`, prediction, and native score. This is an exposed mechanism diagnostic, not a prospective win or a general claim about packet sizes.

## Open Questions

- Does the retained 50-line Go function-window candidate outperform the matched control on an untouched task?
