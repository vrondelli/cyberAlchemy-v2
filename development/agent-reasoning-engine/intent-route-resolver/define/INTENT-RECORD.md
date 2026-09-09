# Intent record

## Raw intent

> define design and plan this probably should be a small run time, a router, we
> receive intention and then answer possible route or ambigous i think we
> already have it inside agent-reasoning-engine part of it

- Capture source: current operator conversation
- Projection schema: `intent-record.selected-local@1`
- Status: `candidate`

## Projected intent

| Field | Posture | Value | Evidence |
|---|---|---|---|
| source | declared | operator | current request |
| purpose | declared | Define, design, and plan a small runtime that receives intent and returns a possible route or ambiguity. | current request |
| scope | declared | Private Agent Reasoning Engine child capability; explain Augmentor composition; no implementation in this pass. | current and preceding confirmed requests |
| constraints | inferred | Preserve existing owners; do not make the resolver an execution or approval authority. | current engine contracts and Augmentor research; inference is required to avoid owner collapse |
| target_pressure | inferred | Route selection currently exists as prose and scattered owner contracts rather than one reusable front-door runtime. | repository audit |
| current_output_hypothesis | declared | A small router-like runtime inside `agent-reasoning-engine`. | current request |
| revision_route | declared | operator through a later Invoke refresh or explicit replacement request | current conversation |

The raw expression remains intact. The inferred constraints and target pressure
do not replace it, and this record grants no implementation authority.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
