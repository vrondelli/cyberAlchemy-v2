# Repaired Synthesis — Zig-Zag Loop 1/2

## Decision Surface

### PT-01 — BUILD-FROM-OWNED Thesis Specialization

The surviving candidate is a specialization of CyberAlchemy’s existing
Product Thesis—not a new Product identity:

> CyberAlchemy should surface source-owned meaning and entry points to bounded
> capabilities in the person’s present work without requiring them to
> reconstruct where those things live or who controls them. Each surfaced item
> must preserve exact identity, provenance, currentness, ownership, boundary,
> and claim ceiling, while uncertainty, stale state, and unresolved
> dependencies remain visible. A person may inspect, challenge, defer, or route
> an item through its retained owner. Automatic discovery and presentation may
> reduce coordination burden, but they do not transfer semantic, acceptance,
> promotion, routing, execution, or effect authority.

This paragraph intentionally contains no plug-in/platform terminology.

Classification: **BUILD-FROM-OWNED proposal**.

Evidence: `research.md#agent-1--shannon-claude` §§Observed product commitments,
Bounded amendment language; Product Thesis SHA-256
`31dab58d79a40c193f5407f180625245d821e3dc3f084945a07e8d31f30380b0`,
§§Thesis, First-Order Product Principles, Governance And Authority, Product
Ergonomics, How CyberAlchemy Creates Value, Product And Delivery Form;
`review-round-1.md` §§Lakatos Product-thesis delta, Quine proposed paragraph.

### PT-02 — Falsifiability And Revision Trigger

The thesis specialization is not realized if no literal source-to-visible-
Workspace witness can be executed or if visibility of an eligible changed
source requires an undeclared manual rebuild, import, or edit.

Classification: **proposal required by non-vacuity review**. Evidence:
`review-round-1.md#popper-karl--non-vacuity`.

### PT-03 — KILL Universal Plug-In Identity

Kill both “CyberAlchemy is a plug-in everywhere and everything is a plug-in
inside it” and “CyberAlchemy is currently a plug-in platform” as Product
identity or implemented capability. They erase necessary distinctions and have
zero current working integration witnesses.

Classification: **KILL**. Evidence: `review-round-1.md` §§Popper, Quine;
ResonantOS commit `e804f16709891e42b67646c1c8387c1ae57185ec`, `README.md`
lines 1–5 and `R-12` Phase 3 lines 692–716; `research.md#agent-2--nyquist-harry`.

## Sound Vocabulary And Non-Collapse Rules

All terms remain candidates pending `CA2-ROUTE-DEFINITIONS`.

| ID | Term | Exact candidate distinction | Classification and evidence |
|---|---|---|---|
| `DEF-01` | Product | User-facing value/governed experience; neither artifact nor runtime role; may span Projects, packages, hosts, Product Capabilities, and implementations. | BUILD-FROM-OWNED: Product Thesis `31dab5…`; Shannon; Quine. |
| `DEF-02` | Project | Bounded change/coordination endeavor that may investigate, construct, validate, or revise Product/capability; not Product, package, host, capability, or owner. | Proposal: Quine. |
| `DEF-03` | Product Capability | Realization-independent, user-meaningful Product ability with owner, boundary, and evaluable outcome. | BUILD-FROM-OWNED: Product Capability blob `538ccbd09d5eb4ff1329d588d04d6c4b5636dea7`; Turing; Quine. |
| `DEF-04` | Implementation capability | Concrete runtime ability contributing through typed contract; distinct from Product Capability and endpoint. | Proposal: Quine. |
| `DEF-05` | Capability endpoint | Invocable interface exposing implementation capability; multiple endpoints may contribute to one Product Capability. | Proposal: Quine; Turing. |
| `DEF-06` | Host | Runtime surface playing host at one declared edge; owns only separately bound lifecycle, containment, presentation, credentials, and effects; Product is not automatically host. | Architecture proposal: ResonantOS `e804f…`, `R-12` §§4.2, 7.3, 8.1–8.2, 11.5; Nyquist; Quine. |
| `DEF-07` | Plug-in distribution | Exact distributable guest artifact intended to implement a host contract; existence is not installation. | Proposal: Quine; Turing manifest sketch. |
| `DEF-08` | Installed guest | Host-bound instance created from distribution; registration, admission, enablement, invocation, disablement, removal stay separate. | Proposal: Quine; ResonantOS `R-12` §§7.1–7.2. |
| `DEF-09` | Package | Distributable artifact container holding zero/many artifacts/entrypoints; creates neither host relation nor authority. | Proposal: Quine. |
| `DEF-10` | Add-on | Non-canonical UX/distribution language only; not ontology class or synonym for plug-in/capability/harness/owner. | KILL as ontology term: Quine; Nyquist drift analysis. |
| `DEF-11` | Harness | Purpose classification for implementation capability that observes/evaluates/replays/measures a target; plug-in is a host relation. | BUILD-FROM-OWNED distinction: Turing; Quine. |
| `DEF-12` | Adapter | Translation responsibility between host-native surface and typed contract; may be built in, bundled, or separately deployed. | Architecture proposal: Shannon; Nyquist; Quine. |
| `DEF-13` | Projection | Provenance-bearing read model derived from retained source truth; neither source nor capability; rendering grants no authority. | BUILD-FROM-OWNED: Workspace digests `fa0911…`, `572611…`, `15d1ab…`; Shannon; Quine. |
| `DEF-14` | Authority principal | Named human/governed entity entitled to decide one bounded meaning/admission/acceptance/promotion/lifecycle/effect class. | BUILD-FROM-OWNED: Product Thesis §Governance; Nyquist; Quine. |
| `DEF-15` | Route | Locator/governed path reaching an authority principal; does not own or decide. | Proposal: Shannon; Quine. |
| `DEF-16` | Capability fabric | Architecture shorthand for composition among independently owned capabilities/edges; owns no participant meaning/effect. | Architecture hypothesis only: Turing; Quine. |

Required invariants:

```text
Product != Project != host
Product Capability != implementation capability != capability endpoint
plug-in distribution != package != installed guest
plug-in != capability
add-on != plug-in
harness != evidence truth
adapter != authority principal
projection != source
projection != capability
host lifecycle authority != guest semantic authority
route != authority principal
registration != admission != enablement != invocation
evaluation != conformance != acceptance != effect permission
recursive host/guest roles != universal artifact identity
```

Preferred candidate relations:

```text
Product --offers--> Product Capability
Project --changes_or_realizes--> Product
Package --contains--> implementation artifact
Installed Guest --instantiated_from--> Plug-in Distribution
Installed Guest --implements_contract_for--> Host
Adapter --translates_between--> Host Protocol and Typed Contract
Harness --evaluates_or_observes--> Target
Projection --derived_from--> Retained Source
Route --reaches--> Authority Principal
Authority Principal --decides--> Bounded Decision Class
```

## Edge-Specific Architecture Hypothesis

### ARC-01 — Embeddable Guest / Compositional Host

CyberAlchemy may participate as a guest through a host-specific adapter at one
edge and host independently governed installed guests through typed capability
ports at another. Roles are declared per edge.

```text
External Host Surface
  --hosts/lifecycle-controls--> CyberAlchemy Adapter
  --grants edge-bounded host capabilities--> CyberAlchemy Runtime Surface

CyberAlchemy Runtime Surface
  --hosts through typed capability port--> Installed Guest
  --invokes--> Capability Endpoint
  --projects candidate result--> Workspace Projection
  --routes request--> Authority Principal

Installed Guest
  --instantiated_from--> Plug-in Distribution
  --implements--> Implementation Capability
  --emits--> Candidate Artifact | Evidence Receipt | Gate Request
  --does not thereby own--> route | meaning | admission | promotion | effect
```

Classification: **BUILD-FROM-OWNED edge-specific architecture hypothesis**,
not integration evidence or Product identity. Evidence: ResonantOS `e804f…`,
`CONCEPT.md` §Element families, `R-12` §§4.2, 7.1–7.3, 8.1–8.2, 11.5;
Nyquist; Turing; Lakatos; Quine.

### ARC-02 — Generic Manifest/Kernel Status

`cyberalchemy.plugin-manifest@1` does not exist. It is a BUILD-FROM-OWNED plus
NOVEL-ATTEMPT sketch. A manifest may bind artifact identity, compatibility,
contracts, permissions, forbidden claims, and witness selectors; it cannot
establish registration, admission, enablement, invocation, acceptance, or
authority. Internal registry ownership remains unresolved.

## Workspace: Existing Static Versus Novel Automatic Behavior

### WS-01 — Static Inspect/Navigation Projection

Current bounded candidate evidence:

- `build-workspace-snapshot.mjs` SHA-256
  `bf15b7f0fc6b9ce20c568e027f077e24874dda59f070c8e18c7573b6f936b9b7`,
  lines 18–154.
- `build-workspace-graph.mjs` SHA-256
  `aeb8036e647504c537b9e3fb35470d8fd74ceeffafaf7a6fc6d6c27bd9e61c41`,
  lines 9–63.
- `workspace-interface.json` `fa0911…`; `workspace-explorer.json` `572611…`;
  `workspace-binding.json` `1ecdba2a093042cc8a6778af59537c807e93b994b993b5ab598ed9db6f2e8837`;
  `OntologyCanvas.tsx` `15d1ab…`.

Classification: bounded current candidate only. It proves neither arbitrary
source discovery nor owner-receipt lifecycle.

### WS-02 — Arbitrary Source-To-Workspace Attempt

The following is a NOVEL-ATTEMPT executable witness shape, not implemented or
passed: exact source notice; declared-source index attempt; non-frontend owner/
dependency currentness result; provenance-bearing projection candidate;
complete atomic `S1 → S2` delta; automatic fresh-client visibility without
manual rebuild/import/edit; digest-bound challenge/route intent; retained
authority-principal receipt projected back. Unsupported/non-evaluable inputs
remain residue.

Evidence basis: Shannon sequence/freshness; Lakatos Workspace dispositions;
Popper literal trace. Novel/unresolved components include watcher, eligible
paths/kinds, selector closure, delta/notices, challenge, owner receipt,
arbitrary-source coverage, and degraded UI.

## Harness Research Backlog

This is a research backlog/taxonomy, not a Product offering or proven portfolio.

| ID | Item | Classification | Evidence ceiling |
|---|---|---|---|
| `HB-01` | Context selection/envelopes | Bounded current candidate; BUILD-FROM-OWNED direction | Blob `f302a870…`; no routing/ontology/admission. |
| `HB-02` | Prefix/cache affinity | BUILD-FROM-OWNED research | DSH blobs `eb41fed…`, `196c6a…`, `071b834…`; provider witness absent; worktree `e2f00d9…` unjoined. |
| `HB-03` | Observation masking | NOVEL-ATTEMPT | No exact current owner/implementation selector; exclusions must remain inspectable. |
| `HB-04` | Compression/reduction | BUILD-FROM-OWNED research proposal | DSH `196c6a…`, `071b83…`; reducer owner unresolved; raw source addressable. |
| `HB-05` | Reasoning recovery/replay | Bounded current candidate | Blob `8e9c501…`; general branching/distributed state/ACI unification gaps. |
| `HB-06` | Runtime journal | Bounded current candidate | Blob `31a161…`; non-durable and distinct from reasoning state. |
| `HB-07` | Semantic evaluator | Bounded current candidate | Blob `e4a5648…`; no promotion/effect authority. |
| `HB-08` | Advisory intent resolver | Bounded current candidate; BUILD-FROM-OWNED direction | Manifest blob `d619b39…`; not repository router. |
| `HB-09` | Evidence/benchmark | BUILD-FROM-OWNED category | No universal owner; bind evaluator/corpus/target/environment and negatives. |
| `HB-10` | Browser/UX proof | BUILD-FROM-OWNED bounded precedent | Generic owner unresolved; keep HTTP/runtime/DOM/pixel/UX/Product proof separate. |
| `HB-11` | Ontology/Inventory projection | BUILD-FROM-OWNED across separate owners | Declare exact records/selectors/source bytes; suspended runtime cannot admit/block. |
| `HB-12` | Construction/conformance loop | Bounded current candidate Product Capability | Blob `538ccbd…`; no completion/admission/effect authority. |

Every row requires its own positive execution and discriminating negative before
it becomes an offering claim.

## Ownership And Effect Boundaries

| ID | Participant | May own/produce | Must not acquire by proximity |
|---|---|---|---|
| `OWN-01` | External host | Separately bound lifecycle, containment, credentials, trusted approval, effects, enable/revoke | Guest domain meaning |
| `OWN-02` | CyberAlchemy Product surface | Composition experience, visible boundaries, typed handoffs | Runtime-host identity, semantic decision, admission, effects |
| `OWN-03` | Host runtime surface | Separately specified register/enable/invoke/disable/uninstall | Product identity or guest semantic authority |
| `OWN-04` | Installed guest | Typed computation under exact contract | Repository routing, admission, promotion, effect permission |
| `OWN-05` | Capability owner | Contract, implementation meaning, conformance criteria | Product-wide or host-wide authority |
| `OWN-06` | Harness owner | Evaluation/observation/replay method and bound evidence | Target truth, acceptance, promotion, effect |
| `OWN-07` | Authority principal | One explicitly bounded decision class | Unrelated decision classes |
| `OWN-08` | Route | Reach principal and carry typed intent | Principal’s decision |
| `OWN-09` | Workspace frontend | Inspect/navigation/local presentation intent | Source/meaning/status/owner/claim edits, admission, effects |
| `OWN-10` | Projection service | Deterministic derived state/provenance | Canonical source, capability ownership, admission |

## Executable Witness Shapes — Not Passed Witnesses

### WIT-01 — D1/D2/S1/S2/P1 Future Evidence Bundle

```text
Inputs
  D1 = exact initial definition bytes/digest
  D2 = exact changed bytes/digest
  P1 = exact harness artifact digest
  registry = source selector + authority principal + route
  S1 = exact pre-change Workspace snapshot

Positive
  D1 -> D2 source event
     -> source-bound index receipt with P1/version/selectors
     -> D2 ownership/currentness receipt
     -> complete S2 plus exact delta
     -> automatic fresh-browser D2 assertion
     -> D2 ChallengeIntent
     -> authority-principal receipt bound to D2

Harness lifecycle
  P1 verified -> installed guest -> registered -> invoked
     -> disabled -> typed unavailable -> uninstalled
     -> host and retained source truth remain

Zeroing facts
  Workspace canonical-source mutation count = 0
  harness semantic mutation count = 0
  unauthorized effect call count = 0
```

Required artifacts are D1/D2 bytes and registry; source event; index/currentness
receipts; S1/S2/delta; browser/runtime identity and visibility assertion;
ChallengeIntent/owner receipt; P1 lifecycle receipts; zero counters; negative
receipts. Classification: NOVEL-ATTEMPT shape.

### WIT-02 — Negative Controls

Out-of-selector mutation remains unsupported/unowned; `D2 → D3` stales the D2
receipt; indexer failure retains conspicuously stale S1 with no partial swap;
malicious guest mutation/effect requests are rejected with zero counters;
disable/uninstall preserves source truth; manifest/PASS does not imply
admission/enablement/conformance/acceptance/effect; HTTP 200 cannot hide browser
or pixel failure. These shapes are unexecuted.

### WIT-03 — Cross-Host Degraded-Feature Control

A later second-host adapter trace must bind host/adapter identities, requested/
available features, explicit capability profile, unavailable features/reasons,
typed user-visible degraded state, no privilege fallback, no equivalence claim,
and disable/removal with retained truth. This is a future architecture witness.

## Degraded-State Requirements

`DEG-01..08` require typed unsupported, indeterminate/blocked owner,
dependency-scoped stale, last-known-good on index failure, no partial swap,
stale receipt on digest mismatch, typed guest unavailable, and reduced host
profile without equivalence. `DEG-09` keeps missing provider-cache telemetry
unknown. `DEG-10` makes journal eviction explicit. `DEG-11` separates serving
from browser/visual proof. `DEG-12` keeps active-worktree-only features out of
current-main claims. These are requirements, not passed tests.

## Immutable Evidence Boundaries

### EVD-01 — ARE/DSH Active Worktree

`/home/vrondelli/projects/domainspec-core-are-dsh-cache-affinity` is clean at
`e2f00d9174339154c554f8d58ecca8be22366848`; no porcelain-v2 changed/untracked
records. Merge base `96b75297dc8402a63a18ec96c474fe89419ff624`, divergence
`1 1`, diff 161 files/10,450 insertions/469 deletions. Active-worktree
observation from Turing; supersedes stale proposal packet. These bytes are not
current-main, accepted ontology, validated Product Capability, conformance, or
joined evidence.

### EVD-02 — Current-Main Harness Boundary

Current-main blobs from Turing: DSH README `eb41fed…`; distill `196c6a…`;
patterns `071b834…`; context package `f302a870…`; reasoning contract
`8e9c501…`; journal `31a161…`; evaluator `e4a564…`; intent manifest `d619b39…`;
construction Product Capability `538ccbd…`. These are bounded candidate facts
at Turing’s exact selectors.

### EVD-03 — ResonantOS External Boundary

Pinned `e804f16709891e42b67646c1c8387c1ae57185ec`: design/research-only tree; no
observed reuse license, implementation witness, or test witness; 36 tracked
files, zero implementation-language/test-named files; Phase 2 not started.
Selectors: Nyquist; ResonantOS `README.md` lines 1–5, `R-12` §14 lines 511–513,
Phase 3 lines 692–716. Architecture comparison only.

### EVD-04 — Historical ResonantOS Add-On Packet

Prior audited precedent at
`.arcanum/inventory/entries/arcanum-resonantos-addon-research-result-synthesis.md`
and `research/2026-07-30-arcanum-resonantos-addon/synthesis-revised.md`; concrete
SDK/bridge bindings invalidated by current pinned repository. Retain only
host-retention and historical design lessons.

## Preserved Disagreements

`DIS-01`: Product invariant survives; platform language omitted/killed as
current identity. `DIS-02`: recursive host/guest survives only per edge.
`DIS-03`: static Workspace is current bounded candidate; automatic behavior is
novel. `DIS-04`: primitives remain evidence; portfolio becomes research
backlog. `DIS-05`: registry owner unresolved. `DIS-06`: current Workspace stays
projection/inspect; approval UI needs separate owner. `DIS-07`: July bindings
historical; current ResonantOS design-only.

## Ordered D65 Follow-On Routes

1. `CA2-ROUTE-DEFINITIONS`: decide `DEF-*` terminology/non-collapse.
2. `CA2-ROUTE-DEFINE`: candidate Product Capability for automatic source-owned
   meaning surfacing and owner-routed continuation.
3. `CA2-ROUTE-GOVERNANCE`: capability-local business ontology, edge roles,
   principals/routes, lifecycle, authority/effect boundaries, exact selected
   ontology dependencies, and degraded states; Python runtime diagnostic only.
4. `CA2-ROUTE-PLAN`: DomainSpec v2 source, deterministic graph/system ontology,
   binding/witness plan; Goals blocker prevents admitted execution state.
5. `CA2-ROUTE-IMPLEMENT`: only under exact authorization, smallest WIT-01
   vertical; do not absorb registry ownership.
6. `CA2-ROUTE-VALIDATE`: run WIT-01/02 and later WIT-03 across exact proof
   surfaces.
7. `CA2-ROUTE-GOVERNANCE`: separate Product Capability adoption, definition
   acceptance, ontology admission, implementation conformance, effect decisions.
8. `CA2-ROUTE-PUBLISH`: separate exact publication envelope.

## Repaired Verdict

- `PT-01`: **SURVIVES — BUILD-FROM-OWNED thesis specialization.**
- `PT-03`: **KILL — universal slogan and current platform Product identity.**
- `ARC-01`: **SURVIVES CONDITIONALLY — edge-specific architecture only.**
- `WS-01`: **BOUNDED CURRENT CANDIDATE — static inspect/navigation only.**
- `WS-02`: **NOVEL-ATTEMPT — requires D1/D2/S1/S2/P1 bundle.**
- `HB-01..12`: **RESEARCH BACKLOG — not an offering portfolio.**
- All install/index/UI/cross-host traces: **EXECUTABLE SHAPES, NOT PASSED.**
- Internal registry ownership: **UNRESOLVED.**
- No definition promotion, ontology admission, Product Thesis mutation,
  implementation, acceptance, publication, release, deployment, or external
  effect is authorized.
