# External localization techniques for the next ARE evolution experiments

Status, 2026-10-04: research candidates only. No integration, GLM call, new
benchmark score, or claim admission follows from this note.

## Why these techniques fit the measured gaps

The private [G01 fresh result](G01-BUGSWARM-FRESH-R25-RESULT-2026-10-04.md)
shows strong GLM listwise accuracy on a fixed 8K candidate packet (MRR@8
0.724 versus graph-r2 0.531), but 89,883 generation tokens and an unmeasured
end-to-end cost. The fixed candidate list missed gold in one of 24 cases.
The [G02 exposed coverage screen](G02-R11-TWO-HOP-IMPORT-COVERAGE-EXPOSED-2026-10-04.md)
found only two new missed-gold files among 11,441 second-hop Python import
placements. These are different problems: G01 needs a cheaper or better
selection policy and a candidate-recall check; G02 needs selective acquisition
of previously unread relevant files.

## Candidate A — report-aware query reformulation (G01 and G02)

[BLIZZARD, from its authors](https://clones.usask.ca/pubfiles/articles/RahmanFSE2018BLIZZARD.pdf)
classifies bug reports by their information type and reformulates retrieval
queries instead of treating a full report or stack trace as one noisy query.
The newer [IQLoc author paper](https://www.sciencedirect.com/science/article/pii/S0164121226000932)
also evaluates semantics-driven query reduction on bug reports, including
stack-trace and code-element strata. Their reported gains are on their own
corpora, not ARE.

ARE hypothesis: deterministically separate exception/file/symbol names,
test-failure lines, and natural-language symptoms in the *already available*
task input. Generate a small fixed set of retrieval queries, then fuse
candidate ranks. The original [reciprocal rank fusion paper](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)
supplies a simple score-free fusion baseline. This is a cheap, model-free
ablation before adding another GLM chooser. The first screen must measure
candidate gold reach, MRR@8, number of files/source bytes read, and time,
with no gold-derived terms in query construction.

## Candidate B — issue-anchored semantic navigation (G02)

The [Language Server Protocol specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)
defines definition, references, implementation and call-hierarchy requests
on exact document positions. Use these only when an issue cue or an ARE-read
source span names a specific symbol; record the seed location, relation,
resolved target, confidence, and proposed read window. If no reliable anchor
or resolution exists, abstain. This is distinct from the rejected unfiltered
two-hop import expansion. The earlier [SemNav review](G02-ISSUE-LOCALIZATION-RESEARCH-2026-10-03.md)
motivates an explicit evidence workspace, but neither its preprint results nor
LSP protocol support establish that a particular language server will resolve
G02's repositories accurately or cheaply.

First gate: on exposed G02 tasks, measure *new* gold files per additional
read, non-gold reads, unresolved/incorrect edges, File-/Span-F1, token/time
cost, and abstention. A source-only anchor extractor and a language-server
arm should be separate ablations. Only a frozen policy may transfer to an
untouched, matched DSH cohort.

## Candidate C — selective expensive reranking (G01 efficiency)

[Self-RAG](https://arxiv.org/abs/2310.11511) demonstrates the general
principle that retrieval should be conditional, not automatic, in a different
QA setting. For ARE, test a much simpler, deterministic gate: run the cheap
graph ranking first and request GLM listwise selection only when a sealed
ambiguity signal predicts that it may help. This is a *new hypothesis*, not
an implementation of Self-RAG or evidence that confidence gating works for
bug localization. A false skip could erase G01's accuracy gain.

The exposed development gate should compare MRR@8, paired wins/losses,
selection-call rate, generation tokens, and end-to-end latency against
always-GLM and graph-only. Freeze the signal and threshold before an
untouched cohort; do not tune it on G01 r11 labels and then call r11 fresh.

## Priority and claim boundary

1. Start with **B** as the G02 acquisition experiment; it directly addresses
   the observed recall failure and has an explicit abstention path.
2. Run **A** as a low-cost retrieval ablation for G01/G02, with rank fusion
   compared against the existing graph baseline.
3. Pursue **C** only after the current G01 result receives independent
   review; its target is efficiency at retained accuracy, not a stronger
   accuracy claim by itself.

No external model weights need be downloaded for these first variants.
Published benchmark gains, training-set overlap, license terms, language-
server completeness, and VPS resource use remain separate checks. The
private G01 result still needs Vlad and Dave's review; broad product
superiority remains unproven.

The first source-only implementation of B has now been
[screened on exposed G02 Python cases](G02-R11-ISSUE-SYMBOL-NAVIGATION-EXPOSED-2026-10-04.md).
Its exact issue-name/definition rule proposed nine files and hit zero missed
gold; it is rejected. This does not validate an LSP arm. Further semantic
navigation needs a different relation-specific anchor with a new frozen
source policy before any fresh run.

## Open Questions

- Which exact issue/source anchors and language-server implementations work
  across the G02 language strata without hidden gold or excessive setup cost?
- Can report-aware query variants improve candidate reach or ranking on
  untouched cases rather than only the exposed development set?
- Is there an ambiguity signal that reduces G01 GLM calls while preserving
  the independently reviewed accuracy margin and measuring full workflow cost?
