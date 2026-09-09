# Requirement research: first two tasks

## Deterministic explicit-operation fast path

The successor candidate implements a strict local path for exactly anchored
`Add ... to the requirements.`, `Remove ... from the requirements.`, and
`Keep ... as a requirement.` forms. Conditional, compound, negated,
noncanonical, and unmatched requests retain the existing compact fallback
contract and receive no guessed local interpretation.

Execution-bound candidate 003 adds strict branch-shape verification and exact
fallback-instruction comparison. Candidates 001 and 002 are preserved as
superseded construction evidence: 001 omitted the public export binding, while
002 exposed the two verifier gaps. Candidate 003 ran 120 scheduled rows
over 24 cases and five repetitions:

| Measurement | Result |
| --- | ---: |
| Fully passed | 120/120 |
| Fast-path precision | 100% |
| Ambiguous fast-path rate | 0% |
| Fast-path coverage | 50% |
| Exact requirement preservation | 100% |
| Model calls per request | 0.5 controlled calls |
| Eligible local p50 | 0.084 ms |
| Eligible local p95 | 0.148 ms |

All eight registered local gates passed. Fallback calls were deterministic
stubs, so this result proves local eligibility, set accounting, and transport
behavior—not model quality or live end-to-end latency. The learning decision is
`collect-replications` because the holdout was authored in this implementation
cycle and supplies only one supporting experiment.

`fast-path-progress-002.json` completes the four-task successor plan for the
current candidate. The next
product test is an independently authored adversarial holdout followed by a
controlled Codex fallback canary. Production wrapper integration remains
separate.

## Latency assessment and successor

`latency-assessment-001.json` completes the original research plan. The measured
boundary does not support another output-only optimization: compact output cut
mean output tokens by 38.1 percent, but those savings were only about 0.13
percent of mean total token traffic and produced a 6.2 percent turn-p95 gain.
Across 40 matched pairs, compact won 25 turns; its median advantage was 339 ms.
It won first-text latency in 22 pairs with a median 174 ms advantage. Two
compact rows had zero cached input while full had none, and provider load was
not controlled.

The scoped lesson is that model invocation and time to first text dominate this
small structured decision. The next hypothesis is therefore
`research-hypothesis:d4df87f3423aeaecb068834259a361d885a9fb9428adca1a00fd243043311ea1`:
use a closed deterministic fast path only for explicit add, remove, and
maintain forms, then preserve the existing context-bound compact model path for
anything ambiguous, conflicting, negated, or unmatched.

The successor experiment requires perfect fast-path precision, zero ambiguous
fast-path admissions, at least 50 percent coverage on a preregistered mixed
holdout, exact requirement preservation, at most 50 ms eligible p95 on the
current host, and no change to the fallback contract. `progress-008.json` has
an empty frontier because every task in this plan is complete. Implementing and
testing the successor requires a new plan and frozen holdout; it is not
implicitly authorized or activated by this assessment.

## Controlled latency result

The registered `requirement-latency-002` run completed all 80 Codex app-server
turns on `gpt-5.6-luna` at low effort. Its content-addressed registration is
`cef063f80f998047ff245642b428852b7e438a8a756df684725a474bfa076a61`;
`latency-run-evidence-001.json` is the compact deterministic result view.

| Result | Full | Compact |
| --- | ---: | ---: |
| Fully passed | 38/40 | 40/40 |
| Turn p50 | 3939 ms | 3551 ms |
| Turn p95 | 5353 ms | 5021 ms |
| First-text p95 | 4834 ms | 4373 ms |
| Mean output tokens | 47.45 | 29.375 |
| Mean cached input tokens | 13056 | 12147.2 |

Compact output reduced turn p95 by 6.2 percent and mean output tokens by 38.1
percent. The registered hypothesis did not pass: the p95 reduction was below
the required 15 percent, and the all-arms quality gate failed because two full
rows missed additions. Compact itself passed 40/40. Cache means differed by 7.0
percent, within the registered 10 percent threshold, and every row passed
runtime-integrity checks. Provider load was uncontrolled, repetitions are not
independent cases, and neither arm produced a sub-second turn.

`progress-007.json` completes `latency.run`; `latency.assess` is now the sole
product-construction frontier. The failed gates are retained as counterevidence
with a `revise-hypothesis` disposition. This result does not authorize product
activation, acceptance, publication, or deployment.

## Controlled latency registration

`latency-execution-001.json` registers the H2 compact-output comparison as
`requirement-latency-002`. It contains eight existing synthetic cases, five
repetitions and 80 scheduled Luna turns: 40 full-delta and 40 compact-patch
observations. Full-first and compact-first order are each used for 20 pairs.

Both arms share the exact semantic instruction prefix and app-server settings.
The experimental difference is the returned representation: full
`retained/added/removed` accounting versus compact `added/removed` patches with
host reconstruction. This measures the combined effect of response schema and
host expansion; it does not isolate hidden model reasoning.

The registered gates require:

- 40/40 correct and preserved results in both arms;
- compact/full turn-p95 ratio at or below 0.85;
- mean cached-input difference no greater than 10 percent;
- complete runtime integrity for every row.

The one-second boundary, startup, first-text latency, token use and cache use
are reported even though only the declared gates determine the experiment
result. Provider load remains uncontrolled. The runner refuses to execute
without `--live`, rechecks all selected source hashes, uses read-only ephemeral
threads and stops on identity or transport drift.

`progress-006.json` completes `latency.register`. The original plan now has one
ready task: `latency.run`, which will make 80 model calls. No calls were made by
registration and no product approval or activation is implied.

## Replication assessment

`replication-assessment-001.json` closes the registered counterevidence question
and `progress-005.json` completes the original replication branch. The four
treatment failures form two clusters:

- three present removals were retained and classified as continuation;
- one absent removal was converted into a new negative requirement.

Each affected case failed only one of three repetitions. The evidence therefore
shows removal/polarity instability rather than a deterministic failure on every
removal. Turns 2 and 3 returned identical bytes for different request polarity,
but fresh thread identities and distinct prompt digests make this an anomaly,
not proof of cache or cross-thread leakage.

The scoped lesson is that explicit set accounting cannot repair an incorrectly
understood operation. The successor hypothesis introduces an explicit
`add | remove | maintain | ambiguous` operation record before deterministic set
application. A negative instruction cannot enter the added-requirements set;
ambiguous polarity defers instead of guessing.

The successor record is
`research-hypothesis:97384e2587b1f6b5e868d7e16441de47688b4b9342b8c74c392c362360897cab`.
It is a verified hypothesis candidate embedded in the assessment. The measured
counterevidence and learning decision are already registered in the research
ontology; the successor needs its own frozen experiment before it can become a
new registered branch.

The next holdout must include new domains, addition/removal polarity contrasts,
and empty, singleton and multi-requirement states. It must capture operation and
target predictions separately from the resulting set. Existing latency and
cache telemetry remain mandatory.

The only ready task in the original work plan is now `latency.register`.

## Replication result

The live Codex app-server replication completed 144/144 turns on
`gpt-5.6-luna` at low effort and registered result
`fbc7c1a6b01810478c5800fa07dba4f1cd3bd3e9a6fa2bb68bda5072198c30f9`.
`replication-run-evidence-001.json` is the compact verified result view;
`progress-004.json` completes `replication.run` and makes
`replication.assess` ready.

| Result | Baseline | Treatment |
| --- | ---: | ---: |
| Classification correct | 53/72 | 68/72 |
| Requirements preserved | 41/72 | 68/72 |
| Fully passed | 35/72 | 68/72 |
| Runtime integrity | 72/72 | 72/72 |
| Turn p95 | 4873 ms | 5564 ms |
| First-text p95 | 4429 ms | 4965 ms |

Paired classification outcomes were 18 treatment-only wins, 3 baseline-only
wins, 50 both correct and 1 neither correct. This supports a classification
gain on this sample, but the registered hypothesis did not pass: four treatment
rows failed classification and requirement preservation, so the all-treatment
preservation gate is false. The registered learning disposition is
`revise-hypothesis`.

All runtime rows passed, but the treatment was slower and emitted more tokens.
Its mean cached-input count also differed from baseline. The run therefore does
not demonstrate a latency gain or isolate a causal effect. The sample covers
only empty and singleton initial requirement sets, and repetitions are not new
independent cases.

Current product-construction frontier: `replication.assess` and
`latency.register`. Operational-support residue remains unrelated to these
tasks. No result grants activation, acceptance, publication or deployment.

## Execution-bound replication

`replication-execution-002.json` is the current execution-bound manifest. It
binds the 144-turn schedule to exact scorer, registration adapter, live runner,
RPC client and canonicalization bytes, plus Node v26.8.1, Codex 0.153.1,
`gpt-5.6-luna` at low effort, a read-only sandbox, disabled shell tool and fresh
ephemeral threads. The live runner refuses to start without `--live` and checks
every selected source digest before opening the app-server.

`replication-execution-001.json` and its evidence record are preserved as a
superseded construction candidate. Its selected source bytes changed while the
scorer was hardened to retain observed runtime identities and enforce an exact
source allowlist; the runner targets only candidate 002.

The scorer treats malformed JSON, wrong labels, requirement loss, invalid
deltas, tool use and missing telemetry as visible failures. Schedule, model,
effort or binary mismatches block. Interrupted prefixes become blocked,
inconclusive results. A complete result is independently reduced to three
gates before content-addressed research registration: classification
improvement, requirement preservation and runtime integrity.

`progress-003.json` completes `replication.register`. The product-construction
frontier is now `latency.register` and `replication.run`. The latter is runnable
only through the explicit live command and will make 144 model calls; it has
not run yet. No acceptance, activation, publication or deployment follows from
registration or passing tests.

Current verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/replication-runtime.test.mjs
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/prepare-execution.mjs --check-saved
```

## Next step: hypotheses and replication preparation

`progress-002.json` preserves the prior events and completes
`latency.hypothesize`. `latency.register` is now ready;
`replication.register` is in progress, not complete.

`latency-hypotheses-001.json` records three untested hypotheses with interventions,
metrics, failure criteria and confounders: optional input reduction, compact
output, and initialized-process reuse. Compact output is the first proposed
comparison. Thresholds are prospective research choices, not demonstrated gains.

`replication-manifest-001.json` freezes 24 cases, exact prompts and a deterministic
144-turn order. Each arm is first in 36 of the 72 comparisons. With three
repetitions, each individual case necessarily has a 2:1 order split; aggregate
balance does not prove equal cache conditions. The treatment changes both
instructions and output structure, so outcomes concern that combined treatment,
not an isolated causal effect of internal reasoning.

This preparation is not executable registration: runner/scorer/environment
bindings and the tested result-registration adapter are still required. Any
execution-ready successor must bind this preparation rather than overwrite it.
The cases remain empty-or-singleton sets; broader multi-requirement preservation
is outside this sample's claim scope. No model turns have run for this identity.

Verify with Node v26.8.1 from the repository root:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/prepare-next.test.mjs
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/prepare-next.mjs --check-saved
```

Construction owner: ARE research owner. Runnable work: latency comparison
registration and replication runner/scorer/adapter preparation. The missing
adapter is an exact prerequisite for replication execution, not a blocker for
latency research. Unrelated wrapper binding repair remains operational support
owned by the wrapper maintainer; no product stage changes in this step.

## Previous step

Product-construction frontier: `latency.inspect` and `replication.design` are
complete as research artifacts. Their source-bound checks unlock
`latency.hypothesize` and `replication.register`. No new model experiment ran.

## Results from the existing 16 latency turns

| Mean measurement | Full | Compact |
| --- | ---: | ---: |
| Explicit prompt bytes | 703.25 | 631.25 |
| Input tokens | 13669.5 | 13660.5 |
| Cached input tokens | 4896 | 2368 |
| Output tokens | 71.5 | 35.125 |
| Turn duration, ms | 4521.67 | 3830.38 |

The prompt reduction saved only nine input tokens on average. The source of
the remaining input tokens is unresolved: the saved runs do not capture a
component-level payload breakdown. Cache imbalance prevents clean attribution
of latency gains to shorter output. Startup is measured separately.

`input-composition-001.json` preserves exact source hashes, recomputable
statistics, protocol observations, inferences and limitations. The inspected
runner is current source, not the original historical runner bytes. The failed
effective-configuration probe supplies no evidence about inherited settings.

## Replication design

`replication-design-001.json` contains 24 cases in six new domains, organized
as 12 paired requirement-state comparisons. Two variants and three repetitions
would require 144 model turns. These are planned, not executed.

The cases have no exact request-text overlap with the prior fixture, but were
authored in this task; they are not independent-team replication. Structural
checks verify declared labels against explicit set changes, not linguistic
ground truth. Registration still needs label review, exact frozen prompts,
counterbalanced ordering, and a compatible result-registration adapter.

## Replay and verification

From the repository root with Node v26.8.1:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/verify-start.test.mjs
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/verify-start.mjs --check-saved
```

The verifier reads only selected files, checks their SHA-256 bindings,
recomputes statistics, checks the case design, then replays four work events.
`progress-001.json` binds completion evidence to the existing plan and its
research-question DAG. It is a scoped progress snapshot, not a new runtime
ledger or global ontology publication. The original planning inspector still
shows initial state; use this verifier for this snapshot.

Operational-support residue: the unrelated Codex wrapper route-registry binding
remains outside this research scope. It does not prevent either next research
task. No runtime activation, acceptance, publication or deployment is implied.

## Strict requirement fast-path canary

`fast-path-canary-manifest-001.json` freezes a same-workstream sequestered
holdout, the exact implementation and app-server client bytes, Node v26.8.1,
Codex CLI 0.153.1, `gpt-5.6-luna` at low effort, and all local and live gates.
The holdout is not independent validation.

The zero-model challenge passed 24/24 cases: all six exact controls were
admitted, all eighteen adversarial or noncanonical inputs were routed to the
fallback, and no model call occurred. The controlled live canary then passed
five of six rows. Both exact controls avoided Codex, routing remained correct
for all six rows, four fallback rows made exactly four app-server turns, and no
tool event occurred. Three of four model fallbacks produced valid exact changes.

The remaining row is preserved as counterevidence. For `Remove appendix from
the requirements` without terminal punctuation, Luna emitted a removal while
also emitting `transition: continue`. The host rejected that contradiction as
`requirements.transition-delta-conflict`. The next construction candidate must
address fallback-output consistency and receive a new manifest identity; this
result must not be retried under the frozen identity or represented as a pass.
Production wrapper integration remains disabled.

### Independent language benchmark

An independently dispatched native helper authored 32 requests while forbidden
from reading the router, its tests, and all earlier holdouts. Sixteen requests
were classified as mechanically simple single operations and sixteen required
model interpretation because of ambiguity, negation, conditions, multiple
operations, quotation, unresolved reference, or semantic inference. The file
was frozen before the current v2 assessor was measured.

The current grammar admitted 3/16 simple requests, for 0.1875 recall against a
prospective 0.75 gate. All three admitted changes were exact. It admitted 0/16
model-required requests, so the false-admission rate remained zero. The result
is an `improvement-opportunity`, not a failed safety boundary: exact whole-form
matching is safe in this sample but does not cover ordinary lexical and speech-
act variation.

`independent-language-hypothesis-001.json` preserves the next implementation
hypothesis. Instead of adding one regex per missed sentence, it proposes a
bounded compositional parser made from speech wrappers, an operation lexicon,
closed target frames, and the existing semantic-risk vetoes. This holdout is
now development evidence and must not be reused as the sole evaluation set.
After that parser is frozen, a new blind successor holdout must test whether the
coverage gain transfers without increasing false admission. Production wrapper
integration remains disabled.

### Delta-contract successor canary

Canary 002 binds the preceding failure and changes the provider boundary from
`transition + added + removed` to `posture + added + removed`. The model no
longer selects workflow transitions. `assessRequirementDelta` derives
`continue` for an empty applicable delta and `refine` for any addition or
removal; `resolveRequirementOperationFromDelta` records
`transition_owner: deterministic-host`. Historical patch and resolver APIs
remain available.

The local successor passed 24/24 cases. In the real six-row app-server canary,
route accuracy, tool exclusion, exact model-call count, and deterministic host
transition ownership all passed. The formerly failing punctuation-free removal
now passed with a host-derived `refine` transition. Overall exact result quality
remained 5/6 because one model response changed the request term `examples` to
`Examples`. This separate label-fidelity counterexample is preserved in
`fast-path-live-canary-result-002.json`; canary 002 is not a full pass.

The next candidate should reconcile a model-added term only when it has one
unambiguous case-insensitive span in the exact request, replacing it with that
source span. Missing or multiple matches must remain unchanged or block under a
prospectively frozen rule. Broad case-folding, semantic rewriting, production
integration, and authority effects remain outside this candidate.

### Exact request-span successor canary

Canary 003 adds `reconcileRequirementDeltaLabels` and the v3 requirement
resolver. Exact provider labels remain unchanged. A case-different label is
replaced only when it has one bounded case-insensitive span in the exact user
request. Missing and multiple spans block. The reconciliation receipt binds the
request digest, source delta digest, provider label, selected request span,
offset, transformation, and resulting delta. The v3 resolution records both
`transition_owner: deterministic-host` and `label_owner: exact-request-span`.

Focused reconciliation tests and the 24-case local canary passed. The live
canary again passed five of six rows, but it exposed a new boundary rather than
the prior casing defect: Luna returned `posture: unsupported` for the plainly
actionable polite request `Please add examples to the requirements.` With no
admitted delta, the host correctly failed closed and performed no label repair.
Canary 003 is therefore preserved as counterevidence, not reported as a pass.

The next candidate should test a prospectively frozen expansion of the local
grammar for a small set of unambiguous polite and punctuation variants. It must
retain zero false admission on conditional, negated, compound, quoted, and
reserved-word cases. Production integration remains disabled.

### Expanded grammar successor canary

Canary 004 adds an additive v2 fast-path assessor and v4 resolver for twelve
closed forms: strict, polite, question, lowercase, and terminal-period-free
add, remove, and maintain requests. Historical APIs and canary bytes remain
unchanged. The expanded assessor records the exact matched form, while the host
continues to own transition derivation. Inputs with negation, choice,
conditions, compounds, quotes, reserved words, capitalization outside the
frozen grammar, or other unregistered phrasing remain on the model fallback.

The prospectively frozen 24-case holdout passed 24/24 locally: positive recall
was 1, false admission was 0, exact result rate was 1, and no model call
occurred. The controlled app-server canary initialized Codex CLI 0.153.1 and
verified `gpt-5.6-luna` at low effort. All four formerly model-bound variants
resolved locally, with exact results, deterministic transition ownership, zero
tool events, zero model calls, and zero `turn/start` operations. This removes
the observed model variability for only these registered forms; it is bounded
same-workstream evidence, not independent validation or general language
understanding evidence. Production wrapper integration remains disabled.
