# ARE successor qualification workspace

This directory qualifies frozen `ARE-PRODUCT-CANDIDATE-020`, version
`0.10.0-rc.1`, as the successor to Candidate 018. It is not product approval,
admission, an archive, or a replacement for historical evidence.

The package deliberately separates two outcomes:

- `package_status` says whether this qualification description is internally
  valid and still bound to the source state it names.
- `qualification_status` stays `BLOCK` until every required successor gate is
  backed by evidence from one stable source closure.

Run the local validator from the ARE product root:

```sh
node qualification/successor-current/validate.mjs
```

The validator is read-only. It computes the current product closure, product
health, and test plan; it does not run tests, change file modes, freeze a
candidate, create an archive, or update any receipt.

## Portability handoff

The portability lane defaults to Candidate 020's retained, closure-bound
receipt. Reproduce it from the retained archive with:

```sh
node ../../development/agent-reasoning-engine/planning/documentation-readiness/qualify-source-distribution-portability.mjs \
  --output docs/releases/0.10.0-rc.1-portability-receipt.json
node qualification/successor-current/validate.mjs
```

An accepted receipt must use `are.portability-qualification/v1`, report
`PASS`, bind the same source-closure digest as this qualification, retain the
exact packaged-artifact `0555` check, and prove that any Git-checkout handling
is a separately named fail-closed context. `--portability-receipt` can assess a
different local receipt explicitly. The validator never turns a receipt into
release or approval authority.

## Gate order

1. Stabilize and bind one successor source closure.
2. Import a passing portability receipt for that exact closure.
3. Run the complete declared test plan in an isolated copy of that closure.
4. Run the non-live optional-module composition check with semantic evaluation,
   evolution signals, intent compilation, and cache telemetry enabled together.
5. Reconcile current documentation while preserving Candidate 018 and older
   records as historical evidence.
6. Materialize, reproduce, retain, install, restart, corrupt, restore, and
   uninstall a successor archive in disposable state.
7. Only then prepare a separately named frozen successor candidate. Product
   approval remains a later owner decision.

Reproduce the closure-bound optional-module composition receipt with:

```sh
node ../../development/agent-reasoning-engine/planning/documentation-readiness/qualify-optional-module-composition.mjs \
  --output docs/releases/0.10.0-rc.1-optional-module-composition-receipt.json
node qualification/successor-current/validate.mjs
```

The synthetic turn makes no provider call. It proves local module composition
and fail-closed handling, not live-provider behavior or model quality.

## Open questions

- What successor candidate and version identities will the product owner select?
- Which repository-local test will become the canonical optional-module
  composition gate rather than a consumer-owned probe?
- What retention horizon and storage location will own the successor archive
  and Candidate 018 rollback artifact?
- Which documentation files should be refreshed versus explicitly marked as
  historical after the successor closure is stable?
