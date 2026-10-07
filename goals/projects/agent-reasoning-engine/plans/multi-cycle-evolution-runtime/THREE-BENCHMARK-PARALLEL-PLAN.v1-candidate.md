# Three-benchmark parallel evolution plan

Status: candidate planning evidence; not admitted execution state  
Plan ID: `ARE-THREE-BENCHMARK-PARALLEL-v1`  
Project: `CA2-PROJECT-AGENT-REASONING-ENGINE`  
Goal: `CA2-GOAL-AGENT-REASONING-ENGINE-MULTI-CYCLE-EVOLUTION-RUNTIME`  
Authority effect: none  

## Outcome

Run three benchmark families as independent, concurrently active evolution
chains through one ARE evolution runtime:

1. GLM 8K ContextBench, continuing with HEN-11;
2. large-window ARE versus DSH, continuing from rounds 73–78; and
3. LongMemEval, continuing from the note-v5 development result toward an
   untouched long-history confirmation.

"Parallel" means that all three chains may advance independently through
preparation, construction, validation, review, and settlement. It does not mean
that three provider workers bypass one shared effect envelope. Live dispatch is
globally resource-governed and remains separately authorized.

This plan does not admit a cycle definition, authorize implementation, call a
provider, execute a benchmark, activate an engine version, or revise historical
evidence. CyberAlchemy-v2 Goals validation is currently blocked, so this file
cannot be registered as admitted execution state.

## Program model

The three benchmark families are not new evolution-cycle kinds. Each family is
an objective-scoped chain of existing cycle instances:

```text
benchmark-research observation
            |
            v
research-learning hypothesis
            |
            v
engine-improvement isolated candidate
            |
            v
benchmark-research qualification or confirmation
            |
            v
independent evaluation and settlement
            |
            v
controlled-upgrade only after separate eligibility and owner authorization
```

LongMemEval may re-enter directly at benchmark-research confirmation when no
engine change is required. Interaction-learning receives operational incidents
but does not replace benchmark or research decisions.

Every cycle instance has its own objective, definition digest, immutable work
plan, phase admission, effect envelope, leases, accounting, evidence, receipts,
and terminal decision. Cross-cycle transfer uses typed immutable handoffs only.

## Shared integration plan

The first construction slice is one benchmark-family-neutral integration seam.
It is shared code, not shared scientific state.

### S0 — Freeze the common contracts

Define a closed `BenchmarkCampaignSpec` containing:

- family, objective, cycle and experiment identities;
- exact candidate and comparison identities;
- source, task, exposure, prompt, model, tokenizer and scorer bindings;
- context, output, call, token, cost, concurrency, retry and elapsed-time caps;
- metrics, acceptance gates, protected properties and stop rules;
- required evaluator and reviewer separation;
- artifact-retention and archive policy; and
- an explicit effect-envelope reference for every external call.

Define a `BenchmarkFamilyAdapter` that can only:

- validate and freeze a family-specific campaign;
- enumerate immutable work items;
- dispatch one admitted assignment through its existing harness;
- normalize a structured outcome and complete accounting;
- invoke a separately bound scorer or judge; and
- return proposed settlement evidence to the coordinator.

The adapter cannot mutate cycle state, admit its own phase, accept its own
evidence, select a serving version, or read credentials from JSON input.

Completion gate: all three family fixtures pass the same closed-schema,
digest-binding, replay, stale-revision, budget, secret-rejection, and recovery
tests while retaining separate domain validators.

### S1 — Add three domain validators

Implement independent validators for:

- `contextbench-glm8k/v1`: native source-selection validity, Span-F1, File-F1,
  8K admission, terminal selection, and attempt accounting;
- `are-dsh-large-context/v1`: harness identity, response/tool-batch validity,
  matched task/policy bindings, source-selection metrics, and total token
  accounting; and
- `longmemeval/v1`: source-only projection, exposure exclusion, measured
  long-history eligibility, answer completion, blind judgment, quality
  non-regression, and total-token savings.

Generic coordinator validation is insufficient. Each settlement must name and
pass the exact family validator version.

### S2 — Make evidence reconstructible and space-first

Keep hot:

- identities, manifests, hashes, event and receipt chains;
- task/exposure ledgers, accounting, decisions and handoffs; and
- archive locations and restoration proofs.

Store large immutable artifacts once in the content-addressed object store,
compress them when warm, and pack terminal unpinned objects into verified cold
archives. A locality change occurs only after archive verification. Restoration
must reproduce original hashes. Permanent evidence deletion remains a separate
user decision.

Credentials, secret material, private reasoning, and raw environment dumps are
never campaign artifacts. Learning ingestion receives only explicitly
whitelisted, minimized benchmark records. Raw tool transcripts are not learning
inputs; benchmark-required outputs are normalized into typed, digest-bound
evidence with provenance.

Completion gate: restart and deleted-index recovery reconstruct every campaign,
attempt, accounting row, evaluation, and decision without trusting a mutable
status file.

### S3 — Govern parallel dispatch

Maintain three independent ready queues behind one global resource arbiter.
The initial live envelope permits at most two provider workers across the whole
program. Family-local limits may be lower and never expand the global cap.
Round-robin selection prevents one family from consuming both slots
indefinitely, while prerequisites and recovery take precedence over new work.

Increasing the global live-worker cap requires measured provider, tokenizer,
memory, disk, and settlement-capacity evidence. All three chains can remain
active while one waits for a live slot.

## Workstream A — GLM 8K ContextBench HEN-11

### Bound starting evidence

- HEN-10: four valid 8K tasks; mean Span-F1 `0.3920897271519605`, mean
  File-F1 `0.6627747252747253`; the strict campaign target failed.
- HEN-11 selected hypothesis:
  `hypothesis:H-EN-R3-intent-anchor-convergence`.
- Scope: exposed development tasks 1 and 4 only, with no new control arm.
- Historical comparison: frozen HEN-10 task results.

Primary source:
`implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/HEN-11-HYPOTHESIS-SELECTION.v1.json`.

### A0 — Close the predecessor boundary

Import and settle the exact HEN-10 result, scoring summary, independent review,
and HEN-11 selection without rewriting their chronology. Missing coordinator
receipts remain missing until prospective runtime settlement creates new ones.

Gate: hashes, task denominator, selected attempts, failed-attempt costs, window
validity, and complete known/unknown usage reconcile.

### A1 — Construct the isolated R3 candidate

Implement the smallest intent-anchor convergence candidate:

- derive bounded, distinct issue anchors before exploration;
- issue diverse targeted rank queries;
- track path and span support across independent observations; and
- run one terminal relevance pass using issue anchors and confirmed base reads.

Focused tests cover query diversity, convergence, terminal selection bounds,
no premature finalization, replay, and the protected behavior of already-good
tasks. This is an `engine-improvement` instance and does not change the serving
engine.

Gate: candidate identity is frozen by digest and an evaluator independent of
the producer accepts the construction and experiment bindings.

### A2 — Execute the HEN-11 qualification

- Model: `glm-5.3-flash`.
- Context limit: 8,000 tokens.
- Output reservation: 2,048 tokens with a 512-token admission margin.
- Tasks: ContextBench 1 and 4 only.
- Family worker limit: two, still bounded by the global cap.
- Comparison: frozen HEN-10 values; no fresh control spend.
- Per-task ceiling: 96 model calls and 96,000 model tokens, split into at
  most 95 exploration calls / 88,000 tokens plus one finalization call / 8,000
  tokens.
- Campaign ceiling: 192 model calls and 192,000 model tokens.
- Model timeout: 120 seconds; automatic retries: zero.
- Cost and wall-clock ceilings remain to be frozen before effect authorization;
  no inherited value may remain implicit.

Acceptance requires all of the following:

- task 1 Span-F1 is greater than zero;
- two-task mean Span-F1 exceeds `0.07327183777122158`;
- task 4 Span-F1 does not regress by more than `0.02` absolute; and
- validity, 8K-window, settlement, reconciliation, and complete-accounting
  gates all pass.

### A3 — Evaluate and hand off

An independent evaluator reproduces scoring and accounting, then returns
`supported`, `revise`, `reject`, or `inconclusive`. Passing two exposed tasks
supports only the R3 mechanism and preparation of an untouched confirmation;
it does not clear ContextBench or make the candidate upgrade-eligible.

## Workstream B — Large-window ARE versus DSH

### Bound starting evidence

Rounds 73–78 are a mixed research continuation, not six DSH rounds. The latest
evidence includes:

- round 77 ARE Svelte: 49 calls, 186,628 tokens, Span-F1 28.64%, File-F1
  28.57%;
- round 78 DSH simdjson: 22 calls, 587,645 tokens, Span-F1 78.70%, File-F1
  57.14%; and
- round 78 ARE simdjson: failed after returning nine tool calls against the
  eight-call ceiling, with 83,935 known tokens.

No request exceeded 120 seconds, so the 300-second deadline did not establish
causality. No whole-benchmark superiority or 15% savings claim is supported.

Primary source:
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-deadline-78/REPORT.md`.

### B0 — Import the historical branch

Import rounds 73–78 as immutable evidence with exact policy generations,
failures, known costs, the two historical unknown-usage calls, and review
posture. Keep identity repair, deadline investigation, and response-batch
failure as separate hypotheses.

Gate: the runtime projection cannot describe these rounds as runtime-native or
combine results from different generations into a new cohort.

### B1 — Formalize and build the next candidate

Research question: can bounded complete-response validation and corrective
feedback preserve a useful trajectory when the model returns an over-limit tool
batch?

Build an isolated response validator that inspects the complete response before
executing any tool. On an over-limit batch it retains a bounded public
diagnostic and permits one policy-bounded correction path. The execution ceiling
stays at eight; every corrective call counts against the original envelope.

Gate: tests cover all response fields, malformed and nine-call batches, zero
premature tool execution, exact accounting, retry exhaustion, recovery, and
public failure capture.

### B2 — ARE-only qualification

Freeze a fresh task-2 ARE trial using the original model, task, context/output,
and scoring bindings: `glm-5.3-flash`, configured 1M context, 8,192 output,
low reasoning, 96 model calls, 4,000,000 total model tokens, 1,800 seconds arm
wall time, 300 seconds nominal model deadline, zero automatic retries, and no
more than eight executed tool calls from one response. The single corrective
feedback call, if used, counts within these ceilings. Compare the result to
frozen round-78 evidence only as a historical diagnostic, not as a matched
superiority claim.

Gate: ARE must complete validly within the unchanged eight-tool-call ceiling,
with complete accounting and no protected identity-policy regression. Failure
revises or rejects the response-recovery hypothesis before new DSH spending.

### B3 — Matched ARE/DSH confirmation

Only after B2 passes, freeze a fresh, untouched matched cohort and run both
harnesses under explicitly comparable task, model, output, retry, budget, and
scoring bindings. Preserve declared timer and harness differences rather than
calling them identical.

Acceptance requires valid quality for both arms and the objective conjunction:
ARE uses at least 15% fewer cumulative input-plus-output tokens without lower
declared source-selection quality. A failed arm cannot support savings.

### B4 — Evaluate and hand off

An independent evaluator separates model quality, harness policy, provider
transport, scorer, and infrastructure failures. Identity and response-recovery
policies remain separate candidates until the matched confirmation justifies a
combined engine-improvement hypothesis.

## Workstream C — LongMemEval

### Bound starting evidence

The exposed note-v5 development comparison completed all eight answers and
judgments:

- treatment: 4/4 correct and 12,662 total model tokens;
- control: 2/4 correct and 564,224 total model tokens; and
- treatment reduction: 97.76%, with no unknown usage.

This is strong development evidence, not untouched or full-benchmark
confirmation.

Primary sources:
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/NOTE-V5-RESULTS.md`
and
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/PLAN.md`.

### C0 — Import and seal note-v5

Import the freeze, generation seal, all 1,145 evidence hashes, reconciliation,
judgments, accounting, review, and learning decision as immutable exposed-task
evidence.

Gate: the import preserves earlier failed comparison costs and does not label
the result untouched, genuinely long, or campaign-complete.

### C1 — Qualify an untouched long-history cohort

The original development IDs—`01493427`, `2e6d26dc`, `32260d93`, and
`eeda8a6d_abs`—and the four Note-v5 full-S development IDs—`09ba9854_abs`,
`06db6396`, `cc06de0d`, and `54026fce`—are excluded. The latter four were
already tokenizer-qualified, generated, and judged; they may support exposed
replication but not an untouched-confirmation claim. Re-stream the pinned
full-S source revision `98d7416c24c778c2fee6e6f3006e7a073259d48f` through a
source-only whitelist and select eight disjoint tasks before any gold or outcome
access. Stratify deterministically by question-type metadata, then use the
exact target-model tokenizer to prove that every selected original history is
strictly greater than 8,000 tokens. Re-audit exposure manifests immediately
before freezing. If fewer than eight rows qualify, do not choose replacements
using outcomes; apply and record a new deterministic source-only selection rule
to the remaining pinned pool.

Generator projections contain only stable task identity/type, question/date,
dated role/content sessions, safe positional session IDs, and provenance
hashes. Evaluator labels remain sealed in the scorer process.

Gate: eight source-complete, exposure-qualified, genuinely long histories are
frozen with pinned provenance and no answer leakage.

### C2 — Freeze the scientific comparison

Use the comparison that tests the original efficiency objective:

- control: sequential whole-history compact notes;
- treatment: deterministic archived-source retrieval plus the common scope
  policy; and
- both arms: the same applicable answer policy, model, scorer, repetitions,
  source material, and 8K per-request admission rule.

Freeze exact chunking, prompt, output reserve, call/token/cost limits, retries,
failure accounting, blind native judge, and task order. The adapter must be a
new confirmation adapter; the development runner cannot silently relabel the
reserved rows.

### C3 — Execute, judge, and settle

For eight tasks and two arms, every planned answer slot and judge slot must
settle. Count ingestion, notes, answers, reasoning, cached input, failures, and
judge use. Unknown usage remains charged and visible. Maximum attempts are one
per planned generation or judgment, with no automatic retry. The numerical live
token ceiling is calculated and admitted only after tokenizer qualification:
8,000 times all frozen control-ingestion and answer-call slots, plus 8,000 times
all frozen judge slots.

Acceptance requires:

- all assigned generations and judgments complete;
- treatment quality is 8/8 and is not lower than control;
- treatment uses at least 15% fewer total input-plus-output tokens; and
- source, exposure, 8K admission, leakage, accounting, and independent-review
  gates all pass.

### C4 — Evaluate and hand off

An independent evaluator reproduces the quality and savings conjunction. A pass
supports the memory mechanism on this eight-task untouched cohort only. A miss
returns to research-learning with exact failure strata; neither result proves
full LongMemEval performance.

## Parallel execution order

```text
Shared:  S0 contracts -> S1 validators -> S2 storage/recovery -> S3 arbiter
               |              |                 |
HEN-11:       A0 -----------> A1 ------------> A2 -> A3
ARE x DSH:    B0 -----------> B1 ------------> B2 -> B3 -> B4
LongMemEval:  C0 -----------> C1 ------------> C2 -> C3 -> C4
```

The work is joined only at shared-contract conformance, global resource
admission, and program-level evidence indexing. A blocked family does not block
offline work or review in another family.

Recommended live order under the initial two-worker global cap:

1. HEN-11 uses up to two slots when A1 and independent prelaunch review pass.
2. While it runs, ARE × DSH remains in B1 and LongMemEval remains in C1/C2.
3. After HEN-11 settles, one slot serves ARE-only B2 and one may serve eligible
   LongMemEval work.
4. The expensive matched DSH confirmation begins only after B2 passes.

This ordering keeps all three chains active without spending on a comparator
before its candidate qualifies.

## Required receipts and reports

Each family produces:

- historical-import receipt and source-hash inventory;
- cycle-instance and phase-admission receipts;
- immutable campaign freeze and effect-envelope digest;
- lease, provider-attempt, accounting, recovery, scorer and settlement receipts;
- independent prelaunch and postrun evaluations;
- terminal decision with claim ceiling and next typed handoff; and
- hot/warm/cold storage manifest with restoration evidence when archived.

The program index reports per-family and global calls, tokens, costs,
reservations, failures, unknown usage, active leases, terminal settlements, and
archive locality. It never aggregates incompatible metrics into a single
"winner" score.

## Stop and recovery rules

- No provider call before exact phase admission and effect authorization.
- Budget or concurrency exhaustion stops new leases; it does not erase work.
- A stale or expired lease requires recovery before redispatch.
- A crash after provider completion but before settlement preserves the attempt
  and reconciles it before any retry.
- Unknown usage is never treated as zero.
- Source, prompt, model, tokenizer, scorer, adapter, or policy drift invalidates
  the affected freeze and returns it to review.
- One family's failure does not authorize another family to consume its budget.
- No benchmark result directly activates an engine candidate.

## Completion criteria

This parallel program plan is complete when:

1. the common contracts and three validators are implemented and independently
   reviewed;
2. the three historical frontiers are reconstructible in the runtime;
3. each family has one exact, independently reviewed next experiment freeze;
4. separately authorized live attempts, if any, are fully reconciled and
   settled; and
5. each family ends with a bounded decision and typed next handoff.

Completing the plan does not itself prove ContextBench, ARE superiority over
DSH, LongMemEval, product readiness, or upgrade eligibility.

## Open Questions

The next owner decision is intentionally singular:

`DG-3B-01` — authorize implementation of S0–S3 and the provider-free portions
of A0–A1, B0–B1, and C0–C2 as one bounded construction slice, while keeping all
live provider dispatch separately gated.

Later decisions, presented one at a time only when their prerequisites are
complete, will bind the exact live effect envelope for each eligible family and
whether measured capacity supports more than two global provider workers.
