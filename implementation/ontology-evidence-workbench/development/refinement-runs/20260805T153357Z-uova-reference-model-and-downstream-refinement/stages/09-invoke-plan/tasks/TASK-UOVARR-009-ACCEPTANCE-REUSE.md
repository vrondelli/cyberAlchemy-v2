# UOVARR-009 — Acceptance and Reuse

## Outcome

Prove the repaired pipeline across full regression, browser interaction,
accessibility fallback, deterministic generation, and one non-Body-War fixture.

## Inputs

- UOVARR-008 terminal and closeout receipts;
- Body War generated bundle and static artifact;
- owner-selected second project fixture;
- shared Playwright runtime binding from Invoke Refresh.

## Exact target class

- update test/browser-acceptance.test.mjs and acceptance receipt generator targets;
- create or update one repository-owned generic reuse fixture/test;
- write generated validation receipts only under the refreshed task output scope.

## Requirements

- browser starts in bounded focus scene rather than black-box full graph;
- portals show cluster destination and relation meaning;
- Path changes clusters and preserves exact selected relation;
- relation colors are predicate-specific while text/pattern/direction preserve meaning;
- cards, visible edges/arrows, inspector, and index synchronize by exact ID;
- static/no-JS fallback is complete;
- second fixture uses identical schema/resolver/projection paths;
- two clean generations are byte equal.

## Validation

    npm test
    npm run test:browser
    node scripts/verify-browser-acceptance.mjs <refreshed-receipt-path>
    git diff --check -- <refreshed-exact-targets>

The browser witness must record viewport, route, runtime/version, screenshot or
trace locators, visible portal/edge/card assertions, keyboard checks, and failures.

## Compatibility and closeout

No deployment, release, promotion, or production claim follows. Return consolidated
prototype validation plus exact residue and owner closeout. Successor: owner
acceptance decision.
