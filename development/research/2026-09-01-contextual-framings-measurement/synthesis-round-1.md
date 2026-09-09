# Round 1 synthesis — `SYN1`

Status: candidate measurement design only. No experiment has run; no KPI, capability effectiveness, human benefit, ontology admission, implementation, or authority outcome is accepted.

## `SYN1-01` Claim ceiling

The corpus supports defining an evidence-equivalent, falsifiable round-trip protocol. It does not support claims that contextual framings improve comprehension, cognition, ergonomics, workload, learning, productivity, trust, preference, accessibility, or broad transfer.

Current permitted wording:

> We define candidate contextual-framing measures and a falsifiable round-trip protocol. Effectiveness and psychological interpretation remain empirical questions.

## `SYN1-02` Immutable binding registry

All paths are repository-relative.

| ID | Immutable source identity | Exact selector |
|---|---|---|
| S1 | `research/2026-08-07-cognitive-tools-reflection-tower/TOWER.md` SHA-256 `693377f3b78cc440e46f20b89dfd51e2dbf6ac8d60939279f2742355afcb1324` | `## Construction`, lines 12–36; `## Three axes, kept distinct`, 47–51; `## Stop rule`, 53–55; `## Gates`, 57–59 |
| S2 | `research/2026-08-07-cognitive-tools-reflection-tower/EVIDENCE-HANDOFF.md` SHA-256 `c1f381f0ab32b4674f54ccb029591ae345bfe7bd1624550cdd6cfd355a68f8cd` | `## Falsifiable question`, 16–18; `## Arms`, 20–25; `## Fixed task family`, 27–38; `## Candidate metrics`, 40–52; `## Required residue classes`, 54–65; `## Pre-registration requirements`, 67–75; `## Result language`, 77–82 |
| S3 | `research/2026-08-07-cognitive-tools-reflection-tower/claims/claim-ledger.md` SHA-256 `117b0bd1c084713047f08df1c68522000f5885953115f155e5716758db842350` | `# Claim Ledger`, lines 12–27; `## Claim ceiling`, 29–33; `## Killed claims`, 35–37 |
| S4 | `research/2026-08-07-cognitive-tools-reflection-tower/residue/open-residue.md` SHA-256 `f9ecf4817873f0c1e5d5e1d4f0d8ce8151462ba8d5c4eed95573178d474a7c4c` | `## Empirical residue`, lines 12–18; `## Closure routing`, 34–38 |
| S5 | `research/2026-08-07-cognitive-tools-reflection-tower/gates/closure-gates.md` SHA-256 `ba45addf9a5c39f16c5e4dcf5879a345be00bc44fc9e3ebb5c6963827bb94630` | `# Closure Gates`, lines 12–22; `## Gate policy`, 24–26 |
| S6 | `research/2026-08-07-cognitive-tools-reflection-tower/examples/round-trip-comprehension-example.md` SHA-256 `149a93fc0481441ad8a9db40594c37aca851b1d60d1467b389d280bca6961413` | `## Baseline prompt`, lines 18–25; `## Treatment instrument`, 27–37; `## Required return`, 39–43; `## Scoring`, 45–54 |
| S7 | `.arcanum/inventory/entries/body-war-business-view-novice-comprehension-review-result-synthesis.md` SHA-256 `efc899f4f6a83ab810f616c78da2b1be99cf4b9d5fcf1be56f44325ee5ca05e5` | `## Reusable Instrument Contract`, lines 97–112; `## Browser Admission Boundary`, 133–144 |
| S8 | `.arcanum/inventory/entries/cyberalchemy-naturalized-interface-design-research-result-synthesis.md` SHA-256 `8a6944cecc474e6c17dabbb8171e5d5d2bcf39b1e96933e5389656d02d28a603` | `## Claim And Authority Boundary`, lines 123–129; `## Residue`, 131–138 |
| J1 | `cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/strategy-inventory-packet.json` SHA-256 `c206cd6fc531591f5a07573fd93d143d2f7cef9805553c27e994507576d4677b` | JSON `/design_consequences/0..4`, lines 108–113; `/gaps_and_residue/0..4`, lines 115–120 |
| E0–E2 | `cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/research.md` SHA-256 `546ef22ac06c258a8817daa6585f654e216b7730ef6bb5fd86ebe9d83deb1903` | E0 Halford lines 5–130; E1 Tversky 132–176; E2 Simon 178–271 |

## `SYN1-03` Candidate measurement model

“Bound” means source-backed as a candidate protocol measure, not validated effectiveness. “Deferred” means it requires a later instrument, human evidence, or direct source binding. “Killed” means the proposed inference is disallowed.

| ID | Promise or risk → construct | Operational definition and observable | Scoring rubric | Data type | Evidence / priority | Falsification and confounds | Allowed result language | Binding and disposition |
|---|---|---|---|---|---|---|---|---|
| SYN1-M01 | Meaning preservation → semantic fidelity | Required source distinctions survive baseline/treatment translation. Observable: each keyed assertion retained, omitted, or contradicted. | `1` retained, `0` omitted, `-1` contradicted; report components and total. | Assertion-level ordinal; item sum | Design evidence; primary benefit | Falsified by treatment score `≤` baseline. Confounds: unequal facts, rubric cueing, prose quality. | “Semantic-preservation score differed under recorded conditions.” | S2 `Candidate metrics` 40–52; E0 46–63. **Bound** |
| SYN1-M02 | Scope/authority safety → claim-ceiling and authority accuracy | Detect unsupported enlargement and retain ownership, approval, non-authorizing, implemented/observed/inferred/unshown distinctions. | Count enlargements; boundary retained/lost/invented. Any confident authority loss is critical. | Count plus categorical event | Design/calibration evidence; primary safety | Net-benefit hypothesis fails on any treatment increase in critical-error rate. Confounds: keys leaked, source boundary omitted. | “The treatment had `[n]` recorded boundary errors”; never “authorized.” | S2 lines 44–49; S6 `Scoring` 45–54; E0 50–61, E2 205–215. **Bound** |
| SYN1-M03 | Abstraction remains reversible → return fidelity | Reconstruct original facts, limits, missing evidence, and authority after using the framing. | Proportion of required case elements restored; penalize imported target properties. | Proportion plus typed errors | Design/calibration evidence; primary benefit | Falsified if treatment return score is nonpositive versus baseline. Confounds: recall cues and task wording. | “Concrete-case reconstruction differed…” | S1 `Construction` 12–36; S2 lines 47–48; S6 `Required return` 39–43; E0 55, 89–100; E1 142–153. **Bound** |
| SYN1-M04 | Useful understanding → counterfactual discrimination and unfamiliar transfer | Reject label-based mechanism claims, request discriminating evidence, then apply the boundary to a matched unfamiliar case. | Separate binary discrimination and transfer items; justification must name the boundary. | Binary/ordinal per item | Design/calibration evidence; hierarchical primary benefit | Falsified if either component is nonpositive or transfer merely repeats the source answer. Confounds: case familiarity, surface similarity, leakage. | “Counterfactual/transfer accuracy differed on these fixtures.” | S2 `Fixed task family` 27–38 and metrics 48–49; S6 lines 49–54; E0 56–57, 95–100; E1 148,155. **Bound** |
| SYN1-M05 | Faithful analogy → mapping and non-mapping fidelity | Score every declared correspondence as correct, unsupported, or contradicted; require at least one explicit non-correspondence and counterexample response. | Correct links `+1`; invented/contradicted links `-1`; refusal/narrowing keyed separately. | Link-level categorical and sum | Packet-proposed framing extension; secondary until validated | Falsified if fluent treatment increases invented links or fails known mismatch. Confounds: treatment supplies extra facts; mapping key subjectivity. | “Candidate mapping rubric produced…”; no “analogy improves explanation.” | J1 `/design_consequences/3`, `/gaps_and_residue/4`; E1 144–166. **Deferred** |
| SYN1-M06 | Persuasive-framing harm → analogy-induced misconception | Source-inconsistent causal, temporal, scope, mechanism, or authority inference attributable to a declared mapping, especially with high confidence. | Count separately from generic errors; severity low/high/critical; attribution requires mapping-to-error trace and adjudication. | Event count, severity, trace | Candidate extension; primary safety sentinel | Any treatment-attributable critical event blocks a positive verdict. Confounds: generic misunderstanding and attribution bias. | “A candidate analogy-attributed error was adjudicated…” | J1 `/gaps_and_residue/4`; S6 lines 49–54; E1 151,161–166; E2 193,215,265. **Deferred** |
| SYN1-M07 | Calibrated understanding → confidence calibration | Confidence must track evidential sufficiency, missing evidence, and correctness—not fluent terminology. | Prespecified confidence scale paired with correctness; flag high-confidence unsupported enlargement. | Ordinal confidence × keyed correctness | Conditional design evidence; secondary | Harm signal if treatment increases confident error. Confounds: scale interpretation and demand characteristics. | “Confidence-error pairing differed…”; never “metacognition improved.” | S1 `Three axes` 47–51; S2 line 51; S3 C12 lines 25,35–37; S6 line 54; E0 59, E1 152. **Bound only as conditional measure; psychological interpretation killed** |
| SYN1-M08 | Lower breakdown cost → stalls and recovery | Prespecified no-progress/repeated-action events, locus, severity, recovery success, steps, and time; correctness remains independent. | Event classifier over frozen traces; zero stalls valid; report recovery separately. | Event sequence, count, duration | Structural diagnostic; human interpretation deferred | Invalid if event capture/classifier fails. Confounds: arbitrary thresholds, interface/tool latency. | Agent: “Recorded stall classifier behavior…” Human: only study-specific observations. | S2 line 50; S7 lines 102–112; E2 198–203,230–250. **Bound structurally; deferred human meaning** |
| SYN1-M09 | Operational efficiency → completion, time, steps, help | Completion within task state; elapsed time; actions beyond preregistered efficient path; help count/type. | Separate measures; never aggregate into “productivity”; correctness stratifies interpretation. | Binary, duration, count | Secondary/diagnostic | Faster but less correct is harm, not success. Confounds: accessibility actions, device latency, unequal help, fatigue. | “Completion/time/actions differed on this task”; no productivity claim. | S2 line 52; J1 `/design_consequences/1`; E2 190–201,217–228. **Bound as secondary observation; speed-only success killed** |
| SYN1-M10 | Learning persistence → retention | Delayed reconstruction of claim, limits, and authority after a fixed interval. | Same keyed components as M01–M03 at preregistered delay. | Delayed ordinal score | Human-only extension | Invalid without fixed delay and no intervening exposure. Confounds: rehearsal and memory aids. | Only participant- and interval-specific observed retention. | S8 lines 123–129; E2 lines 200,224. **Deferred** |
| SYN1-M11 | Lower experienced effort → perceived effort | Brief post-block self-report using a separately selected, source-bound instrument. | Not specified by current corpus; never primary or substitute for correctness. | Self-report ordinal | Unsupported locally | Cannot adjudicate until instrument and scoring policy are bound. Demand and preference confounds dominate. | No effort/workload claim now. | J1 `/gaps_and_residue/3`; E2 line 201. **Deferred; self-report-only success killed** |

## `SYN1-04` Arm contract

Evidence-equivalent baseline:

- One prose representation containing the same bounded claim, evidence, limits, exclusions, target-relevant relations, claim label, governance, and approval boundary.
- It must not contain the analogy as an analogy, but it must contain every fact available in treatment.

Contextual-framing treatment:

- The same evidence reorganized as an explicit source-to-target frame.
- It declares correspondences, non-correspondences, limits, authority boundary, and return path.
- It may change organization and mapping visibility only; it may not add evidence, hints, examples unavailable to baseline, or task-answer cues.

Frozen across arms: source inventory, task bytes wherever possible, allowed time, delivery mode, help policy, scoring key, task order policy, versioned manifests, and digests. Scorers are blinded where answer form permits.

Fixture family: one helpful, one neutral, one misleading, and one low-stakes harmful synthetic analogy, each with an answer key, allowed/prohibited mappings, counterexample, and required source-case return.

## `SYN1-05` Hierarchical primary family

- `SYN1-P1 — Safety gate`: critical boundary or analogy-misconception error rate. Minimum direction: treatment must not be worse than baseline. Any treatment-attributable critical authority loss or confident harmful misconception blocks a positive verdict.
- `SYN1-P2 — Correctness benefit`: preregistered aggregate of M01–M04, reported with every component visible. Minimum direction: treatment must exceed baseline overall, with no hidden component harm. It is tested only if P1 survives.
- Exact non-inferiority margin, minimum worthwhile magnitude, aggregation weights, and inferential threshold remain deferred to sample-sizing and metric validation. They cannot be invented from this corpus.

Interpretation:

- P1 survives and P2 improves: candidate benefit signal, limited to the recorded study.
- P1 survives and P2 is nonpositive: falsifies the proposed benefit direction.
- P1 worsens: harm signal, regardless of speed or aggregate correctness.
- Aggregate improves but a component worsens: mixed result, not success.
- Invalid/contaminated evidence: no effect verdict.

## `SYN1-06` Agent-only structural pretest

Run all frozen baseline/treatment fixtures through a pinned agent/profile solely to verify:

- digest and evidence equivalence;
- task and rubric determinacy;
- positive, neutral, misleading, harmful, leakage, counterfactual, return, and transfer fixtures;
- answer-key scoring and critical-error detection;
- event logging plus scripted stall/recovery classification;
- help-path equality;
- absence of learner-visible keys, audits, rubrics, results, or reviewer metadata;
- fail-closed behavior on missing binding, invalid digest, and invalid task state.

Allowed outcome: “The instrument passed/failed a structural pretest under the recorded conditions.” Agent output is not human comprehension, retention, workload, or ergonomic evidence.

## `SYN1-07` Smallest later human experiment proposal

The smallest structurally adequate arm is a separately authorized, counterbalanced within-participant pilot:

- Two matched task families and four alternate cases: helpful, neutral, misleading, harmful.
- Four trials per participant: two baseline and two treatment; no participant sees the same case in both forms.
- Randomize case-to-arm assignment and counterbalance arm/order.
- Include immediate return and transfer in every trial; delayed retention only if separately approved.
- Freeze bytes, manifests, rubric, help policy, critical errors, time ceiling, and adjudication before recruitment.
- Two blinded scorers independently judge semantic items; a third resolves disagreement. Preserve original scores, disagreement, resolution, and rationale.
- Numerical participant count cannot be validly selected from this corpus. A power/sensitivity and burden rationale is required before this becomes an executable effect experiment; otherwise it is feasibility evidence only.

## `SYN1-08` Rules

Survival requires valid digests, evidence equivalence, complete primary observations, intact blindness, no critical contamination, and valid scoring.

Falsification occurs when P1 worsens, P2 is nonpositive after P1 survives, or a purported benefit exists only in speed, preference, or self-report.

Invalidation occurs on digest mismatch, unequal evidence, key/rubric leakage, missing primary telemetry, systemic scoring ambiguity, unrecorded arm deviation, or broken blinding affecting adjudication. Invalid trials are retained as typed residue, not repaired in place.

Contamination includes prior exposure to the paired case, answer-key leakage, unequal help, persuasive labels that reveal the key, scorer knowledge of condition, or cross-arm exposure before response.

Stop immediately for critical leakage, evidence inequivalence, invalid stimulus identity, missing primary telemetry, or systemic unblinding. Stop an individual block on request, preset maximum duration, or preset repeated-no-progress threshold; retain the stop as an outcome. Stop the study for a treatment-attributable critical harm pattern or systemic invalidity. Do not stop or extend because interim results look favorable.

## `SYN1-09` Candidate verdict matrix

| ID | Candidate | Verdict | Reason |
|---|---|---|---|
| SYN1-V01 | Evidence-equivalent arms and fixed tasks | KEEP AND HARDEN | Source-backed protocol core; requires immutable manifests and equivalence validator. |
| SYN1-V02 | Hierarchical safety-then-correctness primary family | EXPERIMENT | Prevents benefit averages from hiding harm; threshold magnitude remains deferred. |
| SYN1-V03 | Mapping/non-mapping fidelity | EXPERIMENT | Necessary framing-specific extension, but not locally validated. |
| SYN1-V04 | Analogy-induced misconception attribution | EXPERIMENT WITH ADJUDICATION | Harm-sensitive and decision-relevant; causal attribution needs trace and blind review. |
| SYN1-V05 | Stall/recovery and operational-cost panel | KEEP AS DIAGNOSTIC | Preserves cost differences without converting them into comprehension. |
| SYN1-V06 | Completion time as primary success | KILL | Explicitly prohibited as a correctness substitute. |
| SYN1-V07 | Perceived effort as primary or standalone success | KILL | Unsourced locally and self-report cannot establish comprehension or productivity. |
| SYN1-V08 | Retention | DEFER | Human-only, with interval and exposure controls still unspecified. |
| SYN1-V09 | Agent pretest as human evidence | KILL | Agent evidence is structural only. |
| SYN1-V10 | Numerical sample size/effect threshold | DEFER | Requires population, variance, power/sensitivity, and burden rationale. |
| SYN1-V11 | Executable fixtures, validator, result schema | DEFER TO `research-evidence-harness` | S4 and S5 leave protocol validity and treatment/human evidence gates open. |
| SYN1-V12 | Productivity, ergonomics, or cognitive-improvement claim | KILL AT CURRENT EVIDENCE | No baseline/treatment execution or human evidence exists. |

Gate posture: G0–G3 support this bounded candidate lane. G4 protocol validity, G5 treatment evidence, G6 human evidence, G7 public boundary, and G8 owner authority remain open.
