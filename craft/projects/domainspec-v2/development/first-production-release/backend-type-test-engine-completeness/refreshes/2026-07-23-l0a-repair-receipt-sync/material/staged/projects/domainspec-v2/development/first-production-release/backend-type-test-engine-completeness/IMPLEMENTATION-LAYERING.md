---
module: backend-type-test-engine-completeness
version: 2026-07-23-l0a-repair-receipt-sync
status: validated-awaiting-independent-validation-freeze
updatedAt: 2026-07-23
docType: implementation-layering
semanticAuthority: none
sourceDesignDigest: b99abbd87d73106cfc9c2f06e886930f6151d53c6f2e4a854e65f73013827296
---

# Implementation Layering — Backend Graph To Proof

## Purpose

Order the smallest evidence-bearing path from validated contracts to an exact,
independently replayable BTE result. A layer answers one decision, emits one
reviewable evidence boundary, and cannot promote itself from plan status.

## Layer Table

| Layer | Decision question | Consumes | Smallest coherent output | Exit evidence | Deferred until later |
| --- | --- | --- | --- | --- | --- |
| L0A — contract publication | Can the validation owner receive one complete, immutable machine contract and diagnostic boundary before authoring red cases? | exact Design/seed digests; accepted bootstrap decision | nine shape contracts, closed diagnostic registry, deterministic contract-publication receipt | dialect/keyword closure, exact registry parity, stable bytes/digests, contained writes, no red-input access and no ValidationReceipt | semantic validators, red cases, formation, compiler, graph |
| L0B — semantic validation | Can unchanged L0A contracts reject independently frozen malformed, ambiguous, forged, stale, or path-escaping proof primitives? | exact L0A publication receipt; matching validation-owner red manifest/freeze | separate deterministic shape/semantic validators and one non-admitting ValidationReceipt | all positive and frozen red cases produce exact codes; manifest/result recomposition, unsupported keyword, and path/write escape fail; receipt independently recomputes | formation, compiler, graph, TestCase, proof receipt |
| L1 — formation-v2 | Can the successor bind 13 structures and 16 criteria to YAML-owned meaning while retiring every current-v1 JSON constraint explicitly? | L0; frozen v1 handles | structural AST/preflight/evaluator, 13 structure bundles, 16 criterion records, retirement bijection, migration/compatibility corpus | exact predecessor coverage, byte-preserved v1 regressions, reason-specific Entity false-green failure | successor source topology and graph |
| L2 — successor sources/resolver | Can one versioned source set resolve independent node/edge files without fallback or a second graph? | L0–L1; accepted topology | project/feature/node/edge/source-set contracts, roots, resolver, connections migration | positive same/cross-feature roots plus typed missing/duplicate/path/endpoint/order negatives | proof catalogues and generated tests |
| L3 — compiler/graph/build replay | Can the successor route compile deterministically to one graph/manifest/build handle? | L1–L2; preserved 001/003 receipts | hard v1/v2 dispatch, successor compiler, graph v2, manifest v2, BuildReceipt, ProofContext, build replay | exact source/graph bijection, stable bytes, independent replay; candidate posture when unadmitted | obligation/test breadth |
| L4 — catalogues and selections | Is every expected denominator independently frozen and every causal effect owner-selected before derivation? | exact L3 candidate handles | six nonempty catalogues, freezes, 13-row node-pattern and 16-row relationship selections, admission handles/residue | exact owner/version/digest/set validation; no TestCase emitted | execution and aggregate proof |
| L5 — one proof unit | Can one frozen catalogue member traverse the complete graph-to-replay chain without hidden glue? | L0, L3, one stage-eligible L4 member | O_gen, exact join, TestCase, exact role bindings, raw run, independent evaluation, fresh primary mutation, ProofReceipt, ReplayResult | one reason-specific positive/negative/mutation chain and independent replay | breadth and consumers |
| L6 — six-catalogue core | Does every required coverage key in all six catalogues recompose exactly into one core aggregate? | L5; all exact admissions/freezes | catalogue ReplayResults and `verify:bte:core` AggregateResult | exact non-overlapping scope recomposition, no residue, seeded breadth/absence/tamper failures | consumer proof and lifecycle promotion |
| L7A — IOLM | Does IOLM preserve the exact accepted core projection including graph/hierarchy/table parity? | exact green L6 handle; repaired IOLM schema | consumer-owned raw run/receipt plus BTE-owned ReplayResult | missing/parity-drift/stale/self-authored controls fail | Body War and terminal aggregate |
| L7B — Body War | Does Body War consume the exact core handle through a machine contract without private leak or mutation? | exact green L6 handle; Body War machine package | consumer-owned raw run/receipt plus BTE-owned ReplayResult | schema-only, stale, private-leak, mutation, and self-authored controls fail | IOLM and terminal aggregate |
| L8 — aggregates | Do exact fresh consumer replays compose with the exact core without changing admission? | L6 plus L7A and L7B replay handles | `verify:bte:consumers` and terminal `verify:bte` AggregateResults | exact-handle independent replay and all missing/extra/stale/duplicate controls | lifecycle decision remains external |

L7A and L7B are the only parallel layers. Their writes are disjoint, and neither
depends on or can repair the other.

## Entry And Promotion Gates

| From → to | Required evidence | Failure behavior |
| --- | --- | --- |
| Plan → L0A repair | validated reconciliation package and explicit user selection of `SWU-BTE-L0A-REPAIR-001` | completed by the passing repair receipt |
| L0A repair → validation owner | current bytes reproduce the immutable L0A receipt and `verify:bte:contract-publication` passes without rewriting run evidence | passed; route the independent validation owner |
| L0A → L0B | current passing publication verification plus matching validation-owner red manifest/freeze | no semantic execution; route contract drift to L0A repair and expectation/freeze drift to validation owner |
| L0B → L1 | exact L0 ValidationReceipt and unchanged publication/Design/seed digests | block formation implementation |
| L1 → L2 | exact retirement/compatibility receipt; current v1 unchanged | no successor source activation |
| L2 → L3 | resolver receipt and version-hard source handles | no graph build |
| L3 → L4 | candidate graph/manifest/build replay plus exact context handle | no catalogue binding |
| L4 → L5 | matching validation-owner freeze and required stage admission | no TestCase; emit typed gate residue where Design permits |
| L5 → L6 | one complete ReplayResult proves the mechanism, not breadth | breadth remains red until all six exact catalogues close |
| L6 → L7A/L7B | exact green core aggregate handle | no consumer run accepted |
| L7A/L7B → L8 | both fresh consumer ReplayResults reference the same core handle | consumer/terminal nonzero; core remains unchanged |

## Completed Repair And Accepted Split

`SWU-BTE-L0A-001` was selected and implemented. Its immutable Task Session
receipt remains a historical pass. The bounded repair restored all nine
recorded byte handles and the deterministic publication verifier now passes.

`SWU-BTE-L0A-REPAIR-001` is completed. Its passing receipt proves that the nine
surfaces reproduce the immutable publication handles and that the existing
publication verifier passes without rewriting historical evidence. It granted
no admission and authored no validation inputs.

`SWU-BTE-L0B-001` is a named successor but cannot become dependency-ready until
the validation owner has frozen package-local red cases against the exact
publication digests. Current L0A publication verification passes. L0B owns the
shape/semantic validators, exact frozen-case execution, and
`ValidationReceipt`; it cannot rewrite L0A or validation-owned bytes.

This split resolves the bootstrap cycle. A freeze before L0A would guess at
unpublished schemas and diagnostic codes. Folding L0A and L0B back together
would let implementation define the measured contract and execute its tests in
one authority step. The publication receipt is the mechanical handoff, so the
split introduces no prose glue.

Recomposition:

```text
L0A published contract/diagnostic digests
  -> validation-owner red-manifest freeze
  + L0B semantic result matrix
  + exact write/output manifest
  -> non-admitting L0 ValidationReceipt
  -> exact L1 input handle set
```

## Evolution Profile

Expected evolution is new contract versions, more catalogue instances, and new
consumer handshakes—not a universal theorem/evaluator framework. Versioned
contract registries and bounded evaluator interfaces are the extension points.
SMT, FOL, Datalog, Cedar, temporal proof, a plugin host, and full code/spec
equivalence remain typed unsupported residue until a concrete accepted claim
requires one.

## Non-Regression And Authority Guardrails

- Current-v1 machine sources and completed receipts are immutable.
- Existing tool tests, engine tests, typecheck, content checks, and instance
  checks stay green when their surfaces are touched.
- Generated outputs, receipts, replay, Inventory, Craft, and Markdown never
  become semantic or admission authority.
- Missing admission blocks only the affected stage/core eligibility; it does
  not erase already valid local candidate evidence.
- Current L0A byte proof is green; its repair receipt is synchronized.
- Missing validation-owner freeze blocks L0B and later TestCase materialization,
  but never changes the historical L0A Task Session result.
- Core has no consumer or UI dependency; terminal proof has both consumers and
  no UI dependency.

## Frame Expiry

Re-run Invoke Design before execution if the accepted successor profile ID,
formation authority choice, six catalogue definitions, coverage-key rule,
TestCase cardinality, evaluator independence rule, mutation lineage rule,
consumer ownership split, or backend/UI lane split changes. Re-run Invoke Plan
when paths, commands, task boundaries, admission handles, or predecessor
receipts change without changing architecture.
