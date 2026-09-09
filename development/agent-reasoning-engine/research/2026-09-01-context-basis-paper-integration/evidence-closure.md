# Evidence closure

**Dispatch:** `2026-09-01-are-context-basis-paper-integration`  
**Evidence contract:** exact-binding  
**Handoff verdict:** `ready` for a findings writer  
**Authority effect:** none

## Exact upstream package

| Artifact | SHA-256 | Size |
|---|---|---:|
| `research.md` | `37d9d9cfc4ca7be212f9f93ada74e4c077ad6599eab33cd9be30da732ee1662f` | 54348 |
| `synthesis.md` | `4c93dd99a04cf71d7cdfb8877dfa3cfff2e7571e7f5fde273f7d789a9834dfeb` | 10935 |
| `review-round-1.md` | `9a8f51c3463d52c02f32451ffa2fec8049946427694c9f1f96d09d01b170aab9` | 3936 |
| `synthesis-round-2.md` | `ca3c42a46fa81b864d0cb4ae827a87fb086f49d6737f849dbb638bea1d8991ec` | 6039 |

`synthesis-round-2.md` supersedes conflicting claims in `synthesis.md`. All three reviewers returned PASS after the bounded repair loop. Their PASS establishes evidence classification, non-vacuity demotion, and definitional separation only.

## Claim closure matrix

| Finding family | Source binding | Reviewer disposition | Writer state |
|---|---|---|---|
| Yu hierarchy, hybrid memory, access, visibility, and conflict questions | `research.md`, first explorer memo; arXiv:2603.10062v2 §§3–6 | precedent PASS after classified as `paper_position` | `candidate vocabulary` |
| Dadhich lifecycle, scope, anticipation, compaction, and evaluation limitations | `research.md`, second explorer memo; arXiv:2607.21503v1 §§2–6, Apps. A–D | precedent PASS after Synap claims classified separately | `candidate vocabulary`; product results not ARE evidence |
| Local request→preflight→closure→lock→basis→view→strategy invariant | `research.md`, Tarski memo; exact Context Basis and ontology selectors | definitional PASS | `local_owned_candidate` |
| Selector-bound context lifecycle integration | `synthesis-round-2.md` thesis and operation model | PASS across all reviewers | `integration_inference`, `local_witness=none` |
| Definition closure completeness | OPEN-001 exact source selector | non-vacuity and precedent PASS only after demotion | `not_evaluable` |
| Selector-lock sufficiency | OPEN-002 exact source selector | non-vacuity and precedent PASS only after demotion | `not_evaluable` |
| View identity/reuse | OPEN-003 exact source selector | definitional/precedent PASS with both alternatives preserved | `owner_decision_required` |
| Predecision routing fixtures | `synthesis-round-2.md`, fixture boundary | non-vacuity PASS as unexecuted exact-input design | `candidate experiment` |
| Closure, selector, compaction, causal, leakage, and context-rot fixtures | `review-round-1.md`; `synthesis-round-2.md` | non-vacuity PASS as unexecuted or predecessor-blocked designs | `candidate` or `not_evaluable` as specified |
| Latency, savings, fidelity, consistency, isolation, context rot, warm/cold equivalence, production readiness | papers plus reviewer defects | PASS only after explicit rejection of any positive claim | `killed until witnessed` |
| Python ontology runtime as enforcement | AGENTS suspension; round-2 explicit invariant | definitional PASS | `killed` |
| Retrieval, cache, provenance, consensus, publication, or reasoning as authority | local Advice-Not-Permission and Codex preflight boundaries | definitional PASS | `killed` |

## Writer obligations

- Write `findings.md` only.
- Present the practical contribution of each paper and the joined candidate without implying adoption.
- Include the exact operation and authority separations.
- Preserve OPEN-001, OPEN-002, and OPEN-003 as owner decisions.
- Separate predecision plumbing experiments from semantic experiments that remain `not_evaluable`.
- State explicitly that no fixture ran and no performance, fidelity, consistency, isolation, context-rot, conformance, or implementation claim exists.
- Include the final reviewer verdict matrix and claim ceiling.

## Closure result

The source, synthesis, and reviewer bindings are complete enough to write a bounded research result. Missing runtime witnesses are not omitted; they are typed as `candidate`, `not_evaluable`, `killed`, or `owner_decision_required`. Therefore the writer handoff is `ready`.
