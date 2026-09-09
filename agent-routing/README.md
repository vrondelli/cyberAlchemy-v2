# CyberAlchemy-v2 Agent Routing

Status: active local entry route by explicit owner direction; candidate D65
construction evidence.

This package is the single repository objective router. The root `AGENTS.md`
bootstraps here, and `routes.json` resolves every objective to a
CyberAlchemy-v2-owned authority surface. There is no repository routing
fallback outside this package.

The router separates three facts:

- **route availability**: the objective can be classified and bounded;
- **runtime availability**: the selected work can be performed by current
  native operations;
- **governance admission**: exact meaning, system ontology, implementation, and
  conformance evidence have been accepted by their owners.

Those facts must not be collapsed. A route may be locally active while its D65
construction evidence remains candidate and non-authoritative.

## Package map

- `product-capability.json` states the routing outcome owned by CyberAlchemy-v2.
- `ontology.json` contains the capability-local business ontology.
- `routes.json` is the closed machine route registry.
- `project-index.json` links user-cited aliases to source-owned identities.
- `DOMAINSPEC-CORE-INDEX.md` inventories the explicitly selected sibling checkout
  under `CA2-ROUTE-DOMAINSPEC-CORE`; it does not expand local lookup bounds.
- `PROJECT-LOOKUP.md` owns the candidate lookup contract and open questions.
- `scripts/locate.py` resolves names without effects and retains ambiguity.
- `capabilities/recent-context/` models recent committed context in AlchLang and
  provides a tested read-only Git query plus a separately scoped cache refresh.
- direct ontology-runtime operations remain diagnostic while mandatory
  ontology gating is suspended pending a governed Rust replacement.
- `ROUTER.md` defines the selection and failure algorithm.
- `domainspec/` contains the authored DomainSpec-v2 project and deterministic
  graph/system-ontology projection.
- `schemas/agent-router.schema.json` defines the closed package shapes.
- `scripts/validate.py` validates the package and root integration.
- `tests/test_negative_mutations.py` proves hostile changes fail closed.

## Validate

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/scripts/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/tests/test_negative_mutations.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/tests/test_project_lookup.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/tests/test_domainspec_core_route.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/tests/test_layout.py
```

The [layout contract](LAYOUT.md) supports both the umbrella and this sibling
checkout. Install the locked runner with `npm ci --prefix agent-routing
--ignore-scripts --no-audit --no-fund`, build with `npm run --prefix agent-routing
build`, and use `--verify-build` for two independent native replay runs. Commands
with a leading `cyberAlchemy-v2/` above are umbrella-relative; omit that prefix
when running from this checkout. Structural PASS does not admit the development profile or generated
system ontology and does not prove every routed capability has an implementation.

## Ontology calls

Direct diagnostic runtime operations select `CA2-ROUTE-ONTOLOGY`. Other
ontology-related requests keep their normal objective route and declare their
exact record and selector dependencies without invoking the candidate Python
runtime as a gate. Mandatory enforcement remains suspended until a separately
selected Rust governance binding is validated and activated.

## Claim ceiling

This package activates a local repository routing rule by owner direction and
provides deterministic candidate construction evidence. It does not delete or
deprecate public subsystem code, admit the DomainSpec profile or system
ontology, prove capability realization, authorize implementation without a
user request, publish, release, deploy, or perform an external effect.
