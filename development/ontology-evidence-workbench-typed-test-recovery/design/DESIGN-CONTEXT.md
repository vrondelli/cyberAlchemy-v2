# Design Context

## Exact source boundary

- [Define specification](../define/SPEC.md)
- [Accepted SWU006 findings](../../ontology-evidence-workbench-semantic-navigation/research/2026-08-03-swu006-typed-test-failure-prevention/findings.md)
- private builder and builder tests under
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/`
- immutable predecessor patch0004 and binding006
- upstream source archive and frozen dashboard lockfile

## Constraints

- no retry, build, dependency fetch, browser run, or source mutation during
  Invoke authoring;
- no failed workspace or environment retention;
- no private OEW schema in public Arcanum;
- no product-semantics claim from the failing Node test;
- successor patch/binding only; predecessors remain immutable;
- cleanup, authorization consumption, and stop-on-failure are invariant.

## Evidence observation

The frozen dashboard lockfile exposes `jsdom` and `happy-dom` only as optional
Vitest peers and resolves neither package. This weighs against an unbounded
config-side change but does not grant the Design author authority to select the
test-side repair. Both branches remain open for a separate owner decision;
real DOM claims remain later Chromium obligations.
