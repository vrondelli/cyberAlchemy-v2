# Define Experiment Runtime Design

Status: `L1-L3-zero-model-runtime-implemented`

Protocol: `define-downstream-utility@1`

## Purpose

This runtime executes the controlled experiment defined in `../PROTOCOL.md`.
It turns the selected six tasks and four conditions into 24 independent
plan-to-implementation chains.

The runtime must make the experiment easy to operate without making the result
easier to manipulate. It must keep hidden truth away from agents, keep planner
and implementer conversations separate, preserve every result, and stop when a
comparison is no longer fair.

This document designs the runtime. It does not authorize a live model call.

## Concrete Terms

- **Experiment**: one frozen 24-cell pilot.
- **Task block**: one repository task tested in all four conditions.
- **Cell**: one task under one condition. Example: Poker Team under
  `definition_pack`.
- **Condition packet**: the exact material visible for one condition.
- **Agent sandbox**: a source copy visible to the planner or implementer. The
  target implementation and hidden tests are absent.
- **Evaluator sandbox**: a separate source copy containing the hidden tests.
  Agents never see this copy.
- **Controller**: the local CLI that creates sandboxes, starts sessions, records
  state, runs checks, and prepares evidence rows.
- **Hidden truth**: the frozen original implementation, truth card, expected
  action, and semantic acceptance cases used only for evaluation.

## Design Decision

Use an interactive CLI as the controller. Run its zero-model L1/L2 mechanics in
the repository's Node 26 container with the source repository mounted read-only
and one exact run directory writable. Keep model credentials and future native
session creation outside that container. The same image validates packages,
rows, bundles, and metrics.

```text
operator or chat
      |
      v
interactive `define experiment` CLI
      |
      +--> frozen manifest and question ledger
      |
      +--> agent sandbox --> clean planner session --> frozen plan
      |                                             |
      |                                             v
      +--> fresh agent sandbox --> clean implementer session --> patch/outcome
      |                                                        |
      |                                                        v
      +--> hidden evaluator sandbox --> semantic checks --> blind review packet
      |                                                        |
      |                                                        v
      +--> two reviews --> append-only row --> validator container --> report
```

The first pilot runs one cell at a time. Parallel execution is deferred because
it makes resource equality, session isolation, and failure diagnosis harder.

## What We Reuse

The runtime reuses existing work instead of creating a second experiment
framework:

- `../PROTOCOL.md` owns experiment meaning and stop rules.
- `../TASK-PORTFOLIO.md` owns the six selected tasks.
- `../FACT-SET-CONTRACT.md` owns information parity.
- `../evidence/*.schema.json` and validators own evidence shape.
- `../../CONTAINER.md` owns the dependency-light validation container.
- Arcanum Experiment Harness supplies patterns for one-prompt execution, final
  output capture, raw logs, reports, and observability.

Arcanum's stability loop is not used for experiment cells. That loop may retry
and improve an artifact. This experiment allows one attempt per cell. A failed
result is evidence and must not be repaired and rerun as the same cell.

## What The Runtime Does Not Do

- It does not decide whether Define works.
- It does not create new product or architecture decisions during a run.
- It does not change the selected task or hidden cases after assignment.
- It does not expose hidden tests, the original target implementation, or the
  truth card to planner or implementer sessions.
- It does not silently retry a consumed model attempt.
- It does not run automatic improvement or patch the experiment materials.
- It does not publish, deploy, push, or call live product services.
- It does not put model credentials in an image or experiment packet.

## Owners

| Owner | Responsibility |
| --- | --- |
| Experiment owner | Confirms the frozen manifest, model, budget, reviewers, privacy boundary, and permission to start live sessions. |
| Task meaning owner | Freezes the source packet, truth card, expected action, hidden cases, and allowed write surface for one task. |
| Controller | Executes the frozen mechanics and records evidence. It has no product-decision authority. |
| Planner | Produces one plan from the visible packet. It cannot modify code. |
| Implementer | Uses the frozen plan and condition packet. It may write only allowed target paths or return `abstain`, `ask`, or `escalate`. |
| Evaluator | Applies the allowed implementation diff in a hidden sandbox and runs the frozen checks. |
| Reviewers | Score the blind plan and result independently before seeing the condition label. |

## Three Gates Only

Governance is kept to the minimum needed for a fair experiment.

1. **Freeze gate**: exact task, condition, runtime, budget, reviewer, and hidden
   evidence digests are complete and valid.
2. **Live authorization gate**: the experiment owner confirms the frozen
   manifest digest and cost ceiling. Preparation grants no model-run authority.
3. **Final validation gate**: all rows and manifests pass the joined bundle
   validator before metrics are interpreted.

Normal state transitions between these gates are mechanical. They do not need
new owner decisions.

## Runtime Components

| Component | Concrete responsibility |
| --- | --- |
| Interactive CLI | Shows the next safe action, keeps unanswered questions visible, and invokes one bounded operation. |
| Manifest freezer | Binds selection, source, condition, model, tools, budget, reviewers, seed, and sandbox profiles by digest. |
| Question ledger | Preserves each open question and answer so CLI and chat can display the same state. |
| Condition compiler | Produces ticket, notes, pack, and pack-plus-gate packets from one frozen fact set. |
| Task profile registry | Records visible paths, withheld paths, allowed writes, runtime image, dependency closure, and hidden test command for each task. |
| Sandbox builder | Creates clean agent and evaluator sandboxes from the pinned commit. |
| Session adapter | Starts a new planner or implementer session and captures session identity, prompt, final output, raw log, timing, and tokens. |
| Gate adapter | For the fourth condition only, checks the frozen commitment policy before implementation writes are enabled. |
| Diff collector | Exports only allowed implementation changes and rejects out-of-scope writes. |
| Hidden evaluator | Applies the allowed diff to the evaluator sandbox and runs the frozen semantic cases without exposing them. |
| Review queue | Creates condition-blind review packets and records two independent scores. |
| Evidence compiler | Derives append-only run rows from recorded events. Operators do not hand-edit completed rows. |
| Validator adapter | Runs existing selection, condition, row, bundle, and metric checks in the read-only validation container. |

## Interactive CLI

Running `define experiment` with no subcommand opens the wizard. The wizard
shows the current experiment, the next legal action, blockers, remaining
budget, and any unanswered question.

Proposed commands:

```text
define experiment init --selection <task-selection.json>
define experiment prepare
define experiment status
define experiment questions
define experiment answer <question-id>
define experiment freeze
define experiment authorize
define experiment next
define experiment run-planner <cell-id>
define experiment run-implementer <cell-id>
define experiment evaluate <cell-id>
define experiment review <cell-id> --reviewer <reviewer-id>
define experiment validate
define experiment report
define experiment resume
```

The normal operator should need only the wizard, `status`, and `next`.
Stage-specific commands exist for inspection, testing, and recovery.

The runtime must never interpret `next` as permission to start every remaining
cell. `next` performs one bounded transition. Batch execution requires a
separate explicit `--all` request and is not part of the first pilot.

### Questions In CLI And Chat

Every question has:

```text
question_id
experiment_id
cell_id or experiment scope
question
why_it_blocks
allowed_answer_shape
asked_at
status
```

Answers are appended as separate events. A question remains visible until it
is answered or explicitly withdrawn. A chat adapter and the CLI read the same
ledger, so a question can be shown in both places without creating two sources
of truth.

The first version needs no IPC socket and no long-lived server. Files, an
exclusive run lock, and one active controller process are enough. An optional
UI can poll the same state later.

## Experiment State

Experiment states:

```text
draft
  -> prepared
  -> frozen
  -> authorized
  -> running
  -> awaiting_review
  -> validated
  -> closed
```

`blocked` and `protocol_deviation` are terminal states unless the block is a
pure launcher or evaluator failure that occurred without changing frozen
inputs or consuming a model attempt.

Cell states:

```text
pending
  -> sandbox_ready
  -> planner_running
  -> plan_frozen
  -> implementer_running
  -> implementation_frozen
  -> hidden_checked
  -> awaiting_review
  -> row_recorded
```

The controller derives current state from the append-only event log. It does
not overwrite earlier outcomes to make a cell look complete.

## Frozen Experiment Manifest

One immutable manifest binds the complete pilot:

```text
schema and protocol IDs
experiment ID
task-selection path and digest
six condition-manifest paths and digests
repository commit
task-profile paths and digests
source, truth-card, target, and hidden-check digests
randomization seed and per-task condition orders
model and harness identity
tool and task-runtime identities
planner and implementer budgets
sandbox limits
reviewer identities and blinding plan
privacy boundary
cost ceiling
external-effect envelope
authorization status, actor, time, and manifest digest
```

Changing an acceptance-bound field creates a new manifest. It does not update
an authorized manifest in place.

## Task Runtime Profile

Each selected task needs one profile before the freeze gate. The profile makes
isolation concrete instead of relying on a prose promise.

Required fields:

```text
task_id
repository_commit
visible_source_paths
withheld_target_paths
hidden_test_paths
allowed_write_paths
forbidden_paths
dependency_closure_digest
agent_runtime_image_or_toolchain_digest
evaluator_runtime_image_or_toolchain_digest
visible_validation_commands
hidden_validation_commands
timeout and resource limits
network policy
expected action
baseline receipt digest
```

Example for HTML canonicalization:

- visible: function signatures, package contract, dependencies, and the common
  task packet;
- withheld: the bodies of `canonicalizeHtml` and `canonicalHash`;
- hidden: the six semantic tests and current implementation bytes;
- allowed write: `canonicalize.ts` only;
- network: none;
- evaluator: apply the exported change to a clean full snapshot and run the six
  hidden tests.

## Sandbox Isolation

Every cell uses separate directories and new session identities.

### Agent Sandbox

The controller creates the agent sandbox from the pinned repository commit. It
then removes:

- the original target implementation;
- hidden tests and truth cards;
- other condition materials;
- earlier cell outputs; and
- credentials, unrelated writable mounts, and live service configuration.

The target public interface and required dependencies remain. The controller
calculates a visible-sandbox digest before planner and implementer sessions.
For one task, the visible source digest must be equal across all four cells.

The planner receives a read-only sandbox. The implementer receives a fresh copy
of the same visible source, the frozen plan, and the same condition packet. It
does not receive planner conversation history.

### Evaluator Sandbox

The evaluator sandbox starts from a separate full snapshot of the pinned
commit. It contains hidden tests but is never mounted into an agent session.

The controller:

1. validates the implementer diff against the allowed-write list;
2. applies only that diff to the evaluator sandbox;
3. runs the frozen hidden command with network disabled;
4. records command identity, exit status, case counts, diagnostics, and output
   digest; and
5. destroys or seals the evaluator sandbox after evidence capture.

The agent never receives hidden test output during the cell. Hidden findings
go only to reviewers and evidence compilation.

## Condition Assembly

All four conditions bind one common ticket and source packet.

| Condition | Additional visible material |
| --- | --- |
| `ticket_only` | none |
| `equivalent_notes` | information-matched prose notes |
| `definition_pack` | Definition Pack with the same fact IDs |
| `definition_pack_evidence_gate` | the same Definition Pack plus a separate gate policy |

The condition compiler does not generate materials after assignment. It uses
already frozen artifacts and checks their digests.

For the fourth condition, the gate adapter controls the transition from
`plan_frozen` to implementation writes. It checks the exact gate policy and a
commitment record produced by the implementer. It must not reveal hidden facts,
suggest code, or turn a failed commitment into a successful implementation.

## Planner And Implementer Sessions

The session adapter prefers a new native Codex session or subagent for each
role. An explicit legacy CLI adapter may be used only when the frozen harness
identity names it.

For every cell:

1. Start a new planner session in the read-only agent sandbox.
2. Capture its prompt, session ID, final plan, raw log, time, tokens, and tool
   identity.
3. Reject an empty output or a message that only says where a plan was saved.
4. Freeze the plan bytes and digest.
5. Start a new implementer session in a fresh writable agent sandbox.
6. Pass only the condition material and frozen plan, not planner chat history.
7. Capture one explicit outcome: `implement`, `abstain`, `ask`, or `escalate`.
8. If the outcome is `implement`, freeze and export the allowed diff.

The runtime records any question asked by the agent. It does not invent an
owner answer. If an answer would change task meaning, the cell stops as
`blocked` or `protocol_deviation` according to the frozen truth card.

## Review

The controller creates a review packet with a random review ID. It excludes the
condition name, condition manifest, raw prompt wrappers, and material labels.

The packet contains only what the frozen rubric permits, such as:

- the task statement and permitted source references;
- the plan;
- the observed action;
- the allowed implementation diff;
- hidden evaluation summary;
- scope findings; and
- the review rubric.

Two reviewers submit scores independently. The second reviewer cannot see the
first review. After scoring, each reviewer records a condition guess and
confidence. Adjudication, when needed, adds a third record and never replaces
the original two reviews.

## Evidence And Files

Canonical runtime design and future implementation live under:

```text
experiment/runtime/
  RUNTIME-DESIGN.md
  cli/                       # controller implementation
  schemas/                   # runtime-only schemas
  profiles/                  # frozen task profiles
  fixtures/                  # zero-model rehearsal inputs
  tests/                     # zero-model runtime regression tests
  runs/                      # generated local state; repository-ignored
```

Generated run state lives under:

```text
experiment/runtime/runs/<experiment-id>/
  manifest/
    experiment-manifest.json
    authorization.json
    condition-orders.json
  events.jsonl
  questions.jsonl
  answers.jsonl
  tasks/<task-id>/
    source-packet/
    hidden/                  # controller/evaluator only
  cells/<task-id>/<condition>/
    planner/
    implementer/
    evaluator/
    review/
  rows/run.jsonl
  reports/
```

The repository-level `**/development/**/runs/` rule already excludes generated
run directories. A nested ignore file would itself be untrackable and is not a
runtime artifact.

The controller uses one exclusive `run.lock` and atomic file replacement for
derived current-state views. Evidence events and answers remain append-only.
The lock prevents a CLI and chat adapter from advancing the same cell at once.

## Event Record

Each event contains at least:

```text
schema_version
sequence
recorded_at
experiment_id
task_id
condition
cell_id
event_type
actor_or_adapter
prior_state
result_state
input_digests
output_digests
session_id when applicable
status
deviation_codes
```

Run rows are compiled from these events and the frozen manifest. A completed
row is never accepted when a required observation is unknown.

## Failure And Retry Rules

| Failure | Runtime behavior |
| --- | --- |
| Controller fails before a model session starts | Resume the same state after verifying all input digests. |
| Model launcher fails before the prompt is delivered and no usage is recorded | One mechanical retry may use the same cell identity. Record both launcher events. |
| Agent receives the prompt or produces any output | The attempt is consumed. Do not silently rerun the cell. |
| Agent output is empty after a consumed session | Record `blocked`; preserve raw logs and usage. |
| Implementer changes forbidden paths | Freeze the diff, record a scope violation, do not apply it to the evaluator. |
| Hidden evaluator has an environmental failure | Keep the implementation frozen; rerun only the exact evaluator command after proving identical hidden bytes and runtime identity. |
| Hidden test fails semantically | Record the failure. Do not improve and rerun the same cell. |
| Reviewer learns the condition before scoring | Record `protocol_deviation`; do not replace the review silently. |
| Source, packet, model, budget, or tool identity drifts | Stop the affected task block. A changed frozen input requires a new manifest. |

## Runtime And Container Boundaries

- The controller targets Node `26.8.1` and the repository's current Node 26
  toolchain identity.
- L1/L2 controller mechanics run in the Node 26 image. The repository mount is
  read-only; only one exact run directory is writable. Future model session
  adapters remain host-owned and outside the image.
- Task evaluation uses the runtime profile for that task. The RPV task uses its
  frozen Python environment; Node tasks use their frozen Node toolchain and
  dependencies.
- Build and test commands run without external network access unless the
  authorized manifest explicitly says otherwise. The first pilot should set
  external effects to `none`.
- The existing `cyberalchemy-define-research:local` image validates the final
  read-only evidence bundle. It does not receive model credentials or source
  write access.

One universal task image is not required. The tasks use different dependency
closures. Fairness comes from freezing the runtime profile within each
four-condition task block, not from forcing every task into one image.

## Security And Privacy

- Use only the selected synthetic or repository-local material.
- Never copy credentials, personal data, host Git configuration, or unrelated
  dirty files into a sandbox.
- Network is off for sandboxes and evaluators by default.
- The host model adapter receives only the agent sandbox path and condition
  packet.
- Hidden material paths are outside the agent-visible root.
- Raw logs are private local evidence and are not publication artifacts.
- Sandbox cleanup must name one exact cell directory. It must never recursively
  target a repository or home directory.

## Implementation Layers

| Layer | Minimum useful result | Exit check |
| --- | --- | --- |
| L0 — Design | This runtime design and documentation links exist. | Package validation passes; no live run starts. |
| L1 — Prepare-only CLI | Wizard, state derivation, questions, manifest drafting, and status work with fixtures. | Zero model calls; restart shows the same state and unanswered questions. |
| L2 — Isolation | One low-control task profile builds equal agent sandboxes and a separate evaluator sandbox. | Leakage tests prove target and hidden bytes are absent; four visible source digests match. |
| L3 — Synthetic chain | Neutral fixture planner and implementer adapters produce a complete four-condition task block. | Existing joined validator accepts a synthetic block; failure fixtures remain nonzero. |
| L3.5 — Benchmark admission | Research and admit bounded public software-agent benchmark tasks after L3. | Candidate provenance, license, contamination risk, offline runtime, hidden truth, and write bounds are explicit before owner selection. |
| L4 — Native single cell | One explicitly authorized cell runs with new planner and implementer sessions. | Session separation, output capture, diff bounds, cost accounting, and stop behavior pass. |
| L5 — Review and task block | Two blinded reviews and all four conditions work for one task. | One complete task block validates; reviewers submit independently and blinding guesses are recorded. |
| L6 — Full pilot | Six task blocks execute in frozen randomized order. | Exactly 24 live rows join to six manifests and pass final validation. |

Do not skip from L0 to L4. The L1–L3 rehearsal proves that interaction,
isolation, and evidence mechanics work without spending live model budget.

## Runtime Acceptance Criteria

The runtime implementation is ready to request a live canary only when:

- a restart resumes from the same event-derived state;
- questions remain visible in the CLI until answered;
- CLI and chat adapters cannot advance the same state concurrently;
- all four agent sandboxes for one task have the same visible source digest;
- withheld implementation, hidden tests, truth card, and other condition
  materials are absent from agent-visible paths;
- planner and implementer session IDs are different;
- implementer input contains the frozen plan but no planner conversation;
- forbidden writes are rejected before hidden evaluation;
- one consumed attempt cannot be rerun as the same cell;
- the gate condition uses the same Definition Pack digest as the pack-only
  condition;
- two reviewers score independently without the condition label;
- unknown values remain `null` and are named;
- one synthetic four-condition block passes the joined validator;
- expected leakage, drift, scope, and retry mutants fail;
- no model credential or live product integration is present in the validation
  image; and
- the live authorization gate still requires an explicit owner action.

## Design Decisions

| ID | Decision | Reason |
| --- | --- | --- |
| RD-01 | Host-side controller, validation container | Native sessions need host integration; validation should remain credential-free and read-only. |
| RD-02 | File-backed state, no IPC socket | One operator and one transition at a time do not require a service. Files make questions and recovery inspectable. |
| RD-03 | Separate agent and evaluator sandboxes | Hidden truth must be technically absent, not merely described as hidden. |
| RD-04 | Fresh planner and implementer sessions | The experiment measures handoff continuity, so conversation leakage invalidates the cell. |
| RD-05 | One attempt per cell, no auto-improvement | Retries after seeing an outcome would bias the comparison. |
| RD-06 | Sequential first pilot | Reduces machine-resource and concurrency differences between conditions. |
| RD-07 | One task runtime profile shared across its four cells | Conditions vary representation, not source or execution environment. |
| RD-08 | Existing row and bundle validators remain authoritative | The runtime should produce evidence for the current contract, not invent a competing result format. |
| RD-09 | Wizard and chat share one question ledger | Questions can remain visible in both interfaces without diverging state. |
| RD-10 | Three gates only | Freeze, authorization, and final validation are sufficient for this bounded pilot. |

## Decisions Deferred To The Frozen Manifest

The design does not choose:

- the live model and exact harness adapter;
- planner and implementer token or time budgets;
- reviewer identities and whether they are human, agent, or mixed;
- the total live cost ceiling;
- the date and operator of the pilot; or
- any external-effect permission beyond the recommended `none`.

Those choices change the experiment instance, not the runtime architecture.

## Claim And Authority Limit

Completing this design supports implementing and rehearsing the runtime. It
does not authorize a live model run and does not show that Define improves
plans, implementations, comprehension, time, or product value.
