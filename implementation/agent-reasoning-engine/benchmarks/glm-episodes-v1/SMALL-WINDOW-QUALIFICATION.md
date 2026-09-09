# Three-round small-window qualification

`small-window-qualification.py` runs three predeclared repetitions of a twelve-condition8K/10K/12K schedule. It freezes generation, schema, validation, handoff, scoring, schedule and controller sources before execution. Each round completes initial episodes, shared correction and separate final oracle. Ordinary failed outcomes stay counted; source drift, incomplete phases, inconsistent scores or unknown accounting stop the controller. Existing directories reject replay.

Required arguments: `--plan`, `--node`, `--credential`, `--raw`, `--output`. Credential input is a reference path and is not copied to exported evidence. Without transport recovery, three rounds cap516 model/1032 tokenizer attempts and72 public workers. An explicit `maximum_model_retries:2` schedule reserves at most72 additional physical model attempts across36 initial trials, giving588/1032 caps. Each logical request allows at most one retry; the total reserve is shared across its initial trial. Schema/semantic correction remains one attempt with no retry. The aggregate acceptance requires36 final verified plus context/continuity and worker cleanup/execution gates. Model scores do not imply source application or runtime activation.

## Open Questions

See the [opt-in recovery plan](evidence/transient-recovery-qualification-2026-09-08/PLAN.md#open-questions). Original questions are owned by [the qualification plan](evidence/small-window-qualification-2026-09-08/PLAN.md#open-questions).
