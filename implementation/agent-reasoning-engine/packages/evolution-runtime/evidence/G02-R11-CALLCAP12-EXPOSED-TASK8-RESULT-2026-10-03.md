# G02 r11 task-8 call-cap development rerun

Status, 2026-10-03: **valid exposed ARE-only result, but the call-cap mechanism did not activate and quality remained zero**. This is not a matched pair, campaign repair, or superiority evidence.

The separately frozen task-8 rerun used the r11 source candidate, a 12-call maximum (ten potential exploration calls plus two reserved finalization calls), and a 512 MiB container limit. It was selected from an already exposed r11 task after an evaluator-only prefix audit; no untouched population was used. The WSL/VPS freeze SHA-256 is `9deac73c7ca778fed7c01c168254806f4218ba2e9be70f7bc20eb9e9d3c198f2`. Fourteen frozen source hashes verified on the VPS. The effective runtime cell independently reported `maximum_calls: 12` and `finalization_calls: 2` before dispatch.

The provider run settled `exit_code: 0`, `final_context_selected`, with 10 model calls, 102,236 known model tokens, zero unknown-usage calls, and 157.21 seconds. Its prediction and cost were sealed before native scoring at `PRE-SCORE-SEAL.json` SHA-256 `0c3ab0a33a290ab9c13a6c20c82fbc5ea05cd7f8465839e158c37020e9c9f4b5`. The pinned native scorer reported **Span-F1 0, File-F1 0** at `SCORE-RESULT.json` SHA-256 `44a12fd79367099f504403ff20bf3614b807dd6afe0e32360f93a3c426487e31`. The full 47 MiB private raw root is cold-copied to `/home/vlad_/are-benchmark-archive/g02-r11-callcap12-exposed-task8-r1/raw`; a checksum dry-run found no differences from the VPS root.

The archived r11 task-8 ARE run also scored 0/0 but used 234,628 known model tokens and 18 model calls. The new run used 132,392 fewer tokens (56.43% less) and 37.33 fewer seconds against the archived ARE arm. These are **descriptive, non-matched rerun differences**. The new event log contains 10 `model-response` events and **no `finalization-start` event**: the model selected voluntarily at call 10, so the 12-call ceiling did not force its behavior. The observed efficiency difference cannot be attributed to the call-cap intervention, and no quality improvement was obtained.

The result rejects this task-8 rerun as evidence for advancing the call-cap hypothesis. A future forced-finalization test must demonstrate an actual `finalization-start` event and valid scored selection. More importantly, the current G02 frontier is retrieval/selection quality: this task's selected 14 files still missed both native-gold files. Development must use already exposed tasks only; any transfer claim needs a fresh, fully valid paired cohort.

## Open Questions

- Which source-observable cues could surface the relevant iterator implementation before final selection, without using evaluator gold at runtime?
- Can a separately frozen policy improve native Span-F1 and File-F1 on multiple exposed repositories without more tokens and time?
- Can that policy qualify on a fresh matched G02 cohort under the exposure rule?
