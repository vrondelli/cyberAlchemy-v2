# G01 fault-localization technique research — 2026-10-04

Status: bounded external research evidence  
Owner: CyberAlchemy v2 research route  
Authority effect: none  
Claim ceiling: technique candidates for prospective experiments; no benchmark,
product, or superiority claim

## Question

Which externally supported techniques best address G01's current pattern: an
entity-card GLM reranker produces large early-rank gains but also enough
regressions that its paired improvement interval crosses zero?

## Scope and method

The review used primary papers and publisher records on bug localization,
LLM ranking, and repository graphs. It matched those techniques against the
sealed local r43/r44 evidence and the completed untouched r50 confirmation.
The review did not inspect hidden benchmark labels, modify a benchmark, call a
model, or treat results from other tasks as evidence of G01 effectiveness.

Local evidence:

- r43: graph MRR@8 `0.41304` versus entity-card GLM `0.55228`, but 9/6/8
  wins/ties/losses and paired interval `[-0.04348, +0.33851]`;
- the post-hoc prefix-4 guard removed r43 losses, but its benefit must transfer
  prospectively in r44 before it can advance;
- r44 was therefore completed and scored before any new technique changed the
  treatment. Its guarded transfer subsequently passed: MRR@8
  `0.41667→0.43264`, paired interval `[+0.00139, +0.03576]`, and 4/20/0
  wins/ties/losses with unchanged Hit@3 and candidate reach;
- r50 rejected that guard on 24 untouched cases: guarded MRR@8
  `0.59936` versus graph `0.60248`, while raw GLM reached `0.65427` but
  reduced Hit@3 and retained a paired interval crossing zero.

## Findings

### F1 — Candidate-order instability is a first-class hypothesis

Listwise LLM rankings can change when an equivalent candidate set is merely
reordered. Recent work distinguishes pairwise-preference, global-consistency,
and final-output instability, showing that ordinary effectiveness alone does
not establish a stable ranking function. Permutation self-consistency directly
intervenes on this issue: shuffle the same candidates, obtain several rankings,
then aggregate them into a central ranking. Its published experiments found
that a small number of permutations captured much of the attainable gain.

This fits G01 closely because r43 serializes candidates in graph order and asks
for a new permutation. It is plausible that some of the eight losses are order
sensitivity rather than missing evidence. This is an inference to test, not an
explanation already proved by r43.

Decision: **promotion candidate for the next exposed diagnostic**.

### F2 — Pairwise judgments reduce ranking-task burden, at higher call cost

Pairwise Ranking Prompting asks the model to choose between two candidates
instead of generating a full permutation. Published work reports stronger and
more reliable zero-shot ranking than pointwise and listwise formulations, and
PRP-Graph aggregates pairwise judgments as a ranking graph. This is compatible
with G01's existing candidate graph and independent receipt model.

The naive form is too expensive for 30 candidates. A bounded form can compare
only candidates competing for ranks 5–12 while preserving graph ranks 1–4.
It remains a second-line experiment because even a linear comparison schedule
requires materially more provider calls than the current one-call treatment.

Decision: **retain as the fallback if permutation consensus remains unstable**.

### F3 — Evidence-first hierarchical scoring is preferable to unexplained order

RGFL generates bug-specific explanations for candidate files and elements,
then combines LLM and embedding signals in two ranking stages. Its reported
Python/Java results improve file Hit@1 and MRR over its baselines. The result is
not directly transferable to BugSwarm, but the mechanism fits ARE: entity cards
already provide the bounded file and element representation, while graph rank
provides the independent upstream signal.

For G01, the useful borrowing is not RGFL's reported number. It is a response
contract that emits structured supporting and contradicting evidence for each
promoted candidate, followed by deterministic aggregation with the graph
signal. This makes later audits able to separate missing evidence, unsupported
promotion, and genuine graph/model disagreement.

Decision: **combine with permutation consensus after an order-sensitivity
diagnostic, not as an unmeasured prompt rewrite**.

### F4 — Query-matched code segments are a low-cost evidence improvement

BRTracer represents a source file using its segment most similar to the bug
report and separately boosts stack-trace-related files. Its published study
found segmentation and stack-trace analysis complementary across three Java
projects. G01 entity cards already contain query-matching lines, so a bounded
next step is to add one small surrounding code window rather than more generic
declarations.

Decision: **eligible after ranking instability is measured**. Changing evidence
and aggregation simultaneously would prevent causal attribution.

### F5 — Data-flow slices are promising but not the next experiment

ARISE extends repository graphs to statement-level definition-use edges and
exposes data-flow slicing as a queryable primitive. Its ablations attribute
localization gains to the data-flow graph rather than merely the tool schema.
This could eventually improve cases where imports and declarations do not show
the value path responsible for a failure.

The current G01 metric is file-level ranking and the source set spans Python
and Java. A reliable two-language definition-use implementation is a larger
construction than the current experiment requires.

Decision: **defer to a separately bounded graph-enrichment cycle**.

### F6 — Fixed rank fusion is the smallest robust treatment

Reciprocal Rank Fusion (RRF) combines independent rankings without training or
score calibration. Its original `k=60` constant supplies a published fixed
choice rather than another value selected against G01 labels. For G01, the
inputs can be the unchanged graph ranking plus three complete GLM rankings
produced from deterministic counterbalanced candidate orders. Partial GLM
outputs are completed by appending unselected candidates in graph order before
fusion.

This directly addresses r50's useful-but-heterogeneous raw GLM signal: a
candidate must remain strong across views to overcome the graph prior, while a
single harmful promotion has limited influence. It needs no new runtime
dependency, model capability, or selector call.

Decision: **make fixed `RRF(k=60)` the first aggregation candidate after the
order-sensitivity diagnostic**.

### F7 — Self-Sorting is a stronger but costlier escalation

Self-Sorting distinguishes within-list order from cross-list preference. It
generates several candidate rankings, asks the model to rank those rankings,
and combines both signals. This is more expressive than simple permutation
consensus and directly fits the long-context ranking failure observed in G01.

The extra selection-time model call and its mixing parameter add cost and a new
degree of freedom. If RRF fails, use the already sealed candidate rankings,
freeze `lambda=0.5` by symmetry before scoring, and add one selection-time call
per case. Do not tune lambda on r50.

Decision: **second-line aggregation candidate, not the first experiment**.

### F8 — Batched scoring and pairwise fusion define the disagreement fallback

Batched pointwise self-consistency jointly scores several candidates under
varied batch compositions and orders. LLM-RankFusion separately shows that
pairwise rankers can suffer both order and transitivity failures, and proposes
calibration plus fusion. Together they support a bounded fallback: apply
two-orientation pairwise judgments only to candidates whose graph and fused
rankings disagree near the evaluation frontier, record reversals and cycles,
and aggregate the resulting preference graph.

This is preferable to an all-pairs tournament over 30 files. It remains more
expensive than permutation plus RRF and changes the response contract.

Decision: **retain for the graph/consensus disagreement frontier if RRF and
Self-Sorting do not stabilize Hit@3**.

### F9 — Logit calibration is attractive but not transport-compatible

CapCal estimates a model's content-independent position prior with placeholder
candidates and subtracts that prior from output logits. It is single-pass after
calibration and is therefore attractive for production ranking.

ARE's current GLM transport deliberately accepts only `messages` and `tools` in
the request body and records parsed messages plus usage; it neither requests nor
retains token logits. CapCal therefore cannot be integrated faithfully without
a separately tested provider capability and transport-contract change.

Decision: **defer; do not approximate CapCal with verbal confidence scores**.

### F10 — Iterative graph search is a separate candidate-generation hypothesis

CoSIL uses iterative module- and function-graph search with context pruning,
while AgentFL and AutoFL organize localization as tool-mediated navigation and
confirmation. These methods address a different failure mode: the correct file
never reaching the candidate set or lacking decisive neighboring evidence.

G01 r50 already reached the target within 30 candidates in 23/24 cases, so
changing graph traversal now would confound candidate supply with reranking
stability. A later graph-search branch can start from build-log anchors, expand
one bounded neighborhood at a time, and compare reach/cost against the current
static graph prior.

Decision: **separate evolution hypothesis after the ranking branch**.

## Recommended experiment sequence

1. **Close r44 unchanged — completed.** Sealing, scoring, and independent
   reproduction passed without retrofitting any technique.
2. **Untouched r50 transfer — completed and negative.** A new 24-repository
   Python cohort passed every source, log, target, model, sealing, and audit
   gate. Guarded-minus-graph MRR@8 was −0.00313 with paired 95% interval
   [−0.02500, +0.01563]. Raw GLM was +0.05179, but its interval [−0.05615,
   +0.17073] crossed zero and Hit@3 fell. The prefix-4 guard is rejected as the
   current transfer mechanism; no superiority claim follows.
3. **Next exposed order-sensitivity diagnostic.** Reuse sealed r43/r44/r50
   packets;
   submit two additional deterministic counterbalanced candidate orders, measure
   Kendall disagreement, per-file rank variance, selection consistency, and
   gold-aware MRR only after responses are sealed.
4. **Fixed fusion treatment.** Complete each partial model list with the graph
   remainder and fuse the graph plus three model rankings with published
   `RRF(k=60)`. Freeze the permutations, completion rule, cost ceiling, and
   paired gate before scoring. Preserve the candidate set exactly.
5. **Self-Sorting escalation only if needed.** Reuse the sealed lists, freeze
   `lambda=0.5`, add one selection-time ranking call per case, and compare it
   against the already frozen RRF result.
6. **Evidence-contract ablation only if needed.** Keep aggregation
   fixed and replace unexplained permutation output with structured
   support/contradiction evidence and deterministic score aggregation.
7. **Segment enrichment only if ordering is stable but evidence is weak.**
   Add one query-matched bounded code window per candidate; keep the winning
   aggregation unchanged.
8. **Separate graph-search branch.** Only after ranking is stable, test bounded
   CoSIL-style expansion from build-log anchors against candidate reach and
   provider cost.
9. A successful development transfer qualifies a newly frozen untouched
   confirmation cohort on a new dataset such as Defects4J; exhausted BugSwarm
   supply cannot provide another 24-case cohort.

## Executed integration result — r51

The first recommended integration has now been executed over the 71 exposed
r43/r44/r50 cases. Two counterbalanced GLM rankings were fused with the graph
and historical raw GLM rankings using the prospectively fixed `RRF(k=60)` rule.
The diagnostic RRF reached MRR@8 `0.62141`, compared with graph `0.47830` and
historical raw GLM `0.59666`. Hit@3 was `47`, compared with `41` and `45`.
RRF-minus-graph had a paired bootstrap interval of `[+0.05827, +0.23251]`;
RRF-minus-historical-raw was `+0.02475` with interval
`[-0.01278, +0.06367]`.

Every quantitative and cohort-safety check passed. The overall gate did not:
seven of 142 HTTP-200 outputs returned exact candidate paths where the frozen
contract required numeric IDs. Diagnostic normalization recovered all seven,
but cannot retroactively satisfy the gate. The result is therefore strong
exposed mechanism evidence, not confirmation or superiority evidence. Full
receipts and the independent reproduction are recorded in
`implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-order-robust-r51/RESULT.md`.

The smallest useful next technique is therefore **two additional
counterbalanced orders followed by fixed `RRF(k=60)` over the graph and three
GLM rankings**. It directly targets a measurable failure mode, preserves the
graph candidate set, requires no new runtime dependency or model feature, and
avoids carrying forward the rejected prefix-4 guard.

## Second external-research pass — 2026-10-05

This pass was performed after r53 rejected Self-Sorting and while the fresh
BugsInPy r54 confirmation cohort was still gold-blind. It looked specifically
for mechanisms that improve evidence or candidate generation rather than adding
another selector over the same listwise outputs. No r54 input, ranking, metric,
or gate was changed.

### F11 — Structured query expansion is the smallest new causal experiment

Recent file-localization work reports that extracting identifiers, stack traces,
error messages, and a concise bug summary before BM25 retrieval improves over
using an unchanged bug description. LinuxFL+ independently finds value in
expanding potential causes before merging and reranking candidate files.

G01 can borrow the mechanism without replacing the authenticated failure log:
one GLM call emits a closed JSON object containing copied identifiers, copied
error types, subsystem concepts, and a short causal hypothesis. The raw query
and expanded query produce separate complete deterministic rankings, which are
then fused with fixed `RRF(k=60)`. Invalid or invented file paths are not query
labels and receive no special treatment.

Decision: **first exposed ablation after r54**. It costs one provider call per
case, preserves the raw-query channel, requires no new model runtime, and tests
query quality independently from listwise candidate ordering.

### F12 — CodeRankEmbed is the strongest practical new retrieval channel

CoRNStack's CodeRankEmbed is an open 137M-parameter bi-encoder with an 8,192
token input limit. The ICLR 2025 paper reports `50.0%` function Top-5 and
`59.1%` function Top-10 on its SWE-bench-Lite localization formulation; adding
the 7B CodeRankLLM reranker raises those values to `67.5%` and `73.7%`.
CoRet independently reports at least 15 percentage points of retrieval-recall
improvement by combining code semantics, file paths, and call-graph context.

The smallest ARE integration is not the 7B reranker. It is a pinned
CodeRankEmbed ranking over AST-sized Python chunks, collapsed to files by each
file's best chunk, then added as an independent RRF channel beside raw BM25 and
ARE. The model card is MIT-licensed and publishes a SentenceTransformers usage
contract.

Decision: **second arm in the exposed ablation**, subject to a pinned revision,
SHA-256 receipt, audited remote model code, fixed chunking, and an explicit
pretrained-component label.

### F13 — Pretraining overlap limits the claim, not the experiment

CoRNStack was derived from the deduplicated Stack v2. Its authors removed exact
matches with evaluation datasets but explicitly state that more semantic
filtering is needed to detect similar queries and code. BugsInPy consists of
public repositories old enough to be plausible training inputs.

Decision: CodeRankEmbed may establish **bounded system performance on the
frozen BugsInPy cohort**, but it cannot by itself establish contamination-free
general superiority. Report the raw-query/GLM-only arm separately, retain a
model-free baseline, and require a later post-cutoff or private-repository
confirmation for the strongest claim.

### F14 — Directory-aware expansion is the best candidate-recall fallback

LinuxFL+ expands within directories of initially predicted files, reselects the
top files, and merges structurally distinct rankings. Agentless likewise
combines LLM file localization with embedding retrieval before narrowing to
symbols and lines. This addresses a target outside the top candidate union,
where no reranker can recover it.

Decision: **activate only when a gold-blind reach diagnostic shows that the
target is often outside the fixed top-20 union**. Freeze directory depth,
maximum added files, and selection budget before labels. Do not add it to r54,
whose purpose is confirmation of the already-defined RRF mechanism.

### F15 — Execution spectra offer strong independent evidence but a slower cycle

FlexFL and FuseFL combine conventional fault-localization signals such as
Ochiai/SBFL with LLM inspection. This signal is attractive because it is
behavioral and independent of text similarity. BugsInPy supplies failing and
passing tests in principle, but reproducing coverage across historical project
environments is materially slower and more failure-prone than the current
source-only campaign.

Decision: **separate execution-evidence evolution cycle**, not a dependency of
the accelerated r54/r55 path. First measure environment reproduction yield and
coverage cost on a small source-disjoint feasibility cohort.

### F16 — Reward models and durable project memory are later-stage mechanisms

HiLoRM selects among multiple sampled file/function/line predictions with a
trained 7B reward model and reports transfer gains, while MemFL uses static
project summaries plus dynamic debugging memory. Both support ARE's broader
architecture, but neither is the next G01 benchmark intervention: HiLoRM adds a
large specialized runtime and sampling cost; historical debugging memory also
creates a leakage boundary unless every memory item predates and is independent
of the benchmark label.

Decision: retain HiLoRM as a future local scorer and MemFL as an
interaction-learning/project-memory hypothesis. Neither enters the r54 or r55
claim path.

### F17 — Provider JSON mode should harden the transport, not redefine validity

The official Z.AI structured-output contract exposes
`response_format: {"type":"json_object"}` and explicitly recommends local
schema validation. R54 did not enable this parameter. All 72 calls returned
HTTP 200, but 11 responses failed the frozen application schema: two returned
a bare list and nine included at least one string that was neither a numeric
candidate ID nor an exact candidate path.

JSON mode is therefore the smallest transport correction for the exposed r55
cycle. It can prevent the bare-list class and reduce prose/fence drift, but it
does not prove that candidate values satisfy the application enum. R55 must
return numeric IDs only, validate the closed object locally, and count every
out-of-range value as invalid without repair. A one-case provider feasibility
probe must establish that `glm-5.3-flash` accepts the parameter before the r55
packet freeze.

Decision: **integrate JSON mode prospectively in r55; do not reinterpret or
retry r54 responses**.

## Executed fresh confirmation — r54

R54 completed on 24 previously unused BugsInPy cases from 12 repositories.
Source, queries, two deterministic baselines, 72 counterbalanced packets, and
all predictions were sealed before labels were opened. Tokenizer admission was
72/72 and all 72 provider calls returned HTTP 200. Strict application validity
was 61/72, leaving only 15 cases with all three required views. The frozen
72/72 response-validity gate therefore failed and no superiority claim is
supported.

The label-opened diagnostic nevertheless strengthens the RRF hypothesis. On
the 15 complete cases, fixed `RRF(k=60)` reached MRR@8 `0.73333`, versus
`0.36619` for ARE and `0.24841` for chunk BM25. RRF-minus-ARE was `+0.36714`
with a repository-bootstrap 95% interval `[+0.16381, +0.58901]`;
RRF-minus-chunk was `+0.48492` with interval `[+0.24479, +0.68254]`. These are
complete-case diagnostics across 10 repositories, not the frozen 24-case
estimand. The exact result and claim ceiling are recorded in the r54
`RESULT.md`.

## Updated experiment sequence

1. **R54 completed and failed its protocol gate.** Preserve it unchanged as
   strong diagnostic RRF evidence, not confirmation.
2. **Run r55 as an exposed mechanism ablation** over the already scored
   BugsInPy r1/r2b cases:
   - A: unchanged raw-query ARE/BM25 baseline;
   - B: structured-query ranking fused with A using fixed `RRF(k=60)`;
   - C: pinned CodeRankEmbed file ranking;
   - D: fixed RRF of A, B, and C.
3. First verify Z.AI JSON mode on one source-only packet. Then freeze numeric
   candidate IDs only, the JSON expansion schema, model revision and digests, source
   chunking, file-collapse rule, invalid-output rule, provider/model budget,
   and paired metrics before calls or scoring.
4. Advance only a prospectively declared winner. Do not choose per-case or
   retrospectively combine favorable arms.
5. If the winner improves both MRR@8 and Hit@3 on the exposed cohort, confirm
   it on a new source-disjoint 24-case BugsInPy cohort. Keep the
   pretrained-component caveat in that claim.
6. Only if candidate reach is the limiting failure, open the separately frozen
   directory-aware expansion branch. Only if textual retrieval saturates, open
   the SBFL execution-evidence cycle.

## Counterevidence and limitations

- Passage/recommendation reranking is not bug localization; positional-bias
  findings justify a diagnostic, not an assumed G01 gain.
- RGFL and ARISE use different datasets, models, and end-to-end systems. Their
  reported improvements cannot be compared numerically with G01.
- Multiple permutations multiply prompt tokens and provider calls. Quality,
  latency, and cost must all be reported.
- R43 is exposed and its prefix guard was outcome-selected. It can develop a
  mechanism but cannot confirm it.
- Historical-fix similarity and learned-to-rank methods were not prioritized:
  they alter the information/training boundary and need a separate leakage and
  data-supply analysis.

## Executed retrieval feasibility — r55

The 48-case exposed r55 protocol was executed through its feasibility gates.
JSON mode was supported by `glm-5.3-flash`, but only 26/48 structured
expansions passed the frozen closed-schema and verbatim-copy contract. JSON
mode therefore controls serialization, not application schema adherence.

Pinned CodeRankEmbed also ran correctly offline, but full-universe CPU
retrieval was operationally rejected: the first 80-file/156-window case took
726.252 seconds, while r2b contains 42,106 projected file instances. Because
the expansion gate had already failed and the semantic arm projected to
multiple days, r55 was stopped without label scoring. This is a measured
feasibility rejection, not evidence that CodeRankEmbed lacks ranking value.

The next experiment is a separately frozen bounded semantic-reranking cycle:
the existing ARE/chunk channels retain candidate generation, CodeRankEmbed
scores one deterministic query-matched window for each top-20-union candidate,
and fixed RRF completes the semantic partial ranking with the raw fusion
remainder. Full-universe semantic retrieval remains a GPU or offline-indexing
hypothesis.

## Third external-research pass — 2026-10-05

This pass followed the r55 feasibility stop. It searched for a task-aligned
semantic model that could reuse the already working 137M bi-encoder runtime,
and for later mechanisms that improve evidence supply without returning to an
unbounded full-repository CPU scan.

### F18 — SweRankEmbed-Small is the closest controlled replacement

SweRank formulates software issue localization as retrieve-and-rerank and was
accepted at ICLR 2026. Its released `SweRankEmbed-Small` is a 137M bi-encoder
fine-tuned from CodeRankEmbed on issue/patch data. The model card reports
function localization at 74.45 Func@10 on SWE-bench-Lite and 63.39 Func@15 on
LocBench, compared with 58.76 and 50.89 for its CodeRankEmbed baseline. These
external results do not establish a G01 gain, but the model is unusually useful
for a controlled ablation: it preserves the architecture, query prefix,
normalized dot-product scoring, and 8,192-token capability already exercised
in r55 while changing task alignment.

The weights are CC-BY-NC-4.0. They are admissible for the private research
experiment but not an assumed production dependency. Public or commercial
product integration requires a separate license decision or a permissively
licensed replacement trained with the same issue-localization objective.

Decision: **make SweRankEmbed-Small the primary r56 treatment and retain
CodeRankEmbed as its causal control**. Score both over the identical bounded
candidate windows; do not combine them until their individual effects are
known.

### F19 — Late code chunking belongs after the encoder comparison

Late Code Chunking separates retrieval context from later comprehension
context and uses asymmetric query/chunk sizing. Its ACL 2026 results concern
repository-level code completion rather than fault localization, but its
mechanism directly addresses the continuity loss created by arbitrary fixed
windows.

Decision: retain a deterministic structure-aware context as r57: path,
enclosing declaration signature, and one query-matched body window are scored
as the retrieval representation, while broader neighboring code is supplied
only after selection. Do not add this to r56 because changing both encoder and
representation would destroy causal attribution.

### F20 — Repository memory is valuable but label-sensitive

RepoMem augments LocAgent with commit history, linked issues, and summaries of
actively evolving code. It improved localization on SWE-bench Verified and
SWE-bench Live, and it aligns with ARE's interaction-learning and durable
memory architecture. For historical benchmark repositories, however, a commit
or issue after the failing revision can directly reveal the answer.

Decision: create a separate temporal-memory cycle only after every memory item
is timestamped and filtered to information available before the benchmark
failure. It must not enter r56 and cannot be used for a clean superiority claim
without that temporal boundary.

### F21 — Adaptive parallel search is an engine-level cost mechanism

FuseSearch defines tool efficiency as novel information gain per invocation and
learns to move from broad parallel exploration to focused refinement. Its ACL
2026 evaluation reports fewer turns and tokens alongside stronger localization.
This is relevant to ARE's DAG executor, but it is not a drop-in ranking channel:
the published method depends on a trained 4B search policy and an interactive
tool environment.

Decision: borrow the **measurement contract now**—unique candidates or graph
facts gained per tool call, duplicate-call rate, elapsed time, and tokens—and
test adaptive breadth in a later graph-search cycle. Do not mix it into the
static r56 encoder ablation.

## Recommended r56 experiment

Use the 48 exposed r1+r2b cases so model selection cannot be mistaken for
confirmation. Candidate generation remains the fixed first-occurrence union of
ARE top 10 and raw chunk-BM25 top 10, capped at 20 files. Each file receives one
deterministic query-matched 80-line window, with a 512-token ceiling.

- **A:** fixed `RRF(k=60)` of ARE and raw chunk BM25.
- **B:** A plus bounded CodeRankEmbed, completing its partial ranking with A's
  remainder before fusion.
- **C:** A plus bounded SweRankEmbed-Small under the identical completion rule.

The primary contrast is C-minus-B; C-minus-A establishes whether the imported
technique adds value to ARE. Freeze model revisions, weight hashes, code audit,
candidate/window digests, batching, invalid-case behavior, latency and memory
ceilings, MRR@8/Hit@3/recall@20, and repository-cluster bootstrap gates before
scoring. If C wins prospectively, confirm it on a fresh source-disjoint cohort.
Any resulting claim must say that the pretrained research model has plausible
public-repository training overlap and is non-commercially licensed.

## Executed bounded semantic comparison — r56

R56 sealed and scored all 48 exposed r1+r2b cases under identical top-20
candidate and 80-line-window evidence. SweRankEmbed-Small improved over
CodeRankEmbed: MRR@8 `0.25047` versus `0.21138`, difference `+0.03909`, with a
24-cluster interval `[+0.01230, +0.07788]`. The issue-localization fine-tuning
therefore transferred better than generic CodeRank under the controlled
representation.

It did not improve the established raw ARE/chunk fusion, whose MRR@8 was
`0.26746`. SweRank-minus-raw was `-0.01699`, interval
`[-0.06939, +0.03299]`; the advancement gate failed. Standalone semantic MRR
inside the reachable candidate union was `0.19680` for SweRank versus
`0.08857` for CodeRank, while only 36/48 cases had a gold path in that union.

Decision: retain SweRank as the better diagnostic encoder, reject direct
semantic fusion, and next isolate query representation. FaR-Loc supplies the
relevant mechanism: derive a concise failing-functionality description from
the failed test and stack trace before dense retrieval. R57 should use a plain
text summary contract with a frozen raw-query fallback, keep documents and
candidate generation unchanged, and remain an exposed mechanism experiment.

## Executed functionality-query comparison — r57

The 48-case exposed r57 run completed all provider and source gates. Plain-text
functionality descriptions improved SweRank fusion MRR@8 from `0.25047` to
`0.29995` and Hit@3 from 17/48 to 20/48. The paired cluster interval versus
raw SweRank was `[+0.00298, +0.10809]`.

Against ARE + chunk RRF (`0.26746`), the improvement was only `+0.03249` and
its cluster interval `[-0.01567, +0.08636]` crossed zero. The predeclared
advancement gate failed. The next cheap mechanism diagnostic is fixed fusion
of the already sealed raw and functionality semantic views. In parallel, the
top-20 candidate supply requires work: 12/48 cases were unreachable by any
reranker confined to that union.

## Fourth research-to-benchmark pass — r58–r61

External BLAgent evidence favors independently retrieving from structural and
behavioral descriptions before file-level merging. CE-QE independently argues
that a lexical retriever must receive vocabulary-matched terms before its
candidate set can improve; reranking alone cannot recover an absent document.
Neither paper's reported scores transfer directly to BugsInPy. The local tests
therefore isolated ranking and acquisition mechanisms under fixed source and
label boundaries.

- R58 fixed four-channel raw-plus-functionality semantic fusion failed:
  MRR@8 `0.26915`, below functionality-only `0.29995`, with lower Hit@3 and
  recall@20.
- R59 widened raw rank depth or added directory siblings; candidate reach
  increased from 36/48 to only 39/48 and 38/48, respectively. Both missed
  their four-new-case gate.
- R60 reused the sealed r57 functionality summaries as a second query for
  the unchanged full-repository chunk BM25. Retaining the raw pool and adding
  functionality top-10 files raised at-least-one-gold candidate reach from
  36/48 to **43/48**, with seven new reaches, zero losses, and no more than
  26 candidate files. This arm passed its frozen acquisition gate.
- R61 ranked that expanded pool with fixed three-channel `RRF(k=60)` and
  passed its frozen exposed-development gate: MRR@8 `0.26746→0.37304`,
  Hit@3 `17/48→26/48`, and recall@20 `0.75347→0.86458`. The paired
  24-cluster MRR interval was `[+0.05670, +0.16178]`, with 15/7/2
  wins/ties/losses. No new GLM call was made in r58–r61.

The selected treatment is now the unchanged r61 query/acquisition/ranking
rule. A fresh, source-disjoint transfer with provider and cost receipts is the
next claim gate. The 48 development cases are exposed, so their strong gain is
not itself confirmation or superiority.

## Sources

The exact source list, stable URLs, and borrow decisions are in
[sources.json](sources.json).

## Open questions

- Which gold-blind confidence or agreement rule can preserve raw GLM's Hit@1
  gains without its Hit@3 regressions on r50?
- How much of r43/r44 variation is explained by candidate serialization order?
- Are two deterministic counterbalanced orders sufficient, or is a third
  required for a stable central ranking?
- Does fixed RRF preserve r50's raw Hit@1 gain without its Hit@3 regression?
- If RRF fails, does one Self-Sorting selection call add enough stability to
  justify its cost?
- Can consensus be restricted to graph ranks 5–12 without losing lower-rank
  recoveries?
- What cost ceiling should a prospective R46 protocol impose relative to its
  MRR@8 and Hit@3 gain?
- Does raw-plus-expanded-query RRF improve the exposed BugsInPy cohorts without
  reducing exact-identifier matches?
- Can CodeRankEmbed run within the VPS disk and memory envelope at a pinned,
  audited revision, and what is its measured per-repository indexing cost?
- How much of any CodeRankEmbed gain survives on post-cutoff or private code
  where Stack v2 overlap is implausible?
- Is the current top-20 candidate union already sufficient on r54, or is a
  separately frozen directory-aware expansion branch necessary?
