# Obsidian TOC research-ontology experiment

Date: 2026-09-05. Status: planning candidate; not executed.
Selected route: CA2-ROUTE-PLAN. Authority effect: none.
Proposed research home: Agent Reasoning Engine development workspace.
This document does not register a Project, Goal, or ConstructionBinding.

## Question and claim boundary

Can an agent solve the DeepSWE v1.1 Obsidian automatic table-of-contents task
using a small research ontology? Does that method improve outcomes over ordinary
coding and over an equally explicit requirements checklist?

Separate three findings: a particular patch passed; an ontology-assisted run
passed; the ontology method improved measured outcomes. The first two do not
establish the third. One task, even repeated, cannot establish general coding
improvement or ARE runtime conformance.

The treatment borrows ARE's explicit sources, hypotheses, observations and gaps.
It does not require the ARE serving runtime, ontology admission, a new generic
ontology framework, or the suspended Python ontology gate.

## Sources and selected dependencies

- [Task instruction](https://deepswe.datacurve.ai/data/v1.1/tasks/obsidian-linter-auto-table-of-contents):
  instruction article and task identity only as solver inputs.
- [Target repository](https://github.com/platers/obsidian-linter): exact benchmark
  base revision, to be resolved from the task manifest before execution. The
  page displayed abbreviated base `6393b3ab32`; this is not a full revision pin.
- [ARE development entry](../../README.md): workspace ownership and relocation.
- [ARE product explanation](../../../../agent-reasoning-engine/README.md):
  “Research and evolution pipeline” and explicit reusable reasoning-state idea.
- [ARE ontology](../../../../agent-reasoning-engine/ONTOLOGY.md): “Purpose”,
  “Key files”, and “Claim ceiling”; pattern inspiration only, not a dependency
  on all business-ontology records or generated projections.

Before measured runs, record exact instruction bytes/hash, full base SHA,
benchmark version, evaluator revision/hash, environment image digest, lockfile
hash, prompt hashes and model configuration. Current pins are unresolved; no
snapshot or manifest is claimed to exist. Changes to selected inputs create a
new experiment epoch. Unrelated ontology drift has no bearing on this protocol.

## Design: three conditions

| Arm | Method | Purpose |
|---|---|---|
| A: ordinary coding | Task instruction, repository and common tools; ordinary notes permitted; no prescribed scaffold | Practical baseline |
| B: checklist | Same inputs; maintain requirements, source citations, assumptions, code pointers and test outcomes as a flat checklist | Controls for explicit organization and evidence recording |
| C: research ontology | Same inputs; maintain typed entities and explicit relationships among the same categories | Tests the added value of relationships and navigating them |

All arms use the same pinned model/version, reasoning setting, tools, environment,
starting revision and budget. No live ARE wrapper in the first experiment: that
would add another treatment. No arm receives extra papers, solutions, examples,
or precomputed code analysis. Each constructs its own notes from the same allowed
inputs; construction and maintenance count against its budget.

B and C use parallel prompts with the same obligations: extract requirements,
attach evidence, mark uncertainty, link work to tests and revisit after failures.
Only C prescribes typed graph relationships and graph-based gap queries. Prompt
differences must be recorded explicitly. A may organize itself naturally; inspect
actual behavior and report any spontaneous ontology-like behavior as reduced
treatment separation, not grounds to discard a successful baseline.

Proposed per-run limits: 60 minutes of active solver wall time and 100,000 total
provider-reported tokens, stopping at whichever limit is reached first. Count
repeated/cached input tokens and reported output/reasoning tokens according to a
frozen accounting rule; report cache categories and billed cost separately.
Reserve final evaluator time outside these equal solver budgets. If the selected
host cannot meter a hard token limit, resolve that before measurement and revise
all arms consistently. No paid run is authorized by this budget proposal.

Start with one three-arm pilot to test isolation, logging, scoring and practical
budget size. Exclude pilot outcomes from the measured comparison. Freeze a new
protocol version after any pilot-driven changes, before seeing measured results.

Then run three independent blocks, each containing A, B and C: nine measured runs.
Use fresh contexts and workspaces for all runs, with balanced randomized order
across blocks (each arm occupies each position once). Record the randomization.
Run serially to avoid machine contention; no parallel-agent fan-out is planned.
Pin sampling controls where supported; record lack of seed control rather than
claiming deterministic model replay. The pilot plus measurement caps solver time
at 12 hours and reported tokens at 1.2 million under these proposed limits.

## Minimal ontology treatment

Store an inspectable task-local JSON or JSONL graph outside the patch submission.
Use stable IDs and six entity types: Requirement, Source, Hypothesis, CodeLocation,
TestCase and Observation. Preserve unresolved questions as explicitly unresolved
hypotheses rather than fabricating facts.

Relations: Requirement `grounded_in` Source; Hypothesis `addresses` Requirement;
Hypothesis `targets` CodeLocation; TestCase `checks` Requirement; Observation
`result_of` TestCase; Observation `supports` or `contradicts` Hypothesis.
Each source records a path/URL, selector and content hash. Code locations bind
the current source version. Hypotheses distinguish proposed, supported,
contradicted and unresolved; observed test results include command, exit status,
patch digest and log reference. A stale result never becomes current evidence.

Example: “ignore code-block headings” is a requirement grounded in the task;
“reuse the repository's Markdown traversal” is an unverified hypothesis until
source inspection supports it; a fenced-code fixture checks the requirement.
This example specifies a research question, not a selected implementation.

The agent should query its scaffold before patching and after development-test
failures: which requirements have no implementation hypothesis; which lack a
test; which hypotheses have counterevidence; which results concern older bytes?
Keep the graph small enough to inspect directly. Do not build a retrieval service
or compiler merely to run this experiment. B performs equivalent gap checks over
its checklist; A chooses its own working method.

## Task coverage and development checks

Extract exact behavior from the frozen instruction, retaining ambiguity instead
of silently inventing semantics. Cover at least:

- No start marker: unchanged input. Marker case/whitespace, first matching region,
  missing end marker, optional title and required blank lines.
- ATX level filtering and exclusion of TOC, YAML, code and math regions.
- Link display text, removal of image embeds and formatting, trailing heading
  markers, anchor normalization, explicit IDs and duplicate suffixes.
- Bullet versus numbered output, marker choice, continuous versus always-one
  numbering, indentation, literal/regex exclusions and all stated defaults.
- Default export and integration with existing rule conventions.

Each arm can inspect existing repository tests and create its own development
tests. Mark extra robustness checks such as repeat-application stability as
derived checks unless directly supported by the task. Ambiguous interactions
(for example filtered headings versus duplicate numbering) stay explicit until
allowed evidence resolves them. No reference solution may resolve ambiguity.

## Leakage controls and evaluation

The planning conversation fetched the task's full HTML, which contained evaluator
material. It is therefore unsuitable as a measured solver context. Start all
solver runs without this conversation, its tool outputs, private ARE documents,
evaluator code, reference patches or previous-run artifacts. Pass only the clean
instruction, common environment policy and that arm's method prompt. Export no
private repository prose into the external target repository.

An evaluation operator prepares the harness separately. Before solving, verify
that the pinned base has the expected regression baseline and expected missing
feature behavior. If that preflight cannot be reproduced, evaluation is
`not_evaluable`; continue independent protocol/scaffold work.

Keep final benchmark tests outside solver workspaces and observations. Each run
uses only development feedback, then freezes one final patch at completion or
budget exhaustion. The evaluator applies that exact patch to a clean copy of the
pinned base and runs the unchanged official task verifier and its required
regression checks. Record commands and raw logs; distinguish benchmark-scored
regressions from any additional full-suite checks. No post-grading repair enters
the measured run. A later repair is a separately labeled exploratory attempt.

If evaluator isolation is technically unavailable, label the experiment
open-test rather than claiming blinded evaluation. Verify harness commands from
the actual benchmark distribution before executing them; none are invented here.
The task page's request to branch from main does not justify using today's main
instead of the benchmark base. Preserve the pinned benchmark snapshot.

## Metrics and decision rules

Primary outcome: exact official task-verifier pass/fail for each final patch.
Report all nine results and per-arm counts, including incomplete attempts.
Secondary outcomes: official test counts, required regression failures, elapsed
solver time, provider token categories, billed cost where known, tool calls,
development-test iterations, and scaffold construction/maintenance overhead.
Requirement coverage and graph completeness are diagnostic, not substitute scores.

Record the last available patch at budget exhaustion; grade it normally and also
mark the run budget-exhausted. Solver-caused build/test failures count as outcomes.
Infrastructure failures are `not_evaluable`, retained in the report with their
cause. Permit at most one replacement per affected cell after repair, with the
same configuration and no evaluator feedback; retain both attempts. Repeated
infrastructure failure stops that cell. Never rerun merely because an arm lost.

At least one C pass establishes feasibility for that run. More C passes than A
is an exploratory benefit signal; more C passes than both A and B supports further
study of explicit relationships. C beating A but tying B does not isolate ontology
value. If pass counts tie, compare time/tokens for joint-success blocks and report
overhead; do not call efficiency differences correctness gains. If all arms pass,
the task has a correctness ceiling; if all fail, report unresolved feasibility.

Three runs per arm are descriptive, not sufficient for a strong statistical or
generalization claim. Report counts, individual outcomes and paired block
differences without declaring significance. Broad efficacy requires a subsequent
preregistered multi-task study with sample size chosen for its intended effect.

## Construction frontier and operational support

Current product-construction frontier: prototype experimental definitions and
task-scaffold design. Runnable now: requirement decomposition, arm prompts,
ontology/checklist schemas and evidence-contract design. This plan completes
the initial protocol draft; those follow-on artifacts are not yet constructed.

Follow the D65 sequence for any implementation-bearing experiment capability:
prototype definitions -> agent-facing scaffolds -> product/business/DomainSpec/
compiled-system/implementation prototypes -> exact testable candidate -> current
product tests -> product review. Scope the candidate to a fixed experimental
workflow and its artifacts; do not imply that this creates a general ARE product.
Use the pilot to test the workflow candidate. Bind any subsequent product approval
to exact bytes; approval conveys no operational authority. A scored Obsidian
patch likewise is test evidence, not permission to publish or deploy it.

| Operational task | Proposed owner | Exact affected stage | Current state / causal dependency |
|---|---|---|---|
| Resolve base, evaluator and environment pins | Evaluation operator | Pilot and measured product tests | Pending; required for comparable execution, not scaffold design |
| Establish fresh solver contexts and isolated workspaces | Experiment operator | Pilot and measured implementation runs | Pending; necessary to avoid prior-context leakage |
| Pin model, metering and resource envelope | Experiment operator with user resource choice | Model execution | Proposed defaults only; required before live runs |
| Package evaluator evidence without solver access | Evaluation operator | Product tests | Pending; required for blinded scoring |
| Formal execution-state registration | Owning Project | No prototype stage | Deferred; PLAN route registry blocker cannot be treated as admission |
| Commit, push, benchmark submission, ARE activation | Respective repository/product owners | No stage in this local comparison | Deferred; separate exact authorization, not construction prerequisites |

The task's embedded “commit everything” instruction does not authorize commits
in this private repository. Preserve unrelated dirty bytes and active writers.
Runtime adoption and registration work must not hide runnable scaffold work.

## Planned deliverables and completion

Only this PLAN.md is authored in the current planning step. Subsequent proposed
artifacts under this experiment directory are: a frozen experiment manifest,
common/A/B/C prompts, scaffold contracts, a run index, immutable per-run receipts,
private patch references and a comparison report. Resolve exact filenames and
write scopes before their construction; do not edit ARE product identity or
canonical ontology records for this experiment.

Every receipt should bind run/block/arm, protocol and prompt hashes, model/tool
configuration, source/environment pins, timing and usage, final patch hash,
verifier identity, raw evidence paths, result and any causal blocker.

The experiment is complete when the pilot has validated the workflow, all planned
measured cells have a scored outcome or explicit terminal `not_evaluable` reason,
and the report answers feasibility, comparison with A, comparison with B and cost.
Failure or no gain is a valid completed research outcome.

## Open Questions

- Which exact model/version and host can provide fresh contexts and enforce the
  proposed budget? No execution capability has yet been verified.
- What full base SHA, evaluator revision, environment and commands does this
  task's official distribution require?
- Can the evaluator be fully withheld from solver observations on the chosen host?
- Are the proposed 60-minute/100,000-token limits practical in the pilot? Any
  revision must precede measured runs and apply equally to every arm.
- Will a successful pilot justify the nine-run comparison? This plan proposes
  that stage; it does not spend resources or launch it.
