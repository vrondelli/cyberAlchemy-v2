# Audit of narrow fixes in GLM/ARE evaluation work

Candidate planning evidence for schema-recovery-plan-39. Findings are bounded to the current ARE paths below and linked historical experiments. Current source is not asserted to be committed. No runtime or fixture edits, provider calls, container runs, dependency installation or new authority admission occurred in this audit. [Implementation plan](SCHEMA-RECOVERY-PLAN.md).

| Priority / finding | Source evidence | Assessment and planned treatment |
| --- | --- | --- |
| P0: recovery knows one missing field | [format-repair.mjs](../../packages/coding-agent-runtime/glm-flash-v1/format-repair.mjs) compares the entire reason list to authority-effect-invalid and prompts that exact field | Confirmed instance of the criticized pattern. Replace with complete diagnostics plus a protected-source eligibility contract; do not add a schema-version branch. |
| P0: patch contract is duplicated and inconsistent | [parser](../../packages/coding-agent-runtime/patch-set-runtime.mjs), [native schema](../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs), [prompt guidance](../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs) separately enumerate keys/types | Parser accepts rationale:42 although the tool schema requires a string. Canonical schema and generated projections need parity tests. Base/path-to-hash predicates must still be local run bindings. |
| P0: parser diagnostic collection is incomplete for malformed shapes | [parsePatchSetCandidate](../../packages/coding-agent-runtime/patch-set-runtime.mjs) records changes-invalid then iterates changes without an array guard | Read-only probe reproduced TypeError for changes:{}. It already reports both missing schema and authority fields together, so replace the narrow consumer rather than pretending all diagnostic collection is missing. Add safe traversal and field paths. |
| P1: prompt patches repeat known output mistakes | [PATCH_CONTRACT_GUIDANCE, COMPACT_PATCH_CONTRACT, synthesisContract](../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs); [v15 evaluation](evidence/synthesis-adherence-2026-09-08/README.md) | Manual reminders repeat schema_version, authority_effect and rationale placement. V15 still had three missing-schema failures and only1/4 repairs versus3/4 for its paired v14 sample. Evidence does not establish prompt causality, but repeated reminders did not solve contract compliance. Derive guidance from schema; test removing redundancy separately. |
| P1: semantic prompt embeds benchmark defect hints | [agent.mjs](../../packages/coding-agent-runtime/glm-flash-v1/agent.mjs), minimal-repair-v18 branch names positional ordering, uniqueness, membership and both range boundaries | Confirmed task-specific guidance. [v18 targeted result](evidence/example-fields-2026-09-08/README.md#preserved-iterations) was2/4. Prefer source-bound requirements and public checks; test with withheld tasks and prompt ablation. This is semantic generalization, not a schema-validator responsibility. |
| P1: public-case selection is task-specific | [public-checks.mjs](public-checks.mjs) branches on episode IDs, selects first8 retention/scoring examples and authors three archive checks | Adjacent generalization opportunity, not evidence of an incorrect fix. Semantics legitimately need authored adapters. Plan declarative visible cases and explicit coverage/omission reporting; preserve source links and hidden-oracle separation. Do not claim every repository requirement is currently checked. |
| P2: version lists spread experimental behavior | [completion.mjs](../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs), [agent.mjs](../../packages/coding-agent-runtime/glm-flash-v1/agent.mjs) repeatedly enumerate v4–v20 memberships | Maintenance consequence of accumulating experiments. Consolidate into resolved immutable policy profiles after a behavior-equivalence test corpus. Keep old experiment identities and do not bundle prompt-policy changes with schema recovery. |
| P1: status extension escaped aggregation | [feedbackOutcome](feedback-schedule.mjs), [raw/corrected evidence](evidence/shared-correction-2026-09-08/README.md) | A new format BLOCK was omitted by the legacy NO_SUBMISSION counter. The local correction is valid, but future additions need an explicit submission/correction/final-state model and exhaustive aggregation tests, not another status-specific counter patch. |

## Existing mechanisms to reuse

- [tools.mjs](../../packages/coding-agent-runtime/glm-flash-v1/tools.mjs) already shares `SCHEMAS` between advertised tools and local matching. This is the right schema-source pattern, but `matches` is boolean, supports only its current small subset, and raises generic tool-arguments-invalid. Extend diagnostics later; do not treat it as a complete JSON Schema validator or silently support unimplemented keywords.
- [shared-correction.mjs](../../packages/coding-agent-runtime/glm-flash-v1/shared-correction.mjs) already composes one dispatch across format and semantic repair. Keep that budget instead of creating an independent repair loop for each validator.
- [public-feedback.mjs](../../packages/coding-agent-runtime/glm-flash-v1/public-feedback.mjs) already returns all failed public-check IDs, separates execution failure, and supports validation with zero correction attempts remaining. This is already a general feedback mechanism at its declared layer.
- [public-case-validation.mjs](../../packages/coding-agent-runtime/public-case-validation.mjs), [container backend](../../packages/coding-agent-runtime/container-public-validation.mjs), and [owned container](../../packages/coding-agent-runtime/owned-container.mjs) provide source-bound checks, isolated execution and verified cleanup. Reuse them unchanged for schema-recovery evaluation.
- [execution-readiness.mjs](../../packages/coding-agent-runtime/execution-readiness.mjs) and [secret provider](../../packages/coding-agent-runtime/sops-age-secret-provider.mjs) diagnose local readiness and fixed safe failure categories. Timeouts and secret errors should remain bounded execution failures, not model-correctable schema mistakes.
- A [generated router validator](../../packages/request-decision-router/generated/route-availability/runtime/boundary.mjs) exists, but uses a different model schema dialect and fails on the first error. It is generated projection evidence, not the canonical source for a new patch validator; copying or editing it would not solve ownership or complete diagnostics.

## Read-only reproduction

Three in-memory calls to the current parser, without provider or filesystem mutation by the parser, produced:

| Probe | Observed result |
| --- | --- |
| Valid patch envelope plus rationale:42 | Accepted |
| Valid patch envelope with changes:{} | TypeError |
| Both schema_version and authority_effect omitted | Rejected with both existing reason codes |

[Probe results and source hashes](evidence/schema-recovery-plan-2026-09-08/probes.json) retain these observations. These are diagnostic probes, not a new implementation test-suite pass. No accepted historical result was rescored.

## Open Questions

Owned by [the plan](SCHEMA-RECOVERY-PLAN.md#open-questions). The audit does not establish that unrelated repository packages share these defects. A later cross-package migration needs its own source inventory and contract owners; generic diagnostics must not imply generic effect retries.
