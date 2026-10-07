# G02 acquisition research after r11 source-only rejections

Status, 2026-10-03: **research direction, not an implemented policy or
benchmark result**.

The sealed r11 same-directory pool covers seven of 22 files ARE failed to
read, but its two independent source-only top-three orderings both lose
additive File-F1. The [filename rank](G02-R11-SAME-DIRECTORY-NAME-RANK-EXPOSED-2026-10-03.md)
found 1/22 new-gold proposals; the [declaration-link rank](G02-R11-SAME-DIRECTORY-DECLARATION-LINKS-EXPOSED-2026-10-03.md)
found 3/36. The latter's relevant hits were on exposed tasks 3, 4 and 7,
but irrelevant task 5 had a higher maximum link score than tasks 3 and 4.
Thus a simple threshold on this score cannot retain all three hit tasks
while excluding that clear false-positive task. This is an inference from
the sealed source scores and evaluator-only counts, not a new score test.

Primary external methods offer a more substantial next hypothesis:

- [Agentless's own SWE-bench procedure](https://github.com/OpenAutoCoder/Agentless/blob/main/README_swebench.md)
  first combines model and retrieval candidates at file level, then
  localizes related code elements and fine-grained locations. It explicitly
  bounds the combined suspicious-file list to a top-three stage. This is a
  workflow precedent, **not** evidence that copying its method improves ARE.
- [LocAgent's authors' repository](https://github.com/gersteinlab/LocAgent)
  describes a heterogeneous repository graph and multi-hop search over
  code structure and dependencies. Its repository is Apache-2.0, but its
  published performance belongs to its own datasets/models; ARE has not
  reproduced it. A bounded graph exploration from ARE-delivered evidence
  is a candidate mechanism to test locally.
- [Salesforce's SweRankEmbed-Small model card](https://huggingface.co/Salesforce/SweRankEmbed-Small)
  reports a 137M issue-to-code retriever trained on public Python GitHub
  issues. It is useful evidence that issue localization differs from
  generic code retrieval, but the listed **CC-BY-NC-4.0** license and
  potential overlap with public issue-based benchmark data preclude
  silently adopting its weights for a product superiority campaign.
  Neither license clearance nor a contamination audit has occurred.

Next experimental design: generate a source-only bounded candidate graph
from existing ARE reads and task issue text; choose a small file set using
both issue relevance and a named relation to already delivered code;
identify the linked code element and a proposed read window before any
model call. Freeze the generator and read budget, then audit acquisition
precision on exposed development. Only if it meets a predeclared quality
and cost gate should it be delivered through ARE on an untouched matched
cohort. The failure of the two broad top-three orderings argues against
another GLM chooser over the unchanged 1,266-file pool.

No source or external model has been downloaded, no GLM call was made, and
no new native score or superiority estimate follows from this note.

## 2026-10-04 task-specific retriever screen

The [octodex-v1 author model card](https://huggingface.co/robot-octopus/octodex-v1/blob/6803aca0d3a0ced4a2a1bde0c21941a10d98df0e/README.md)
describes an Apache-2.0 issue-to-code embedding model, but reports training
on 21,302 SWE-bench train/test instances and evaluation on SWE-bench Verified.
G02 r11 includes SWE-bench Verified-derived tasks. This is a **corpus-level
contamination risk**, not proof that any exact r11 instance was in training;
an exact ID/training-triple exclusion audit would be required before treating
such a model as independent G02 claim evidence. The card says SWE-bench Pro
was excluded from training and reports no repository overlap with its Pro
instances, but that author claim is not an audit of G02's exact cohort.

The same card lists a roughly 1.4 GB self-contained INT8 ONNX artifact and a
2B-parameter base model. A 2026-10-04 read-only VPS check found about 1.06 GB
`MemAvailable` and 1.67 GB free on the root filesystem. Downloading or
loading this artifact there is not a safe near-term G02 qualification step.
Neither model nor weights were downloaded. **Decision for this development
frontier:** do not use octodex-v1 on the existing G02 cohort; prioritize a
source-grounded, budgeted acquisition policy or a separately defined and
audited independent population. Its published retrieval figures are not ARE
scores and cannot support an ARE-versus-DSH claim.

## Open Questions

- Which language-specific graph edges can be extracted reliably from the
  four r11 repository strata within the source/read-time budget?
- What prospective precision and abstention gate should precede live reads?
- Can any candidate transfer to untouched tasks without evaluator leakage,
  label contamination, or a noncommercial model dependency?
- If a learned retriever is reconsidered, can exact training-instance and
  repository overlap be ruled out, and can its inference artifact meet VPS
  memory/storage reserves without displacing retained evidence?

## 2026-10-04 external-technique review — evidence-backed navigation

The recent [SemNav preprint](https://arxiv.org/html/2609.31176v1) describes a
two-stage issue-localization loop: deterministic initial retrieval, then
navigation over source relations with an explicit candidate workspace that
stores evidence for each revision. Its relation graph resolves uncertain edges
on demand through a language server, and its compact semantic cards keep the
source spans visible. The authors report higher File Hit@10 on their own
SWE-bench Lite/PLocBench experiments, but those figures are **not** ARE
evidence; this is a recent preprint, not an independently replicated ARE
mechanism. [SweRank+](https://arxiv.org/abs/2512.20482) separately motivates
multi-turn retrieval plus listwise reranking, but adopting its trained model
would add training-overlap, license and inference-resource questions. The
[SBEST study](https://arxiv.org/abs/2405.00565) supplies a complementary
test-failure idea: use stack-trace proximity with source/coverage relations.
Its reported MRR gain is on a different dataset and must not be transferred
to BugSwarm or G02.

**Recommended local hypothesis:** add a bounded, source-grounded navigation
*candidate-acquisition* arm to G02. Seed it with the current ARE retrieval and
issue cues; expand only typed, resolvable relations from already delivered
entities; record each new file with its relation, source location, issue cue,
read window and cost. Permit abstention when no such evidence exists. This
tests whether the 22 previously unread relevant files can be reached without
the false positives seen in r11's broad top-three pools. Build the first
variant from source-only static relations; treat language-server resolution
and GLM-generated cards as later, separately costed ablations. Preserve the
existing read budget or state an explicit new budget before scoring.

Development gate: seal the mechanism and predictions before evaluator labels,
then report newly reached gold files, non-gold reads, File-/Span-F1 and
token/time overhead on exposed cases. Fresh transfer requires a new untouched
cohort and unchanged matched DSH comparator. Do not modify G01 r22's frozen
packets, combine exposed development with fresh scores, or infer any product
superiority from the cited papers.

### Open Questions for this hypothesis

- Which typed source relations resolve reliably in the G02 language strata?
- Does bounded expansion increase gold-file reach without erasing quality or
  cost gains through irrelevant reads?
- Does a source-only workspace suffice, or does on-demand semantic resolution
  materially improve fresh transfer?

The first [two-hop Python import coverage screen](G02-R11-TWO-HOP-IMPORT-COVERAGE-EXPOSED-2026-10-04.md)
then tested a cheap part of this idea without gold in its source graph. It
found only **two** missed gold files beyond the prior relation union in
**11,441** second-hop candidate placements; one-hop added none beyond the
union. Therefore unfiltered import expansion is rejected. The next test, if
pursued, must resolve *specific issue-anchored relations* on demand and
demonstrate selective abstention, rather than presenting a larger pool to
another chooser. This is exposed coverage evidence only, not native quality
or a fresh G02 improvement.
