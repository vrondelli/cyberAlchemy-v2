# G02 exposed NodeBB live cross-layer diagnostic r4

This is a **live ARE-only diagnostic on the already exposed** NodeBB chat-permissions task `09eb0d6d`, not a new matched ARE–DSH pair. The frozen four-task G02 result and its failed breadth gate remain unchanged. The run used the opt-in cross-layer source-hint ranker with the existing packet-aware orchestrator on the pinned NodeBB base. Earlier setup attempts r1–r3 are retained separately on the VPS; r4 is the first completed episode with the new hints actually delivered.

The event stream contains an `initial-source-packet` before the model requests. Its focused reads and the final delivery binding include the settings OpenAPI schema, admin settings view, client account settings, and account settings controller. The model selected the latter three, plus other reads, but omitted the delivered schema. The episode completed `final_context_selected` in 14 model calls with 119,617 known model tokens.

The pinned native scorer gave the **raw model prediction** Span-F1 **0.58825** and File-F1 **0.50000** (5/13 gold files, 7 predicted). Applying the additive, opt-in `task-anchored-cross-layer-r1` final selector added only the previously delivered settings schema: Span-F1 **0.57536** and File-F1 **0.57143** (6/13 gold files, 8 predicted). The schema increases file recall but adds enough non-gold span to reduce Span-F1 slightly. Both versions are above the *frozen* DSH task scores (Span-F1 **0.43701**, File-F1 **0.33333**), but this cross-run comparison is diagnostic because the task is exposed and the DSH arm was not rerun.

Full run receipts remain at `/opt/are/evolution-runtime/g02-cross-layer-nodebb-live-diagnostic-r4` on the GLM VPS, separate from the frozen pair. SHA-256 anchors: `evidence/run/result.json` `4d2d8e4395c68512b4ab04baa93cddaa4903725f923d3779f6a17f80daf26195`; `evidence/run/events.jsonl` `03c0d1a69a0af961ec6fb9124027f854300600c0213d12d5251e550d2c5eea7e`; raw `evidence/run/native-score.json` `af2aaef9b243425d33f93658948e02aeac903e9c6eb3f5048c75a96029beee2c`; selected `selected/selection.json` `0b048f43f668f25b9364ce3c55d817df91a42f22e749b859e018851ecdd92316`; selected `selected/native-score.json` `7b8cf94ea710d827e97e75240d0491faec297edd2f376ab4d8105aee81571dd9`.

## Open Questions

- Does this source-only acquisition plus receipt-bound selector improve quality on a fresh, untouched task against a contemporaneous DSH control while retaining G02's efficiency advantage?
- Should the final selector optimize Span-F1 rather than File-F1 when adding a delivered schema enlarges the selected span?
