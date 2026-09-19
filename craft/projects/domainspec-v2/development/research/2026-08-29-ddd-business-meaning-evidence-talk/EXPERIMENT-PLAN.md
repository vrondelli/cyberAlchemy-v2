# EXP-DDD-EVF-001 — Business Meaning To Bounded Evidence

Status: experiment candidate
Visibility: private
Authority effect: none
Execution status: not selected
Evidence status: protocol only

## Purpose

Create one reproducible, public-safe experiment that can become the factual
center of the DDD talk. The experiment asks whether an exact business rule can
remain traceable from domain language to typed meaning, implementation, formal
or executable evidence, and back to a domain conversation.

The experiment must expose both kinds of failure:

1. the implementation violates a correctly modeled rule; and
2. the model precisely expresses the wrong or incomplete business meaning.

EVF should help with the first. The second must remain visible as a human/domain
modeling responsibility. This distinction is the main learning result even if
every planned technical stage succeeds.

## Research Questions

| ID | Question |
| --- | --- |
| RQ1 | Can a reviewer trace one business phrase through every selected model, obligation, binding, execution, and evidence artifact? |
| RQ2 | Do the checks reject deliberately wrong implementation variants without inventing missing semantics? |
| RQ3 | Does a deliberately wrong but internally consistent formalization demonstrate that proof is conditional on the modeled meaning? |
| RQ4 | Can an independent DDD or domain participant explain what the final evidence proves, does not prove, and leaves unresolved? |
| RQ5 | Can the same frozen experiment be replayed twice with equivalent results and claim ceilings? |

## Experimental Domain

Use the real private `projects/auth-user-management` package and its
`auth-access-control` bounded context. The first rule is
`AuthorizeRequest.R3`:

> Deny rules override allow rules.

Candidate typed path:

```text
DenyOverridesRule          --[enforces]--> AuthorizeRequest
PermissionResolutionPolicy --[applies]----> AuthorizeRequest
AuthorizeRequest           --[produces]---> AccessDenied
```

If the domain owner accepts the current implementation-aligned carrier, the
operation also `reads` `PermissionGrant` during authorization. That edge is not
yet admitted because the current auth ontology records `CON-04`: the documented
authorization input cannot carry a DENY effect and the documents do not decide
where DENY enters the decision.

The candidate business meaning, first bounded `FormalClaim`, planned
obligations, and ontology/EVF map live at:

`projects/auth-user-management/development/evf-experiments/2026-08-29-deny-overrides/`

Private identifiers, source prose, code, and evidence must not be copied into a
public talk without an explicit public-safe transformation and disclosure
review. This plan does not make the rule or candidate artifacts DomainSpec
authority.

## Target Vertical

```text
authored business phrase and examples
  -> typed DomainSpec source claim
  -> admitted executable projection
  -> deterministic TDE obligation and case set
  -> exact implementation binding
  -> runtime and selected provider execution
  -> positive and deliberately wrong results
  -> EVF normalized evidence handle and claim ceiling
  -> independent interpretation review
  -> returned domain question or refinement
```

This is deliberately stronger than replaying the existing candidate-local L0/L1
fixtures. The current architecture says no receipt proves this complete vertical.
The experiment succeeds only at the exact boundaries it actually crosses.

This is the **talk-experiment vertical**, not EVF's complete system-level
vertical. Independent interpretation review measures human comprehension; it
does not substitute for the independently authored consumer receipt required by
the full EVF architecture.

## Regimes

| Regime | Controlled change | Expected result | Talk lesson |
| --- | --- | --- | --- |
| A — aligned | Reviewed meaning, correct binding, correct implementation | Positive path passes; required negative controls fail; receipt stays bounded. | What the evidence chain can establish. |
| B — wrong implementation | Freeze a separately bound faulty implementation while retaining A's reviewed meaning and obligation; never reuse A's implementation binding. | EVF withholds the positive result and identifies the implementation/binding seam. | Evidence can reject an implementation that violates the modeled rule. |
| C — wrong meaning, internally consistent | Plant an incorrect or incomplete domain assumption before formalization; keep model and implementation consistent with it; preserve a separately owner-authored debrief key or accepted business example. | Technical evidence may pass; a reviewer blinded until debrief must reject or question the source meaning. Preserve failure to detect it. | Formal verification cannot prove that the team modeled the right business meaning. |
| D1 — stale source | Change exactly one bound source rule or policy version, then verify the old receipt before issuing new evidence. | Currentness validation rejects reuse of the earlier receipt. | Evidence applies to exact meaning. |
| D2 — stale fixture | Change exactly one bound example/fixture, then verify the old receipt before issuing new evidence. | Currentness validation rejects reuse of the earlier receipt. | Examples are part of the evidence boundary. |
| D3 — stale implementation | Change exactly one bound implementation artifact, then verify the old receipt before issuing new evidence. | Currentness validation rejects reuse of the earlier receipt. | Evidence applies to exact executable bytes. |
| E — unresolved provider | Force one feasible controlled timeout in the selected provider under a declared execution policy. | Result remains unresolved or blocked; no inferred pass. | Unknown is useful evidence and must not be flattened into success. |

Regime C must be ethically planted and revealed during debrief. It is a test of
the method, not a test of a participant.

## Measures

| Measure | Collection | Initial adjudication |
| --- | --- | --- |
| Trace completeness | Required artifact links present and digest-bound | Pass only when every selected boundary is traceable. |
| Negative discrimination | Required wrong variants rejected | Report exact killed/survived counts; do not hide survivors. |
| Replay stability | Two runs over frozen inputs | Pass only when results and claim ceilings are equivalent under the declared determinism contract. |
| Fault localization | First affected seam and full blocker set retained | Report whether the failure identifies meaning, derivation, binding, execution, composition, or review. |
| Claim comprehension | Independent participant explains “proves,” “does not prove,” and “unknown” in their own words | Preserve participant denominator, role, prior exposure, prompt, assistance, completion time, and answers. One session supports only a qualitative pilot lesson. Set a threshold only after a pilot shows the rubric is usable. |
| Meaning correction yield | Planted ambiguity or wrong assumption is detected, challenged, or accepted with rationale | Descriptive pilot result; no product KPI claim. |
| Observed recovery burden | Time and questions needed to resume from the experiment pack | Record one observation; without a comparator it is not a baseline, improvement result, or ergonomics success threshold. |

## Evidence Bundle

Each live attempt should preserve:

- experiment and regime identity;
- source business phrase, examples, owner, and bounded context;
- typed claim and exact source digest;
- obligation and case identities;
- implementation binding and executable identity;
- provider/runtime manifest;
- positive and negative observations;
- native and normalized results, including timeout or unknown;
- EVF evidence handle and explicit claim ceiling;
- independent interpretation participant denominator, role, prior exposure,
  prompt, assistance, completion time, and notes;
- protocol deviations and unresolved questions; and
- public-disclosure classification for each presentation artifact.

## Work Units

| Unit | Outcome | Depends on | Current state |
| --- | --- | --- | --- |
| EXP-001 | Decide the DENY carrier, approve the bounded R3 meaning and declared loss, choose any planted ambiguity, and approve the public boundary. | none | proposed |
| EXP-002 | Freeze the experiment protocol, run fields, regimes, measures, and pass/fail rubric. | EXP-001 | not selected |
| EXP-003 | Build or bind the smallest selected experiment vertical through EVF without claiming the complete source-to-consumer vertical. | EXP-002, validated EXP-004 dry run, accepted semantic/admission contract, selected provider/runtime, and exact implementation/execution authority | not selected |
| EXP-004 | Validate the evidence schema with one passing and one failing synthetic fixture. | EXP-002 | not selected |
| EXP-005 | Execute regimes A–E and replay the frozen aligned regime twice. | completed EXP-003 plus frozen, validated EXP-002/EXP-004 protocol | not selected |
| EXP-006 | Run an independent DDD/domain interpretation session and debrief. | EXP-005 | not selected |
| EXP-007 | Produce a public-safe experiment report, talk outline, and claim review. | EXP-005 and EXP-006 | not selected |

## Relative Schedule

Because the Sessionize page has no future event date, use readiness milestones
rather than promising a calendar deadline:

1. **Meaning ready:** EXP-001 accepted.
2. **Protocol ready:** EXP-002 and EXP-004 validated.
3. **Technical ready:** EXP-003 crosses the selected vertical.
4. **Evidence ready:** EXP-005 produces validated attempts and replay.
5. **Audience ready:** EXP-006 shows how people interpret the evidence.
6. **Submission ready:** EXP-007 passes public/private and claim review.

The work can begin before a new CFP opens. “Ready before the event” becomes a
credible claim only after the event date and these milestone estimates are known.

All faulty variants must be isolated experiment-local inputs with independent
bindings. They must never mutate admitted or canonical bytes in place.

## Feasibility Blockers

| ID | Blocker | Effect |
| --- | --- | --- |
| EXP-B-001 | Auth R3 exists, but its DENY carrier is unresolved (`CON-04`); the bounded FormalClaim has no two-owner formalization acceptance or admitted executable projection. | Does not block EXP-001, EXP-002, or synthetic EXP-004; blocks live EXP-003 and EXP-005. |
| EXP-B-002 | No exact DS-SFOL projection, obligation derivation context, or provider/runtime is selected for Auth R3. Current SMT work is protocol-only, the formal-model provider is unapproved/unexecuted, and current L2 evidence covers one bounded reachability property. | Does not block protocol work; blocks technical-feasibility and live-execution claims. |

## Success And Failure

The experiment is useful if it produces honest evidence about the boundary
between domain meaning and formal evidence. A failed provider, a surviving
mutation, a wrong source rule, or participant confusion may be stronger talk
material than a clean demonstration, provided the failure is preserved and not
reframed as success.

The experiment does not validate CyberAlchemy as a product, prove organization-
wide DDD adoption, grant EVF release authority, or authorize publication.

## Next Gate

Select and review `EXP-001`. Only after its meaning and public boundary are
approved should `research-evidence-harness` create run schemas, fixtures,
validators, or metrics for `EXP-002`/`EXP-004`. Live execution must wait for
their dry-run validation, both feasibility blockers, and the exact EVF
implementation/execution authority required by `EXP-003`.
