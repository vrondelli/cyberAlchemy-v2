# L2 — Synthesis And Submission Approach

## Recommended Approach

Use the framing:

> Formal evidence is not the end of domain modeling. It is another way to ask the
> domain model a precise question and return the answer, counterexample, or
> uncertainty to the team.

This fits the CFP as a practical DDD experience, connects strategic and tactical
concerns, and leaves enough room to explain architecture without making the talk
a tool demonstration.

## Why This Approach Is Stronger Than A Product-Thesis Talk

A talk led by “CyberAlchemy integrated with DomainSpec v2” asks the audience to
understand two unfamiliar names before they know the problem. It also risks
reading as a product pitch despite the product thesis being a private, unvalidated
candidate.

The recommended talk leads with the audience's problem, uses one concrete domain
rule, and introduces the system names only as implementation context. The product
thesis contributes the human goal: the work should remain understandable,
challengeable, and resumable. EVF contributes the technical experiment.

## Concrete Example

Use one sanitized financial-settlement story rather than the key-and-door toy in
the main narrative:

```text
EligiblePayout --[enforces]--> ReleasePayout
ReleasePayout --[produces]--> PayoutReleased
```

Walk through these questions:

1. What does “eligible” mean in this bounded context?
2. Which exact operation is gated?
3. What obligation follows from the rule?
4. Which implementation behavior is bound to that obligation?
5. Which valid example must pass?
6. Which deliberately wrong variants must fail?
7. What does the receipt allow the team to say?
8. Which counterexample or unknown must return to the domain conversation?

The final public example must be independently sanitized and must not reuse
private fixture prose or identifiers without a disclosure decision.

## 35-Minute Arc

| Time | Segment | Audience result |
| --- | --- | --- |
| 0–4 min | The lost chain from domain conversation to code and tests | Recognize the problem. |
| 4–9 min | DDD bridge: ubiquitous language, context, model-driven design | Understand why this remains DDD. |
| 9–21 min | One rule end to end | See typed claim, obligation, binding, positive case, mutation, and receipt. |
| 21–27 min | Formal evidence ladder | Distinguish test, bounded model, theorem, runtime observation, and their limits. |
| 27–32 min | What failed or remains hard | Learn translation, usability, ownership, and drift lessons. |
| 32–35 min | Practical adoption ladder | Leave with an incremental method and questions to try. |

## Practical Adoption Ladder

1. Choose one important rule in one bounded context.
2. Write it in the ubiquitous language and name its owner.
3. Represent only the concepts and relation needed for that rule.
4. State the obligation in plain and machine-checkable forms.
5. Bind the obligation to one implementation behavior.
6. Run a valid example and deliberately wrong variants.
7. Record what the evidence proves and what it does not prove.
8. Return failures, ambiguity, and missing cases to the domain conversation.
9. Add a formal provider only when risk and expected learning justify its cost.

## Proposal Decision

Recommend advancing this angle to abstract drafting after:

- the user confirms the actual current CFP or target event;
- a public/private disclosure boundary is selected;
- the example is sanitized; and
- the submission describes this as an experiment and learning report, not an
  organization-wide adoption case.
