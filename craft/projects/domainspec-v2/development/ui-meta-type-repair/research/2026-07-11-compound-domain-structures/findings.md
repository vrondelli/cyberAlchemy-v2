---
dispatch_id: 2026-07-11-ui-compound-domain-structures
artifact: findings
status: research-complete
authority: candidate-only
date: 2026-07-11
revised_synthesis: residual-analysis-hypothesis-only
promotion_eligible: false
authority_boundary: no DS-D1 or DS-D8 mutation; no new ontological layer; no promotion
review:
  quine: PASS
  wittgenstein: PASS
  popper: NARROW
---

# Findings: UI Compound Domain Structures

## Direct Answer

Current evidence does **not** justify a new DS-D1 type, a general "compound
domain structure" kind, or a third ontological layer above DS-D1 nodes and
DS-D8 relationships.

It supports a narrower, candidate-only **residual-analysis hypothesis**: for a
bounded specimen, preregister a finite set of observations and existing
explanations, subtract those explanations under fixed rules, and test whether
any remaining residue produces a deterministic usefulness delta.

The eight labels do not share one destination. They must remain separately
routable among:

- atomic DS-D1 type;
- contextual role;
- projection;
- DS-D8 relationship;
- architecture pattern;
- residual hypothesis;
- named instance.

The UI portion of DS-D1 remains deferred, while DS-D8 is active endpoint
authority, not type-formation or category-law authority
(`projects/domainspec-v2/definitions/DEFINITIONS.md:1053-1065,1111-1159`).

## Central Finding

A recurring graph, familiar label, or useful bundle does not establish
identity. The evidence nevertheless leaves a practical question: after
existing explanations are applied, does a finite residue remain that changes a
downstream decision?

For a bounded specimen \(X\), define:

\[
H(X)=(G,A,Q,R,S,D,U)
\]

| Element | Fixed meaning |
| --- | --- |
| \(G\) | A finite observed graph: bounded artifacts, declared boundaries, literal behaviors, and active DS-D8-admissible edges. DS-D8 participation does not establish DS-D1 identity. |
| \(A\) | A finite, preregistered set of existing explanations: atomic type, contextual role, projection, DS-D8 relationship, architecture pattern, or named instance. Each explanation declares exactly which observables it can explain and by what rule. |
| \(Q\) | A finite set of preregistered observables, including boundary, invariant, lifecycle, substitution, failure, and downstream-decision observations. |
| \(R\) | The residue after applying \(A\) to \(Q\) through a finite subtraction map fixed before evaluation. |
| \(S\) | Preregistered permitted and identity-breaking substitutions, with predicted observable consequences. "Identity-breaking" here names a test mutation, not proven ontological identity. |
| \(D\) | A deterministic usefulness delta between the existing-explanation baseline and use of the residual hypothesis, measured only in fixed validation, decomposition, generation, testing, ownership, or execution decisions. |
| \(U\) | Explicit uncertainty: missing observations, corpus limits, competing explanations, untested substitutions, and portability not demonstrated. |

Before examining outcomes, freeze finite predicates

\[
\sigma_a:Q\rightarrow\{\text{explained},\text{not-explained}\}
\quad\text{for every }a\in A
\]

and compute

\[
R=\{q\in Q\mid \forall a\in A,\ \sigma_a(q)=\text{not-explained}\}.
\]

Neither \(A\), \(Q\), nor the subtraction predicates may be expanded or
rewritten after evaluation begins. This satisfies Popper's requirement that
the path from preregistered \(Q\), through finite preregistered \(A\), into
\(R\) be finite and fixed.

A nonempty \(R\) means only that the registered explanations did not account
for every registered observation. It does **not** imply identity,
irreducibility, portability, a new kind, or promotion eligibility.

### Dissent And Convergence

The explorer record preserves real dissent. Fong proposed a third layer and
treated Page and Layout as the strongest compound candidates
(`projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-compound-domain-structures/research.md:160-172`).
Alexander found that none of the eight labels met a governed compound-kind
standard
(`projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-compound-domain-structures/research.md:184-205,228-254`).
Simon, Turing, and Ashby further separated roles, patterns, projections,
durable records, and locally significant structures
(`projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-compound-domain-structures/research.md:347-374,412-438,517-556`).

The final convergence is narrower: Quine and Wittgenstein pass the
residual-analysis framing; Popper narrows it through fixed finite subtraction,
evidence-bounded rejection language, and disjoint outcome triggers.

## Verdict Matrix

| Label | Current analytical destination | Evidence-bounded verdict |
| --- | --- | --- |
| **Page** | Contextual composition-root role; unreplicated architecture-pattern pressure | The Savvy specimen coordinates state, persistence, guard invocation, and screen selection, but lacks an independently replicated route/content identity witness (`projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515,571-710`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`). It is neither an established pattern nor an admitted type. |
| **Layout** | Contextual shell role; unreplicated architecture-pattern pressure | A reusable shell and content-slot law is documented, but the observed specimen does not establish finite slots, Page targets, or content exclusion (`implementation/domainspec/architecture/pattern-library/concepts/ui/layout.md:3-34`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:18`). |
| **Component** | Framework-local visual-unit role or narrow fallback candidate | React componenthood and nesting do not establish a general kind. The umbrella meaning is rejected, and no non-framework identity witness is replicated (`projects/domainspec-v2/development/ui-meta-type-formalization/adjudication/VERDICT-MATRIX.md:14`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:19`). Component is not admitted as a general kind by current evidence. |
| **Hook** | Framework/reactive role | The observed `useHasMounted` delegates to `useSyncExternalStore`; current evidence does not establish an independently owned, framework-neutral lifecycle contract (`projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:392-411`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:21`). Hook is not admitted as a general kind. |
| **Guard** | Gate role; projection only when separate Rule authority is evidenced | `guardStep` has finite allow/reroute behavior, but the specimen does not attest a separate authoritative Rule (`projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126-162`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:24`). DS-D8 permits `protects` and `mirrors`, but `mirrors` requires a Rule endpoint and does not transfer Rule authority (`projects/domainspec-v2/definitions/relationships/relationships.yml:372-385,484-497`). |
| **Binding** | Split by meaning: DS-D8 relationship when edge-only; possible durable-record candidate when independently persisted | The observed auth call is an inline operation without a durable endpoint/mapping/cache/invalidation record (`projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-login.tsx:40-77`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:25`). The durable-record formulation remains experimental and unreplicated (`projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/binding/binding.md:15-38,53-60`). |
| **Importer** | Boundary-adapter or workflow role; otherwise named instance | `Arcanum Importer` is a named architecture component with read-only and provenance obligations, not evidence for a general kind (`implementation/domainspec/docs/features/domainspec-arcanum-superset/ARCHITECTURE.md:113-120,198-208`). Without stable source-to-output crossing laws, substitutions, and consequences across specimens, Importer remains a role or named instance. |
| **Processor** | Pipeline/operation role or named instance | The GoldenQuill fabrication gate has deterministic local obligations and fixed execution placement, but those facts identify that gate, not a general Processor kind (`projects/goldenquill/pipeline/logician/gates/f_extractor_fabrication.py:80-185,321-351`; `projects/goldenquill/pipeline/orchestrator/seats/intake.py:1411-1465`). Processor is not admitted as a general kind. |

"Not admitted as a general kind" means **not admitted by current evidence**. It
does not assert universal impossibility.

## Usefulness Versus Identity

The residual hypothesis is useful only if \(D\) is nonzero and reproducible.
For example, it may reveal that an existing role description omits a testable
sequencing obligation, or that a named instance needs an architecture-pattern
card. That can improve decomposition, tests, ownership, or execution without
changing ontology.

The following implications are forbidden:

\[
R\neq\varnothing \not\Rightarrow \text{identity}
\]

\[
R\neq\varnothing \not\Rightarrow \text{irreducibility}
\]

\[
R\neq\varnothing \not\Rightarrow \text{portability}
\]

Likewise, active DS-D8 edges such as `renders`, `wraps`, `composes`,
`consumes`, `protects`, `fetches`, `mutates`, and `mirrors` establish only
finite endpoint admissibility
(`projects/domainspec-v2/definitions/relationships/relationships.yml:276-337,372-433,484-497`).
They do not prove that their endpoints possess independently formed DS-D1
identities.

## Rejected Alternatives And Typed Negatives

| ID | Rejected claim |
| --- | --- |
| TN-01 | Add "compound domain structure" as a new ontological layer. |
| TN-02 | Treat a recurrent graph motif, label, filename, or framework convention as identity evidence. |
| TN-03 | Treat Page or Layout as an established architecture pattern; current evidence shows only unreplicated pattern pressure. |
| TN-04 | Admit Component, Hook, or Processor as general kinds from current evidence. |
| TN-05 | Let Guard own authorization or Rule authority; projection requires a separately authoritative Rule. |
| TN-06 | Give Binding one universal interpretation; edge-only and durable-record meanings must remain split. |
| TN-07 | Infer a general Importer kind from a named architecture component or delegated UI workflow. |
| TN-08 | Treat DS-D8 endpoint participation as DS-D1 formation authority. |
| TN-09 | Treat nonempty residue as proof of identity, irreducibility, portability, or promotion readiness. |
| TN-10 | Treat "rejected as a general kind" as universal impossibility rather than current-evidence non-admission. |
| TN-11 | Repair a failed residual test by adding explanations or observables after evaluation begins. |
| TN-12 | Use recurrence, scoring, or authored shape to compensate for a missing deterministic usefulness delta. |

## Three-Fixture Calibration Experiment

The smallest useful calibration uses one likely residual lead, one collapse
control, and one disputed case:

| Fixture | Purpose | Bounded evidence |
| --- | --- | --- |
| **F1: GoldenQuill fabrication gate** | Test whether sequencing, closed failure behavior, and pre-queue placement leave useful residue after existing Rule, Operation, Workflow, architecture-pattern, and named-instance explanations are applied. | `projects/goldenquill/pipeline/logician/gates/f_extractor_fabrication.py:80-185,321-351`; `projects/goldenquill/pipeline/orchestrator/seats/intake.py:1411-1465`; `projects/goldenquill/tests/logician/gates/test_f_extractor_fabrication.py:110-149`. |
| **F2: Savvy `useHasMounted`** | Collapse control: test whether framework/reactive-role explanations fully account for the specimen. | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:392-411`. |
| **F3: Savvy `Page`** | Disputed calibration: test whether orchestration observations leave useful residue after composition-root role, DS-D8 edges, architecture-pattern pressure, and named-instance explanations. | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515,571-710`; `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`. |

For each fixture, preregister the same finite observation classes: boundary,
boundary-owned invariant, lifecycle, one permitted substitution, one breaking
substitution, failure consequence, and downstream decision. Freeze \(A\),
\(Q\), subtraction predicates, \(S\), and the computation of \(D\) before
evaluation.

Apply this ordered, mutually exclusive outcome procedure:

1. **INSUFFICIENT-EVIDENCE**: at least one required observation, explanation
   predicate, substitution result, or usefulness measurement is unavailable or
   indeterminate.
2. **EXPLAINED**: evidence is complete and \(R=\varnothing\).
3. **RUBRIC-FAIL**: evidence is complete, \(R\neq\varnothing\), but at least one
   required residual condition fails: no boundary-owned invariant remains, no
   permitted/breaking substitution pair has its preregistered consequence, or
   \(D\) is zero or nondeterministic.
4. **RESIDUAL-SUPPORTED**: evidence is complete, \(R\neq\varnothing\), every
   residual condition passes, and \(D\) is deterministic and nonzero.

`RUBRIC-FAIL` is therefore distinct from `EXPLAINED`: it requires nonempty
residue. It is distinct from `INSUFFICIENT-EVIDENCE`: it requires complete
evaluable evidence. `RESIDUAL-SUPPORTED` supports only continued use of
\(H\); it does not establish a kind or authorize promotion.

## Governance Consequence And Next Route

This research closes with no authority mutation:

- no new DS-D1 type;
- no compound layer;
- no DS-D8 change;
- no candidate-status change;
- no validator change;
- no promotion.

The next route is `invoke` to author a candidate-only experiment package for
the three fixtures. Its source contract must freeze \(G,A,Q,S,D\), the
subtraction predicates, uncertainty fields, evidence selectors, and the
four-outcome decision procedure before execution. The experiment may recommend
an existing destination, continued residual research, or a bounded
`decision-gate`; it may not propose canonical promotion directly.

Any later DS-D1 formation claim must return to the DS-D1 owner with independent
positives, stable contrast, erasure tests, changed downstream consequence,
closed negatives, portability evidence, and an owner firewall
(`projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-findings-repair-architecture/findings.md:140-158`).
Any new or changed relationship remains separately owned by DS-D8.
