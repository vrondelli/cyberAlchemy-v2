# ARE benchmark tool-contract audit

This audit found **ten current defects or reusable opportunities** and one historical issue that is already bounded on the current revision path. The highest-priority current problems are failed-call recovery, paging below the result-size ceiling, terminal action availability, source-bound patch arguments, and phase scheduling after exact-match rejection. These are tool/harness concerns that can amplify model mistakes; they are not evidence that the model alone caused the resulting task failures.

The machine-readable record is [findings.json](findings.json). It carries severity, evidence posture, ownership classification, paths and event indices, reproduction, qualitative token impact, repair candidates, and meaningful validation for every finding.

## Priority findings

| ID | Severity | Evidence | Current conclusion |
| --- | --- | --- | --- |
| TC-001 | High | Source-reproduced | A malformed native inspection call returns a typed host BLOCK but no corrective tool result to the model, ending the episode. |
| TC-002 | High | Live + source | Recovery reservation can expose only staging/reporting after an exact-match failure whose own correction says to reread source. |
| TC-003 | High | Source-reproduced | The read runtime rejects a large full result before the paging adapter can slice it. |
| TC-005 | High | Source-inferred | The final native turn exposes submission even when the completion gate is known to be incomplete; no structured inability terminal is available. |
| TC-006 | High | Live + source | A path repeated inside every edit was omitted in six consecutive staging calls; the unchanged correction did not alter the failure loop. |
| TC-004 | Medium | Source-reproduced | Provider-visible patch schema allows a path paired with another allowlisted file's hash; the local parser rejects it later. |
| TC-007 | Medium | Live + source | External repository failures collapse distinct correctable causes into `bounded repository tool failed`. |
| TC-008 | Medium | Source-inferred | The recycler's `task_state` is a frozen initial clone. Dynamic workflow state is separately re-presented and does not preserve evolving source conclusions. |
| TC-009 | Medium | Source + captures | Stable evidence is repeated within and across requests, consuming input tokens without adding information. |
| TC-010 | Medium | Live + source | `report_unable` accepts any non-empty reason/ref strings; a literal placeholder terminal was accepted. |

TC-011 is historical: old evidence contains raw container stacks for staging mismatch, while the current `stagingFeedback` path sanitizes this known error. It should remain a regression case rather than be planned as an unfixed current defect.

## Contract and validation assessment

The shared validators are generally strict about complete objects. External benchmark tools pass every call through bounded JSON parsing and closed Ajv schemas. The GLM native validator recursively enforces required fields and rejects unknown fields before executing a batch. I did not find a current adapter that simply bypasses whole-call schema validation.

The defects appear at other layers:

- the advertised schema misses a path-to-digest cross-field binding;
- mechanically required fields create repeated failure modes without source-bound assistance;
- backend failures lose their safe corrective category;
- strict validation becomes terminal rather than a model-visible correction;
- controller phases remove an action that the previous tool result says is required;
- deterministic storage and prompt presentation are treated as if they implied useful reasoning continuity.

The local cross-field reproduction used two allowlisted paths and hashes. `patchToolSchema` accepted the wrong file hash for a path; `parseSubmission` rejected the same value. The paging reproduction allowlisted the repository's 149,356-byte `feedback-timing-v1/closeout.json`; `createReadOnlyToolRuntime().invoke("read-file", ...)` returned `tool.result-limit-exceeded`, confirming that the later page adapter cannot operate on that result.

## State, archive, and presentation distinction

`context-recycling.mjs` deterministically binds and persists the initial task state and raw history. That is useful integrity and recovery machinery. It does not update `facts`, `lessons`, `completed`, or `pending`. The external runners compensate by rendering `workflow.snapshot()` on each turn. That snapshot keeps hypotheses, candidate/test identity, and probe counts, but it does not capture all useful conclusions learned from source.

Archives therefore establish that bytes can be recovered. They do not establish that the model's useful reasoning has been preserved or that the relevant bytes are in the current presentation. A future repair should keep deterministic memory maintenance separate from presentation: explicit typed operations may append source-linked findings, and a prompt planner may select/deduplicate them. Neither layer should claim preservation of hidden reasoning.

The same separation matters for tokens. The external runner repeatedly serializes full public context and then repeats baseline evidence inside workflow state. Current GLM captures can simultaneously include an inspected-source projection and a retained raw read result for the same bytes. Storage is cheap under the user's cost model; repeated input presentation is not.

## Design, implementation, model, and historical attribution

The live traces show model-originated malformed arguments, incorrect exact text, placeholder edits, and a placeholder inability report. The harness made several of those errors more expensive: it repeated an unchanged correction, removed reads at a recovery checkpoint, accepted semantically empty inability, or erased the backend failure category. Findings mark both sides when that distinction matters.

The large-file paging order and cross-file digest schema are current implementation bugs independent of model behavior. The final-turn submission-only state and static-vs-dynamic state split are controller/architecture design gaps. Raw stack trace exposure belongs to an older frozen path and is already improved in the current revision path.

## Coverage

- `glm-fitting-v1`: benchmark/live adapter and tests. Its live request deliberately has `tools: []`; it contributes terminal/output and token-accounting context but no coding-tool contract.
- `glm-episodes-v1`: episode construction and verification, runner, native submission probe, current GLM agent loop, tool schemas, paging, delivery, archive recovery, completion policy, source preservation, patch schema/runtime, and read-only runtime.
- `external-context-v1`: shared schema/backend plus current success, holdout, feedback timing, and recovery-reservation phases, runners, workflow, recovery controller, prompt captures, and all discovered model-visible failures in `evidence/*/events.json`.
- `real-reasoning-v1`: compaction/live benchmark surfaces and schemas. Its tool pairs are deterministic event fixtures or no-tools live requests; they do not implement the repository editing tools audited above.

The audit covered all requested dimensions: all-fields validation, arguments, patch staging/exact matching, reads/search, result shape and error repairability, terminal calls, phase/action availability, evidence/archive recovery, token presentation, and state capture versus presentation.

## Limitations

No provider request, credential access, Docker execution, fix, or commit was performed. Frozen evidence supports observed claims; bounded local calls support the two reproduced source defects. The companion trace audit owns exhaustive experiment aggregation. Token impacts remain qualitative because these traces do not isolate causal token counts per contract defect.

## Open Questions

- What remaining-turn threshold should permit a malformed tool call to receive one repair turn rather than terminate?
- Should exact patches use complete-file replacement, source-bound hunks, or both under the same transactional verifier?
- Which dynamic facts should be admitted through explicit typed state operations, and which should remain unpreserved model reasoning?
- Can per-request content-digest deduplication reduce tokens without weakening stateless provider recovery?
- Do all target providers reliably enforce conditional JSON Schema, or would file-scoped tools be more portable?
