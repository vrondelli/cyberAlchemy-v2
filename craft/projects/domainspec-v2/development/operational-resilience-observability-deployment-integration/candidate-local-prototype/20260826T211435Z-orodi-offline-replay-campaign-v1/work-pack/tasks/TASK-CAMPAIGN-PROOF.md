# TASK-CAMPAIGN-PROOF

## Objective and mapping

- Layer: L2
- Slice/wave: adversarial proof and documentation / W2
- SWU: `SWU-ORODI-WP7-003`
- Objective: prove the finite campaign denominator and claim ceiling with three golden campaigns, 25 hostile cases, full regression, and one additive README section.

## Source contracts

- `../../WORK-PACK.md` — exact golden/hostile tables, validation surface, manifest, and completion contract.
- `../../VALIDATION-STRATEGY.md` — acceptance-critical checks and failure policy.
- Existing WP6 golden cases, evaluation contexts, profile descriptors, inventories, policies, referents, and tests are read-only inputs.
- W0 schemas and W1 composer.

## Dependencies and blockers

- Dependency: `SWU-ORODI-WP7-002` passed.
- Current blocker: exact Work Pack and manifest acceptance is unapproved.
- Stop if a hostile discriminator requires changing composition semantics or any existing source.

## Smallest Working Unit

### `SWU-ORODI-WP7-003`

- Primary behavior: materialize and execute the complete finite evidence corpus, then document exactly what it proves.
- Independent acceptance boundary: only the joined fixture/expected/test/doc set can prove denominator parity, executable interpretation, regression, and operator-visible claim limits.
- Candidate child units: golden fixture; hostile fixture; expected map; test harness; README.
- Retained-boundary rationale: fixtures without executable assertions and tests without pinned hostile inputs are not durable proof; documentation is accepted only against the passing joined evidence.
- Write scope:
  - `projects/domainspec-v2/impl/operational-resilience/fixtures/tool-evidence-replay-campaign/golden/cases.json`
  - `projects/domainspec-v2/impl/operational-resilience/fixtures/tool-evidence-replay-campaign/hostile/cases.json`
  - `projects/domainspec-v2/impl/operational-resilience/fixtures/tool-evidence-replay-campaign/expected-results.json`
  - `projects/domainspec-v2/impl/operational-resilience/test/tool-evidence-replay-campaign.test.ts`
  - `projects/domainspec-v2/impl/operational-resilience/README.md`
- Done criteria:
  - exactly three unique golden IDs and 25 unique hostile IDs;
  - hostile/expected one-to-one parity;
  - full-seven family denominator and two bounded subset campaigns;
  - original/reverse/fixed-shuffle byte equality;
  - every hostile required code is present and all rejection projections are empty;
  - all emitted outputs validate against the result schema;
  - full WP1-WP6 regression remains green;
  - README adds only `## Offline replay campaigns (candidate-local)` and denies live/runtime/deployment claims;
  - exact manifest, baseline, package/lockfile, and hygiene checks pass.
- Acceptance evidence: one consolidated candidate-local validation report with commands, exits, counts, digests, baseline parity, and Handoff Notice locator.
- Validation surface: all checks in `../../VALIDATION-STRATEGY.md`.
- Execution owner: local fallback after exact acceptance.
- Handoff note: test code may read repository fixtures and create temporary schema instances; product code may not perform I/O.

## Synchronization

Return the SWU result and consolidated report. There is no same-Work-Pack successor. Deferred owner review is the only next route and grants no lifecycle, runtime, deployment, or release authority.
