# Benchmark evolution workflow

Status: controlling continuation plan. Current as of 2026-09-26.
Authority effect: none. This document does not authorize provider calls,
publication, release or deployment.

## Purpose and Source of Truth

Use this workflow to continue the three active benchmark objectives without
reconstructing their state from the historical ledger. The evidence order is:

1. Immutable run, freeze, result and review artifacts establish what happened.
2. This workflow establishes the current direction and next admissible work.
3. [CURRENT-PROGRESS.md](CURRENT-PROGRESS.md) preserves detailed historical entries;
   its physical ordering is not a current-state signal.
4. Older plans and their `next` statements are historical snapshots only.

After every E10 decision below, update this file, [README.md](README.md),
[NEXT-DAG.md](NEXT-DAG.md), and the read-first block at the top of
[CURRENT-PROGRESS.md](CURRENT-PROGRESS.md). Append the detailed evidence to the
ledger; do not make future recovery depend on finding its newest paragraph.

## Fixed Research Contract

| Item | Contract |
| --- | --- |
| Direction | Screen ARE hypotheses cheaply against a pinned, reusable development control; run fresh matched controls only for promoted confirmation candidates |
| Model | GLM-5.3-Flash, low reasoning |
| Window | Strict 8,000-token projected request envelope |
| Per-task budget | At most 96,000 model tokens and 96 calls |
| Campaign budget | At most 384,000 model tokens across four fixed exposed tasks |
| Concurrency | At most two shared model workers |
| Accounting | Include every call, failure, retry and known input/output token; unknown usage remains unknown |
| Evaluation | Native Span-F1, File-F1, validity, completion, exact accounting and mechanism evidence |
| Prohibited shortcuts | No automatic retries, task replacement, gold in generation, hidden failed costs or relabeling post-hoc evidence as prospective |
| Confirmation | A qualifying development candidate receives a separately frozen untouched confirmation |

Historical controls may reject or prioritize a development candidate, but cannot
establish a new matched 15% token-savings claim. The owner's current objective is
to prove accuracy, token and efficiency improvements over control, so a promoted
candidate receives a fresh matched control on a separately fixed cohort. No
candidate-only screen is described as a causal confirmation.

## Fast Research Loop (current)

Freeze the objective, native scorer, task IDs, reusable control rows and budget
once per campaign. For each distinct hypothesis, record its one-sentence mechanism
and falsifier, make the smallest additive change, run only treatment on the fixed
development tasks, then combine its results with the pinned control rows. Score
with `node implementation/agent-reasoning-engine/packages/evolution-runtime/research/benchmark-fast-screen-v1/screen.mjs INPUT OUTPUT` using the normalized
`are.benchmark-fast-screen-input/v1` shape. The result reports the full paired
denominator, validity, quality, all known tokens and summed task elapsed time;
unknown usage or missing tasks reject the screen. This is a development decision,
not a benchmark claim.

Reject immediately when a quality, token or time gate fails. Do not run per-candidate
independent review or rebuild an entire launch package merely to reject it. For a
candidate that clears the screen, freeze an untouched cohort and execute fresh
matched control and treatment with separate source binding, exact accounting and
independent result check. Report wall time as well as per-task elapsed time; the
historical ContextBench discovery data lacks arm-specific elapsed time and cannot
prove efficiency. Preserve the old E0–E10 sequence below as the confirmation and
audit path, not a mandatory sequence for every exploratory candidate.

## Current Evidence Snapshot

### Active objective ledger (2026-09-26)

| Objective | Current durable boundary | Next gate |
| --- | --- | --- |
| G01 — GLM 8K ContextBench HEN-11 | **V22 generation, native scoring and independent review completed.** The continuation reused the immutable successful v21 task-4 row and dispatched only task 1. Settlement: two valid tasks, 45 bound model calls including the preserved row, 167,086 known model tokens, zero retries and no unknown usage. Native score-r2: task 1 Span/File-F1 `0`/`0`; task 4 Span-F1 `0.0710625214`, File-F1 `0.4`; mean Span-F1 `0.0355312607`. All three quality gates failed. Freeze `eba1fed7…be31`; results `88a0d742…a190`; review `6ab3fdda…31eb`. | Reject HEN-11 intent-anchor convergence at this exposed two-task boundary. Preserve all attempts and return to E1 to choose a materially different hypothesis; do not rerun or repair this candidate. |
| G02 — ARE×DSH large-window | **Call-cap16 rejected by a fresh valid JavaScript pair.** ARE Span/File-F1 `0.088928`/`0.173913`, 45,253 tokens, 119.45s versus DSH `0.396075`/`0.4`, 482,228 tokens, 223.41s. The source-only Go slot was stopped before dispatch. See the [fresh result](../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/g02-callcap16-confirm-r1/RESULT-NOTE.md). An earlier exposed call-cap16 screen passed, but did not generalize. Source-diverse 16-, 24- and 32-call screens on the now-exposed fresh task all failed native quality; the 32-call run recovered 22 archive outputs with only three distinct bodies and selected two files. See the [32-call result](../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/g02-diverse-callcap32-r1/RESULT-NOTE.md). | Reject the call-cap sweep. Test a targeted repeat-recovery/source-exploration mechanism treatment-only on the exposed JavaScript task. Promote only after a valid quality/token/time screen; then select another unexposed matched cohort. |
| G03 — LongMemEval unexposed full-S | **Fresh sixteen-question matched comparison complete.** The 5K ARE arm scored 11/16 with all judgments valid versus control 2/16 with 14 valid and two retained punctuation-only invalid judgments. All-in model tokens were 29,787 versus 2,229,566 (98.664% fewer), and summed arm-plus-judge time fell 97.585%. A 10K comparator scored 11/16 with one invalid judgment and used 50,967 tokens. A six-pair predecessor plus lossless zero-model-call recovery settled all sixteen; see [full result and receipts](../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/longmemeval-fast16-v1/RESULT-NOTE.md). | Retain a bounded positive G03 claim, including the conservative invalid-control sensitivity. Do not call this full-benchmark generalization. Prioritize G01 and G02 live comparative tests; any G03 replication uses new questions. |

No benchmark dispatch is currently active. G01 is a rejected hypothesis, G02's
fresh paired test rejected call-cap16 and the follow-up call-cap sweep failed
native quality; G03 has a positive fresh sixteen-question
paired result following its four-task development screen.
The three objectives remain independent; completion of one does not admit or
redefine another.

### G02 low-overhead screen boundary

The frozen full-cycle-80 worker remains the comparison source. For future
exploratory G02 screens only, an opt-in
[`ARE_SCREEN_TOKEN_CEILING` worker overlay](contextbench/deepseek-pilot-are-worker-screen-v1.mjs)
stops before the next model dispatch once **accounted** model spend reaches a
predeclared screen ceiling; unknown dispatched usage also stops it. It does not
alter source retrieval, prompt, scorer, successful under-ceiling dispatches, or
the default worker when unset. The overlay and ceiling must be bound in the
candidate manifest and mounted together; a stop is a failed screen, not a native
score. Its offline tests pass, and R3/R4 exercised it live without reaching the
ceiling. Replaying R2's
ledger shows a 261,037-token ceiling would have stopped after call 80 at
262,789 tokens, avoiding the final seven calls and 24,061 measured tokens.
This is a counterfactual saving, not a measured new run or a strict prospective
maximum: a final admitted call can cross the ceiling. The old no-retry provider
check returned HTTP 429/code `1113`; after the user updated the credential, a
new minimal no-retry check returned HTTP 200 with known usage. The provider
blocker was removed for R3/R4, but that does not validate future billing state.

After a G02 worker seals, use the
[`g02-collect-screen-v1.mjs` collector](../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/research/g02-collect-screen-v1.mjs)
with the sealed `RESULTS.json`, task ID, three numeric gates and an unused
output directory. For a valid export, give it the pinned scorer, upstream,
`full.parquet` and repository cache: it writes `prediction.json`, invokes the
native scorer once, then writes `native-score.json` and `screen.json`. A stopped
run needs none of the scorer inputs and produces a failed `screen.json` without
opening gold. Replaying the R1 task-3 export through this path reproduced the
prior native-score file byte-for-byte; replaying R2 rejected its absent export
and token overspend. This is a development gate, not a substitute for matched
confirmation or an elapsed-time measurement.

The 2026-09-26 independent reviews close the construction/readiness boundary for
all three objectives. Development execution has no human or cryptographic
pre-launch admission gate. A green unit suite does not override a failed
technical preflight, and an `execution_host` field does not
prove VPS execution without a checked host identity and VPS-resident executable,
source, output and receipt closure.

| Candidate | Evidence | Decision |
| --- | --- | --- |
| H-L recent-evidence ledger | Four live tasks; 331,492 tokens; mean Span-F1 0.3156; mean File-F1 0.4270; zero perfect | Completed and rejected as an improvement; retain as counterevidence |
| H-MC consensus selector | Post-hoc exposed-cohort selection; Span-F1 0.4169; File-F1 0.5865; no new calls | Promising hypothesis only; requires a leakage-safe prospective protocol |
| H-EN evidence neighborhood | Supervised R7 replay retained 46.7% to 100% projected acquisition, recovered all nine missing files, and settled all four worker groups cleanly | R1 findings repaired locally; independent R2 construction review is next |

The older H-EN/H-MC snapshot below is retained as historical diagnosis. Its
`next` statements do not override the active objective ledger above.

## Recovered Environment State

The 2026-09-20 post-restart preflight passed native Linux Node.js 26.8.1 with npm
11.19.0, Python 3.14.4, Docker client/server 29.8.1 and the repository-pinned
Rust/C toolchain. Node's user-local links resolve in a fresh WSL login shell and
the user has working Docker socket access. Rust must continue to run through
`tools/toolchain/run` as required by the repository contract.

Environment recovery is part of E0. A development run starts only from an
explicit runtime command that consumes its exact freeze; it does not require a
separate human authorization artifact. Docker is not a reason to delay HEN-01
or HEN-04 when those tasks do not use containers.

## Repeatable Evolution Cycle

Promoted confirmation candidates move through these gates. A failed gate returns
to hypothesis selection; it never silently advances.

| Gate | Required output | Advance condition |
| --- | --- | --- |
| E0 Recover | Current snapshot, source pins, environment and process check | No active or orphaned run; evidence paths resolve |
| E1 Diagnose | Measured failure and affected mechanism | Gap is supported by artifacts, not intuition |
| E2 Hypothesize | Candidate, null, expected mechanism and falsifier | Distinct, testable explanation registered |
| E3 Specify | Cohort, metrics, budgets, source policy, stop conditions and leakage boundary | Prospective contract is complete |
| E4 Construct | Additive implementation and regression tests | Exact candidate behavior is reproducible |
| E5 Validate | Independent construction review | All blocking findings closed |
| E6 Qualify | Real tokenizer, source, storage and process checks with generation disabled | Every request fits 8K and all resources settle |
| E7 Freeze | Exact sources, config, hashes and experiment registration | Development runner can consume the freeze and emit a launch receipt; no human signature is required |
| E8 Execute | Four fixed candidate-only outcomes, at most two workers | All assignments terminal and costs retained |
| E9 Evaluate | Native scores, accounting, mechanism audit and independent result review | Evidence reconstructs without placeholders |
| E10 Decide | Retain, revise, reject or advance to untouched confirmation | Decision cites the frozen criteria and names the next frontier |

## Historical H-EN Work Queue (superseded)

This table preserves the 2026-09-20 checkpoint. It is not the current execution
queue; use the active objective ledger above.

| ID | Work | Dependency | State |
| --- | --- | --- | --- |
| HEN-01 | Define canonical Git-byte policy for indexed evidence | None | Complete: raw pinned blob bytes |
| HEN-02 | Load bytes from pinned Git objects and verify path/tree object identity | HEN-01 | Complete |
| HEN-03 | Add assume-unchanged, skip-worktree and CRLF substitution regressions | HEN-02 | Complete |
| HEN-04 | Put all helper processes under bounded supervision and process-group ownership | None | Complete |
| HEN-05 | Test timeout, cancellation, post-verification and descendant settlement | HEN-04 | Complete: 11/11 focused tests |
| HEN-06 | Obtain a new independent construction review | HEN-03, HEN-05 | Ready |
| HEN-07 | Compress and deduplicate evidence hints under a declared limit | HEN-06 | Blocked |
| HEN-08 | Integrate H-EN as a separate candidate view with exact accounting | HEN-07 | Blocked |
| HEN-09 | Run initial, populated and terminal tokenizer qualification | HEN-08 | Blocked |
| HEN-10 | Register, freeze, review and execute the four-task run | HEN-09 | Blocked |
| HEN-11 | Score, audit the mechanism and make the E10 decision | HEN-10 | Blocked |

R2 construction evidence and the supervised R7 replay are recorded in
[contextbench/EVIDENCE-NEIGHBORHOOD-REPAIR-R2.md](contextbench/EVIDENCE-NEIGHBORHOOD-REPAIR-R2.md).
Do not begin compression, integration, tokenizer qualification or dispatch until
a new independent review closes both rejected findings.

## H-MC Separate Branch

Before H-MC can advance, specify how candidate outputs are produced without
same-task label leakage, how the selector is frozen before judging, which costs
belong to the candidate, and what result falsifies the consensus mechanism. Its
0.4169 post-hoc score is hypothesis evidence only and must not be used as the
prospective baseline or acceptance threshold without an explicit rationale.

## Historical Resume Checklist (superseded)

This checklist describes the earlier R2 continuation and is retained for
provenance only.

1. Bind the exact R2 sources, 11-test receipt and supervised R7 replay.
2. Obtain an independent construction review against both rejected R1 findings.
3. If approved, compress and deduplicate hints under a declared limit.
4. Integrate the result as a separate candidate view with exact accounting.
5. Continue through E6–E10 only when each preceding artifact says the gate passed.
6. At E10, refresh all four navigation documents named above.

## Round Namespace

Round numbers are global research-continuation labels, not equivalent benchmark
counts. In the large-window ARE–DSH branch, rounds 73–78 comprise two comparisons
(73 and 74), one offline audit (75), two ARE-only identity-repair trials (76 and
77), and one deadline pair (78). They must not be summarized as six DSH rounds or
as the candidate-only GLM 8K evolution count.

## Open Questions

Development launch policy is decided: the exact freeze is the executable
contract, the runtime records its consumption in an immutable development-launch
receipt, and no reviewer key, trust registry or human pre-launch authorization is
required. Independent agent evaluation occurs after the run. Any future
production or release approval policy must be implemented as a separate boundary
and must not be imported into the development runner.

Will canonical pinned-object input preserve H-EN's 100% exposed-cohort acquisition
projection? How many hints fit while retaining useful evidence inside 8K? Can
H-MC be made prospective without same-task leakage? What frozen quality threshold
should trigger untouched confirmation? G03's matched comparison now retests
quality and efficiency on sixteen fresh questions; the remaining question is
how much independent replication is needed before broadening that claim.
