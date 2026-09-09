# Reviewer Recheck — Loop 1

## Precedent reviewer

# Precedent and duplicate-ownership re-review

**Verdict: PASS**

All four original mandatory repairs are materially closed.

1. **Registry projection ceiling and owner block — closed.**  
   The revision labels the registry `[ABSENT ADAPTER: implementation-local configured registration projection]`, blocks runtime-contract and implementation ownership, and forbids discovery, indexing, ranking, selection, or authority-registry behavior (`synthesis-revised.md:25-40`, `:46-61`, `:97-134`). Admission without selected owners now fails explicitly (`synthesis-revised.md:742-748`).

2. **Runtime transition owners — closed.**  
   Registration, snapshot, run, retention/GC, and service lifecycles are uniformly marked `[DESIGNED, OWNER-ABSENT]`; every transition is enumerated, admission is blocked pending owner selection, and the unowned `cancelled` state was removed (`synthesis-revised.md:63-95`, `:264-305`, `:311-313`, `:407-419`, `:634-652`).

3. **Exact v0 operation allowlist excluding Dispatch Spec/Orchestrate — closed.**  
   V0 admits only local adapter extraction/runtime compilation, native validation, and same-adapter byte/local-ID diff. It rejects semantic drift, lifecycle-transition validation, arbitrary profile operations, delegated reports, dispatch, and agent-backed work; unsupported delegated requests route to Orchestrate without queueing, spawning, joining, retrying, interrupting, gating, registering, or closing agents (`synthesis-revised.md:335-368`). The capability matrix preserves that restriction package by package (`synthesis-revised.md:421-450`).

4. **PromotionRequest-compatible draft with no owner-review lifecycle — closed.**  
   The runtime creates immutable `PromotionRequest`-compatible draft bytes only. It does not deliver them or own handoff, owner-review, acceptance, deferral, rejection, or decision states (`synthesis-revised.md:15-25`, `:72-95`, `:370-405`). The injected-state negative test makes the boundary executable (`synthesis-revised.md:749-749`).

The revised design no longer duplicates Inventory, Dispatch Spec, Orchestrate, the promotion-request lifecycle, project validators, or an authority owner within this review lane.

```yaml
action_id: spawn-0009
status: pass
validation: pass
blockers: []
started_at: 2026-07-30T06:46:00Z
finished_at: 2026-07-30T06:47:45Z
```

## Non-vacuity reviewer

## Non-vacuity and overhead re-review

**Verdict: NEEDS_FEEDBACK**

The resource-ceiling repair passes. The capability-matrix repair is structurally correct but not yet exact for the two live minted packages.

### Remaining mandatory repair

Replace the prose placeholders in the Augmentor and Body War `UNSUPPORTED(...)` cells with exact profile-bound route values, or `OWNER_ROUTE_UNRESOLVED` where no exact route exists.

The matrix currently says `UNSUPPORTED(exact typed Augmentor ontology/profile owner ref)` and analogous promotion/owner phrases, plus equivalent Body War placeholders (`synthesis-revised.md:430-435`). Those are instructions to resolve a route, not executable response values. This conflicts with the matrix legend’s promise of a named route (`synthesis-revised.md:423-428`) and with the assertion that unsupported cells return the exact profile-bound owner ref (`synthesis-revised.md:450`). The exact current evidence is available: Augmentor supplies role-bearing route values including `owner-selection-required:augmentor-meaning` and `authority-kind-specific-named-owner` (`projects/augmentor/ontology/unified-agent/profile.json:15-23`); Body War supplies `body-war.product-ontology-owner` (`projects/body-war/ontology/business/profile.json:3-10`). Bind the relevant existing opaque value to each unsupported operation, or explicitly return `OWNER_ROUTE_UNRESOLVED` when the profile does not resolve that operation’s owner. The corresponding tests at `synthesis-revised.md:787-796` must assert those literal outcomes.

This is the only surviving issue from my original operation-admission repair. The design now cleanly distinguishes runtime-owned same-adapter byte/local-ID diff from profile-owned semantic drift (`synthesis-revised.md:335-360,437-450`), and correctly makes draft proposal construction a separately gated runtime output rather than a profile operation or owner-review lifecycle (`synthesis-revised.md:370-405`).

### Repair confirmed: executable resource witness

The revised research contract now defines exact provisional fixture thresholds for peak RSS, compile/query/validation/diff/proposal time, store/temp/artifact bytes, child timeout, query/response caps, teardown residual bytes/PIDs/ports, and outbound requests (`synthesis-revised.md:591-620`). It supplies fail-closed outcomes, makes unavailable measurements fail the witness, and bounds v0 concurrency (`synthesis-revised.md:623-632`). The receipt records every required measurement and applied cap (`synthesis-revised.md:538-589`), while the acceptance tests require missing-field failure, cap observations, cleanup outcomes, source preservation, and zero teardown residue (`synthesis-revised.md:798-818`). That satisfies the original overhead repair as a falsifiable design gate. The process sandbox remains an explicit pre-implementation owner decision, not a claim of implemented enforcement (`synthesis-revised.md:593,634-654,890-898`).

### Posture preserved

The document consistently says the candidate is research-only, owner-absent, unimplemented, and blocked from readiness until owner selection and the witness run (`synthesis-revised.md:1-3,25-44,693-711,837-874`). No implementation, performance, three-package, or release completion is claimed.

```yaml
action_id: spawn-0010
status: fail
validation: fail
blockers:
  - live-package unsupported-operation cells still contain route placeholders rather than literal profile-bound routes or OWNER_ROUTE_UNRESOLVED
started_at: 2026-07-30T06:46:00Z
finished_at: 2026-07-30T06:47:56Z
```

## Non-collapse reviewer

# Non-collapse re-review

## Verdict: PASS

All five mandatory repairs are closed in `synthesis-revised.md`, with executable collapse tests.

- Adapter versus runtime ownership is explicit: adapters emit only lossless local extraction material (`synthesis-revised.md:136-162`), forbidden snapshot/publication outputs are enumerated (`:164-177`), and the runtime alone constructs and publishes snapshots (`:268-305`). The rejection tests are exact (`:751-756`).
- Runtime authority is invariant `"none"` (`:225-246`, `:333`). Source-owned authority/status/lifecycle values remain owner-bound opaque facets and are not normalized across packages (`:246-260`). Exact cross-axis and cross-package tests appear at `:758-768`.
- Aliases, predicates, branch/view refs, statuses, lifecycle values, and other local facets now have separate structures (`:181-210`). Queries are package/profile/axis-qualified and branch/predicate semantics cannot become universal (`:248-260`). Tests at `:763-768` preserve identity, predicate isolation, branch-as-view, and alias provenance.
- Runtime execution, native validation result, and conformance are separated (`:508-536`). A native negative is successful execution containing negative evidence, while process failure is runtime failure. The tests at `:770-776` prohibit validation-to-conformance, status, lifecycle, release, maturity, authority, or identity collapse.
- Confidence uses a mandatory `ConfidencePair` with independently provided or `not_provided` axes (`:212-223`, `:262`). Proposal observations require that pair (`:377-403`). Tests at `:778-785` reject scalar confidence, require both axes, preserve independent provenance, and prevent confidence from mutating lifecycle or authority state.

No new load-bearing issue exists within the original definitional and authority non-collapse lane.

```yaml
action_id: spawn-0011
status: pass
validation: pass
blockers: []
started_at: 2026-07-30T06:42:00Z
finished_at: 2026-07-30T06:48:10Z
```
