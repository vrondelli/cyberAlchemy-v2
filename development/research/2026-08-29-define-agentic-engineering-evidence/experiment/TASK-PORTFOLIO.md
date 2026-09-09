# Define Experiment Task Portfolio

Status: `selected-baseline-green-not-started`

This portfolio fixes the six repository tasks for the first Define experiment.
The selection happened before any condition output was produced.

The experiment has four meaning-heavy tasks and two clear controls. Body War
and Poker Team were named by the product owner. The other four were selected
from clean, implemented repository paths.

## Selected Tasks

| Task | Band | Concrete implementation target | What hidden checks protect |
| --- | --- | --- | --- |
| Body War business-view atlas | high ambiguity | Reconstruct `projectViewAtlas` and `deriveLensFlows`. | All nodes and relations remain represented; business kinds map once; portal direction and parallel relations survive; flows partition all portals; isolate dispositions stay exact. |
| Poker Team financial settlement | high ambiguity | Reconstruct the `generateSettlement` use-case orchestration. | Profit share, makeup, rakeback, payout creation, event payloads, duplicate prevention, and separate makeup/payout idempotency. |
| RPV Origination canonical normalization | high ambiguity | Reconstruct the current Python `normalize` boundary. | Decimal-safe values; explicit zero; missing but applicable; not applicable; closed fields; deterministic checksum; safe errors with no raw-value leak. |
| IDE Extension Operations V1 append | high ambiguity | Reconstruct the append branch of `createOperationsService().operate`. | Parser-correct body append; byte limits; invalid UTF-8 rejection; retry and conflict behavior; concurrent writers; event/projection failure recovery. |
| DomainSpec v2 proof lifecycle and accounting | low control | Reconstruct proof accounting and the proof-state transition functions. | One legal transition chain; terminal blocking; complete positive and mutation accounting; exact diagnostic codes. |
| UI Prototyping Studio HTML canonicalization | low control | Reconstruct `canonicalizeHtml` and `canonicalHash`. | Idempotence; sorted attributes; collapsed whitespace; preserved `data-od-id`; void/raw-text handling; stable hash. |

The machine-readable selection is
[`evidence/live-task-selection.json`](evidence/live-task-selection.json).

## Why These Tasks Form A Useful Set

The high-ambiguity tasks can fail while still looking reasonable. For example,
a settlement can return the right amount but emit a duplicate event. An atlas
can contain all nodes but reverse a portal. An append can render correctly but
write twice after a retry.

The controls have clear function boundaries and direct expected behavior. If a
large Define pack improves only the controls, the experiment has not shown that
Define helps with difficult product meaning.

The six tasks also use different domain languages:

- health and business ontology;
- poker finance;
- legal receivable normalization;
- interactive tool persistence;
- proof evidence; and
- HTML transformation.

This reduces the chance that the result is only a feature of one project or one
kind of code.

## Baseline Verification

The current hidden-truth suites passed before challenge material was created:

| Task | Result | Runtime |
| --- | --- | --- |
| Body War business-view atlas | 8 of 8 passed | Node 26 container |
| Poker Team financial settlement | 9 of 9 passed | Node 26 container |
| RPV Origination canonical normalization | 8 of 8 passed | Python 3.12 project environment |
| IDE Extension Operations V1 append | 5 of 5 passed | Node 26 container |
| DomainSpec v2 proof lifecycle and accounting | 9 of 9 passed | Node 26 container |
| UI Prototyping Studio HTML canonicalization | 6 of 6 passed | Node 26 container |

The selection validator also passed the required shape: six selected tasks,
four `high_ambiguity` tasks, and two `low_ambiguity_control` tasks. Its
classification, hidden-case minimum, and six-task-shape regression checks pass.

These results show that the current reference behavior is green. They do not
show that a withheld-target challenge is fair or that any Define condition
improves implementation.

## Isolation Rule

Each later experiment cell gets its own local sandbox from repository commit
`1a9281557258b7182c6793859d8c2bf77a9c1d0d`.

For each task:

1. Keep the public interfaces and required dependencies.
2. Withhold only the implementation target named in the table.
3. Keep the current implementation and semantic tests outside the agent-visible
   sandbox as hidden truth.
4. Give every condition the same task facts. Change only how those facts are
   represented: ticket, notes, Define pack, or Define pack plus evidence gate.
5. Run the hidden checks only after the implementation attempt ends.

This is a replay benchmark. It does not ask an agent to invent a new product
decision and then judge it against an answer created after the fact.

## Not Selected

- Auth User Management permission precedence is a strong future task, but fresh
  related EVF material exists in that project tree. It is excluded until the
  semantic source and writer state are frozen.
- Co-op Engine's Whisper state contract is a reserve. Its 26-event lifecycle,
  correction binding, replay, projection, negative cases, and receipt equality
  form too large a reconstruction surface for the first pilot.
- The older RPV Node normalization reference is not used. The project README
  identifies the Python path as current and says the Node candidate is not
  expected to pass.

## Claim And Authority Limit

This document selects tasks only. It does not authorize model runs, accept any
condition material, prove that Define helps, publish results, or change product
code.

Before the live run, the next preparation step must freeze the exact visible
task cards, hidden target bytes, hidden check bytes, dependency closure, and
per-task validation command. Those frozen digests must be identical across the
four conditions for each task.
