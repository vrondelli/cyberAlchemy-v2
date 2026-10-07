# G01 external research: test-mediated and structural retrieval — 2026-10-05

Status: bounded research candidate. Authority effect: none. No benchmark treatment,
claim gate, or product behavior changes here.

## Local problem

The fixed r61 functionality-query rule improved MRR@8 from 0.26746 to 0.37304
on 48 **exposed** BugsInPy cases. Its separate r63 BugSwarm Python diagnostic
improved 0.10417 to 0.14583 on 16 **exposed** admissible cases, but the paired
repository-bootstrap interval was [0, 0.09375], with 13 ties. R62 itself
failed its frozen all-17 label-admission gate before quality scoring. None of
these results establish superiority.

Local evidence:

- `implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-functionality-rank-r61/RESULT.md`
- `implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-bugswarm-functionality-transfer-r62/RESULT.md`
- `implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-bugswarm-functionality-diagnostic-r63/RESULT.md`

## External findings and fit

1. [IssueExec](https://arxiv.org/html/2607.17286v1) uses relevant tests as an
   intermediate between a behavioral issue and implementation, then analyzes
   execution traces hierarchically. Its study reports benefits on SWE-bench
   Lite, but its methodology requires runnable tests and coverage. The paper
   also identifies missing coverage and deep, noisy call chains as failure
   modes. **Inference for ARE:** a cheap *static* first ablation can map
   authenticated failure-log test names and stack frames to source files via
   imports, references, and existing repository graph edges. This borrows the
   test-to-code hypothesis, not IssueExec's validated dynamic method or result.

2. [Agent Retrieval Bench](https://arxiv.org/html/2607.24882v1) offers a
   relevant `trace2code` task and frozen base-commit corpora. It reports
   complementary lexical, structural RepoMap, and embedding behavior; no
   family wins uniformly. Its natural no-gold cases also show that simple
   retrieval-score thresholds are poor abstention signals. **Inference for
   ARE:** use `trace2code` as an independent retrieval check, and preserve
   raw/functionality/structural channels separately before fixed fusion.
   Do not equate its labels or metrics with BugsInPy/BugSwarm G01.

3. [CORE-Bench](https://arxiv.org/abs/2606.11864) distinguishes ordinary
   code search from issue-to-edit and broader-context retrieval. It is a
   useful later external-validity check, but its broad dataset is not a
   substitute for a fresh, repository-disjoint G01 confirmation.

4. [FaR-Loc](https://arxiv.org/abs/2509.20552) combines functionality
   extraction, semantic retrieval, and LLM reranking. R61 already tests a
   lower-cost functionality-query analogue. Its published Defects4J gains
   cannot be transferred numerically to G01. The remaining distinct lever is
   semantic candidate acquisition, not repeating the same query-generation
   experiment.

## Existing test-edge evidence and next experiment

**Correction after checking the complete local G01 history:** static
test-to-code import traversal was already tested on a 24-case exposed BugSwarm
development cohort. Its r3 treatment improved top-30 gold reach 17/24→21/24
but reduced MRR@8 0.43234→0.34142 against graph r2, failing its frozen gate.
The subsequent r4 union selector failed response validity; r5 passed response
validity but failed its advancement gate. A second development cohort saw only
one additional reachable case and lower direct MRR. Repeating this static
bridge on the same exposed evidence is **not** the next experiment. See:

- `implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-BUGSWARM-GRAPH-DEV-R3-TEST-EDGE-RESULT-2026-10-04.md`
- `implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-BUGSWARM-GRAPH-DEV-R4-UNION-SELECTOR-RESULT-2026-10-04.md`
- `implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-BUGSWARM-GRAPH-DEV-R5-NORMALIZED-SELECTOR-RESULT-2026-10-04.md`

The immediate claim-path experiment is now a **fresh, repository-disjoint,
pre-label-screened transfer of unchanged r61**. Screen failed-source gold-file
existence in evaluator isolation before provider spend, freeze the population
and r61 rule, then make and seal the same raw/functionality rankings before
quality labels open. This tests whether the promising 48-case development gain
generalizes; r63's 16 exposed cases cannot serve as confirmation.

IssueExec's *dynamic* test-coverage/trace hierarchy remains a distinct
technique candidate if that transfer fails specifically on candidate reach.
It needs its own environment-reproduction feasibility gate and must not inherit
the paper's results as an ARE claim. Dense embeddings are also separate: model
provenance, pretraining overlap, memory, and operational cost must be assessed
before they enter a claim path.

## Open questions

- Can dynamic execution traces recover targets missed by the already-tested
  static test edge without giving up early-rank precision?
- Is there enough fresh, source-admissible, repository-disjoint supply for a
  paired confirmation, and which external task best tests generalization?
