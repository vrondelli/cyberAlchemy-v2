# Exact-Binding Synthesis Candidate

## Decision

The highest-priority product-thesis delta should be about an owner-preserving
product experience, not about “CyberAlchemy as a plug-in platform.”

CyberAlchemy should promise that relevant source-owned meaning and bounded
capabilities become visible at the moment of work, with their identity,
provenance, currentness, boundary, owner, and claim ceiling intact. A person
can inspect, challenge, defer, or route what appears; automatic discovery,
plug-ins, adapters, harnesses, and Workspace projections may reduce
coordination burden, but none acquires semantic, acceptance, promotion,
routing, execution, or effect authority by being loaded or rendered.

“Embeddable guest and compositional host” is a strong architecture candidate.
“Plug-in platform” remains a delivery-form hypothesis until canonical terms and
an install/register/invoke/degrade/uninstall witness exist.

This preserves Shannon’s product-first objection, Nyquist’s concrete host
constraints, and Turing’s owner-preserving capability-fabric inference without
collapsing them into one stronger claim than the evidence supports.

## Proposed Thesis Delta

Candidate insertion after `Product Ergonomics` or within `How CyberAlchemy
Creates Value`:

> CyberAlchemy should bring source-owned meaning and bounded capabilities into
> the person’s present work without requiring them to reconstruct where those
> things live or who controls them. Each surfaced item must preserve exact
> identity, provenance, currentness, ownership, boundary, and claim ceiling,
> while uncertainty, stale state, and unresolved dependencies remain visible.
> A person may inspect, challenge, defer, or route an item through its retained
> owner. CyberAlchemy may participate in different hosts and compose
> independently governed capabilities, but discovery, installation,
> presentation, or successful evaluation does not transfer semantic,
> acceptance, promotion, routing, execution, or effect authority.

Classification: **proposal**, grounded in:

- Explorer return `Agent 1 — Shannon, Claude / Observed product commitments vs
  lower layers` and `/ Bounded amendment language`;
  `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, SHA-256
  `31dab58d79a40c193f5407f180625245d821e3dc3f084945a07e8d31f30380b0`,
  selectors `§Thesis`, `§First-Order Product Principles`, `§Governance And
  Authority`, `§Product Ergonomics`, `§How CyberAlchemy Creates Value`,
  `§Product And Delivery Form`.
- Explorer return `Agent 2 — Nyquist, Harry / Product thesis and boundaries`,
  `/ Runtime/effect ownership`, and `/ Inference`; ResonantOS commit
  `e804f16709891e42b67646c1c8387c1ae57185ec`, selectors `CONCEPT.md §The core
  idea`, `§Principles`, `§Element families`, `§Augmentor`, and `R-12 §4.2`,
  `§7.1–7.3`, `§8.1–8.2`, `§11.5`.
- Explorer return `Agent 3 — Turing, Alan / Executive finding` and `/
  Product-thesis implications`; current-main blob selectors listed in
  `Current-main evidence boundary`, especially
  `intent-route-resolver/addon-manifest.json` blob
  `d619b39c093f773a6e3ca2f964f0997984972ab1` and
  `continuous-construction-task-loop/product-capability.json` blob
  `538ccbd09d5eb4ff1329d588d04d6c4b5636dea7`.

The thesis should not presently say “everything is a plug-in,” “app store of
autonomous agents,” “automatically improves itself,” or “cache affinity reuses
reasoning.” Those formulations either collapse distinct types or exceed
current witnesses.

## Typed Distinctions

| Term | Candidate necessary distinction | Counterexample / forbidden collapse | Class and binding |
|---|---|---|---|
| **Product** | User-facing value and governed experience across delivery forms. | A manifest, package, UI surface, or passing harness is not the Product. | **Current local fact + synthesis:** Shannon; Product Thesis `31dab5…`, `§Thesis`, `§Product And Delivery Form`. |
| **Host** | Environment that loads/invokes a guest and owns lifecycle, containment, trusted presentation, credentials, and effect ceilings at that boundary. | Host need not own guest domain meaning. | **Pinned external fact + inference:** Nyquist; ResonantOS `e804f…`, `R-12 §4.2`, `§7.3`, `§8.1–8.2`, `§11.5`. |
| **Plug-in** | Guest artifact bound by exact identity that implements host contracts and can be registered, invoked, disabled, and removed without becoming an authority kind. | Loaded, installed, important, or visible does not mean admitted, enabled, authoritative, or effectful. | **Proposal:** Turing, `Smallest manifest`; add-on manifest blob `d619b3…`; canonical definition unresolved. |
| **Add-on** | Packaging/integration label for an optional extension to an existing product; may contain adapters, capabilities, harnesses, or projections. | Add-on is not synonymous with capability or authority owner; historical ResonantOS SDK meaning is not current. | **Prior audited precedent, now drifted:** Nyquist; local prior finding, superseded by ResonantOS `e804f…`. |
| **Capability** | Realization-independent, testable ability with typed inputs, outputs, boundaries, and an owner. | A package may carry several capabilities; installation does not prove adoption or conformance. | **Current local fact + proposal:** Turing; construction-loop Product Capability blob `538ccb…`. |
| **Harness** | Capability specialized for bounded observations, evaluations, replay results, or evidence about a target. | Harness PASS is not semantic truth, admission, promotion, or permission. | **Current local fact:** Turing; blobs `f302a8…`, `8e9c50…`, `31a161…`, `e4a564…`; portfolio positioning is inference. |
| **Adapter** | Boundary translator between host-native events/protocols and portable typed CyberAlchemy contracts. | Cannot infer owner, change meaning, strengthen authority, or claim equal guarantees across hosts. | **Proposal/inference:** Shannon and Nyquist; ResonantOS `e804f…`, `R-12 §4.2`, `§7.1–7.3`. |
| **Projection** | Derived provenance-bearing read model over retained source truth. | Rendering a record does not make the frontend its meaning owner. | **Current local fact:** Shannon; Workspace node/UI digests `fa0911…`, `572611…`, `1ecdba…`, `15d1ab…`. |
| **Authority owner** | Named principal or route entitled to decide one bounded class of meaning, lifecycle, admission, acceptance, promotion, or effect; ownership is edge-specific. | Host, plug-in, registry, frontend, evaluator, and Product are not automatically one owner. | **Current local fact + corroboration:** Product Thesis `31dab5…`, `§Governance And Authority`; ResonantOS `e804f…`, `R-12 §8.1–8.2`. |

Preferred topology relations are `hosted_by`, `registers_with`,
`implements_contract`, `requests_capability`, `projects_state_from`,
`executes_via`, and `persists_truth_in`. This vocabulary is a proposal, not
canonical definition authority.

## Bidirectional Host/Guest Topology

```text
External host
  --hosts/lifecycle-controls--> CyberAlchemy adapter
  --grants bounded host capabilities--> CyberAlchemy Product surface
  --retains credentials, containment, trusted approval UI, effects, revoke-->

CyberAlchemy Product
  --hosts through capability ports--> typed plug-ins/add-ons
  --invokes--> capability or harness endpoint
  --projects candidate evidence--> Workspace
  --routes challenge/gate request--> retained authority owner

Plug-in
  --implements--> one or more typed contracts
  --emits--> CandidateArtifact | EvidenceReceipt | GateRequest
  --does not own by default--> route | meaning | admission | promotion | effect

Authority owner
  --decides under separate binding--> accept | reject | defer | block | authorize
  --returns immutable receipt--> Workspace projection
```

Classification: **inference/proposal**. External constraints come from Nyquist,
`Inference` and `Adopt / adapt / reject`, ResonantOS `e804f…`, `CONCEPT.md
§Element families`, `R-12 §4.2`, `§7.1–7.3`, `§8.1–8.2`, `§11.5`. Local
feasibility precedent comes from Turing, `Executive finding` and `Typed harness
catalog`, with blobs `f302a8…`, `8e9c50…`, `31a161…`, `e4a564…`, `d619b3…`,
and `538ccb…`.

Recursive symmetry is allowed: CyberAlchemy can be a guest of an IDE/CLI/OS/
agent host and a host of internal capabilities. The role must be declared
independently at each edge.

## Automatic Definition/Ontology Discovery-To-Workspace Contract

1. A filesystem, VCS, or registered-source adapter emits
   `SemanticSourceNotice {source_ref, byte_digest, observed_at, event_kind}`;
   observation only.
2. An indexer restricted to declared source kinds emits
   `IndexMaterializationAttempt {indexer_version, selector_set, record_id,
   source_digest, material_digest, disposition}` with `indexed | unsupported |
   invalid | ambiguous`.
3. A non-frontend service returns `OwnershipBinding` and
   `CurrentnessVerdict {current|stale|blocked|indeterminate, compared_epoch,
   blockers}`. Missing or ambiguous owner/digest fails closed.
4. An evaluable projection candidate carries stable identity, status, meaning,
   owner route, source refs, boundary, claim ceiling, source epoch, and
   derivation posture. Unsupported/indeterminate inputs remain visible residue.
5. Projection computes immutable `WorkspaceSnapshot` and exact
   `ProjectionDelta {added, changed, blocked, removed}` and swaps atomically
   only after complete deterministic materialization.
6. Workspace exposes freshness, digest/epoch, owner, provenance, boundary,
   claim ceiling, relations, and new/changed state without authority transfer.
7. Human selects `inspect | challenge | route | defer | dismiss`; only local
   attention state changes directly. Challenge/route produce typed intents
   bound to the selected record and digest.
8. The retained owner separately validates and returns an immutable
   `accepted | rejected | deferred | blocked` receipt, which Workspace displays.

Steps 1–8 are **proposal**, from Shannon’s sequence and vocabulary. Existing
static snapshot/projection behavior is **current local fact**:
`build-workspace-snapshot.mjs` digest `bf15b7…`, lines 18–154;
`build-workspace-graph.mjs` `aeb803…`, lines 9–63; Workspace node/UI digests
above. Arbitrary discovery, watcher coverage, resolver, deltas/notices, and
degraded-mode UI are **unresolved/not implemented**.

## Harness Offering Portfolio

| Candidate offering | Evidence class | Product-facing promise | Required retained owner / prohibition |
|---|---|---|---|
| Context selection and sealed envelopes | Current local fact | Reconstruct selected context crossing a boundary. | `context-basis-runtime`; cannot own routing or ontology admission; blob `f302a8…`. |
| Prefix/cache-affinity observation | Research precedent; active-worktree extension unjoined | Distinguish local projection reuse from provider cache observation. | Provider owns provider-cache fact; DSH blobs `eb41fe…`, `196c6a…`, `071b83…`; worktree `e2f00d9…`. |
| Observation masking | Proposal | Produce inspectable inclusion/exclusion records. | Context/evaluator policy owner; never erase defeaters silently. |
| Compression/reduction | Proposal/research | Retain addressable raw bytes and shadow ranges while reducing payloads. | Reducer owns transformation only; summary cannot replace source. |
| Reasoning-state recovery/replay | Current local fact; broader branching unresolved | Recover verified completed frontier and replay bounded state. | Reasoning-state owner; no inherited tools, permissions, effects; blob `8e9c50…`. |
| Runtime diagnostic journal | Current local fact | Replay immutable in-process cut. | Runtime-journal owner; non-durable; blob `31a161…`. |
| Semantic evaluator | Current local fact with bounded witness | Typed advisory outcomes/receipts from frozen inputs. | Separate effect gate required; blob `e4a564…`. |
| Advisory intent resolver | Current local fact | Candidate/ambiguous/no-match/invalid dispositions. | Repository router retains authority; zero effects; blob `d619b3…`. |
| Evidence/benchmark harness | Current local precedent plus portfolio proposal | Reproducible scored evidence bound to corpus/evaluator/environment. | Target owner decides adoption/promotion; PASS is advisory. |
| Browser/UX proof | Bounded precedent; general offering unresolved | Separate HTTP, console/network, DOM, pixel, and UX evidence. | No product-readiness inference. |
| Ontology/Inventory projection | Current local fact | Deterministic selected-record projection with source/build receipts. | Definition/ontology/Inventory owners retain meaning/admission. |
| Construction/conformance loop | Current local fact | Candidate continuation and D65 decision composition. | Planning or validator PASS cannot become completion; blob `538ccb…`. |

## Ownership And Effect Matrix

| Boundary | Owns | May produce | Must not produce |
|---|---|---|---|
| External host | lifecycle, containment, credentials, trusted approval UI, external effects, enable/revoke | host grants/effect receipts | guest semantic truth |
| CyberAlchemy Product | composition experience and legible handoffs | typed invocation, candidate projection, owner-route intent | automatic semantic/admission/effect decision |
| Plug-in/add-on | bounded implementation/runtime behavior | candidate artifact, evidence receipt, gate request | repository route, acceptance, promotion, effect permission |
| Capability owner | capability contract/conformance criteria | typed result and conformance evidence | broader Product/host authority |
| Harness owner | evaluator/replay/observation method | target/environment-bound evidence | target adoption, truth, promotion |
| Definition/ontology owner | canonical meaning/admission | owner disposition receipt | runtime/effect permission by semantic proximity |
| Workspace/frontend | presentation and local attention/session intent | inspect, focus, challenge, route, defer, dismiss intents | meaning/status/owner/claim edits, admission, effects |

Bindings are the corresponding Shannon, Nyquist, and Turing sections and
identities already cited above.

## Smallest Non-Vacuous End-To-End Witness

**Positive:** Register one candidate definition source with declared owner and
digest `D1`; install/register a no-authority indexer harness at exact artifact
digest `P1`; change source to `D2`; produce a digest-bound source notice and
index result; resolve owner and dependency-scoped currentness; atomically
advance Workspace `S1 → S2` and show `D2`, owner, provenance, boundary, and
claim ceiling; capture a digest-bound `ChallengeIntent` without mutating the
definition; project the owner’s `D2` disposition receipt; then disable/uninstall
the harness while retaining authoritative source and receipt and showing the
automatic indexer as unavailable.

**Negative controls:** unregistered ontology-looking file gets no inferred
owner/admission; `D2 → D3` invalidates the old receipt; indexer failure preserves
`S1` conspicuously stale rather than partially current; semantic-edit/effect
request from the harness is rejected; manifest validation or PASS does not
mark the definition accepted or capability promoted.

This complete witness is **proposed and unexecuted**, combining Shannon’s
witness/degraded-mode sections with Turing’s manifest and executable witness
shapes. Present Workspace behavior is only bounded precedent.

## Degraded Modes

- Unsupported source → visible unsupported residue, no inferred owner.
- Missing/ambiguous owner → indeterminate/blocked, no owner-route action.
- Selected dependency drift → only affected records stale/block; unrelated
  drift diagnostic.
- Index failure → last-known-good with failure identity and coverage counters.
- Partial materialization → no snapshot swap.
- Stale receipt → no reused acceptance.
- Plug-in unavailable/incompatible → host stays operable; capability unavailable.
- External host feature absent → explicit reduced profile, no equivalence claim.
- Provider cache telemetry absent → unknown, never inferred locally.
- Journal eviction → explicit receipt, no reconstruction claim.
- Browser HTTP 200 plus console/pixel failure → serving passes while browser/
  visual proof fails.
- Unjoined ARE/DSH bytes → research candidate only, never current-main evidence.

## Active-Worktree And External-Source Corrections

- `/home/vrondelli/projects/domainspec-core-are-dsh-cache-affinity` is clean at
  `e2f00d9174339154c554f8d58ecca8be22366848`; it has a large unjoined divergent
  commit (161 files, 10,450 insertions, 469 deletions), merge base
  `96b75297dc8402a63a18ec96c474fe89419ff624`. This supersedes the proposal
  packet’s stale dirty-worktree description.
- ResonantOS is pinned at
  `e804f16709891e42b67646c1c8387c1ae57185ec`; no reuse license was observed,
  and its 36 tracked files include zero implementation-language and zero
  test-named files. Phase 2 design has not started. It supports architectural
  comparison only, not code reuse or working integration.

## Preserved Disagreements

1. Shannon omits “plug-in platform” from the thesis; Nyquist/Turing find
   host/guest and capability-fabric language useful. Resolution: thesis gets
   the owner-preserving user invariant; plug-in stays architecture/delivery.
2. Existing Workspace is inspect-only; ResonantOS workspace includes trusted
   host security chrome. Do not transfer approval authority into Workspace;
   any such surface needs a separate owner.
3. Whether CyberAlchemy owns an internal registry or compiles projections for
   another host owner remains unresolved.
4. Local primitives exist, but arbitrary discovery and a complete platform
   witness do not.
5. July ResonantOS add-on research is precedent; its concrete SDK/bridge
   bindings are obsolete against current pinned source.

## Ordered D65 Follow-On Routes

These are planning candidates only:

1. `CA2-ROUTE-DEFINITIONS`: decide canonical terms and non-collapse rules.
2. `CA2-ROUTE-DEFINE`: author candidate Product Capability for automatic
   source-owned semantic surfacing and owner-routed continuation.
3. `CA2-ROUTE-GOVERNANCE`: bind capability-local business ontology, roles,
   lifecycle, authority/effect prohibitions, and degraded states.
4. `CA2-ROUTE-PLAN`: prepare DomainSpec v2 source and compiled-graph bindings;
   current Goals validation blocker prevents admitted execution state.
5. `CA2-ROUTE-IMPLEMENT`: after exact authorization, implement smallest
   discovery/index/projection vertical and manifest/capability relation.
6. `CA2-ROUTE-VALIDATE`: run positive/negative witness including uninstall,
   degradation, and zero-authority controls.
7. `CA2-ROUTE-GOVERNANCE`: separate owner acceptance/admission review.
8. `CA2-ROUTE-PUBLISH`: separate exact publication envelope only.

## Reviewer Candidates And Residue

Lakatos must locate existing owners and classify build-from-owned obligations.
Popper must require the literal `D1 → D2 → index → currentness → S1 → S2 →
ChallengeIntent → owner receipt` witness and negative controls. Quine must test
every term and forbid `Product = host`, `plug-in = capability`, `add-on =
authority`, `harness result = truth`, `adapter = owner`, and `projection =
source`.

No explorer feedback is needed. Remaining gaps are owner decisions or future
implementation/evaluation: canonical vocabulary, registry ownership, manifest
fields, eligible source kinds, challenge/receipt schema, per-record dependency
closure, diagnostics presentation, provider cache observability, DSH durable
event store/branching, ACI overlap, general UX harness, and ResonantOS licensing
and implementation evidence.

## Synthesis Verdict

The candidate survives to precedent, non-vacuity, and definitional review, but
only as an owner-preserving product-experience amendment plus a subordinate
bidirectional host/guest architecture. “CyberAlchemy plug-in platform” is not
yet a supported product identity or implemented capability.
