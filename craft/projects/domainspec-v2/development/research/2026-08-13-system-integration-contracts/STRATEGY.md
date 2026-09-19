# DomainSpec v2 System-Integration Contracts Research Strategy

This is a confirmation-ready, non-authority research proposal. It does not
change DomainSpec definitions, admit a profile, implement an integration,
prove consistency, or authorize publication or deployment.

## Preliminary finding

DomainSpec v2 currently names several logical domain and application concepts
that integrations need: `Interface`, `Event`, `Mapping`, `Workflow`,
`Operation`, `Query`, and `State Machine`, plus relationships such as
`exposes`, `maps`, `produces`, `triggers-cross`, `transitions`, and
`orchestrates`. That is not yet a complete system-integration model.

Current inspected sources do not define canonical contracts for databases,
repositories, ORMs, migrations, transactions, concurrency, external
transports, brokers, channels, delivery guarantees, retries, idempotency,
outbox/inbox behavior, or consistency. The experimental minted-project
profile is narrower still: it admits only `Entity`, `Event`, `Operation`, and
`Rule` plus three relationships, and it has no release admission.

The central research question is therefore not “which missing products become
meta-types?” It is which concerns belong to domain semantics, application
contracts, infrastructure bindings, technology profiles, runtime guarantees,
validator obligations, operational evidence, and owner authority—and how
those layers connect without collapsing into one another.

## P1 trigger decision

This is a governed research dispatch. It needs three distinct evidence
corpora and methods, must keep raw research out of the parent context, and
requires independent attacks on duplication, non-vacuity, and authority
collapse before one findings artifact can be trusted. The bounded route uses
nine research agents only after explicit human confirmation.

## Lanes and subagents

| Group | Subagent | Role and angle | Expected output |
| --- | --- | --- | --- |
| Explorers, parallel | `Tarski, Alfred` | Current DomainSpec authority and implementation archaeology | Current define/declare/bind/implement/validate/observe/govern matrix; owner map; exact selectors and hashes; observed/designed/absent/blocked classifications |
| Explorers, parallel | `Imieliński, Tomasz` | Persistence, ORM, transactions, migrations, concurrency, and local consistency | Primary-source persistence taxonomy; candidate verdicts; local positive fixture and hostile storage failures |
| Explorers, parallel | `Hewitt, Carl` | External APIs, webhooks, messaging, delivery, and distributed consistency | Primary-source integration taxonomy; candidate verdicts; positive fixture and hostile network/message failures |
| Synthesizer, dependent | `Spivak, David` | Non-collapsing contract architecture | Layer model, concern matrix, owner and gap maps, bounded vocabulary, exact-binding evidence-closure candidate |
| Reviewers, parallel | `Rittel, Horst` | Precedent and duplicate-owner attack | Reuse/merge routes and verified precedent classification |
| Reviewers, parallel | `Popper, Karl` | Finite non-vacuity and failure-discrimination attack | End-to-end fixture, hostile cases, typed `KILL` decisions |
| Reviewers, parallel | `Quine, Willard Van Orman` | Definitional and authority non-collapse attack | Bounded vocabulary and corrected claim language |
| Writer, dependent | `Noether, Emmy` | Evidence-closed technical findings | `findings.md` only |
| Auditor, dependent | `Bourbaki, Nicolas` | Final exact-binding and claim-ceiling audit | `ACCEPT` or one bounded writer-revision list |

The explorer anti-bias axis is methodology and source corpus: repository
archaeology versus stateful persistence semantics versus distributed
integration protocols. The reviewer anti-bias axis is attack vector:
precedent/duplication versus non-vacuity/failure discrimination versus
definitional/authority collapse. Every unordered pair in both three-agent
groups has an exact-sheet `predicted_disagreements` record.

## Dependency flow

`explorers -> synthesizer <-> reviewers -> exact-binding evidence closure -> writer -> auditor -> parent`

- Explorers join before synthesis.
- Synthesizer and reviewers have one bounded zig-zag revision.
- The synthesizer has one bounded feedback edge to explorers for missing
  evidence.
- Review receipts must close exact-binding evidence before the writer starts.
- The auditor has one bounded writer-revision edge.
- Global `max_loops` is two; the parent remains final approver.

## Expected findings shape

The research must deliver:

1. A direct, source-grounded current-state answer.
2. A non-collapsing layer model.
3. A define/declare/bind/implement/validate/observe/govern matrix covering
   databases, persistence, repositories, ORMs, migrations, APIs, webhooks,
   buses, brokers/channels, transactions, consistency, concurrency, retry,
   idempotency, outbox/inbox, secrets, observability, and validators.
4. Owner, artifact, dependency, and gate maps.
5. Candidate vocabulary with `KEEP`, `MERGE`, `PROFILE-LOCAL`, `DEFER`, or
   `KILL` verdicts; a new type survives only with a distinct invariant, owner,
   lifecycle, failure mode, and evidence artifact.
6. One finite domain-to-storage-to-transport fixture plus discriminating local
   and distributed failure cases.
7. A smallest implementation/adoption sequence with explicit authority gates
   and a claim-ceiling matrix.

## Inventory preflight

The root machine Inventory passed lookup readiness at the captured digest, but
its source coverage is partial and `projects/domainspec-v2` has no
consumer-local machine index.

Selected discovery leads:

- `domainspec-v2-implementation-structure-enforcement-research-result-synthesis`
  for implementation-profile boundaries and explicitly deferred runtime
  concerns;
- `domainspec-language-type-enforcement-proof-strategy-result-synthesis` for
  the structural-validation claim ceiling;
- `domainspec-v2-evolvable-validation-framework-strategy-result-synthesis`
  for source, registry, profile, formation, evaluator, and receipt separation;
- `domainspec-v2-composability-edges-taxonomy-synthesis` for taxonomy, typed
  edges, and realization, subject to current-source re-verification;
- `entries-ddd-process-manager-email-uniqueness-strategy-result-synthesis` for
  coordination versus storage-enforced uniqueness;
- `wavedb-craft-runtime-research-result-synthesis` for database posture,
  migration, and bounded failure evidence without authority transfer;
- `entries-resonantos-living-archive-seam-and-owned-base-synthesis` for
  host-owned ports versus provider realization.

Excluded as superseded or non-owning:

- the earlier implementation-structure strategy proposal, superseded by its
  completed result;
- the earlier WaveDB strategy proposal, superseded by its completed result;
- the candidate CAV2 deterministic-validation design, because it is
  intended-not-shipped and does not own DomainSpec infrastructure realization.

The remaining gaps directly shaped the three explorer lanes. No selected
entry owns a DomainSpec ORM, repository, external transport, bus, broker,
outbox/inbox, or consistency contract; the placement among DS-D1, DS-D8,
profiles, bindings, and operational contracts is undecided; and no current
fixture spans domain graph, storage, transport, failure policy, validation,
and claim-limited receipt.

## Gate and ledger state

- Live form/schema: `0.8.0`; confirmation readiness: `PASS`.
- Frozen sheet SHA-256:
  `49d3a4682b0c388501a7f344dc827382fecab36ce4be701db3e12fd112fe1c96`.
- Material-strategy SHA-256:
  `0de2aa4bb3c72583d9cf8c1cbd42b292b2d1d98d5bae3371d2db93177432d89d`.
- Dispatch Spec route validation: `PASS`.
- Check-tension: independent `PASS/PASS`, no apontamentos, exact digest.
- Human confirmation: required and not yet granted.
- Registration: not run; dispatch ledger unchanged.
- Execution: zero of nine proposed research agents launched.
- Closeout expectation: every agent must be joined and receipt-bound; the
  dispatch receives a close row only after evidence closure and final audit.

Allowed future writes are confined to the declared research folder and the
append-only dispatch/Inventory evidence required by the governing workflow.
Existing definitions, profiles, implementation, validators, Craft state,
public Arcanum, Git, and external systems remain forbidden.

## Next human action

Reply exactly `confirmed` to authorize registration and execution of this
frozen proposal. Any other response is discussion or a revision request, not
dispatch confirmation.
