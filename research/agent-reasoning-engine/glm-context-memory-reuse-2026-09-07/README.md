# GLM context and memory reuse research

Date: 2026-09-07. Route: `CA2-ROUTE-RESEARCH`. Status: research candidate.
Authority effect: none. This proposes experiments; it does not admit an
implementation, dependency, runtime change, or deployment.

## Finding

The best first experiment for ARE is **selective observation masking**: retain
recent tool results and compact verified progress, while older result bodies
remain recoverable from the durable journal. Memoket Kite is useful for a
separate retrieval experiment and benchmark accounting. Its default transport
and evidence-selection budget should not replace ARE's existing boundaries.
LongMemEval-V2 supplies a useful evaluation design; GEPA supplies an optional
way to optimize prompts after the benchmark and retention baseline exist.

These are transfer hypotheses, not GLM performance results. Research covered
arXiv papers first, then six GitHub repositories through read-only source
inspection. No upstream package was installed or executed, no published result
was reproduced, and no paid model call was made for this research. Exact
repository commits, inspected source hashes, and paper links are in
[sources.json](sources.json). Private repository content was not submitted to
the upstream projects.

## Why this fits the current failure

The [repaired recycling canary](../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/evidence/recycling-canary-repaired-2026-09-07.json)
passed its seven patch checks, but needed all 12 model requests and 11 recycles.
It performed 19 reads across four distinct paths, consumed 29,204 input tokens,
and had only 91–971 tokens of recorded dispatch headroom. Runtime projection
and the canary prompt both changed, so this result cannot isolate either
change's contribution. The receipt explicitly records that efficiency has
not been demonstrated.

The active implementation archives history and clears retained exchanges when
recycling. The added inspection-progress projection preserves successful
file-read identity and evidence-read status, but not the file contents needed
to finish the repair. Repeatedly reconstructing that content is a plausible
source of the observed rereads. This is an inference to test, not a demonstrated
causal explanation.

Keep three measurements separate: correctness after recycling, efficiency of
that recovery, and enforcement of outbound context limits. A passing patch
does not establish the other two.

## arXiv evidence

| Paper | Relevant finding or design | Transfer limit and proposed use |
| --- | --- | --- |
| [The Complexity Trap, 2508.21433](https://arxiv.org/abs/2508.21433) | Compares observation masking and LLM summarization in software-engineering agents; simple masking is competitive across the evaluated configurations. | Closest match to ARE's active tool loop. Test retaining recent observations before adding a summarizer. Its chosen history lengths and reported outcomes are not GLM presets. |
| [LongMemEval, 2410.10813](https://arxiv.org/abs/2410.10813) | Evaluates extraction, multi-session and temporal reasoning, updates, and abstention in long conversation histories. | Useful question taxonomy. Conversational answer accuracy does not establish coding-task continuity. |
| [MemoryArena, 2602.16313](https://arxiv.org/abs/2602.16313) | Evaluates memory in interdependent agent-environment sessions. | Supports testing whether remembered information enables the next action, alongside recall questions. Its environments are not ARE's repository tasks. |
| [LongMemEval-V2, 2605.12493](https://arxiv.org/abs/2605.12493) | Includes state, workflows, gotchas, and premise awareness in long agent histories; assesses answers and retrieval latency. | Strong basis for repository questions and stale-premise cases. Work in progress; its very large histories and reader/judge setup are not a required deployment recipe. |
| [GEPA, 2507.19457](https://arxiv.org/abs/2507.19457) | Uses execution feedback and reflection to evolve textual prompts. | Candidate for fitting prompts to GLM, with independent held-out evaluation. It does not establish a gain for this model or train its weights. |
| [ACE, 2510.04618](https://arxiv.org/abs/2510.04618) | Develops an evolving context playbook through generation, reflection, and curation. | Consider task-scoped lessons later; keep inferred lessons separate from repository authority and source evidence. |
| [Context-Folding, 2510.11967](https://arxiv.org/abs/2510.11967) | Uses branching/folding and a training method for long-horizon agents. | Architectural inspiration only. A hosted GLM prompt change cannot be assumed to reproduce a trained folding policy. |

Reading depth: full HTML for Complexity Trap, LongMemEval, MemoryArena,
LongMemEval-V2, and ACE; abstract and implementation for GEPA; abstract-level
screening for Context-Folding. No companion arXiv paper was identified for Kite
in this search; its inspected citation file identifies software.

## GitHub reuse assessment

| Repository | Inspected code license | Decision |
| --- | --- | --- |
| [JetBrains-Research/the-complexity-trap](https://github.com/JetBrains-Research/the-complexity-trap) | MIT | First candidate: adapt the observation-masking policy and relevant test cases, maintaining ARE's tool protocol and journal. Python/SWE-agent classes are not a direct Node import. |
| [memoket/memoket-kite](https://github.com/memoket/memoket-kite) | Apache-2.0 | Reuse benchmark-accounting patterns now in the experiment design; evaluate a retrieval adapter separately. Avoid wholesale runtime adoption. |
| [xiaowu0162/LongMemEval-V2](https://github.com/xiaowu0162/LongMemEval-V2) | Apache-2.0 | Adapt the memory interface, query blindness, and evaluation structure to our own repository fixtures. Dataset terms require separate review before download/reuse. |
| [gepa-ai/gepa](https://github.com/gepa-ai/gepa) | MIT | Optional custom adapter after stable scoring exists. Optimize selected prompt text only. |
| [xiaowu0162/LongMemEval](https://github.com/xiaowu0162/LongMemEval) | MIT | Secondary source of question and scoring formats; keep gold evidence metadata out of retrieval. |
| [ZexueHe/MemoryArena](https://github.com/ZexueHe/MemoryArena) | No root license found at inspected commit | Use the paper's experimental ideas. Do not vendor the repository on the assumption that its vendored MemoRAG license covers it. Source inspection was limited to documentation and file layout. |

License labels describe the inspected repositories, not all dependencies,
datasets, models, or assets. Preserve applicable notices if code is later
adapted. This research adds no dependency.

### Kite: concrete useful components and boundaries

Kite extracts facts into a codebook with source references, compiles questions
into validated symbolic retrieval plans, and executes those plans with indexed
retrieval and fallback ranking. This offers an inspectable route from a query
to selected evidence. Plan execution can be deterministic for a fixed plan and
store; model-produced extraction and planning are not thereby deterministic.
See the pinned [architecture](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/docs/architecture.md).

Useful candidates are:

- **Evidence provenance:** retain source locations and inspectable plans in a
  retrieval sidecar. Extracted facts remain derived candidates; they do not
  redefine canonical repository definitions.
- **Benchmark accounting:** distinguish build, retrieval, answer, and judge
  work; pin inputs, record failed examples, and audit leakage. The
  [reproducibility design](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/docs/reproducibility.md)
  is useful even without Kite as a dependency.
- **Token channels:** adapt the distinction between compact evidence and
  actual reader input from its
  [ledger](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/src/memoket_kite/pipeline/ledger.py).
  Its `o200k_base` counter is not a verified GLM tokenizer; the fallback estimate
  must never be treated as exact GLM admission accounting.

There are material integration differences:

1. The [row selector](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/src/memoket_kite/pipeline/retrieve.py)
   exempts anchored rows from its token cap, subject to a 40-row seed ceiling.
   It prices compact rows before later hydration and adjacent context.
   Therefore its evidence cap is not a hard cap on the final model request.
2. The [provider wrapper](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/src/memoket_kite/providers/llm.py)
   uses environment credentials, retries, a default 16,000 output-token limit,
   and fallback from empty content to reasoning content. Its JSON helper also
   retries. These differ from ARE's bounded calls, secret handling, output
   budget, and protocol interpretation. Any experiment should use an explicit
   ARE transport adapter and account for every extraction/planning call.
3. The [published reproduction manifest](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/benchmarks/reproduce/manifest.json)
   is a maintainer artifact, not our reproduction. Its claims concern
   conversational benchmarks using GPT-4.1-mini stages, not GLM coding.
   The inspected manifest has a null release commit and packaging status;
   our source register pins the actual inspected checkout separately.
4. [Data licensing](https://github.com/memoket/memoket-kite/blob/8745fedab8d10ea698066583dfc3ba4e0a32e294/LICENSE-DATA.md)
   is separate: Kite documents noncommercial LoCoMo-derived material and MIT
   LongMemEval data. Use repository-owned fixtures for the first experiment.

### Other implementation details worth retaining

Complexity Trap's
[history processor](https://github.com/JetBrains-Research/the-complexity-trap/blob/bf15b5fb7d279679035a007ac9a81084d6b9a89a/sweagent/agent/history_processors.py)
replaces old observation bodies, keeps recent observations, supports exceptions,
and amortizes history changes through a processing cadence. An ARE adaptation
must preserve valid tool-call/result pairing and recoverable source identities.
Retaining action text forever is still unbounded; whole-request admission must
remain the final guard. Do not import its surrounding execution configuration.

LongMemEval-V2's
[memory interface](https://github.com/xiaowu0162/LongMemEval-V2/blob/2cc8c540bdb87fe6761629b585e727e1c4704520/memory_modules/memory.py)
separates inserting trajectories from querying evidence. An opaque invocation
identifier can support tracing without disclosing answer labels. Its
[harness](https://github.com/xiaowu0162/LongMemEval-V2/blob/2cc8c540bdb87fe6761629b585e727e1c4704520/evaluation/harness.py)
separates memory output from the reader. Adapt that separation, while enforcing
the full ARE request budget in addition to any retrieved-evidence limit.

GEPA's
[adapter protocol](https://github.com/gepa-ai/gepa/blob/0632cdb5dcc052e690eab439e1b4a7e3e9cfe407/src/gepa/core/adapter.py)
accepts candidate text, scores, and execution trajectories. A custom adapter
can invoke the existing bounded ARE runner. Keep hard budgets, authorization,
secret handling, and verification outside the mutable prompt candidates.
Reflection calls have their own cost: an evaluation-call cap alone is not a
complete spending cap. Validation examples used by the optimizer are not an
untouched final test set.

## Proposed model-fitting experiment

This is a candidate experimental design, not an admitted execution plan.
Begin with our current canary and archived failure, then build 48 independently
specified repository tasks: eight each for source lookup, architecture/dependency
reasoning, conflicting or superseded evidence, continuation after recycling,
small verified repairs, and abstention when evidence is absent. Include factual
questions and action tasks; the latter need observable completion criteria.
Question authors must derive gold answers from pinned sources, not GLM replies.

Partition by source family or task episode into 24 training, 12 development,
and 12 held-out tasks. Keep paraphrases and shared solution-bearing histories
in the same partition. If that grouping cannot support these exact counts,
preserve separation and record the resulting counts. This is a pilot dataset,
not a statistically powered claim of general model improvement.

Record model identity, endpoint/configuration, prompt and source hashes,
outgoing request hashes, exposed response/tool events, parser outcomes,
finish reasons, tokenizer and model calls, token usage, latency, cache usage
when reported, repeated reads, recycling events, and verifier outcomes.
Collect what GLM visibly emits and does; do not equate it with access to its
private reasoning. Redact credentials and keep private traces locally.

Use staged comparisons instead of a large live Cartesian product:

1. **Offline baseline audit:** check request construction, source identities,
   journal recovery, tool-pair validity, and boundary failures using existing
   traces and deterministic fixtures. Label byte/token estimates explicitly.
2. **Retention comparison:** compare current clearing with recent-observation
   masking under the same prompt, call limits, and context policy. Then test
   compact verified progress plus masking as a separate treatment. A recent
   tail must be token-bounded, not merely a fixed message count.
3. **Context sweep:** independently vary the configured hard window and soft
   recycle threshold. Candidate hard limits are 8k, 16k, and 32k only where the
   exact runtime/provider configuration supports them. Preserve the existing
   5,000-token threshold as a stress baseline; keep the 2,048 output reserve
   and token margin fixed initially. Report actual prompt occupancy, evidence
   position, and distractor load, not just nominal window size.
4. **Small live pilot:** use paired tasks and repeated runs with a manifest
   covering all model/tokenizer/reflection calls, latency and spend ceilings.
   Record failures without invisible retries. Expand only after the pilot
   provides interpretable results.
5. **Retrieval and fitting:** add a Kite-style retrieval sidecar as a separate
   arm only after retention is understood. Use GEPA or the existing ARE
   improvement loop to tune limited prompt components on training/development
   data. Freeze the winner before one held-out evaluation.

Primary outcomes are verified task success and boundary compliance. Secondary
outcomes are tokens, latency, repeated reads, and recovery actions per successful
task. Report costs and failures over *all* attempted tasks as well, so a cheap
failure is not mistaken for an efficiency gain. For prose questions, score
source correctness, abstention, and format separately from stylistic fluency.
Prefer deterministic source/patch checks; isolate any model judge and audit a
sample manually. Do not let the optimized model grade its own correctness.

## What “never let the window compact” can establish

The testable local invariant is that every admitted **complete outgoing
request**, including instructions, tools, progress, retained/retrieved material,
and tokenization margin, fits the configured input allowance with output
reserved. Check again after recycling/retrieval and before dispatch. If the
minimum valid request cannot fit, block explicitly. A retrieval-only token cap
cannot establish this invariant.

Test below, at, and above each admission boundary; oversized single tool
results; growing tool schemas and progress; multiple tool calls per turn;
resume after recycling; stale source hashes; and repeated cycles. Require
archive integrity and valid protocol reconstruction in addition to task
completion. Pausing, truncation, recycling, request rejection, and provider
finish reasons should be distinct recorded events.

ARE-controlled recycling is observable. Provider-side internal truncation or
compaction is not proven absent by an HTTP success or a correct answer.
Establishing that stronger claim requires a documented provider guarantee or
explicit telemetry. Likewise, an append-only disk journal does not imply
provider prefix-cache hits; see the existing
[DeepSeek Harness context research](../deepseek-harness-context-management/README.md).

## Open Questions

- Which exact GLM endpoint/model configuration exposes context limits,
  tokenizer behavior, and any internal truncation/compaction metadata?
- How much rereading comes from clearing observations versus prompt wording
  and the unusually small soft threshold?
- What minimum recent evidence permits recovery without repeated full reads?
- Does structured retrieval improve repository tasks enough to pay for its
  extraction and planning calls, including invalidation after source changes?
- Which source groups provide a truly independent held-out repository set?
- What are MemoryArena's root reuse terms and LongMemEval-V2's dataset terms?
- Are Kite's published results reproducible from a fully release-pinned
  manifest? This run inspected source; it did not answer that question.

The next research-backed implementation candidate is one bounded masking policy
with protocol/budget tests and a paired canary. Construction admission and
operational integration remain separate from this research finding.
