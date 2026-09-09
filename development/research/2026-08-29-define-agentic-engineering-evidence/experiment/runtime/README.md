# Define Experiment Runtime

Status: `L1-prepare-L2-isolation-and-L3-synthetic-chain`

This directory contains the local controller for preparing the Define
downstream-utility experiment. L1 records preparation decisions and can move a
run from `draft` to `prepared`. L2 can then build and verify source bases for
the four conditions and a separate evaluator base. L3 builds, seals, runs, and
validates one neutral synthetic four-condition block. It cannot freeze or
authorize a live run, create an agent session, call a model, execute hidden
tests, or publish anything.

## Run The CLI

Use Node 26 and give every command an explicit run directory:

```text
node experiment/runtime/cli/define.mjs experiment init \
  --run /absolute/local/run-directory \
  --selection /absolute/task-selection.json \
  --experiment-id define-pilot-001

node experiment/runtime/cli/define.mjs experiment --run /absolute/local/run-directory
node experiment/runtime/cli/define.mjs experiment status --run /absolute/local/run-directory
node experiment/runtime/cli/define.mjs experiment questions --run /absolute/local/run-directory
node experiment/runtime/cli/define.mjs experiment answer experiment_owner "owner-id" --run /absolute/local/run-directory
node experiment/runtime/cli/define.mjs experiment prepare --run /absolute/local/run-directory
node experiment/runtime/cli/define.mjs experiment next --run /absolute/local/run-directory

node experiment/runtime/cli/define.mjs experiment isolation build \
  --run /absolute/local/run-directory \
  --profile /absolute/task-runtime-profile.json \
  --attempt attempt-001 \
  --repository /absolute/source-repository

node experiment/runtime/cli/define.mjs experiment isolation status \
  --run /absolute/local/run-directory --attempt attempt-001

node experiment/runtime/cli/define.mjs experiment isolation verify \
  --run /absolute/local/run-directory --attempt attempt-001

node experiment/runtime/cli/define.mjs experiment block build \
  --run /absolute/local/run-directory \
  --isolation-attempt attempt-001 \
  --block-attempt block-001

node experiment/runtime/cli/define.mjs experiment block inspect \
  --run /absolute/local/run-directory --block-attempt block-001

node experiment/runtime/cli/define.mjs experiment block seal \
  --run /absolute/local/run-directory --block-attempt block-001 \
  --confirm-digest <candidate-digest>

node experiment/runtime/cli/define.mjs experiment block run-synthetic \
  --run /absolute/local/run-directory --block-attempt block-001

node experiment/runtime/cli/define.mjs experiment block validate \
  --run /absolute/local/run-directory --block-attempt block-001
```

With no subcommand, the interactive wizard shows the status and all unanswered
questions. In a terminal it records at most one answer or one `draft` to
`prepared` transition. In non-interactive use it only displays current state.
`next` also performs at most one action: it displays the first unanswered
question, moves a ready draft to `prepared`, or reports the L1 boundary.

`init` copies the task-selection file into the run, checks the original and
copy with `validate_task_selection.py --live-pilot`, and binds its SHA-256 in
the manifest draft. This confirms the six-task selection shape. It does not
authorize the experiment. `isolation build` accepts only a `prepared` run. It
reads files from the profile's exact Git commit, replaces the withheld target
with the bound stub, and writes immutable rehearsal bases under the run. Dirty
working-tree bytes are not copied.

## Persisted Files

Each run contains:

```text
events.jsonl                         append-only controller events
questions.jsonl                      append-only question ledger
answers.jsonl                        append-only answer ledger
state.json                           atomic event-derived current view
manifest/task-selection.json         bound selection copy
manifest/experiment-manifest.draft.json
isolation/attempts/<attempt>/profile.json
isolation/attempts/<attempt>/agent-bases/<condition>/...
isolation/attempts/<attempt>/evaluator-base/...
isolation/attempts/<attempt>/isolation-rehearsal-receipt.json
block-attempts/<attempt>/candidate/...
block-attempts/<attempt>/sealed/seal-receipt.json
block-attempts/<attempt>/cells/<condition>/...
block-attempts/<attempt>/rows/run.jsonl
block-attempts/<attempt>/validation-receipt.json
```

The CLI creates `run.lock` exclusively for a mutation and removes it after the
operation. Read-only `status` and `questions` commands do not take the lock.
Both a future chat adapter and the CLI must read these same ledgers; neither
should maintain a separate copy of a question or answer.

Generated run directories belong under `runs/` for normal use. The repository's
development-run ignore rule already excludes that directory from Git. The
fixtures use temporary directories.

## Test

```text
node --test experiment/runtime/tests/*.test.mjs
```

The focused tests cover restart persistence, unanswered-question visibility,
one-step `next`, the prepared transition, exact-commit materialization, four
equal agent-visible digests, evaluator-only hidden truth, drift detection,
path and symlink rejection, exclusive locking, and the absence of live
authorization or model calls. L3 tests also cover exact fact parity, neutral
four-row compilation, distinct synthetic session identities, explicit digest
confirmation, L2 drift, row mutation, and the existing joined validators.

Public software-agent benchmark tasks are a later admission lane, not part of
L3 completion. See `BENCHMARK-ADMISSION.md`.
