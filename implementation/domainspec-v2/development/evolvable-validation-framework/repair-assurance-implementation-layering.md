---
title: Property-to-Repair Assurance Implementation Layering
status: planning-candidate
updatedAt: 2026-09-12
owner: CyberAlchemy v2 product owner (proposed coordination; assignments unconfirmed)
scope: workflow
authority_effect: none
---

# Property-to-Repair Assurance Implementation Layering

## Objective and boundary

Make the existing TDE/EVF property-to-repair workflow reproducible by a reviewer
and reusable on a second implementation. The proposed eventual service delivers
a scoped assessment, any confirmed defect, an optional repair, and evidence of
the repair's behavior within explicitly declared bounds.

This is an additive planning candidate, not a registered Goal, admitted work
pack, implementation instruction, or authorization to execute providers or
contact customers. The repository PLAN route reports Goals validation blocked;
this document is not registered as admitted execution state.

The layer numbers below describe this workflow's progression. They do not
rename or supersede the existing TDE/EVF L0-L4 provider-layer plan.

## Evidence basis

- [Existing provider layering](implementation-layering.md): implemented L0-L2
  candidates and recorded bounded Souffle/Alloy and degraded-evidence results.
- [Original CRABS finding](crabs-convergence-audit-candidate-v1/FINDINGS.md)
  and [stored result](crabs-convergence-audit-candidate-v1/evidence/result-summary.json).
- [CRABS repair findings](crabs-convergence-repair-candidate-v1/FINDINGS.md)
  and [stored result](crabs-convergence-repair-candidate-v1/evidence/result-summary.json).
- [48-case package](crabs-partial-knowledge-move-candidate-v1/README.md)
  and [readiness report](crabs-partial-knowledge-move-candidate-v1/construction/readiness-audit/WORK-PACK-READINESS-REPORT.md).
- [TDE guide](../../current-candidate-v9/impl/test-derivation-engine/COMPLETE-GUIDE.md).
- [Financial-settlement evidence](../../current-candidate-v9/impl/spec/features/financial-settlement/sfol/adoption/adoption-report.json).

These sources were inspected for planning. Historical results are not fresh
provider runs or independently revalidated receipts. CRABS already supplies a
minimum bounded defect-and-repair example; reuse and requalify it rather than
restart discovery or declare all existing mechanisms unimplemented.

The L0/L1 construction unit was completed on 2026-09-12 in
[crabs-replay-review-v1/COMPLETION.md](crabs-replay-review-v1/COMPLETION.md).
The [successor expansion plan](repair-assurance-expansion-plan-v1/README.md)
now owns L2 falsification, the 48-case experiment, L3 financial-settlement
transfer and L4 service-candidate packaging.

## Proposed assessment contract

| Stage | Required output | Responsible role | Review condition |
| --- | --- | --- | --- |
| Define the property | Domain statement, formal/checkable obligation, intended observations, assumptions, exclusions and bound | Domain owner with verification engineer | Confirm that the property expresses intended behavior and admits meaningful positive cases |
| Bind the implementation | Exact revision, selected code, configuration, dependencies, harness and tool identities | Verification engineer | Show where each observation reaches actual implementation behavior; document modeled dependencies |
| Seek a counterexample | Reproducer or typed inconclusive/no-counterexample result, resource use and raw output | Evidence producer | A tool failure is not an implementation counterexample |
| Explain the defect | Minimized witness, root cause, violated property, plausible impact and demonstrated reachability | Reviewing engineer | Distinguish demonstrated behavior from inferred downstream impact |
| Construct a repair | Isolated patch and rationale tied to the defect | Repair engineer | Preserve the frozen property and identify effects on neighboring behavior |
| Verify the repair | Original witness replay, bounded check, relevant regressions and unchanged exclusions | Reviewer and EVF verifier | Compare original and repaired bytes under equivalent obligations and bounds |
| Deliver | Assessment report, evidence manifest, reproduction instructions and unresolved questions | Assessment lead | State the strongest earned conclusion; customer acceptance remains separate |

TDE retains ownership of supported neutral derivation. A manually authored
property must be labeled as such; it must not be presented as TDE-derived.
EVF retains evidence binding, normalization, comparability and bounded joins.
AI may propose properties, harnesses, explanations and patches; model output
alone is not evidence that the implementation satisfies a property.

Finding a defect is not guaranteed. A valid engagement can conclude
counterexample found, no counterexample within bounds, inconclusive, or
conflicting evidence. Use existing route-specific status vocabularies without
silently equating their meanings. Repair work is conditional on a confirmed
defect and a separately selected change scope.

## Layering method

Each layer ends when its evidence unlocks the next decision. Weigh that value
against implementation effort, verification cost and coordination. Additional
tool families, larger bounds or interface polish belong in the current layer
only when they answer its decision question more effectively than the next
bounded step. Preserve all earlier evidence and guarantees.

## Layer decision table

| Layer | Decision question | Minimum unit and outcome | Risk reduced / principal cost | Exit and next decision |
| --- | --- | --- | --- | --- |
| L0: qualify the existing example | After this layer, we know whether the stored CRABS defect and repair remain reproducible on their exact inputs. | One original/repair pair and a reviewed property-to-code mapping | Stale or overclaimed baseline; environment and harness review | Fresh defect witness plus repaired bounded result; proceed, repair reproducibility, or stop the claim |
| L1: independent replay | After this layer, we know whether a reviewer can reproduce and interpret the result without the original conversation. | One self-contained private replay package and reviewer report | Hidden setup and author assumptions; packaging and reviewer time | A different operator reproduces both results and identifies the same scope limits; proceed or fix the package |
| L2: falsification and repair depth | After this layer, we know whether misleading evidence or a superficial repair can be detected within the declared controls. | Adapt existing integrity controls to this route; add selected behavioral stress cases | False success and narrow patch overfit; harness, sanitizer and solver time | Every selected negative control stays non-pass and every declared case has an outcome; expand, remediate or retain a narrower claim |
| L3: second implementation | After this layer, we know whether the method transfers without rewriting the evidence core. | A separately owned target using the same assessment contract | One-off demonstration; property extraction, adapter and integration effort | Independent owner reviews the property and reviewer reproduces its outcome; package the common mechanism or narrow its scope |
| L4: bounded pilot | After this layer, we know whether a customer can use the deliverable and delivery effort is economically credible. | One agreed component, small property set, assessment and optional repair/retest | Unusable reports and unpredictable service cost; expert time and customer coordination | Customer acceptance against agreed criteria plus measured delivery cost; offer again, revise or defer |

## Included and deferred scope

| Layer | Included | Explicitly deferred |
| --- | --- | --- |
| L0 | Recheck exact refs and tool availability; reproduce the known failure and repair; audit bounds and assertion mapping | Rediscovering the known defect, whole-CRABS correctness, new provider families |
| L1 | Source/patch manifest, toolchain instructions, commands, raw evidence, report, independent replay checklist | Hosted dashboard, public release, automatic customer onboarding |
| L2 | Mutated repair that reintroduces the defect, stale-source evidence, missing/duplicate cases, tampered output, timeouts, disagreement, weakened harness detection; bounded neighboring behaviors | Unbounded proof, all dependencies, arbitrary concurrency and production migration |
| L3 | One second property-driven target; choose an existing adequate provider; preserve domain-specific assumptions | Universal property inference, all languages, automatic provider discovery |
| L4 | Written scope and data handling, qualified review, report, customer feedback, actual labor/compute/retest measurement | Certification-body status, broad security guarantees, unlimited repair commitments |

## First construction unit to prepare

Prepare an exact CRABS replay-and-review work pack for L0/L1. Its required
deliverable is a private evidence package containing:

1. The original and repaired revision identities, patch and source manifests.
2. One property in plain language and its executable assertion mapping.
3. Input domain, output equivalence, modeled dependencies and explicit bounds.
4. Reproduction commands using the repository toolchain and preserved nested pins.
5. Original counterexample, repaired result and relevant regression evidence.
6. A defect explanation with reachability and impact limits.
7. A reviewer checklist and explicit unresolved questions.

The target decision is whether a reviewer can reproduce the original failure
and repaired bounded behavior without weakening the property. The original and
repair harnesses may require different assertion IDs or representation adapters;
their semantic equivalence must be reviewed rather than assumed from labels.

Freeze the property and comparisons before evaluating a repair. An altered
property, smaller bound or newly excluded failure mode creates a new assessment
version; it cannot silently close the original defect. Preserve known valid
behavior so that rejecting all inputs cannot pass as a satisfactory repair.

## Product construction and operational support

Current product frontier: L2 falsification and partial-knowledge expansion after
completed L0/L1 qualification and independent replay. The successor plan first
reconciles the partial-knowledge readiness report with its later implementation
repair plan, then gates mechanism hardening, live evidence and independent
review. Provider execution and source mutation still require separately
selected routes and exact scope.

| Support task | Proposed owner | Affected stage | Causal status |
| --- | --- | --- | --- |
| Recheck available pinned compiler/provider and exact inputs | Environment owner | L0 execution | Required before claiming a fresh reproduced result; availability not established by this plan |
| Remove the obsolete Task Session coupling and audit remaining R00-R09 gaps | Partial-knowledge candidate owner | L2 execution of the existing 48-case package | User selected exact owner-directed native execution; derive readiness from actual technical checks and preserve authority separately |
| Nominate an independent reviewer | Product owner | L1 conclusion | Required for independent replay; does not block package preparation |
| Select the second implementation and domain owner | Product owner | L3 | Deferred selection; no current L0 blocker |
| Agree target access, data handling, delivery scope and acceptance criteria | Customer and assessment lead | L4 | Required before customer access or delivery; no current construction blocker |
| Register/admit a future plan or approve an exact product | Respective repository owners | Later authority transition | Separate from this planning candidate and from technical results |
| Publish, deploy or share private examples | Publication/data owners | Any external effect | Separately authorized; not part of this work |

The 48-case run is a useful L2 candidate because it tests three replicas,
partial knowledge and move ordering. Its absence does not invalidate the smaller
historical result. Its blockers do not make L0/L1 preparation dependent on an
unrelated repository-wide runtime rollout.

## Non-regression and measurement

- Keep unknown, missing, timed-out, malformed and contradictory evidence visible.
- Never combine providers by majority vote or replace implementation evidence
  with an abstract model result.
- Transfer the existing L2 controls only after checking their applicability to
  the CBMC/native route; graph-provider success is not cross-provider validation.
- A patch author should not be the sole source of the acceptance oracle. Separate
  author and reviewer responsibilities, and record any unavoidable shared assumptions.
- Record declared cases versus completed cases, replay success, detected seeded
  faults, reviewer corrections, and unresolved obligations. Seeded faults are
  calibration evidence, not claims of naturally discovered vulnerabilities.
- Measure human hours, provider time, setup effort and retest cost per assessment.
  Choose budgets and service pricing after these measurements; this plan invents
  neither an unlimited search promise nor an unsupported market price.
- Passing local checks grants neither product approval nor certification.

## Open Questions

1. Who owns the proposed service outcome and the independent review decision?
2. Which frozen CRABS source/tool set can be reproduced in the current checkout?
3. After removing the unconditional Task Session coupling, which exact
   successor candidate and current R00-R09 evidence should the 48-case
   execution bind to?
4. Which second target best tests transfer: an existing settlement rule, an
   authorization rule, or another distributed implementation? The domain owner
   must confirm a specific property before execution planning.
5. What reviewer time and compute bounds make the first engagement practical?
6. Will the initial pilot include patch construction or assessment plus retest
   of a customer-authored patch? Keep those responsibilities explicit.

## Planning validation

Prepared from existing local documentation and stored evidence. No provider,
repair, admission, customer interaction or publication was executed. Validate
this document's local links and scope; do not describe that check as product
validation or goal achievement.
