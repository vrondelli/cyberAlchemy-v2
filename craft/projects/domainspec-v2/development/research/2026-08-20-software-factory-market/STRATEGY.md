# DomainSpec v2 Software-Factory Market Research Strategy

Status: `confirmation-ready`

Dispatch ID: `2026-08-20-domainspec-v2-software-factory-market`

## P1 Trigger Decision

A governed research dispatch is required. The work must synthesize three
independently falsifiable lenses across more than three source families, the
external market corpus and live local evidence exceed a safe single context, and
independent review is necessary to stop vendor marketing, generic agent mechanics,
or attractive UX from silently becoming DomainSpec v2 semantics.

## Lanes, Groups, and Subagents

1. `explorers` — three agents in parallel:
   - market structure, adoption, maturity, and buyer criteria;
   - software-factory product workflow and runtime architecture;
   - current DomainSpec v2 capability, owner, and reuse fit.
2. `synthesizer` — one agent joins the three lenses into market, ownership,
   branch, and reuse matrices.
3. `reviewers` — three independent agents apply precedent, non-vacuity, and
   definitional-soundness gates.
4. `writer` — one agent writes `findings.md` only after evidence closure.
5. `auditor` — one agent audits exact findings and may request one bounded writer
   repair.

Total intended research agents: `9` — explorers `3`, synthesizer `1`, skeptics
`3`, writer `1`, auditor `1`. One bounded read-only helper was already used to
audit the internal v2 surface; it wrote nothing and is not part of the governed
dispatch.

## Dependency Flow

```text
explorers -> synthesizer <-> reviewers -> evidence closure -> writer -> auditor
                  |                                      ^             |
                  +------ one bounded explorer return ---+-------------+
```

The explorer return and auditor repair edges each have a loop cap of one. No
unbounded spawning or autonomous continuation is permitted.

## Inventory Preflight

The live Inventory validates `pass` with lookup readiness `ready`. It supplied
five selected internal entries and explicit exclusions in
`strategy-inventory-packet.json`. It contained no exact Factory.ai or named
external-product market corpus, so external research remains necessary. Inventory
is discovery only; the live v2 Craft ledger remains current-state authority.

The read-only helper found that v2 already has a bounded typed-validation and
same-host reproducible-realization kernel plus substantial governed factory
contracts. It also found that scheduler/lock/snapshot machinery, the planned CLI,
runtime agent conformance, cross-host proof, and production-stable operation are
not established. The dispatch is shaped to reuse those owners rather than restart
them.

## Evidence Contract

`exact-binding`

Every load-bearing product row needs an exact official source and selector. Every
market statistic needs its date, population, denominator or method, and caveat.
Every local current-state row needs an exact path/selector and execution-time
digest. Every reuse recommendation needs an owner, observed precedent, positive
and negative witness, protected boundary, and verdict.

## Write Scope

Only this new research folder may receive research artifacts. Explorer,
synthesizer, reviewer, and auditor agents are read-only. The writer alone may
write `findings.md` after evidence closure; the parent mechanically owns
`research.md`, receipts, and closeout. Existing v2 files, Inventory, Craft,
dispatch ledger, Git, public Arcanum, authority, and implementation are forbidden.

## Gate and Ledger State

- candidate sheet: validation `pass`, schema `0.8.0`, SHA-256 `028f1eed9838201c1bdce8c860085d99f37e66fc276c8e0ae1e4158fdb54f426`, ledger mutation `none`;
- Arcanum Dispatch Spec: validation `pass`, authorization `requires_user_permission`;
- independent tension checks: `PASS/PASS` against the exact sheet digest;
- human confirmation: pending;
- dispatch ledger: unchanged;
- agents spawned: `0` governed research agents;
- implementation, procurement, authority, promotion, publication, commit, push,
  and external delivery: not authorized.

## Next Human Action

The candidate sheet validates `pass` under schema `0.8.0` with SHA-256
`028f1eed9838201c1bdce8c860085d99f37e66fc276c8e0ae1e4158fdb54f426`
and `LEDGER_MUTATION=none`. The capability-bound Arcanum Dispatch Spec also
validates `pass`. Independent checkers A2 and B2 each passed all five tension
tests against those exact sheet bytes; see `gates/tension-checks.md`.

Reply exactly:

```text
confirmed
```

That confirms only this research dispatch. It does not authorize implementation,
vendor access, purchasing, deployment, promotion, publication, commit, or push.
