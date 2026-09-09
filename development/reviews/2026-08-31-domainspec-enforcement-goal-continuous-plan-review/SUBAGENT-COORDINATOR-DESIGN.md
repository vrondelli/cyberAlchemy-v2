# Private Subagent-Strategy Coordinator — Design Candidate

Date: 2026-08-31  
Work item: `ARC-SWU-02`  
Parent graph node: `CGC-G20`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: `none`

## Decision in one sentence

Design a thin private coordinator for `CA2-ROUTE-DELEGATE` that always invokes the existing generic strategy engine with the fixed DomainSpec private profile, validates the normalized receipts, and never falls back to the public Arcanum profile.

This is a planning candidate, not an implementation or adoption decision.

## Product-thesis fit

The coordinator realizes one operation of the existing candidate Product Capability `CA2-CAP-ROUTE-REPOSITORY-WORK`: a route-admitted delegation must preserve product meaning, owner authority, exact evidence, and fail-closed gaps from sheet preparation through closeout. It does not create a second Product Capability and does not make Arcanum a private routing authority.

The public engine remains a replaceable mechanism. CyberAlchemy-v2 owns the private operation contract, profile selection, authority boundaries, and conformance obligations.

## Current evidence boundary

The following clean source bytes were inspected for this candidate:

| Role | Exact source | SHA-256 |
|---|---|---|
| Generic strategy engine | `arcanum/arcana/subagent-strategy/scripts/strategy-runtime.cjs` | `d51bab69d596db6ba562e41d76bae7daaa2cf270b2b6b20cc33844ad3893e1b7` |
| Public fallback profile | `arcanum/arcana/subagent-strategy/profiles/arcanum.json` | `0ba2a4466de181231a69c51a949bb116a9990f3095936b9ecffffa67ade378f2` |
| Private DomainSpec profile | `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/runtime-profile.json` | `1b007bc7b734ef308975250a33d4148ab4f67b919ad31cd15a170e9c175b6a8e` |
| Private ledger adapter | `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/append-dispatch.cjs` | `55b57d21655d3c032da148665c6f7e98a9b83274534f44f55f06948bf87733f6` |
| Runtime composition helper | `implementation/domainspec/internal_tools/subagents-dispatch-hooks/scripts/sync-strategy-runtimes.cjs` | `4ec395e496997fdcb70524ba992b581a8b2c0050f59293fef6348aba699dcd64` |

The generic engine defaults to the public `0.6.1` profile when `--profile` is absent. The private profile instead requires current row schema `0.10.0`, durable strategy sheets, material-projection confirmation, `domainspec.preconfirmation-closure.v1`, the private register-dispatch adapter, and the private ledger. That default boundary is the form-drift risk this coordinator must remove.

## Required private operation contract

The future coordinator should expose four named operations. Only the first three correspond to profile adapter mutations; history inspection remains diagnostic.

### `readiness`

- Accept one exact durable strategy-sheet path and an explicit repository root.
- Reject any caller-supplied profile path or public-profile selector.
- Resolve the private profile from a coordinator-owned constant.
- Verify the engine, private profile, and private adapter against the admitted implementation binding.
- Invoke the generic engine in `readiness` mode with the fixed private profile.
- Require exit zero and the private adapter evidence `SHEET_VALIDATION=pass`, `SCHEMA_VERSION=0.10.0`, and `LEDGER_MUTATION=none`.
- Return a normalized read-only receipt binding the source-sheet SHA-256, profile ID, schema version, engine digest, adapter digest, and ledger-mutation result.
- Never spawn a helper, register a dispatch, append a row, or infer human confirmation.

### `register`

- Accept one exact run-local registration envelope whose sheet, material-equivalence receipt, preconfirmation closure, human confirmation, agent pool, and intended dispatch identity are immutable and mutually bound.
- Re-run readiness against the exact sheet digest immediately before registration.
- Require profile ID `domainspec.subagent-strategy.private.v1`, current schema `0.10.0`, material-projection confirmation, and admission kind `domainspec.preconfirmation-closure.v1`.
- Invoke the generic engine in `register` mode with the fixed private profile.
- Require a normalized runtime receipt with `status=pass`, `mode=register`, the intended identity, the private ledger, and `registration_envelope_consumed=true`.
- Accept `already_present_identical` only as idempotent evidence; reject identity collision or non-identical replay.
- Append at most one dispatch row and never imply that registration proves execution or completion.

### `close`

- Accept one exact close envelope bound to an existing registered dispatch identity and the joined helper result.
- Fail if any helper remains open, unjoined, unpooled, duplicated, or identity-ambiguous.
- Invoke the generic engine in `close` mode with the fixed private profile.
- Require a normalized runtime receipt with `status=pass`, `mode=close`, the intended identity, the private ledger, and `temporary_close_consumed=true`.
- Accept `already_present_identical` only as idempotent evidence; reject a conflicting close.
- Append at most one close row. Closeout cannot promote the work result or widen its claim.

### `check-history`

- Inspect only the private ledger using the fixed private profile.
- Report dispatch count, close count, and open dispatch identities.
- Remain diagnostic: it neither closes an orphan nor authorizes a successor.

## Fail-closed invariants

1. No caller override of the profile, adapter, ledger, schema, confirmation mode, or admission kind.
2. No implicit `cwd` or environment-variable fallback for the repository root; the coordinator validates one explicit root.
3. No public profile or public ledger fallback when private inputs are missing or invalid.
4. No ledger mutation during readiness, tension, or confirmation.
5. No registration without exact sheet readiness, material equivalence, preconfirmation closure, human confirmation, and a valid agent-pool binding.
6. No close before the registered helper identity is joined and no helper remains open.
7. No private prose or private record copied into the public Arcanum subsystem.
8. Engine reuse is a dependency, not transfer of routing or Product authority.
9. Digest drift in an admitted binding requires a new candidate and review; it is never repaired by refreshing a hash in place.
10. Runtime PASS is bounded execution evidence, not capability adoption, DomainSpec admission, conformance admission, publication, deployment, or goal achievement.

## D65 construction state

| Stage | Candidate state | Required evidence before successor |
|---|---|---|
| canonical definitions | `blocked-owner-review` | Define Delegation Coordination, Strategy Sheet, Readiness Receipt, Tension Verdict, Human Confirmation, Registration Envelope, Ledger Row, Close Receipt, and Helper Join without importing public private-incompatible meaning. |
| Product Capability | `candidate-extension` | Owner-reviewed operation extension under `CA2-CAP-ROUTE-REPOSITORY-WORK`; no second Product Capability. |
| capability-local business ontology | `blocked-missing-records` | Add the nine coordinator records and their exact input, produces, binds, authorizes, records, and closes relations to `CA2-ROUTING-BUSINESS-ONTOLOGY`. |
| DomainSpec v2 authored source | `not_evaluable` | Author the operation and ontology extension in the selected admitted DomainSpec v2 profile after predecessor decisions. |
| deterministic compiled graph | `not_evaluable` | Deterministic compile from the exact authored source. |
| system ontology | `not_evaluable` | Selector-closed system ontology generated from that graph. |
| exact implementation binding | `not_evaluable` | Bind coordinator, engine, private profile, adapter, ledger contract, and tests by immutable digest. |
| static conformance | `not_evaluable` | Independent positive, negative, mutation, and determinism evidence. |
| runtime evidence | `not_evaluable` | Bounded shadow and temporary-ledger runs with exact receipts. |
| runtime enforcement | `not_evaluable` | Separate owner adoption after conformance; ontology-runtime enforcement remains suspended until its governed Rust prerequisite exists. |

No successor stage is admitted by this document.

## Proposed ontology extension

The existing routing ontology currently models the Product, the routing Product Capability, two outcomes, and two actors. The coordinator requires owner-reviewed candidate records for:

- `Delegation Coordination` — an operation of `CA2-CAP-ROUTE-REPOSITORY-WORK`.
- `Strategy Sheet` — exact proposed fan-out and authority surface.
- `Readiness Receipt` — read-only validation of one exact sheet.
- `Tension Verdict` — independent challenge result over that sheet.
- `Human Confirmation` — immutable owner decision over the material projection.
- `Registration Envelope` — exact effect request binding all prerequisites.
- `Dispatch Ledger Row` — append-only record of a registered dispatch.
- `Close Receipt` — exact joined closeout evidence.
- `Helper Join` — proof that every registered native helper is joined and none remain open.

Minimum relation questions for the ontology owner are: which actor proposes a sheet; which evidence a readiness receipt binds; whether a tension verdict challenges or refines a sheet; exactly what a human confirmation authorizes; which envelope consumes that confirmation; which row records registration; which join enables close; and which receipt closes the registered identity. Ambiguous answers keep DomainSpec authoring blocked.

## Candidate implementation package — not created

After predecessor admission, the bounded target should be private and capability-local, for example:

```text
cyberAlchemy-v2/agent-routing/subagent-coordinator/
  profile.json
  product-capability-operation.json
  ontology-extension.json
  domainspec/
  scripts/coordinator.mjs
  schemas/coordinator-receipt.schema.json
  tests/
  construction-binding.json
```

The exact filenames remain an owner decision. This review creates none of them.

## Conformance obligations

Positive coverage must include readiness, one registration, idempotent identical registration, one close, idempotent identical close, and private history inspection.

Negative coverage must include missing fixed profile; attempted `--profile` override; public profile injection; schema `0.6.1` or historical `0.9.0` registration; source-sheet drift; material-equivalence drift; missing or wrong preconfirmation receipt; confirmation bound to different bytes; invalid or duplicated agent identity; unpooled helper; wrong ledger; registration replay with different content; close before join; close with another identity; open-helper closeout; engine/profile/adapter digest drift; and private data directed toward the public subsystem.

Determinism coverage must prove two clean readiness runs over identical bytes produce the same semantic receipt, excluding explicitly non-semantic runtime fields. Mutation coverage must prove each required binding fails independently.

## Migration sequence

1. **P0 — owner decisions:** freeze this design digest; review definitions, Product Capability operation, ontology records, privacy boundary, and the choice to reuse the generic engine.
2. **P1 — D65 predecessors:** author and admit canonical definitions, capability operation, business ontology, DomainSpec source, compiled graph, and system ontology in order.
3. **P2 — shadow readiness:** implement only fixed-profile readiness and compare its result against the current private manual path with no ledger mutation.
4. **P3 — isolated mutation:** exercise register and close against a temporary ledger with positive, negative, replay, orphan, and join tests.
5. **P4 — binding and conformance:** freeze exact dependency digests and obtain independent static and bounded runtime evidence.
6. **P5 — adoption:** a separate owner decision may switch the private skill to the coordinator. Keep the public engine as a replaceable dependency until an independently reviewed replacement exists.

Rollback at every phase is removal of the unadopted private candidate or restoration of the previously admitted private caller. No phase rewrites public history or public Arcanum source.

## Open owner decisions

- Approve, revise, or reject the proposed ontology records and relations.
- Confirm that delegation coordination is an operation of the existing routing Product Capability rather than a new capability.
- Confirm generic-engine reuse versus a private reimplementation after comparing maintenance and privacy risks.
- Name the authoritative DomainSpec v2 development profile and admission gate for this operation.
- Approve the immutable implementation-binding shape and independent conformance owner.
- Decide adoption only after P4 evidence; do not infer it from this design.

## Claim ceiling

This candidate proves only that a bounded, fail-closed private coordinator can be specified around the current generic engine and private profile, and that D65 predecessor gaps are now explicit. It does not create the coordinator, change a ledger, approve a fan-out, spawn a helper, adopt the operation, admit any ontology or DomainSpec artifact, prove conformance, enable runtime enforcement, publish, deploy, or achieve the continuous Goal.
