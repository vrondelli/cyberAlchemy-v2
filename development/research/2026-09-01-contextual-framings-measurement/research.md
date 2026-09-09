# Contextual Framings Measurement — Explorer Returns

The following sections preserve the three explorer returns verbatim.

## Agent 0 — Halford, Graeme

# Contextual Framings Measurement — Explorer Report

**Status:** proposed measurement design only; no study, improvement, psychological effect, or authority outcome is claimed.

## 1. Source-grounded protocol spine

The Cognitive Tools Reflection Tower supplies a usable measurement architecture:

```text
concrete bounded claim
→ alternate expressions (horizontal)
→ fixed comprehension task
→ typed residue
→ local repair or vocabulary-driven escalation
→ return to the concrete case
→ empirical comparison and gates
```

It separates representation design from evidence that readers comprehend it. Horizontal variants must preserve claim ceiling and governed meaning; a vertical move is justified only by unresolved missing vocabulary; the diagonal/metacognitive axis remains conditional research territory. [Tower: Construction, Three axes, Stop rule](research/2026-08-07-cognitive-tools-reflection-tower/TOWER.md)

For contextual framings, treat a framing as a controlled alternate expression of the same bounded source claim—not as a demonstrated cognitive intervention. The relevant analogy is protocol shape, not validated psychology.

## 2. Proposed capability mapping

| Tower construct | Contextual-framings interpretation | Status |
|---|---|---|
| Concrete case | A short source-bound claim, evidence, limit, and authority state | Supported as protocol structure |
| Horizontal set | Evidence-equivalent framings for specified reader/decision contexts | Proposed treatment form |
| Fixed comprehension task | Identical scored prompts across baseline/treatment where arm distinction permits | Supported requirement |
| Typed residue | Error/stall classification, including framing-specific mapping and misconception failures | Supported base classes; framing additions proposed |
| Local repair | Clarify a framing while retaining source meaning | Proposed operational action |
| Vertical climb | Add only missing vocabulary needed to distinguish source from framing | Supported method boundary |
| Return | Reconstruct original case after contextual abstraction | Supported task pattern |
| Gates | Separate definition, protocol validity, treatment evidence, human evidence, public boundary, and owner authority | Supported gate structure |

The candidate capability is therefore: *define and test whether an evidence-equivalent contextual framing changes measured performance on source-preserving comprehension tasks.* It is not: “use framing to improve comprehension, productivity, cognitive load, or ergonomics.”

## 3. Operational definitions and scoring units

Use a single pre-registered **item**: `(source packet, bounded claim, evidence/limit/authority tuple, baseline, treatment, task prompts, rubric, version digest)`.

Score each response at the **assertion** level, then aggregate to item and arm.

| Outcome | Operational definition | Observable scoring unit |
|---|---|---|
| Semantic preservation | Required source distinctions survive explanation/translation | required distinction retained / omitted / contradicted |
| Claim-ceiling accuracy | Response does not enlarge what evidence supports | unsupported enlargement count; ceiling pass/fail |
| Authority accuracy | Response retains owner, approval, and non-authorizing boundaries | boundary retained / lost / invented |
| Return fidelity | Response reconstructs concrete source case after framing | required case facts and limits restored |
| Transfer | Rule correctly applied to a novel, structurally matched case | correct application plus justified boundary |
| Overclaim detection | Unsupported causal/mechanism claim is rejected | rejected / accepted / ambiguous |
| Stall profile | Difficulty is recorded independently from correctness | count, class, locus, recovery, severity |
| Calibration | Confidence is proportionate to evidential sufficiency | confidence rating paired with correctness/uncertainty |
| Framing mapping fidelity | Treatment mapping preserves source-target correspondence and non-correspondence | correct map links; explicit non-map links; invented links |
| Analogy-induced misconception | Framing causes a confident, source-inconsistent inference | misconception event, confidence, residue class |

The Tower’s existing candidate metrics already cover the first eight, with completion time secondary and never a substitute for correctness. [Evidence Handoff: Candidate metrics](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md) Mapping fidelity and analogy-induced misconception are packet-proposed extensions, not locally validated measures. [Strategy inventory packet: Design consequences, Gaps and residue](cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/strategy-inventory-packet.json)

## 4. Baseline/treatment invariants and contamination controls

**Required invariants**

- Same source evidence, bounded claim, exclusions, claim label, limits, governance/approval boundary, prompts, scoring key, allowed time, delivery mode, and task order.
- Baseline and treatment task bytes should be identical wherever the framing distinction permits.
- Preregister treatment/baseline digests, primary outcome, effect direction, rubric, adjudication, invalidation criteria, and local-repair-versus-escalation rule.
- Keep agent structural pretest and human arm as distinct result populations.

These derive directly from the Tower’s evidence handoff and the Body War reusable instrument contract. [Evidence Handoff: Arms, Fixed task family, Pre-registration requirements](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md) [Body War: Reusable Instrument Contract](.arcanum/inventory/entries/body-war-business-view-novice-comprehension-review-result-synthesis.md)

**Contamination controls**

- Redact reviewer keys, rubrics, audit metadata, results, and reviewer-only material from learner bytes; fail closed on leakage.
- Randomize/match arms and prevent exposure to the other representation before the scored response.
- Blind scorers to arm; record blindness failures.
- Treat persuasive terminology as a contamination risk: include label-substitution/counterfactual items that require discriminating evidence.
- Record stimulus, prompt, treatment/baseline digests, toolchain/version, and all deviations.
- Keep correctness separate from stall severity; no stalls is valid data.

The last two controls are particularly important because a fluent analogy can yield fast, confident error rather than understanding. [Worked Round-Trip Example: Scoring](research/2026-08-07-cognitive-tools-reflection-tower/examples/round-trip-comprehension-example.md)

## 5. Smallest proposed task set

One source-bound item can contain eight short scored prompts:

1. Restate the bounded claim in plain language.  
2. Identify demonstrated evidence, inference, proposal, and untested assertions.  
3. State the claim ceiling and approval/authority boundary.  
4. Translate the framing back into a source-faithful concrete case.  
5. Reject an unsupported causal or mechanism claim.  
6. Select which source-to-framing mappings hold and name one explicit non-mapping.  
7. Apply the same boundary rule to one unfamiliar matched case.  
8. Give confidence and explain what missing evidence should lower it.

This preserves the Tower’s fixed task family while making the framing-specific risk observable. [Evidence Handoff: Fixed task family](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md) The worked example supports the calibration pattern: distinguish executable witness from claimed mechanism, request discriminating evidence, retain authority limits, and transfer the rule. [Worked Round-Trip Example: Required return, Scoring](research/2026-08-07-cognitive-tools-reflection-tower/examples/round-trip-comprehension-example.md)

## 6. Residue and gates

Use the Tower’s residue classes: missing vocabulary; ambiguity; edge/state confusion; claim-ceiling loss; authority-boundary loss; causal overreach; failed return; transfer failure; contamination; and unclassified residue. Add two **proposed** contextual-framing subclasses: `mapping-boundary loss` and `analogy-induced misconception`. [Evidence Handoff: Required residue classes](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md)

Gate posture:

- **G0–G3:** the local corpus supports defining a source-bound framing lane and its invariants, but not a cognitive effect.
- **G4:** remains open until a machine-checkable protocol, fixed artifacts, blindness/contamination records, and metric validator exist.
- **G5:** remains open until clean preregistered baseline/treatment evidence exists.
- **G6:** remains open until a human arm provides human evidence.
- **G7–G8:** remain open for public-safe derivation and owner acceptance.

No lower gate implies a higher one. [Closure Gates](research/2026-08-07-cognitive-tools-reflection-tower/gates/closure-gates.md)

## 7. Evidence levels and permitted language

| Evidence level | What the local corpus supports | Permitted result language |
|---|---|---|
| Current corpus / design | A source-grounded, falsifiable contextual-framings protocol can be defined | “We define a falsifiable protocol.” |
| Agent-only pretest | Structural task ambiguity, leakage checks, observable residue/stalls under recorded conditions | “The instrument passed a structural pretest under the recorded conditions.” |
| Clean controlled treatment result | Only the preregistered observed difference and stated limitations | “In this recorded study, [measure] differed by [observed amount].” |
| Human arm | Only the preregistered human result and limits | “Among this study’s participants, [pre-registered outcome] was observed…” |
| Absent evidence | Improvement in comprehension, learning, workload, usefulness, productivity, trust, preference, accessibility, or broad transfer | Do not claim |

The current claim ceiling remains: “We define a source-grounded cognitive instrument and falsifiable round-trip comprehension protocol. Its effectiveness and psychological interpretation remain empirical questions.” [Claim Ledger: Claim ceiling](research/2026-08-07-cognitive-tools-reflection-tower/claims/claim-ledger.md) Automated structure cannot establish human usefulness, comprehension, learning, workload reduction, preference, accessibility conformance, or representative-user transfer. [Naturalized Interface: Claim And Authority Boundary](.arcanum/inventory/entries/cyberalchemy-naturalized-interface-design-research-result-synthesis.md)

## 8. Conclusion

The local corpus supports a disciplined, evidence-equivalent contextual-framings **measurement proposal** with fixed tasks, explicit leakage controls, typed residue, and strict claim/authority separation. It does not support any effectiveness or human-psychology conclusion. The remaining execution package—fixtures, artifact manifests, metric validator, result schema, contamination/blindness fields, and audit report—is explicitly open residue and belongs to a later evidence-harness route. [Open Residue: Empirical residue, Closure routing](research/2026-08-07-cognitive-tools-reflection-tower/residue/open-residue.md)

## Agent 1 — Tversky, Amos

# Contextual framings: candidate measurement report

Status: candidate design only; no protocol, fixtures, validator, baseline/treatment run, or human evidence exists. The reusable foundation is the Tower’s evidence-equivalent-arm, round-trip, counterfactual-discrimination, overclaim, leakage, and human-evidence boundaries. All contextual-framing/analogy-specific measures below are candidate extensions.

## Measurement contract

Use an evidence-equivalent prose baseline and a contextual-framing treatment; retain byte-identical tasks wherever possible. Score correctness before time, preregister metric direction, arm digests, blindness/contamination fields, rubric, and adjudication. An agent arm can detect task ambiguity or leakage only; a human arm is required for any comprehension result. [EVIDENCE-HANDOFF.md:18-25,38-52,67-93](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#L18-L93)

A framing is acceptable only if the participant can return to the source case while retaining its claim ceiling, evidence gaps, and authority boundary. This is the Tower’s existing round-trip requirement; it is not evidence that framing improves comprehension. [TOWER.md:12-36](research/2026-08-07-cognitive-tools-reflection-tower/TOWER.md#L12-L36) [claim-ledger.md:29-37](research/2026-08-07-cognitive-tools-reflection-tower/claims/claim-ledger.md#L29-L37)

| Candidate measure | Operational observation | Reused or extension |
|---|---|---|
| Source-to-target mapping fidelity | Score each declared correspondence as correct, unsupported, or contradicted by the source case; penalize adding source mechanisms absent from the case. | Candidate extension of semantic preservation and claim-ceiling accuracy. |
| Preserved limitations | After using the framing, require the participant to name source-case non-demonstrations, missing evidence, and approval limits. Score retained versus lost limitations. | Candidate extension of claim-ceiling and authority retention. |
| Useful-discrimination gain | Compare matched-arm accuracy on a counterfactual that separates a superficial label/metaphor from the actually demonstrated witness. Report treatment minus baseline; do not interpret without a controlled run. | Candidate extension grounded in counterfactual discrimination. |
| Counterexample handling | Present a known mismatch to the framing. Score whether the participant narrows, qualifies, or rejects the mapping rather than explaining it away. | Candidate extension of causal-overclaim detection and typed residue. |
| Boundary retention | Score whether the participant preserves the distinction between implemented/observed/inferred/unshown and keeps source authority limits intact. | Reuses authority accuracy, claim-ceiling retention, and return fidelity. |
| Analogy-induced misconception | Count incorrect target-case conclusions attributable to a declared mapping, especially transferred causal, temporal, scope, or authority properties. | Candidate extension; must remain separate from generic error. |
| Unjustified confidence | Elicit confidence after the counterfactual and missing-evidence questions; flag high confidence coupled with unsupported enlargement or missing discriminating evidence. | Reuses confidence calibration; analogy attribution is a candidate extension. |
| Failure to return to source case | Require reconstruction of the original concrete case after abstraction. Score lost distinctions, imported target properties, or inability to state what the source does *not* show. | Direct reuse of return fidelity / failed descent residue. |

The core discrimination pattern is already exemplified: replacing an attractive mechanism label with ordinary hashing leaves the verdict unchanged, so a valid response must not treat the label as proof and must request discriminating behavior. [round-trip-comprehension-example.md:14-25,39-58](research/2026-08-07-cognitive-tools-reflection-tower/examples/round-trip-comprehension-example.md#L14-L58)

## Candidate fixture set

Each fixture should have matched baseline and framing forms, identical evidence, an answer key, declared allowed mappings, prohibited inferences, a counterexample, and a required source-case return.

| Fixture class | Framing behavior | Required positive check | Required negative check |
|---|---|---|---|
| Helpful | A source case has a real structural correspondence to the target, plus explicit non-correspondences. | Correctly maps the shared structure, rejects the counterexample, and reconstructs the source limits. | Does not infer unmentioned causes, authority, or performance. |
| Neutral | The framing adds memorable language but no task-relevant distinction beyond source prose. | Same source-case and counterfactual result as baseline. | No unsupported gain claim merely because prose is preferred or fluent. |
| Misleading | A fluent mapping shares surface features while hiding a material mechanism/evidence mismatch. | Identifies the mismatch when challenged and downgrades confidence. | No target conclusion based solely on label similarity. |
| Actively harmful | The framing invites a high-stakes false inference—for example, that a visible witness proves unimplemented concurrency or authorizes a stronger capability. | Explicitly rejects the inference and returns to the actual witness. | Any endorsement is recorded as analogy-induced misconception and boundary loss. |

Leakage controls are mandatory: learner-facing materials must exclude keys, audits, rubrics, results, and reviewer metadata, while correctness and stall severity remain independent observations. [body-war-business-view-novice-comprehension-review-result-synthesis.md:97-112](.arcanum/inventory/entries/body-war-business-view-novice-comprehension-review-result-synthesis.md#L97-L112)

## Interpretation boundaries

- A clean fixture or agent structural pretest could establish only recorded structural behavior, ambiguity, contamination, and scoring feasibility—not human usefulness, comprehension, learning, trust, workload reduction, preference, or transfer. [cyberalchemy-naturalized-interface-design-research-result-synthesis.md:123-138](.arcanum/inventory/entries/cyberalchemy-naturalized-interface-design-research-result-synthesis.md#L123-L138)
- Baseline/treatment execution, a human arm, metric schema, fixtures, and result validator remain open residue. [open-residue.md:12-18](research/2026-08-07-cognitive-tools-reflection-tower/residue/open-residue.md#L12-L18)
- Passing source and design gates only defines a bounded research lane; protocol validity, treatment evidence, and human evidence are distinct later gates. [closure-gates.md:12-26](research/2026-08-07-cognitive-tools-reflection-tower/gates/closure-gates.md#L12-L26)

Accordingly, permitted current wording is: “We define candidate contextual-framing measures and a falsifiable round-trip protocol.” It does not support a claim that any framing benefits people.

## Agent 2 — Simon, Herbert

# Explorer report: ergonomic-capacity measurement without speed reduction

## Scope and claim ceiling

This is a candidate measurement design, not evidence that contextual framings improve productivity, comprehension, workload, learning, or human performance. It separates a structural agent pretest from a separately authorized human arm. Automated evidence can establish task/stimulus binding, keyed scoring, interaction instrumentation, leakage refusal, and recorded failures; it cannot establish usefulness, learning, workload reduction, preference, or ergonomic benefit. [Naturalized interface synthesis](.arcanum/inventory/entries/cyberalchemy-naturalized-interface-design-research-result-synthesis.md#claim-and-authority-boundary)

The target construct, “ergonomic capacity,” should therefore be operationalized as preserving and correctly applying task-relevant distinctions with fewer harmful breakdowns—not merely finishing sooner. Correctness is primary; time is secondary. [Evidence handoff](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#candidate-metrics)

## Outcome model

| Outcome | Operational measure | Priority | Agent structural pretest | Separately authorized human arm |
|---|---|---:|---|---|
| Task correctness | Rubric score for semantic preservation, claim/authority-boundary retention, counterfactual discrimination, and transfer | Primary | Can score deterministic keyed answers; establishes only scoring/task behavior | Required to infer human task performance or comprehension |
| Critical errors | Count/rate of high-severity failures: invented sequence, boundary loss, unsupported causal enlargement, incorrect transfer, or analogy-induced misconception | Primary safety outcome | Can detect against explicit keys and negative fixtures | Required to estimate human error risk |
| Completion | Finished required answer/action within the task state | Secondary | Observable | Required for human completion claims |
| Time on task | Elapsed time from task presentation to submission | Secondary, never a substitute for correctness | Recordable as harness telemetry, but not ergonomic evidence | Required to interpret speed as a human outcome |
| Unnecessary interaction steps | Actions beyond a preregistered efficient path, excluding required inspection and accessibility-preserving actions | Diagnostic | Observable if event model is pinned | Required to infer friction for people |
| Help requests | Count/type/location of help, hint, or clarification requests | Diagnostic | Observable as tool/help invocation | Required to interpret need for assistance |
| Stalls | Count, type, location, and severity of no-progress episodes | Primary diagnostic, distinct from correctness | Observable using explicit inactivity/repeated-action rules | Required to infer experienced difficulty |
| Recovery | Whether, and how, a participant resumes correct progress after a stall; recovery steps/time | Primary diagnostic | Observable under a fixed recovery rule | Required to infer resilient human task performance |
| Retention | Delayed reconstruction of the claim, limits, and boundary after an interval | Human-only outcome | No: an agent rerun does not evidence retention or learning | Required |
| Perceived effort | Brief self-report after a block, labelled exploratory unless a source-bound instrument and scoring policy are separately selected | Optional | No | Required |

Correctness and stall severity must remain independent: a correct answer with severe stalls and an incorrect answer with no observable stall are both valid, different observations. [Reusable instrument contract](.arcanum/inventory/entries/body-war-business-view-novice-comprehension-review-result-synthesis.md#reusable-instrument-contract)

## Primary scoring rule

Use a preregistered keyed rubric with separate component scores:

1. Retains the bounded claim and source/target mapping.
2. Retains the claim ceiling and approval/authority boundary.
3. Rejects a tempting but unsupported analogy or causal conclusion.
4. Reconstructs the concrete case after using the framing.
5. Applies the distinction to a novel, matched case.

Treat the following as critical errors rather than ordinary partial-credit loss: claim-ceiling enlargement, authority-boundary loss, invented mechanism/sequence, and confident analogy-induced misconception. The worked calibration example provides this pattern: distinguish the mechanism from its witness, request discriminating evidence, and return to the concrete case. [Round-trip example](research/2026-08-07-cognitive-tools-reflection-tower/examples/round-trip-comprehension-example.md#scoring)

## Smallest feasible repeated-task design

A feasible minimum is a matched, counterbalanced repeated-task pilot—not a productivity study.

- Create four evidence-equivalent task packets from two task families, each with a baseline prose form and a contextual-framing form.
- Each participant completes two baseline and two treatment trials, but never sees the same underlying case in both forms.
- Randomize case-to-form assignment and counterbalance form order; use one fixed prompt and identical scoring rubric wherever form differences do not require otherwise.
- Include one immediate transfer item in each trial. Add one delayed retention item only in the separately authorized human arm.
- Blind scorers to condition where answer format permits; freeze treatment/baseline bytes, task catalog, rubric, help policy, and critical-error definitions before data collection.
- Analyze correctness and critical-error outcomes first. Report completion, stalls, recovery, interaction steps, help, and time as distinct outcomes; do not aggregate them into a single “productivity” score.

This follows the required evidence-equivalent baseline/treatment structure and fixed task family, while preserving the separation between structural and human claims. [Evidence handoff](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#arms) [Evidence handoff](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#fixed-task-family)

## Agent structural pretest

Before any human work, an agent-only pretest may verify:

- baseline/treatment byte manifests and evidence equivalence;
- rubric completeness, expected-answer scoring, and critical-error fixtures;
- that tasks can be completed, help paths work, and events are captured;
- stall/recovery classifier behavior on scripted traces;
- absence of leakage of answer keys, rubrics, audits, results, or reviewer metadata into learner bytes;
- refusal/fail-closed behavior for missing source bindings or invalid task state.

Its proper result language is: “The instrument passed a structural pretest under the recorded conditions.” It cannot be described as evidence of human comprehension, learning, workload reduction, or ergonomic improvement. [Evidence handoff](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#result-language) [Claim ledger](research/2026-08-07-cognitive-tools-reflection-tower/claims/claim-ledger.md#claim-ceiling)

## Stopping rules and burden limits

Predeclare these before execution:

- Stop the arm immediately for a critical leakage, invalid stimulus digest, missing telemetry, unblinded scoring condition, or evidence inequivalence; invalidate affected trials rather than repairing them in place.
- Stop a participant’s block for repeated no-progress behavior under the preset stall threshold, a fixed maximum task duration, or a request to stop; record the stop as an outcome, not an excluded inconvenience.
- Cap the minimum pilot at four scored trials in one short session; set a conservative session ceiling in the protocol (for example, no more than about 30 minutes including instruction and breaks). Do not add retention unless its interval and burden are explicitly approved.
- Do not continue collecting merely because an apparent direction looks favorable. Use preregistered survival, falsification, and invalidation criteria, and report feasibility residue when the pilot cannot support the planned comparison.

The protocol must predeclare primary metric, direction, treatment/baseline digests, contamination/blindness fields, and scoring/adjudication policy. [Evidence handoff](research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md#pre-registration-requirements)

## Confounds to control or record

| Confound | Control / record |
|---|---|
| Novelty | Record prior exposure to the framing and interface; interpret first-use effects separately from task effects. |
| Learning and carryover | Do not show the same case in both forms; use matched alternate cases, counterbalanced order, and a transfer item. |
| Leakage | Keep keys, rubrics, audits, results, and reviewer metadata out of learner materials; add negative leakage fixtures. |
| Order and fatigue | Counterbalance form and case order; record trial position, breaks, and early termination. |
| Unequal evidence | Freeze evidence-equivalent baseline and treatment packages; compare their source/claim inventory and digests before running. |
| Framing changes information, not ergonomics | Require identical factual evidence and task demand; the treatment may change organization and explicit mapping only. |
| Rubric bias | Blind scoring where possible; preregister adjudication and retain disagreement records. |
| Persuasive misconception | Score analogy-induced misconception and overclaim separately from ordinary wrong answers. |
| Unequal help | Fix help availability, wording, and escalation policy across arms; log every request. |
| Instrumentation artifacts | Validate event logs, stall rules, and recovery classification in the agent structural pretest. |

## Required next gate

No study is authorized by this report. A later `research-evidence-harness` proposal would need to select the population, sample-sizing rationale, primary metric, minimum effect direction, task fixtures, metric validator, result schema, and human authorization. Until then, the supported claim is only that this is a source-grounded, falsifiable measurement design. [Closure gates](research/2026-08-07-cognitive-tools-reflection-tower/gates/closure-gates.md#closure-gates) [Open residue](research/2026-08-07-cognitive-tools-reflection-tower/residue/open-residue.md#empirical-residue)
