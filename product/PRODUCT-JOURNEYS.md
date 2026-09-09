# CyberAlchemy Product Journeys

Status: candidate
Visibility: private
Meaning owner: CyberAlchemy v2
Authority effect: none

This document turns the product thesis into work a person can recognize. It
describes intended product behavior, not a claim that the CLI, chat, runtime, or
DomainSpec projection is already implemented.

The journeys project first-order product principles into experience. Missing
runtime proof limits implementation and outcome claims; it does not make the
principles optional.

## Journey 1: From Goal To A Definition Pack

### Starting situation

A person has a goal and wants to move toward Design. Past conversations,
definitions, decisions, files, and evidence may contain important meaning, but
they are incomplete or spread across places.

### Desired ending

The person and Design can inspect a Definition Pack that shows:

- where to start and what needs attention now;
- every concept required by the goal;
- the current decision for each concept;
- evidence and relationships supporting that decision;
- the applicable scope and owner;
- every concept that remains unresolved;
- whether the receiving Design stage accepts the pack as input.

The pack is useful when it makes the next step reviewable. It is not useful
merely because a file was generated.

### Intended path

| Step | Human experience | Machine contribution | Durable state |
| --- | --- | --- | --- |
| 1. State the goal | Explain the intended change in ordinary language. | Parse the goal and locate likely prior evidence. | Goal and evidence references. |
| 2. Recover past meaning | See what earlier work already decided and where evidence is missing or stale. | Retrieve relevant evidence and show provenance or uncertainty. | Candidate evidence set and gaps. |
| 3. Find required concepts | Confirm which concepts Design must understand. | Propose concepts and relationships implied by the goal and evidence. | Required-concept set. |
| 4. Resolve one concept | Reuse, specialize, define a new candidate, or leave the concept open. | Ask one useful question, show relevant evidence, and check the answer for conflict. | Concept decision or visible open question. |
| 5. Review coverage | See what is resolved, challenged, or still missing. | Check that no required concept silently disappeared. | Coverage view and residue. |
| 6. Build the pack | Review the whole set before handoff. | Produce a consistent candidate pack with evidence, owners, and relationships. | Definition Pack candidate. |
| 7. Hand off to Design | Know whether Design accepted the input and what remains open. | Present the pack and record the receiving response. | Accepted input, requested clarification, or explicit stop. |

### Interactive wizard behavior

The intended Define experience is an interactive wizard shared by CLI and
chat:

- the current question remains visible until it is answered, deferred, or
  withdrawn;
- the same question has one stable identity in CLI and chat;
- the interface can change explanation depth and interaction speed for the
  person's explicit context without changing the question's meaning or identity;
- prior answers and evidence can be inspected without losing the active
  question;
- the user can challenge the proposed concept or evidence;
- a restart restores the visible state instead of pretending the interview is
  complete;
- the restored view shows the current objective, active question, relevant
  evidence, unresolved work, and next allowed or blocked action;
- the interface distinguishes a suggestion, a user choice, and an owner
  decision.
- a user answer changes the session state but does not by itself promote a
  definition, approve Design, or authorize execution.

This is the product requirement for a future business-system bridge. It is not
evidence that the wizard runtime exists.

### Decision paths for one concept

```text
required concept
    +-- reuse existing meaning
    +-- specialize existing meaning
    +-- propose a new candidate meaning
    `-- keep as an open question
```

All four paths are valid. The failure is silently dropping the concept or
presenting an unsupported choice as settled.

### Stop and recovery paths

| Condition | Product behavior |
| --- | --- |
| Relevant past evidence cannot be found | Keep an explicit evidence gap and ask whether to continue with a bounded premise. |
| Evidence conflicts | Show the conflict; do not select the convenient source silently. |
| A required concept has no owner | Keep the concept open and route ownership as a decision. |
| The user defers a question | Preserve the question and explain which later result it limits. |
| Evidence becomes stale | Mark the affected decision for recheck without erasing the earlier trail. |
| CLI or chat stops | Preserve the same session state for recovery. |
| Design rejects the pack | Return the named gap to Define; do not claim a successful handoff. |

## Journey 2: Continue Governed Work

Define is one leg of the larger CyberAlchemy loop:

1. Sense the current goal, state, evidence, and constraints.
2. Decide which bounded question or action matters next.
3. Route it to a responsible person, capability, or owner gate.
4. Act inside the allowed boundary.
5. Test the result against the promised change and guardrails.
6. Preserve the result, evidence, counterevidence, and unresolved residue.
7. Hand the work to its receiving owner.
8. Re-sense from the new state.

The loop succeeds only when the receiving stage can continue the work. A clean
handoff document without an accepted receiver is preparation, not continuity.

## Product Rules Across Both Journeys

- Every consequential action shows the authority holder, action, target, scope,
  conditions, and lifecycle point that make the effect allowed.
- Participation, ownership, evidence, recommendations, generated artifacts,
  handoffs, validation success, and earlier acceptance do not silently expand
  authority.
- Governance stays active as checking and routing, but human-interrupting gates
  are concentrated where the consequence changes. Reading, exploration,
  drafting, preview, and reversible local work remain lightweight.
- Candidate-to-canonical, recommendation-to-decision, preview-to-execution,
  local-to-shared or public, and accepted-scope-to-effect transitions must show
  the narrowest responsible authority route.
- The product fits the smallest useful governed action to the current work
  moment, task state, explicitly supplied human context, domain priority, and
  evidence boundary.
- The system carries avoidable memory, routing, reconstruction, and coordination
  burden while the human keeps consequential judgment.
- Meaningful tangents can be parked or handed off without silently switching the
  active route.
- Choices remain small, explainable, reversible where possible, and appropriate
  to the person's stated experience and attention.
- Human indicators are opt-in, local, reviewable, and allowed to remain unknown;
  demanding domain-critical work is not hidden merely because it is demanding.
- Human choice, evidence, and owner remain visible.
- Every work surface provides a clear entry point and makes the current state,
  unresolved work, and next action easy to find.
- Questions are product state, not disposable chat text.
- Missing knowledge is preserved as residue.
- A machine suggestion is not an owner decision.
- A generated artifact is not proof of a useful outcome.
- A handoff is not complete until its receiving state is known.
- The strength of the product claim must stay within the observed evidence.

## Ontology References

The main journey is projected by `CA2-CAP-DEFINE-SHARED-MEANING`,
`CA2-OUTPUT-DEFINITION-PACK`, `CA2-RULE-DEFINE-COVERAGE`,
`CA2-RULE-HUMAN-CHOICE-VISIBLE`, `CA2-RULE-EVIDENCE-OWNER-VISIBLE`, and
`CA2-RULE-WORK-ERGONOMICS`, `CA2-RULE-AUTHORITY-BOUNDED-VISIBLE`, and
`CA2-RULE-GOVERNANCE-SERVES-WORK`.
The future CLI/chat realization remains residue `CA2-RES-DEFINE-WIZARD`.
