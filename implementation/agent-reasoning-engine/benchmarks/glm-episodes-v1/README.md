# Source-derived GLM repair episodes

Small-window gate passed: [36/36 final,28/36 initial,9/9 recycled continuity](evidence/complete-transport-qualification-2026-09-09/README.md). Next design work is informed by the [offline analysis script and report](analysis/README.md) and [GCF review](analysis/GCF-REVIEW.md).

Current finish tracker: [GLM completion plan](../../GLM-FINISH-PLAN.md). It consolidates milestones, acceptance criteria and open questions; the experiments below remain historical evidence.

Status: candidate product construction; authority effect **none**. These two
bounded tasks extend the [GLM fitting corpus](../glm-fitting-v1/README.md) with
multi-step source inspection and independent executable repair checks. The
[construction record](CONSTRUCTION.json) carries the existing D65 boundary.

| Episode | Actual source | Controlled mutation |
| --- | --- | --- |
| `exact-json-scoring` | `scoreResponse` in [benchmark.mjs](../glm-fitting-v1/benchmark.mjs) | Structural equality becomes serialization equality, incorrectly rejecting equivalent objects with reordered keys. |
| `retention-tool-pairs` | `projectObservations` in [retention.mjs](../../packages/coding-agent-runtime/glm-flash-v1/retention.mjs) | Unique call-ID checks and positional result pairing are weakened, accepting duplicate IDs and reordered results. |

These are deliberately injected faults, **not naturally occurring repository
bugs**. The source snapshots are bounded adaptations: the scorer is extracted
with its built-in import; the private projection function is exported with
transport-equivalent hashing/serialization helpers and a plain Error wrapper.
Exact upstream source hashes, adaptation notes, and immutable fixture hashes
are recorded under each `fixtures/<episode>/` directory. No original runtime
source is changed. Source or fixture drift blocks creation rather than repinning.

## Product API and current frontier

```js
import {episodeIds, createEpisode, verifyEpisodeCandidate} from './episodes.mjs';
const episode = await createEpisode(episodeIds[0], '/tmp/new-private-episode');
const verdict = verifyEpisodeCandidate(episode.id, episode.root); // synchronous
```

`createEpisode` creates `directory/fixture` with stable source/evidence bytes and
returns `{id,root,request,observation_allowlist,mutation_allowlist,required_reads,
verification,provenance}`. Reusing an existing destination fails. The only
mutable path is `src/subject.mjs`. Required reads are `README.md`, the subject,
`evidence/contract.json`, and `evidence/cases.json`, on separate model turns.
The request requires an archived-evidence read after any actual recycle.

Each episode has two contract/example files of about 10 KB each, with meaningful
structural-equality or protocol-pair cases. All individual files are below
11,000 raw bytes and their actual serialized read-tool results fit the 12,000
byte runtime cap. No arbitrary padding is added. The examples are acceptance
context, not executable implementation answers. Reference implementations are
written outside the model fixture at `directory/reference/subject.mjs`.
`verify.test.mjs` is inside the fixture for existing runner compatibility but
excluded from the observation allowlist, along with all evaluator/reference data.

The unchanged mutants fail independently: scorer **7/8**, pair projection
**6/8**. Both reference implementations pass **8/8**. Eight construction tests
cover these outcomes, deterministic pins, read-tool size/allowlist boundaries,
TAP spoofing, forbidden filesystem access, subprocess denial, and mutation of
function input state:

```sh
node --test implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/episodes.test.mjs
```

## Independent verification boundary

`verifyEpisodeCandidate(id,root)` keeps the oracle in the trusted parent and
executes each candidate invocation in a separate Node process. That child uses
`--permission`, an exact candidate-file read grant, no filesystem-write,
network, worker, or subprocess grant, an empty environment, a two-second timeout,
and a 65,536-byte output cap. Only invocation arguments enter stdin; gold expected
results do not. The parent parses JSON and compares actual results against its
independent expected values. A child that prints fake TAP passes and exits zero
fails this comparison. Returned results also reject input mutation, including
mutation before throwing an error. The synchronous result is
`{ok,passed,expected_tests,results:[{id,passed,reason}]}`.

The compatibility test module uses the same parent/child separation, with eight
outer Node test cases. Candidate code never executes in the oracle process.
This is a tested local execution boundary, not a claim of a production-grade
hostile-code sandbox or protection against a compromised Node runtime. The
parent evaluator and its source files remain trusted inputs.

## Measurement and operational lanes

The [paired runner](runner.mjs) owns policy comparison, trace accounting and live
execution. These episodes alone make no model calls. A successful repair with
zero recycles is completion evidence only. V2 may keep a request below the soft
threshold by masking old observations; that is a legitimate outcome and must
not be reported as recovery after recycling. When a recycle occurs, the runner
must separately verify archived-evidence use and subsequent task completion.
Raw file sizes do not prove GLM token occupancy or provider compaction behavior.

The [live pilot](evidence/live-episodes-2026-09-07/README.md) attempted three of
four arms: two scorer failures and a provider timeout on the retention task.
No verified repairs; no policy winner. All 233 local checks passed. The traces
identify batched reads whose observation bodies were recycled before delivery
as the next scheduling and task-progress tuning target. The evidence report
contains the proposed DAG and distinguishes local admission from unobservable
provider compaction.

The CLI supports `--episode retention-tool-pairs` after `--credential <path>`
and `--output-directory <new-directory>` to select that episode's existing
v2/clear order under reduced two-arm caps. Selection does not retry failed arms.
Publication, default activation, and deployment remain separate decisions.

## Context-size sweep

`--soft-limit 8000|10000|12000` selects the recycle threshold; omission keeps
8000. The hard limit stays 16384, with output reserve 2048, token margin 256
and safety margin 1024. Unsupported values reject before effects. Manifests,
configuration bindings and dispatch headroom use the selected threshold.
The [frozen sweep plan](evidence/context-sweep-2026-09-07/PLAN.md) owns the
18-trial schedule and its open questions; repair and exercised recycling
continuity are assessed separately.

## Opt-in bounded delivery trial

`--delivery-policy bounded-reads-v1` applies the candidate delivery bundle to
both retention arms. Omission preserves legacy delivery. Combine with
`--episode exact-json-scoring` for the two-arm 24-model/48-tokenizer trial.
The candidate task wording accepts either archived-evidence tool; its exact
request hash is frozen in the manifest. Fixture and independent oracle bytes
remain identical. New metrics distinguish executed reads from bodies delivered
in actual model requests; bounded continuity requires full required-file
observation delivery and delivered, nonempty archived evidence after recycling.
Patch correctness is always measured independently of continuity.

To continue one untouched arm in a separate manifest, add
`--retention-policy recent-observations-v2` with the episode selector. This
reduces caps to 12 model / 24 tokenizer attempts and 660 seconds. Invalid or
duplicate selectors reject before effects.

The [bounded live pilot](evidence/bounded-delivery-2026-09-07/README.md) demonstrated
four-file delivery and post-recycle recovery in clear-v1, then exposed an EOF
handling defect, now fixed locally. The untouched v2 continuation stopped on a
tokenizer HTTP 500. No verified repair; the different source versions do not
support a matched policy comparison. Current local validation covers 261 distinct
checks with no failures.

See the [bounded delivery construction plan](../../packages/coding-agent-runtime/glm-flash-v1/evidence/BOUNDED-DELIVERY-PLAN.md).

## Checked run reports

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/report.mjs /path/to/private-run-directory
```

The read-only command verifies manifest, task/configuration, started/completed
arm, agent-result, and accounting bindings before reporting outcomes. It keeps
unstarted and incomplete arms visible and unknown usage distinct from zero;
it never declares a winner from one pair. It does not rerun candidate code or
expose raw messages/provider reasoning. Hashes check local consistency, not
signed authenticity. Use the complete original run directory; visible-trace
exports omit raw agent/configuration inputs and are not interchangeable inputs.

The [matched corrected-runtime trial](evidence/matched-repair-2026-09-07/README.md)
completed both arms without provider errors. Both passed continuity and exhausted
the 12-model-turn cap without a patch. Repeated archive pages and source rereads
identify delivered-page coverage and remaining-turn guidance as the next
completion-control hypothesis. The report contains its proposed DAG.

## Completion-policy trials

Add `--completion-policy budget-aware-v1` with `--delivery-policy bounded-reads-v1`
to the paired runner. The same completion policy is recorded in both arm configs,
the frozen manifest and result receipts. Checked reporting rejects policy
mismatches and preserves older manifests whose omitted completion policy means
`none`. Existing call, time, request and verification limits remain unchanged.

The [completion-control trial](evidence/completion-control-2026-09-07/README.md)
produced one rejected patch and no verified repair. All 293 local tests pass;
completion guidance remains opt-in pending useful repair results.

## Source-preservation trials

Add `--source-policy inspected-mutation-v1` with bounded delivery to the runner.
The policy is bound in agent scope, configs, manifest, arm receipts and checked
reporting. Historical omission means `none`; invalid or mismatched policies
reject. The [source-preservation plan](../../packages/coding-agent-runtime/glm-flash-v1/evidence/SOURCE-PRESERVATION-PLAN.md)
compares clear/v2 using the same exact-source projection and completion guidance.
The [first pilot](evidence/source-preservation-2026-09-07/README.md) produced no
repair: clearing exceeded strict admission and v2 requested non-owned evidence.
Followup prompt reductions and typed-only archive recovery pass local tests;
the corrected runtime has not been rerun live.

## Second-task coverage

The [retention pair](evidence/retention-pair-2026-09-07/README.md) produced a
verified V2 repair without archive continuity; clearing passed continuity but
exhausted its model calls without a candidate. The next tuning target is budget-aware
inspection completion. Defaults remain unchanged.

## Inspection-guidance pilot

The [live guidance trial](evidence/inspection-live-2026-09-07/README.md) produced
no patches: both policies exceeded strict fresh-request admission. V2 passed
continuity. Prompt overhead must be addressed before another regression pair.

## Execution-control candidate

Use `--completion-policy bounded-execution-v2 --delivery-policy bounded-reads-v1`
for the opt-in repeated-read and final-response execution rules. Existing policy
values retain their behavior. The candidate is locally tested, not live validated.

## Explicit finalization candidate

Use `--completion-policy explicit-finalization-v3 --delivery-policy bounded-reads-v1`
for an explicit final patch request with three calls remaining. The policy is
bound identically across both arms and checked reports. Local validation only.

## Working V3 live pairs

Both retention policies now pass repair (8/8 oracle checks each) and continuity
on both controlled tasks. See [all attempts and final evidence](evidence/working-loop-2026-09-07/README.md).
The benchmark now names the available recovery tool and states the read/recover/patch
sequence explicitly. Fixtures and acceptance predicates are unchanged. These are
adaptively selected working examples, not a reliability estimate. Defaults unchanged.

## Open Questions

- Do either policy's actual requests cross the selected soft threshold, and how
  does that affect reads, verified success and total cost?
- Are two small controlled repairs representative of longer repository work?
- Which failures remain attributable to task wording rather than context policy?
- Which provider evidence could establish internal compaction behavior beyond
  ARE's observable complete-request admission and recycling records?


## Patch-contract candidate

Use `--completion-policy patch-contract-v4` with bounded delivery to evaluate
the opt-in final-answer field reminder. Checked reports retain exact parser
rejection diagnostics in `candidate_validation`. The [six-trial plan](evidence/patch-contract-2026-09-07/PLAN.md)
owns scope and open questions; no older evidence or default policy is changed.


`--completion-policy compact-contract-v5` selects the shorter opt-in contract
reminder. The [adaptive validation loop](evidence/contract-loop-2026-09-07/README.md)
retains all trials, including failed repairs, and owns its open questions.


## Headroom and broader evaluation

`--completion-policy reserved-headroom-v7` requests an additional256 tokens
between admitted requests and the configured soft limit. Reports expose and
check `admission_policy`. Existing policies retain their original thresholds.

Two additional episodes require explicit `--episode` selection:
`archive-slice-bounds` repairs the repository-derived UTF-16 archive range
projection, and `retention-long-window` requires six distinct reads including
two dense long-ID evidence files. Both retain isolated eight-check oracles.
The default invocation still runs the original two episodes only.

The [construction plan](evidence/headroom-generalization-2026-09-07/PLAN.md) owns
experiment boundaries and open questions.


`--completion-policy verified-completion-v8` binds each episode’s required
reads, distinct turns and conditional recovery to the runtime acceptance gate,
and selects the calibrated512-token tokenizer margin. Checked reports verify
these bindings and reject accepted candidates with unmet requirements.
The [construction plan](evidence/completion-calibration-2026-09-07/PLAN.md) owns
the fixed12-trial rerun, calibration evidence and open questions.

## Paged completion experiment

Opt-in `paged-completion-v9`, `compact-paging-v10`, and `assembled-paging-v11` retain v8 requirements and token reservations. V9 limits native file pages to 5000 UTF-16 units; v10/v11 use 5500 and a compact next-read hint. Offset arguments are offered only under these policies. Complete delivered text must match the pinned file hash. V11 reconstructs exact inspected requirement fields from complete verified page text. All retain 12 model calls, with one final response reserved.

These are experimental: v11 demonstrated one correct 10K long-workload repair but passed only 1/4 targeted repairs; 8K remains unresolved. Defaults are unchanged. See [results and open questions](evidence/assembled-paging-2026-09-08/README.md).

## Window and turn budget experiment

Opt-in `budgeted-paging-v12` selects 4000-unit file pages and an explicit 16-model/32-tokenizer cap at 8K, retaining 5500-unit pages and 12/24 caps at larger windows. All token reservations and the 24-tool-call cap remain. Known remaining page turns are checked before dispatch. Separate extended-history adapters preserve pinned original retention/archive files. The fixed 8K sample passed 1/4 repairs: one complete correct repair, two turn-budget blocks and one deadline. Defaults remain unchanged; this is not a pilot-ready policy. [Evidence and open questions](evidence/budgeted-paging-2026-09-08/README.md).

## Explicit next-page experiment

Opt-in `page-adherence-v13` inherits v12 budgets and adds explicit offset zero plus one exact next-read instruction after current observations. Four fixed 8K long-workload trials produced three correct repairs with full continuity and one final-attempt deadline. All traces had fourteen file reads with no repeated pages or nonzero starting offsets. The strict all-four completion criterion failed; defaults remain unchanged. [Results and open questions](evidence/page-adherence-2026-09-08/README.md).

## Final deadline experiment

Opt-in `final-latency-v14` inherits v13 and gives tool-free model requests a 60-second deadline, keeping other requests at 30 seconds and each episode at 580 seconds. The deadline is bound to client identity and recorded per receipt. The fixed four-task, three-window screening run passed 8/12 repairs, with 5/5 continuity among recycled trials and zero timeouts. Neither extended-deadline call exceeded 30 seconds, so benefit from the extension is unproven. Two semantic failures and two malformed candidates remain. All 396 local tests passed; defaults are unchanged. [Results and open questions](evidence/final-latency-2026-09-08/README.md).

## Final synthesis experiment

Opt-in `synthesis-adherence-v15` inherits v14 budgets and adds a last synthesis instruction with exact patch keys/hashes and requirement review. The fixed paired rerun of four prior failures passed 1/4 repairs under v15 versus 3/4 under v14. Three v15 responses omitted schema_version. Both recycled trials passed continuity; 398 local tests passed. This candidate is retained as an unsuccessful experiment and is not selected for activation; defaults remain unchanged. [Results and open questions](evidence/synthesis-adherence-2026-09-08/README.md).

## Hosted schema-output diagnostic

Three direct endpoint probes found exact copying in text mode, lowercase `json` removal inside source strings in JSON mode, and an accepted but unenforced `json_schema` request. These single probes do not establish a native schema contract. No completion policy or runtime behavior changed. [Reproduction and open questions](evidence/schema-output-2026-09-08/README.md).

## Native submission protocol probe

Six isolated live calls passed exact native patch submission, including required fields, scope hashes and source bytes; four local protocol tests passed. The submission adapter is not integrated into coding-agent execution or activated. Long-context behavior and repair performance remain untested. [Evidence and open questions](evidence/native-submission-2026-09-08/README.md).

## Native completion with preserved example evidence

Opt-in `example-fields-v20` integrates native patch submission with strict parsing, delivery/recovery gates, terminal history and exact inspected example explanations. Across ten fixed trials it passed nine repairs; one transport failure before submission remains counted. The four prior-failure cases passed 4/4, and both long 8K retention policies passed their fixed repetition with continuity. All 414 local tests passed. Earlier v16–v19 failures remain preserved; defaults remain unchanged and this is not production reliability evidence. [Results and open questions](evidence/example-fields-2026-09-08/README.md).

## Fixed evaluation and repeatability

The reusable [fixed evaluator](FIXED-EVALUATION.md) ran eight predeclared v20 trials with frozen sources and no retries or failure replacement. It passed 3/8 repairs, 6/8 completion gates and 4/5 recycled-trial continuity checks; the reliability target failed. Two secret-resolution interruptions and three incorrect repairs remain counted. Five evaluator tests passed. This result qualifies the earlier 9/10 screening result; defaults remain unchanged. [Results and open questions](evidence/fixed-repeatability-2026-09-08/README.md).

## Public validation and failure diagnosis

A standalone visible-case validator detects the two confirmed semantic defects in the fixed v20 run. Separate rechecking shows the third alleged semantic failure was failed oracle child execution; original scores remain unchanged. Secret diagnostics now retain safe failure categories, and 20 local resolutions passed without reproducing the interruption. Affected tests passed 298, with one optional test skipped. [Implementation and open questions](evidence/repair-validation-2026-09-08/README.md).

## One-turn public repair feedback

An explicit post-submission stage now validates and allows one corrective proposal. The fixed six-submission evaluation completed with zero verified corrective repairs: child execution timeouts and one confirmed secret-bridge timeout blocked the target. Two unchanged proposals passed. Thirteen affected tests pass after a post-run status fix; no default policy was activated. [Results and open questions](evidence/public-feedback-2026-09-08/README.md).

## Measured execution readiness

The explicit feedback stage now checks local child execution and secret latency before corrective dispatch. All 21 affected tests pass. A fixed eight-round diagnostic found the host unready in every round under CPU/memory pressure, so it performed no secret access or model calls. Validation replay was skipped. [Implementation, measurements and open questions](evidence/execution-readiness-2026-09-08/README.md).

## Disposable validation worker

A candidate container worker passed all six retained public validations (40 checks) with explicit cleanup of all seven containers including a timeout canary. Five lifecycle tests passed; no model calls were made. Host capacity is not reserved, and feedback backend integration remains next. [Results and open questions](evidence/isolated-validation-2026-09-08/README.md).

## Integrated container feedback

Explicit public-feedback-v3 completed the fixed retained-proposal test: both new corrections and all six final proposals passed the separate oracle (48 checks), using two model/two tokenizer attempts. All eight validation containers completed without execution failures and were cleaned up. Twenty affected tests passed. This is selected-proposal evidence, not a fresh episode benchmark. [Results and open questions](evidence/container-feedback-2026-09-08/README.md).

## Fresh episodes with integrated feedback

Four fresh model runs on existing fixtures passed first-pass and final validation (4/4). Both recycled episodes passed continuity, including long8K; the final oracle passed 32 checks. All proposals were accepted unchanged, so correction used no additional model calls. Four schedule/scoring tests passed. This clean sample does not measure corrective benefit or unseen-task reliability. [Results and open questions](evidence/fresh-feedback-2026-09-08/README.md).

## Frozen twelve-condition matrix

The four-task by8K/10K/12K run passed11/12 first-pass and final repairs, with3/3 recycled-trial continuity. The remaining native submission omitted required authority_effect and stayed failed. All11 accepted proposals passed unchanged; correction made no model calls. All11 workers cleaned up,88 final oracle checks passed, and7 schedule/scoring tests passed. [Results and open questions](evidence/matrix-feedback-2026-09-08/README.md).

## Native missing-field recovery

A standalone bounded stage recovered the matrix’s sole missing-authority-field submission through one explicit native response while preserving all source bytes. The recovered proposal passed9/9 public and8/8 separate oracle checks; its container was cleaned up and6/6 tests passed. The original matrix stays11/12. Shared-budget feedback integration and a fresh matrix remain next. [Contract](FORMAT-REPAIR.md) and [evidence and open questions](evidence/format-repair-2026-09-08/README.md).

## Shared correction budget

Opt-in format/semantic composition enforces one total correction attempt per trial. A fresh twelve-condition matrix passed11/12 first and final repairs,3/3 recycled continuity,84 public checks and88 final oracle checks, with all11 containers cleaned up. The remaining proposal omitted schema_version and was ineligible for the authority-only recovery; correction made no calls. Thirty tests passed before the run and eight scoring tests after a reporting-only fix. [Results, reporting correction and open questions](evidence/shared-correction-2026-09-08/README.md).

## Full-schema diagnostic recovery

A canonical patch schema now drives local diagnostics and native submission parameters. One shared correction handles all safely recoverable metadata violations while preserving exact source/scope. The fresh matrix reached12/12 final repairs from9/12 first-pass, using three corrections, with3/3 recycled continuity and96 final oracle checks. All14 matrix workers cleaned up;382 distinct local tests passed. A delivery-versus-submission handoff bug was fixed after the initial batch and before correction, so a complete run with the corrected adapter frozen from the start remains next. [Contract](SCHEMA-RECOVERY.md) and [full evidence and open questions](evidence/schema-recovery-2026-09-08/README.md).
