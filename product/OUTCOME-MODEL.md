# CyberAlchemy Product Outcome Model

Status: candidate
Visibility: private
Meaning owner: CyberAlchemy v2
Authority effect: none

This document states what should become better for a person or for the work.
It prepares later measurement design without inventing formulas, baselines, or
KPI targets.

## First-Order Product Principle: Dynamic Human-Machine Work Fit

Ontology ID: `CA2-RULE-WORK-ERGONOMICS`

CyberAlchemy commits to shaping work to fit the person, task, and moment. The
product carries avoidable memory, routing, reconstruction, and coordination
burden; recognizes or accepts meaningful work moments; presents small
explainable owner-safe choices; adapts task shape, timing, and detail through
explicit context; and preserves flow, evidence, domain priority, and human
control.

This principle defines what CyberAlchemy must try to be. It is not an output,
metric, or KPI. Measurement determines whether a particular realization
succeeds; lack of finished product proof does not demote the principle.

- **Desired behavior:** the smallest useful governed action is available at the
  right moment, fits the current work and explicitly supplied human context, and
  shows its owner, evidence boundary, consequences, and prohibited effects.
- **Observation question:** can the person recognize why this action matters now,
  choose or defer it without unnecessary reconstruction or switching, and retain
  control of consequential effects?
- **Counterevidence:** the product shows too many choices, interrupts flow,
  recommends the right task at the wrong moment, hides demanding domain-critical
  work, adds excess ceremony, infers private human state, or moves coordination
  burden back to the user.
- **Guardrail:** ergonomic fit must not become surveillance, productivity scoring,
  comfort over domain priority, hidden automation, weakened evidence, or removal
  of necessary judgment.

## First-Order Product Principles: Bounded Authority And Useful Governance

Ontology IDs: `CA2-RULE-AUTHORITY-BOUNDED-VISIBLE` and
`CA2-RULE-GOVERNANCE-SERVES-WORK`

CyberAlchemy commits to making the authority for a consequential action bounded
and visible. The product must show who or what may make the consequence real,
which action and target are covered, the scope and conditions, and the lifecycle
point. Evidence, ownership, participation, a recommendation, a generated
artifact, a handoff, validation success, or an earlier acceptance must not
silently expand that authority.

CyberAlchemy also commits to making governance serve the work. The system
carries routine evidence, owner-routing, scope-checking, and continuity burden.
Reading, exploration, drafting, preview, and reversible local work remain
lightweight. Human-visible gates are concentrated where a transition would make
work canonical, decided, executable, shared, public, deployed, or external.

These are product principles, not outputs, metrics, KPI targets, authority
grants, or proof that a runtime enforces them.

- **Desired behavior:** a person can see the exact authority boundary for a
  consequential next step, while low-effect work proceeds without avoidable
  approval ceremony.
- **Observation question:** can the person identify who or what may make the
  next effect real and its limits, and does the product interrupt only when the
  consequence requires a new authority decision?
- **Counterevidence:** authority is inferred from usefulness or proximity; a
  suggestion looks like a decision; a PASS looks like promotion; a handoff looks
  like acceptance; harmless work repeatedly stops for ceremony; or an effectful
  transition hides its owner route.
- **Guardrail:** reducing governance burden must not become ambient consent,
  hidden execution, global permission, or removal of a necessary owner decision.

## Outcome Chain

```text
first-order ergonomic work fit + bounded authority + useful governance
    -> governed human-machine work
    -> shared meaning and visible choices
    -> evidence and ownership stay attached
    -> a meaningful moment and proportionate owner-safe choice
    -> a reviewable next step
    -> work continuity across stages, sessions, people, and machines
```

This is a causal product hypothesis. Each arrow must be tested. The existence
of the documents or ontology nodes does not prove the chain.

## Keep Four Things Separate

| Kind | Plain meaning | Example | Not the same as |
| --- | --- | --- | --- |
| Output | Something the product produces. | Definition Pack | A useful change for the user. |
| Outcome | A desired change in the user or work state. | Design can understand and challenge the next step. | A number or target. |
| Metric | A defined way to measure an outcome. | A future handoff-acceptance measure with a formula and population. | Raw event count or KPI target. |
| KPI target | An owner-selected threshold, population, and time window that drives a decision. | Not selected yet. | The metric definition or product proof. |

Telemetry is raw observation. Validation checks the calculation and evidence.
Neither defines the product outcome.

## Product Output: Definition Pack

Ontology ID: `CA2-OUTPUT-DEFINITION-PACK`

The Definition Pack is an output. Its usefulness is tested through the
reviewable-next-step and work-continuity outcomes below.

- **Actor:** the person defining the work and the receiving Design owner.
- **Starting state:** required concepts and past decisions are incomplete,
  scattered, conflicting, or hard to inspect.
- **Desired change:** Design receives a pack in which every required concept has
  a supported decision or a visible open question.
- **Product contribution:** Define retrieves evidence, asks focused questions,
  records choices, checks coverage, and preserves residue.
- **Observation question:** can the receiving owner use the pack to continue,
  challenge, or request a specific clarification?
- **Counterevidence:** Design must reconstruct important meaning outside the
  pack, discovers a silently omitted concept, or cannot tell what is settled.
- **Guardrail:** coverage must not be improved by guessing user intent or hiding
  open questions.

## Outcome 1: Reviewable Next Step

Ontology ID: `CA2-OUT-REVIEWABLE-NEXT-STEP`

- **Actor:** the human participant responsible for continuing or approving the
  work.
- **Starting state:** the next action is buried in tool behavior, detached from
  evidence, or lacks a clear owner.
- **Desired change:** the person can see what should happen next, why, what
  supports it, what remains open, and who owns the choice.
- **Product contribution:** the work loop presents one bounded route with its
  evidence, uncertainty, alternatives, and authority boundary.
- **Observation question:** can the person explain, challenge, accept, defer, or
  reject the proposed next step without reconstructing hidden context?
- **Counterevidence:** the recommendation appears clear but the person cannot
  locate its evidence, alternatives, limits, or owner.
- **Guardrail:** clarity must not come from removing consequential choices or
  treating a machine recommendation as authorization.

## Outcome 2: Work Continuity

Ontology ID: `CA2-OUT-WORK-CONTINUITY`

- **Actor:** the next person, machine, session, or lifecycle stage receiving the
  work.
- **Starting state:** intent, evidence, decisions, tests, or ownership are lost
  when the work moves.
- **Desired change:** the receiver can continue from the preserved state and
  can identify what is accepted, challenged, stale, or unresolved.
- **Product contribution:** CyberAlchemy keeps artifacts, evidence, decisions,
  residue, and handoff state connected.
- **Observation question:** can the receiver continue without an avoidable
  reconstruction of material context?
- **Counterevidence:** the receiver repeats discovery, makes a decision already
  made, trusts stale evidence, or cannot find the responsible owner.
- **Guardrail:** continuity must not require collecting private human indicators
  without an opt-in, local, reviewable contract.

## Candidate Measurement Questions

These are questions for the next measurement design, not approved metrics:

- What share of required concepts reaches an explicit decision or visible open
  state?
- How often can a user locate the evidence and owner behind a proposed next
  step?
- How often does Design accept the Definition Pack, and what named gaps cause a
  return?
- How much material context must a receiver reconstruct at handoff?
- Can a receiver locate the objective, current question or decision, evidence,
  unresolved work, owner, and next action without the original conversation?
- Does the product recognize or accept the right work moment and present a small
  useful route set rather than a generic tool drawer?
- Does the recommended task shape and timing fit explicit attention, available
  time, and interruption context without hiding domain-critical work?
- How much avoidable routing, switching, and reconstruction burden remains with
  the person?
- Can the person identify the authority holder, effect, scope, conditions, and
  lifecycle boundary for a consequential next step?
- How much time and attention does governance require from the person, and how
  much of that burden is avoidable?
- How often does the product request an explicit gate for work that is
  reversible and already inside a bounded authority envelope?
- Can the person park, reject, request explanation, or choose a different route
  without losing the work moment?
- How often are stale or conflicting sources discovered before they affect the
  next stage?
- Does the product preserve explicit human choice while improving clarity and
  continuity?

Possible future metric names include concept resolution, evidence-linked
decision, handoff acceptance, context reconstruction, work-state orientation,
work-moment recognition, task-moment fit, switching burden, route-set usefulness,
stale-evidence detection, explicit-choice guardrail, authority-boundary
legibility, governance overhead, and unnecessary-gate rate. These names have no
formula or authority yet.

## What A Measurement Record Must Add

Before any metric or KPI can support the thesis, its owner must define:

- outcome reference and decision purpose;
- formula, unit, population, inclusion and exclusion rules;
- observation source and privacy boundary;
- baseline and comparison method;
- data-quality limits and missing-data behavior;
- counter-metric or guardrail;
- KPI target, time window, and consequence, if a target is selected;
- validation method, counterevidence, and permitted claim.

The intended trace is:

```text
thesis -> outcome -> metric -> optional KPI target
                     |             |
                     v             v
              telemetry input   decision consequence
                     |
                     v
              validated proof -> bounded product claim
```

## Next Documentation Gate

After a human reviews this candidate model, the next artifacts should be
proposed separately:

- `specs/PRODUCT-OUTCOME-AND-MEASUREMENT.md` for owner-approved outcome,
  metric, KPI, and guardrail contracts;
- `observability/PRODUCT-SIGNAL-CATALOG.md` for raw product observations and
  privacy boundaries;
- `validation/PRODUCT-PROOF-PLAN.md` for baselines, calculations,
  counterevidence, and claim limits.

Those files do not exist yet because this candidate meaning has not passed its
review gate.
