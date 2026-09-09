---
module: interactive-ontology-learning-map
version: 0.1.0-candidate
status: candidate-compile-blocked
updatedAt: 2026-07-22
docType: implementation-layering
---

# Implementation Layering

## Applied consumer boundary

The BTE handoff is an input contract, not a second semantic source. Layer work
must preserve imported node/edge identity and source provenance, bind every view
to the semantic hash, and reject learner/navigation mutations that alter semantic
bytes. Candidate posture remains distinct from authoritative `Sg` readiness.

## Target and boundary

- Target: private compiler-backed witness under `./prototype/`, plus one independently governed demo sidecar under `cyberAlchemy-v2/development/iolm-workable-example/`.
- Current state: accepted research and planning plus the passing L0C candidate-contract/provenance guard; no candidate graph, parity views, product UI, or demo implementation yet.
- Governing rule: later layers preserve source-local ownership, non-collapse laws, semantic byte stability, GET-only behavior, and spatial/non-spatial parity.
- Candidate readiness boundary: L0C consumes the minted-project runtime only with explicit candidate posture, source/build receipts, stable identities, and an authority non-collapse guard.
- External authority boundary: L0A consumes an exact owner-generated DomainSpec `Sg` only after the FPR-01/02/03/FPR-04 receipts pass. It does not implement, close, or reinterpret those upstream nodes.
- Production website integration and public packaging are outside the active layer window.

## Layer decisions

| Layer | Decision unlocked | Minimum working unit | Included | Deferred | Exit evidence | Promotion decision |
|---|---|---|---|---|---|---|
| L0C Candidate substrate | After this layer, we know whether one candidate source contract and projection pipeline can preserve posture, stable identity, provenance, and graph/hierarchy/table parity without claiming authority. | candidate contract/provenance guard, then minimal minted project and parity proof | project/feature metadata, node/connection files, source/build receipts, normalized read model, candidate badge/field, parity fixture | full corpus, production UI, authoritative DomainSpec labels | contract negatives; deterministic compile; parity diff; proof candidate receipts cannot satisfy G-DSV2-SG | continue candidate learning work, repair contract, or stop |
| L0C-demo Workable example | After this layer, we know whether one pinned candidate fixture can be inspected through a runnable synchronized local interface without entering compiler, authority, or package-dependency scope. | one parent outcome delivered through four sequential risk-domain SWUs: A1 pinned boundary, A2 immutable `DemoSnapshotV1`, A3 graph/outline/table viewer, A4 Firefox acceptance and honest evidence aggregation | native HTML/CSS/ES modules/SVG/semantic tables; Python 3.11+ boundary checks; Node 22+ pure-model tests; Firefox Playwright black-box checks; fixed 4-node/3-edge fixture and 2-node/1-relation question slice | compiler support, source authority, package installation, production UI, and any human browser `PASS` not actually performed | `iolm-fixture-boundary/v1` -> `iolm-demo-snapshot/v1` -> `iolm-interactive-viewer/v1` -> `iolm-browser-acceptance/v1`, each with the unchanged exclusion fence | retain as fixture witness, reroute defects to the owning SWU, or later replace only its gateway under the versioned contract |
| L0D Evidence consumer | After this layer, we know whether the private application can consume an exact executable DomainSpec proof without semantic, identity, provenance, view, or authority collapse. | narrow EVF consumer run; later independent BTE breadth rerun | versioned YAML contract, JSON receipt schema, exact upstream handles, deterministic IOLM rebuild, parity and negative replay | predicate/obligation authorship, BTE execution, authority rebind, UI/pilot | fresh `SWU-IOLM-DSC-A` receipt; later distinct `SWU-IOLM-DSC-B` receipt | accept the bounded combined claim, repair the consumer, or preserve only the upstream result |
| L0A Authority rebind | After this layer, we know whether the same normalized boundary can consume the exact owner-issued `Sg` without semantic or identity drift. | exact `Sg` readiness handle + equivalence or migration proof | read-only `Sg` adapter, receipt binding, stable-ID equivalence/migration map | FPR ownership or lifecycle mutation | FPR readiness handle; unchanged import; independent retraction; rebind diff | admit authoritative input to the private projection, repair migration, or stop |
| L1 Deterministic read model | After this layer, we know whether owner-generated `Sg` plus selected documentary sources compile repeatably into a queryable immutable snapshot. | clean read-only import and build of both witnesses | `Sg` adapter, documentary adapters, validator kernel, semantic/learning/navigation builders, ELK layout, search, GET API | UI, pilot, website integration | unchanged imported-edge receipt; repeated-build bytes/hash/layout/index/ETag; endpoint residue; route inventory | continue, narrow sources, or stop |
| L2 Learning interface | After this layer, we know whether graph, hierarchy, and table provide equivalent usable journeys. | both journeys through all surfaces | React Flow neighborhood, hierarchy, table, detail/challenge views, non-drag controls | accounts, production website, alternate renderer | parity diff; keyboard/touch/reduced-motion/screen-reader receipts | pilot, repair, or stop |
| L3 Private pilot | After this layer, we know whether the bounded map improves correct distinctions for target learners and can be integrated privately. | named pilot on curated 50–150-node surface | comprehension protocol, performance traces, private integration decision | public derivative, accounts, scale renderer | raw pilot data, scored rubric, perf distributions, exact integration decision | integrate privately, iterate, or stop |

## Active layer window

The active window contains two independent sibling facts after the shared 00C-A receipt. In L0C, 00C-B is selected but blocked before mutation because its required cross-feature edge is intentionally unsupported by the live compiler and no upstream support receipt exists; 00C-C remains unselected. In L0C-demo, the old UI-A is superseded before execution and the historical A1-A3 passes remain audit evidence, but their pinned fixture generation is stale. The option-1 decision preserves the current Key-and-Door generation; fresh A1 rebind `20260723T002902Z-current-fixture-rebind` passed against it, so A2 regeneration is the sole selected L0C-demo unit while A3 revalidation and A4 replay remain gated. These sidecar receipts cannot unblock or evidence the compiler-backed chain. L0D remains planned with both consumer SWUs unselected, and G-DSV2-SG remains blocked only for L0A authoritative labeling/rebind.

## Non-regression guardrails

- Semantic bytes never depend on learner, navigation, layout, or clock material.
- Rejected attempted relations never enter semantic export.
- Candidate relations remain visibly candidate and never become DomainSpec relations by naming or projection; owner-generated `Sg` relations are imported unchanged only in L0A.
- Candidate and authoritative sources feed one normalized graph boundary; no second UI/read-model pipeline is allowed.
- Executable evidence enters through the versioned private consumer contract; IOLM receipts never become upstream semantic, obligation, profile, or release authority.
- The demo reads only the three pinned allowlisted fixture paths, writes only its sidecar and its Task Session lifecycle receipt, and carries the full machine eligibility exclusion fence.
- Required manual browser and assistive-technology checks remain `NOT_RUN` until performed by named runners; automated evidence cannot promote that state to `PASS`.
- Each L0C-demo path has exactly one SWU owner, each typed handle has one producer and declared consumer, and A4 may only report implementation defects back to A1, A2, or A3.
- No layer creates source-owner, promotion, runtime, comprehension, accessibility, or publication evidence by inference.
- Equivalent non-spatial access is not traded away for renderer scale.
- The public derivative stays absent from all four layers; it requires its own Invoke/owner/publication route.

## Recommended next move

Run Context Builder and a compact Goal profile for one `SWU-IOLM-00C-UI-A2` regeneration, execute only A2 through Task Session against fresh A1 receipt `20260723T002902Z-current-fixture-rebind`, and stop at a current-generation `iolm-demo-snapshot/v1`. Re-read the exact A1 receipt and current guarded bundle immediately before mutation and block on any further drift. Independently, Option 1 remains recorded in `DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001`: do not create 00C-B candidate graph sources or select 00C-C until a passing upstream cross-feature-support receipt exists. `DEC-GCP-002` keeps the L0D consumer lane unselected after the compiler-backed candidate substrate, and the G-DSV2-SG owner route remains relevant only to L0A authoritative rebind.
