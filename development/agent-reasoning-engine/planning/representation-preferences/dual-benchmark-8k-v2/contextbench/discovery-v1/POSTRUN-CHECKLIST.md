# Post-run closeout checklist

Prospective checklist only. Generation is active when this is written. No outcome, native score or successful gate is assumed. Do not read gold, invoke scoring, alter frozen sources, remove live source trees or restart attempted cells while generation is active.

## 1. Require terminal generation, then score once

From the repository root:

```sh
D=development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1
node "$D/prepare-live.mjs" verify
```

Require `live/generation-complete.json`, matching terminal statuses in `live/checkpoint.json`, no pending/running job and no `live/.scheduler-lock`. Preserve all four pair slots and eight arm slots, including unstarted or failed ones. Preserve health events and rejected preflight/freeze evidence. Do not treat a stopped run as permission to replace outcomes.

Only after those conditions hold:

```sh
node "$D/score-live.mjs" score
```

The existing scorer enforces the generation seal, reconstructs exported source evidence against each retained base checkout, verifies pinned upstream/scorer/dataset identity, and writes per-pair `scored-pair-result.json`/`scored-result.json`, `LIVE-RESULTS.json`, and `live/evaluation-complete.json`. It makes no model calls. Its output files are exclusive-create: inspect partial evaluation before any explicit recovery; do not blindly repeat the command.

## 2. Independently reconcile evidence before cleanup

- Reverify freeze SHA `f39d81fda6322960a1520ecdda00c32c08f755097ff4499bdb42a49467c4f7ca`, all 804 bindings, exact review SHA association, fixed task/config/manifest hashes and native continuity. Keep the historical 44-test integration review and subsequent amendment distinct from the approved 59-test live sources.
- Enumerate all native model receipts and transport ledgers, including exceptions, parent failure files and incomplete calls. Reconcile each arm, pair, scheduler and report; distinguish copied receipt evidence from separate repeated requests. Count complete provider input plus output, including cached input and reasoning. Check missing completion receipts, in-flight ledgers, unknown reservations and unallocated known costs explicitly. Deterministic native scoring adds no model tokens.
- Reconstruct actual request hashes from captures and receipts; distinguish tokenizer-only render candidates from dispatched requests. Check every dispatched request's recorded admission, model profile, output reserve, retained reasoning reservation and 8,000-token bound. No failed or corrective call may disappear from the 96,000-per-arm / 768,000-study accounting.
- Reuse the existing terminal-only capacity analyzer below; do not implement another overlap calculation. Reconcile its timing coverage against raw receipts. Report measured local request overlap, not backend instances or a throughput speedup.
- For each valid export, independently replay `exportTerminalEvidenceSelection` using the exact successful terminal request's private packet, response capture, retained source snapshots and base checkout. Require equality with recorded selection and prediction, then reconcile native metrics. Withheld outputs, edited/unmappable reads and tokenizer candidates cannot become original delivered evidence.
- Reconcile recovery snapshot prefixes/pages, failed discovery attempts versus successful presentations, selected terminal packet, reminder novelty/spacing and native deferrals. Preserve original archive bytes and explicit omissions. Failure, unknown usage or an incomplete trajectory cannot establish an efficiency pass.
- Recompute all eight outcomes and six named native metrics. Verify the exact conjunction in `score-live.mjs`: sealed/recorded pairs, eight valid exports, each treatment task perfect, every request admitted, all trajectories genuinely multi-call and over 8K cumulative tokens, complete accounting, and at least 15% total treatment reduction. Preserve infrastructure failures and report nonregression separately. Keep `campaign_goal_achieved:false` even if the development conjunction passes.

The v1 analyzer is compatible: this run writes `live/manifest.json` with `benchmark:contextbench`, matching `pairs/<job>/run/<arm>/model-timing.jsonl` and `<arm>-summary.json` with `usage.model_calls`. After terminal generation:

```sh
node development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v1/contextbench/capacity-analysis.mjs "$D/live"
```

Save its output as a new `LIVE-CAPACITY.json`. Missing arm summaries conservatively make timing coverage incomplete; do not replace missing evidence with an assumed zero. `active_pool_worker_peaks:null` is expected because this coordinator writes no pool-event journal. The analyzer carries historical stage1/stage2/eight-request caveats that do not describe this two-worker, ContextBench-only run. Its capacity gate excludes scientific quality, complete accounting and non-429/503 errors; inspect those separately, including provider codes1302/1305.

Required independent artifacts: `LIVE-POSTRUN-REVIEW.json` and `.md`, binding actual receipts/results/score evidence and freeze. Distinguish result-integrity approval, experiment/development outcome, and campaign achievement. Write `LIVE-COMPLETION-AUDIT.md` with resolved dispositions, limitations and remaining questions; do not substitute raw model claims for evidence.

## 3. Native D02 / D04 / D07 registration

The ContextBench post-run registration helper does **not** exist at checklist creation. Add a new `register-result.mjs` after terminal results, using sibling [LongMem registration](../../longmemeval/register-result.mjs) as an API example, not an outcome template. Do not execute the sibling command for this experiment or copy its hard-coded inconclusive classification, token totals or scope-policy claim.

Use the frozen records exactly:

- Selected D01 H1: `research-hypothesis:fcf7e835f42ff4e14a0919d07eb95e0f87c9c181d9b3a783056f9201653e0035`.
- Competing H0: `research-hypothesis:5a4869d7c82fcf1e403d9293b500f7d77bc53933d216ee06a81284b8d2740e83`.
- D03: `research-experiment:bba3ce99dd727f8bdcecda3e95d1d55163f8f9570391a389a67066e661a7002b`.

Create D02 via `createHypothesisObservation`, binding the canonical digest of `LIVE-RESULTS.json` and actual evidence. Classify measured support/counterevidence/inconclusive after reviewing the combined hypothesis and failures; unknown costs or infrastructure gaps are not clean mechanism evidence. Separate observed quality and cost changes from causal attribution. This combined intervention cannot distinguish retention, recovery and reminder effects.

Create D04 via `createLearningDecision`, referencing the frozen D03 and verified observations. State a bounded evidence-led successor or untouched confirmation requirement; do not promote authority or claim full-benchmark perfection from four exposed tasks. Preserve the original objectives and the independent LongMemEval gap.

Validate all records with `verifyEvolutionRecord`; construct `LIVE-OBSERVATIONS.json` and a digest-verified `LIVE-REGISTRATION.json` containing implementation binding to the exact freeze and hashes of result/observation/review artifacts. Materialize D07 with `materializeResearchDag` into `LIVE-RESEARCH-DAG.json`, and its task plan with `materializeResearchPlan` into `LIVE-RESEARCH-WORK.json`. Registration verification must recheck digests, source bindings and hypothesis/experiment/observation references.

Once that new helper exists and its read-only validation path is implemented:

```sh
node "$D/register-result.mjs"
node "$D/register-result.mjs" --check
```

These are the required new helper's command contract, not currently available commands.

## 4. Native D08 evidence closure

Add a new `close-live-work.mjs`, following sibling [D08 replay](../../longmemeval/close-live-work.mjs) but using the **seven tasks frozen in this experiment's continuity**, not the sibling's five tasks or hard-coded successful counts:

| Task | Evidence to validate |
| --- | --- |
| `integration` | `INTEGRATION-AMENDMENT.md`, `LIVE-TEST-RESULTS.json`, reviewed source hashes |
| `tokenizer-preflight` | `preflight/RESULTS.json`, start/end bindings, exact eight rows, zero models |
| `freeze` | `live-freeze.json`, `LIVE-REVIEW.json`, native D01/D03/continuity validation |
| `generation-two-workers` | terminal checkpoint/seal, all assigned slots, raw accounting and timing evidence |
| `native-score` | per-pair scoring results, source reconstruction and pinned native scorer evidence |
| `complete-report` | `LIVE-RESULTS.json`, `live/evaluation-complete.json`, fixed denominator/gates |
| `independent-review` | `LIVE-POSTRUN-REVIEW.json`, bound evidence and `LIVE-COMPLETION-AUDIT.md` |

Use `replayResearchWork` with digest-bound evidence, validated registration and real dependency order. Emit `LIVE-RESEARCH-WORK-EVENTS.json` and `LIVE-RESEARCH-WORK-STATE.json`; provide `--check` to replay and compare persisted state. A completed task means its evidence/disposition was established, not that the research hypothesis or campaign succeeded. Preserve blocked tasks when required evidence is unresolved; do not require all model outcomes to succeed merely to document a rejected experiment.

After implementing and reviewing that helper:

```sh
node "$D/close-live-work.mjs"
node "$D/close-live-work.mjs" --check
node "$D/prepare-live.mjs" verify
```

## 5. Cleanup and successor

Only after native scoring and independent reconstruction/review, verify each completed result hash and remove explicitly owned disposable base/work trees through the existing lifecycle cleanup. Preserve snapshots, captures, receipts, predictions, score files, private packet/page bindings, ledgers and shared caches. Record cleanup separately and recheck audit bindings afterward. No cleanup is authorized by this checklist while the run is active.

## Open questions

Actual outcomes remain unknown here. Follow [LIVE-PROTOCOL.md](LIVE-PROTOCOL.md) and frozen `live-continuity.json` for outstanding long-task, untouched-confirmation, quality, 15% savings and later four-worker capacity requirements. Registration and closure helper implementation remains necessary after scoring; this checklist does not claim those artifacts exist or that their tasks are complete.
