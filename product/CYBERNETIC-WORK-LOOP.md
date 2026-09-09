# CyberAlchemy's Controlled Work Loop

Status: candidate explanatory companion
Visibility: private
Meaning owner: CyberAlchemy v2
Authority effect: none
Thesis: [CyberAlchemy Product Thesis](PRODUCT-THESIS.md)

## Purpose And Product Promise

CyberAlchemy helps people and machines build and evolve complex systems while
keeping purpose, meaning, evidence, action, and ownership connected. Its value
depends on whether the work moves toward the intended result and remains under
human control, not simply on how many artifacts or automated actions it produces.

Here, cybernetic framing makes that practical question visible: what happened
after an action, how does it compare with what was wanted, and what should change
next? This explanation adds no canonical definitions, runtime schemas, or
authority. The thesis's ten first-order principles remain the product commitments.

## The Operating Loop

```text
human purpose + immediate desired result + expected evidence
                            |
                            v
                 choose a useful permitted action
                            |
                            v
                   act -> observe the result
                            |
                            v
                  compare with expectations
                            |
          +-----------------+-----------------+----------------+
          v                 v                 v                v
       continue           adjust             ask              stop
          |                 |                 |                |
          +-----------------+-----------------+----------------+
                            |
                            v
              preserve evidence, state, owner, and gaps
                            |
                            v
              next permitted step, handoff, or parked work
```

The immediate desired result supplies the comparison point. A broader Project
and Goal explain why it matters, but do not substitute for today's completion
condition. Expected evidence makes success assessable before a plausible-looking
output can be mistaken for completion.

A permitted action has a bounded target and effect. Observations describe what
actually happened, with their source and applicable conditions. Comparison may
support the expected result, contradict it, or leave it unknown. A validator can
check a declared property; a receiving owner may need to judge whether the output
is usable. Neither judgment proves properties it did not examine.

Continue when a further useful step is within scope. Adjust when evidence calls
for a correction inside that scope. Ask when missing input or a consequential
choice prevents that step. Stop when the objective is complete, the person ends
the work, or no further permitted action is available. Record which reason
applies: stopping and achieving the result are different outcomes.

## Human Purpose And Control

People supply purpose and retain judgment over consequential choices. Machines
can recover context, propose interpretations, prepare alternatives, check stated
conditions, and perform permitted work. Feedback may reveal that an approach is
wrong; it does not silently authorize changing the goal or broadening an action.

The ordinary surface can show the result, material assumptions, and next choice.
The person must also be able to inspect the evidence and interpretation, correct
them, pause, redirect, or reject the proposed continuation. Explicit human context
can shape timing and detail; inferred fatigue or confidence is not a substitute
for that context. A quieter interface cannot conceal domain-critical work.

## State And Owner Continuity

The loop needs enough inspectable state to carry the purpose, selected meanings,
evidence, decisions, observed outcomes, unresolved questions, and next owner into
later work. Currentness and applicability matter: a familiar old conclusion may
depend on a source or instruction that changed.

A handoff identifies the receiving owner, the exact output, what was checked,
what remains uncertain, and the next decision or evidence owed. Preparing that
handoff does not prove receipt, acceptance, or successful use. Parked work retains
its unresolved condition so resumption does not require reconstructing the chat.

This state supports continuity. It does not imply that every product interaction
creates permanent memory or that the system stores hidden model chain-of-thought.

## Feedback, Delay, And Corrections

Some observations arrive immediately, such as a consistency check. Others arrive
when another person uses the output or a later test runs. Preserve a pending or
unknown result while waiting; silence does not establish satisfaction. When new
feedback arrives, bind it to the output version, action, and conditions it concerns
before using it to revise current work.

Attribute a correction to its source and scope. Distinguish a misunderstood
request, changed intent, stale evidence, failed execution, and a presentation
preference: they can require different repairs. Conflicting feedback stays
visible until the relevant meaning or decision owner resolves it.

Repairing today's result, updating the current context, retaining a reusable
convention, and proposing a product change are separate effects. The person can
narrow or revoke retention without losing the immediate correction. Recurring
failures can motivate investigation; they do not establish their own cause.

## Example: Preparing Shared Meaning For Design

Suppose a person asks for shared meaning for a booking feature before Design.
The immediate result is a reviewable Definition Pack that distinguishes a
temporary reservation from a confirmed booking, with unresolved questions visible.
This is an illustrative product interaction, not a report of a completed run.

Define uses the person's references and applicable work context to prepare
candidate meanings. The expected result includes a distinction Design can use
and an explicit gap wherever the available evidence is insufficient. A check
can establish that required fields exist; the person or receiving owner must
still assess whether the meanings support the intended work.

If the person corrects “a reservation guarantees capacity,” preserve that
correction and its source, revise the affected candidate, and check it again.
If capacity policy is unknown, record the question and its owner instead of
inventing a policy. Independent supported definitions can continue while that
question remains visible.

The handoff carries the selected meanings, evidence, correction, and open policy
question to Design. Design's response supplies further feedback about usability.
A prepared pack does not canonize its terms, approve Design, or authorize
implementation. The local objective ends at its declared completion condition.

## How ARE Supports The Product

ARE's product model connects reusable explicit reasoning state, checked
interpretation, scoped learning, and measured engine experiments. It can support
CyberAlchemy's continuity and assessment; it is not the entire human-machine
product, its meaning owner, or a source of operational authority.

The [ARE thesis](../agent-reasoning-engine/README.md#product-thesis) and
[detailed explanation](../agent-reasoning-engine/REASONING-AND-LEARNING.md)
distinguish existing state, context, intent, and continuation pieces from planned
general objective transitions and full interaction-learning integration. This
companion describes intended product behavior, not a verified end-to-end runtime.
It introduces no universal autonomous self-upgrading promise.

## Useful Measures And Counterevidence

Test a bounded realization against the same class of work without it. Measure
whether people identify the right next step, how long context recovery takes,
whether a receiving owner can use the handoff, how often meaning must be repaired,
and whether scope, privacy, and domain priority survive. Track checking and
coordination costs alongside any time saved.

Include delayed and missing outcomes, conflicting corrections, stale evidence,
interruptions, and return-to-work cases. Count unnecessary questions, premature
completion, and continuation after the objective is finished. A document count
or passing schema alone cannot establish usefulness or continuity.

Repeated wrong next steps, greater recovery cost, lost handoff ownership, hidden
choices, or a simpler approach producing better outcomes are counterevidence.
Declare a useful gain and protected properties before comparing a proposed
improvement with its baseline. If repeated trials show no gain, revise or stop
that experiment; do not extend it indefinitely or weaken the checks. A successful
candidate still needs its separate product and operational decisions.

## Construction Frontier And Operational Support

Current product-construction work is this explanatory revision of the thesis.
It can be reviewed now against its source meanings and claim boundaries. It does
not implement the integrated loop or replace an existing capability's work plan.
No runtime validation or product-test result is created by this prose change.

Operational support has no execution stage in this change. Projection maintenance
belongs to the owners of any affected records; publication and deployment remain
outside this documentation scope. No operational blocker is asserted as a reason
to suspend the runnable explanation work.

## Open Questions

- Which bounded work episode should first test the complete product loop?
- What observable outcome establishes a useful handoff for each receiving stage?
- How should delayed or contradictory feedback reopen a previously assessed result?
- Which retained corrections need explicit scope, expiry, or revocation controls?
- What minimum useful gain justifies the added context and coordination cost?

## Source Basis

This companion develops the [main thesis](PRODUCT-THESIS.md), its
[document contract](PRODUCT-THESIS-DOCUMENT-TYPE.md), and the existing private
[value and philosophy proposition](../VALUE-AND-PHILOSOPHY-PROPOSITION.md).
The ARE sources above inform the distinction between work, scoped learning, and
tested engine changes; they do not prove CyberAlchemy's whole product promise.
