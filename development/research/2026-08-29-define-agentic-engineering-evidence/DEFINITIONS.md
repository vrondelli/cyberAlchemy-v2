# Local Definition Cards

Promotion status for every card: `local-research-only`.

## Definition Intervention

**Formal shape**

```text
I = (G, N, P, E)
```

where:

- `G` is the frozen goal, intent, context, and raw source corpus;
- `N` is an optional information-matched note representation;
- `P` is an optional structured Definition Pack representation; and
- `E` is an optional runtime evidence gate.

**Plain meaning:** the experiment changes how the same work meaning is exposed
and enforced while keeping task and source identity fixed.

**Intuition:** if notes and the pack contain different facts, the experiment
cannot tell whether structure or information caused the result.

**Anti-misuse:** `P + E` is not “Define alone.”

## Semantic Defect

A downstream plan or implementation has a semantic defect when it contradicts
the frozen truth card for goal, intent, context, required concepts, ownership,
allowed action, or blocked action.

Severity weights for analysis are:

- critical = 5;
- major = 2;
- minor = 1.

The weights are experiment policy, not a canonical CyberAlchemy scale.

## Information Parity

Equivalent notes and the Definition Pack have information parity when the same
frozen set of task-relevant factual propositions appears in both conditions,
even though their structure and presentation differ.

Information parity does not require identical words or length. It requires a
reviewable fact-set manifest and digest.

## Evidence-Conditioned Commitment

An action is evidence-conditioned when a runtime may proceed only after the
trajectory contains the observations required for that action class.

This is borrowed carefully from ECLoop as a separate experimental intervention.
It is not promoted into the Define contract by this tower.
