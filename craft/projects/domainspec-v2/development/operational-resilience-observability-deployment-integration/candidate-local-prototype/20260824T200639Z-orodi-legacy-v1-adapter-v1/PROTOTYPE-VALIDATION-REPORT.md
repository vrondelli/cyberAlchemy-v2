# ORODI Legacy-v1 Adapter Prototype Validation

Status: **PASS — candidate-local only**

Work Pack: `WP-ORODI-PROTOTYPE-003`

Deferred-governance locator: `HN-0C301E50D056`

## What works

The prototype pins eleven exact DomainSpec v1 source shapes by repository path, selector, and SHA-256. A pure deterministic kernel normalizes two declaration shapes into the existing generic ORODI observation contract:

- failure-mapping rows become product `log` observations;
- OTel metric declarations become product `metric` observations.

Both outputs are explicitly `simulation`, have zero runtime telemetry, set `deployment_effect=false`, and set `independently_observed=false`. They are adapter replay artifacts, not live observations or complete evaluation bundles.

The adapter fails closed for the remaining legacy surface:

- workflow signals and telemetry bundles cannot cross into the product plane;
- SLO rows, Prometheus scrape configuration, and alert rules remain declarations, not observations;
- infrastructure and deployment procedures remain proposal-only;
- load and canary result families remain absent and cannot be fabricated.

## Evidence

- TypeScript compile: pass.
- Combined regression suite: **62/62 pass** — 41 existing WP1/WP2 tests plus 21 adapter tests.
- Golden replay: 2 exact input/result pairs, deterministic and input-pure.
- Hostile replay: 14 persisted cases, each rejected with its exact discriminator.
- Closed result schema: every golden and hostile emitted result validates offline.
- CLI/library parity: exact semantic equality for the failure-map golden.
- Source pins: all 11 current repository hashes match.
- Plan/product inventory: exact semantic equality.
- JSON, scoped whitespace, regular-file, final-newline, and conflict-marker checks: pass.
- Product aggregate SHA-256: `d2ce194a93164655d1212819f5c4ac6ed06d42ba432786ecd5497cee80446d1d` across 66 sorted product files.

The first full suite exposed a relative JSON Schema `$id` that broke offline local-fragment resolution. The governance-only sidecar receipt `SCHEMA-REF-DEFECT-RECEIPT.json` diagnosed it. The final candidate uses `urn:domainspec:orodi:legacy-v1-normalization-result:v1`, matches neighboring schemas, adds a regression assertion, and passes 62/62.

## Boundaries

No live tool, external network, workload, fault, infrastructure plan/apply, canary, deployment, rollback, ontology/profile admission, Git publication, or lifecycle reconciliation ran. No source v1 file was modified.

Lifecycle reconciliation remains deferred, not waived. `HN-0C301E50D056` points a future separately authorized owner to `invoke:refresh`; the notice itself grants no continuation authority. `authority_effect` is `none`.
