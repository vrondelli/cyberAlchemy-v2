# One-turn public repair feedback

`packages/coding-agent-runtime/glm-flash-v1/public-feedback.mjs` adds an explicit post-submission stage. It accepts one strictly parsed proposal for `src/subject.mjs`, its original base/file hashes, a source-bound public-check plan, a fresh result directory and a trusted single-request transport callback.

The stage validates the original proposal first. Passing proposals return `UNCHANGED` without a model call. Child execution failures return `BLOCK` without becoming semantic repair instructions. Output mismatches produce one prompt containing the proposed source, declared public checks and failed check IDs. A replacement must use the existing native submission tool and strict scope parser. It then runs the same public checks and returns `REPAIRED` or `REJECTED`. Neither state applies a patch or proves hidden-test success. The original terminal coding-agent run remains intact.

Directories are exclusive; started/result records are fsynced and existing directories reject replay. A request failure is retained with uncertain attempt accounting; the transport ledger owns actual model/tokenizer counts. No automatic retry or second correction occurs. Public plans and input candidates are cloned before the asynchronous request. Candidate and evidence hashes are rechecked before accepting validation.

This stage opts into five seconds per child and two minutes per validation, with remaining batch time limiting each child. This budget was selected after loaded-host tests failed at the validator's default one second. The standalone validator retains its original default budgets; it now reports timeout and output-limit failures separately. Child permission and isolation limits remain those documented in [public validation](PUBLIC-VALIDATION.md).

`public-feedback-run.mjs` evaluates the six retained submitted candidates once, with an aggregate cap of two corrective model requests and four tokenizer requests. It uses the existing measured context admission and persistent transport ledger: effective soft bound 7744, hard window 16384, input margin512, output cap2048, final timeout60000ms. Hidden oracle checking occurs only after all feedback requests complete and never enters model prompts. This is a live corrective-stage evaluation on known proposals, not a fresh end-to-end task benchmark or continuity measurement. Defaults are not activated.

```sh
/path/to/node-26.8.1 public-feedback-run.mjs \
  /path/to/credential-reference.json \
  evidence/fixed-repeatability-2026-09-08/run \
  /path/to/new-evidence-directory /tmp/new-private-ledger-directory
```

## Open Questions

The [construction plan](evidence/public-feedback-2026-09-08/PLAN.md#open-questions) owns current questions. Prospective end-to-end episodes, larger context windows, unseen tasks, sustained host-load behavior and activation remain separate work.

The current explicit stage is `public-feedback-v2`: callers must provide the [execution readiness](EXECUTION-READINESS.md) adapter. This is checked immediately before a corrective request; denial records zero model attempts. The earlier live result remains evidence of v1.

The explicit runner now selects `public-feedback-v3` with `createContainerPublicValidator()`. Both validation points use disposable workers, with original/remapped plan and source receipt binding. Unconfirmed cleanup stops the run; container errors never fall back to native execution. Programmatic callers omitting a backend retain v2. [Integrated result and open questions](evidence/container-feedback-2026-09-08/README.md).

The programmatic stage accepts `maximum_model_attempts` of zero or one (default one). Zero still validates, accepts passing source unchanged, and distinguishes execution failure from semantic mismatch, but returns a budget-exhausted rejection before readiness or dispatch on a mismatch. The [shared correction composition](FORMAT-REPAIR.md#shared-correction-composition) now gathers schema and public diagnostics before its single request. A validation-only envelope with schema errors cannot take the unchanged-success path, even when its source passes public checks.

Current schema-driven implementation: [full contract and limits](SCHEMA-RECOVERY.md). The field-specific recovery described above is historical; the new stage reports all evaluable schema violations, admits recovery only when original source/scope are protected, and keeps the one shared correction allowance. [Current evidence and open questions](evidence/schema-recovery-2026-09-08/README.md).
