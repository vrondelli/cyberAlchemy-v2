# CyberAlchemy Product-Thesis Findings

Status: candidate research finding  
Authority effect: none  
Evidence contract: exact-binding, closure handoff `ready`

This artifact proposes a bounded Product Thesis change and follow-on research
routes. It does not promote a definition, mutate the Product Thesis, select an
architecture, adopt a Product Capability, admit ontology, implement or prove a
capability, establish conformance or acceptance, publish, release, deploy, or
authorize an external effect. [Evidence: `evidence-closure.md` Contract and
Writer Obligations; confirmed dispatch claim ceiling recorded in
`synthesis-revised.md#ordered-d65-follow-on-routes`.]

## Decision 1 — Change the highest-priority Product Thesis

The highest-priority change is **PT-01: a BUILD-FROM-OWNED specialization** of
the existing CyberAlchemy Product Thesis. It should specialize dynamic work fit,
shared meaning, visible boundaries, and evidence/owner continuity; it should not
rename the Product as a plug-in platform. This classification is bound to
Product Thesis SHA-256
`31dab58d79a40c193f5407f180625245d821e3dc3f084945a07e8d31f30380b0`,
selectors §§Thesis, First-Order Product Principles, Governance And Authority,
Product Ergonomics, How CyberAlchemy Creates Value, and Product And Delivery
Form; explorer return `research.md#agent-1--shannon-claude`, §§Observed product
commitments and Bounded amendment language; and closure `ECB-01`.

The exact repaired PT-01 paragraph is:

> CyberAlchemy should surface source-owned meaning and entry points to bounded
> capabilities in the person’s present work without requiring them to
> reconstruct where those things live or who controls them. Each surfaced item
> must preserve exact identity, provenance, currentness, ownership, boundary,
> and claim ceiling, while uncertainty, stale state, and unresolved
> dependencies remain visible. A person may inspect, challenge, defer, or route
> an item through its retained owner. Automatic discovery and presentation may
> reduce coordination burden, but they do not transfer semantic, acceptance,
> promotion, routing, execution, or effect authority.

This wording intentionally surfaces *entry points* to capabilities rather than
claiming that an ability itself is rendered or transported. [Evidence:
`review-round-1.md#quine-willard-van-orman--definitional-soundness`; Product
Thesis `31dab58d…`, selectors above; closure `ECB-01`.]

**PT-02 revision trigger.** The specialization must be revised if no literal
source-to-visible-Workspace witness can be executed, or if an eligible changed
source becomes visible only after an undeclared manual rebuild, import, or edit.
This is a falsifier definition, not an executed result. [Evidence:
`review-round-1.md#popper-karl--non-vacuity` and
`synthesis-revised.md#pt-02--falsifiability-and-revision-trigger`; closure
`ECB-02`.]

**PT-03 KILL.** Kill both the universal slogan “CyberAlchemy is a plug-in
everywhere and everything is a plug-in inside it” and the claim that
CyberAlchemy is currently a plug-in-platform Product or implemented capability.
They collapse testable distinctions and have zero working integration
witnesses. [Evidence: explorer `research.md#agent-2--nyquist-harry`, §§Failure
witness and Immutable source identity; ResonantOS commit
`e804f16709891e42b67646c1c8387c1ae57185ec`, `README.md` lines 1–5 and
`research/R-12-architecture-paper.md` lines 692–716; Product Thesis
`31dab58d…`, §Product And Delivery Form; closure `ECB-03`.]

## Typed distinctions that must not collapse

These are candidate distinctions for `CA2-ROUTE-DEFINITIONS`, not canonical
definitions. Their shared binding is closure `ECB-04`, Product Thesis
`31dab58d…` §Governance, construction Product Capability Git blob
`538ccbd09d5eb4ff1329d588d04d6c4b5636dea7`, explorer
`research.md#agent-3--turing-alan` §§Executive finding, Typed harness catalog,
and Product-thesis implications, and
`review-round-1.md#quine-willard-van-orman--definitional-soundness`.

| Term | Candidate meaning and exclusion |
|---|---|
| Product | User-facing value and governed experience; neither an artifact nor runtime role, and capable of spanning Projects, packages, hosts, Product Capabilities, and implementations. |
| Project | A bounded change or coordination endeavor; not the Product, package, host, capability, owner, or authority principal. |
| Product Capability | A realization-independent, user-meaningful Product ability with owner, boundary, and evaluable outcome. |
| Implementation capability | A concrete runtime ability contributing through a typed contract; not the Product Capability and not its endpoint. |
| Capability endpoint | An invocable interface exposing implementation capability; several endpoints may contribute to one Product Capability. |
| Host | The runtime surface playing host at one declared integration edge; host-owned lifecycle, containment, presentation, credentials, or effects exist only where separately bound. Product does not imply Host. |
| Plug-in distribution | An exact distributable guest artifact intended to implement a host contract; existence or packaging is not installation. |
| Installed guest | A host-bound instance created from a distribution; registration, admission, enablement, invocation, disablement, and removal remain separate. |
| Package | An artifact container that may hold zero or many artifacts and entry points; it creates neither a host relationship nor authority. |
| Add-on | A non-canonical UX or distribution label only. It is killed as an ontology kind and is not a synonym for plug-in, capability, harness, or owner. |
| Harness | A purpose classification for a capability that observes, evaluates, replays, or measures a target; it neither makes its evidence true nor becomes a plug-in except through a separately declared host edge. |
| Adapter | A translation responsibility between a host-native surface and typed contract; it may be built in, bundled, or separately deployed and never becomes the owner through translation. |
| Projection | A provenance-bearing read model derived from retained source truth; it is neither the source nor a capability, and rendering grants no authority. |
| Authority Principal | A named human or governed entity entitled to decide one bounded meaning, admission, acceptance, promotion, lifecycle, or effect class. |
| Route | A locator or governed path that reaches an Authority Principal and carries typed intent; it does not own or decide. |

The mandatory non-collapse rules are: `Product != Project != Host`; `Product
Capability != implementation capability != capability endpoint`; `plug-in
distribution != Package != installed guest`; `plug-in != capability`; `Add-on
!= plug-in`; `Harness != evidence truth`; `Adapter != Authority Principal`;
`Projection != source` and `Projection != capability`; host lifecycle authority
`!=` guest semantic authority; `Route != Authority Principal`; registration
`!=` admission `!=` enablement `!=` invocation; evaluation `!=` conformance
`!=` acceptance `!=` effect permission; and recursive host/guest roles `!=`
universal artifact identity. [Evidence: Quine table and Required non-collapse;
Turing §§Executive finding and Smallest manifest; closure `ECB-04` and
`ECB-05`.]

## Edge-specific host/guest topology

`ARC-01` survives only as a BUILD-FROM-OWNED, edge-specific architecture
hypothesis:

```text
External Host Surface
  --hosts and lifecycle-controls--> CyberAlchemy Adapter
  --grants edge-bounded capabilities--> CyberAlchemy Runtime Surface

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

CyberAlchemy can therefore be a guest at one edge and a host at another, but
the role and each truth, lifecycle, credential, containment, presentation, and
effect owner must be declared independently at each edge. One internal harness
cannot prove cross-host embeddability. [Evidence: Nyquist
`research.md#agent-2--nyquist-harry`, §§Inference and Proposal: candidate
product-thesis implications; ResonantOS `e804f167…`, `CONCEPT.md` §§core idea,
principles, element families, Augmentor, and `R-12` §§4.2, 7.1–7.3, 8.1–8.2,
11.5; Turing manifest relation; closure `ECB-06` and `ECB-13`.]

`ARC-02` remains killed as a current claim: no
`cyberalchemy.plugin-manifest@1` or generic internal kernel currently exists.
The only exact local precedent in scope is
`cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/addon-manifest.json`,
Git blob `d619b39c093f773a6e3ca2f964f0997984972ab1`. A future manifest could bind
identity, compatibility, contracts, permissions, forbidden claims, and witness
selectors, but it could not itself establish registration, admission,
enablement, invocation, acceptance, or authority; registry ownership remains
deferred. [Evidence: Turing §§Existing add-on precedent and Smallest manifest;
Lakatos Generic manifest/kernel; closure `ECB-07`.]

## Workspace boundary: static current candidate versus automatic contract

`WS-01` is only a bounded, static inspect/navigation candidate. The exact
current selectors are snapshot builder SHA-256
`bf15b7f0fc6b9ce20c568e027f077e24874dda59f070c8e18c7573b6f936b9b7`,
lines 18–154; graph builder SHA-256
`aeb8036e647504c537b9e3fb35470d8fd74ceeffafaf7a6fc6d6c27bd9e61c41`,
lines 9–63; node SHAs `fa0911…`, `572611…`, and
`1ecdba2a093042cc8a6778af59537c807e93b994b993b5ab598ed9db6f2e8837`;
and Canvas SHA `15d1ab…`, selectors `DetailDialog` and `Canvas`. Those bytes do
not prove arbitrary source discovery, automatic refresh, or an owner-receipt
lifecycle. [Evidence: Shannon §§Observed gap and Freshness/degraded-mode
requirements; closure `ECB-08`.]

`WS-02` is a NOVEL-ATTEMPT contract: exact source notice; declared-kind,
source-bound indexing; non-frontend owner and dependency-currentness result;
provenance-bearing projection candidate; atomic `S1 -> S2` snapshot and exact
delta; automatic fresh-client visibility without manual rebuild/import/edit;
digest-bound challenge or route intent; and a retained Authority Principal’s
receipt projected back. Unsupported, unowned, ambiguous, or non-evaluable
inputs must remain visible residue rather than be admitted or silently omitted.
[Evidence: Shannon §§Concrete event-to-interface sequence, Positive witnesses,
Negative witnesses, and Observed gap; IDE ergonomics SHA-256
`760944d61f6531f922a7422d89672d6014bc2294a72ec4ebe700143ad4ceb884`,
§§Working Hypothesis, Candidate UX Primitives, Boundaries; closure `ECB-09`.]

## Harness research backlog, not an offering portfolio

`HB-01..12` is killed as a Product offering portfolio and retained only as a
research backlog. Each item needs its own owner, exact positive execution, and
discriminating negative before an offering claim can be evaluated. [Evidence:
Turing §Typed harness catalog; Lakatos disposition matrix; Popper KILL of
Harness Offering Portfolio; current-main blobs and exact paths corrected in
`evidence-closure.md#exact-path-corrections`; closure `ECB-10`.]

| ID | Backlog item | Current evidence ceiling |
|---|---|---|
| HB-01 | Context selection/envelopes | Bounded candidate, blob `f302a870…`; no routing, ontology, or admission. |
| HB-02 | Prefix/cache affinity | Research at DSH blobs `eb41fed…`, `196c6a…`, `071b834…`; provider-cache witness absent and worktree commit unjoined. |
| HB-03 | Observation masking | NOVEL-ATTEMPT; no exact current owner or implementation selector. |
| HB-04 | Compression/reduction | Research proposal at `196c6a…`, `071b834…`; reducer owner unresolved and raw source must remain addressable. |
| HB-05 | Reasoning recovery/replay | Bounded candidate at `8e9c501…`; general branching/distributed state remains open. |
| HB-06 | Runtime journal | Bounded non-durable candidate at `31a161…`; distinct from reasoning state. |
| HB-07 | Semantic evaluator | Bounded candidate at `e4a5648…`; no promotion or effect authority. |
| HB-08 | Advisory intent resolver | Bounded candidate at `d619b39…`; not repository routing authority. |
| HB-09 | Evidence/benchmark | Research category with no universal owner; evaluator, corpus, target, environment, and negatives must be bound. |
| HB-10 | Browser/UX proof | Bounded precedent only; HTTP, browser runtime, DOM, pixels, UX, and Product proof remain separate. |
| HB-11 | Ontology/Inventory projection | Research across separate owners; exact records, selectors, and source bytes required; suspended runtime cannot admit or block. |
| HB-12 | Construction/conformance loop | Bounded candidate Product Capability at blob `538ccbd…`; no completion, admission, or effect authority. |

## Owner and effect boundaries

An external host may own only separately bound lifecycle, containment,
credentials, trusted approval, effects, enablement, and revocation; it does not
inherit guest domain meaning. A CyberAlchemy Product surface may own the
composition experience, visible boundaries, and typed handoffs, not runtime-host
identity, semantic decisions, admission, or effects. A host runtime surface may
own separately specified registration, enablement, invocation, disablement, and
uninstallation, but not Product identity or guest meaning. [Evidence: Nyquist
§§UI integration and Runtime/effect ownership; ResonantOS `R-12` §§4.2, 7.3,
8.1–8.2, 11.5; closure `ECB-06`.]

An installed guest owns only its typed computation under its exact contract. A
capability owner owns contract and implementation meaning plus conformance
criteria. A harness owner owns its bounded observation/evaluation/replay method
and evidence, not target truth, acceptance, promotion, or effects. A Workspace
frontend owns inspect/navigation and local presentation intent, while the
projection service owns deterministic derived state and provenance; neither may
edit retained source meaning, status, owner, claim ceiling, or authority.
[Evidence: Turing §§Executive finding and Typed harness catalog; Shannon
§§Observed implementation/interaction precedent and Negative witnesses;
Workspace node SHAs and Canvas SHA in closure `ECB-08`.]

Every consequential decision remains with the explicitly bounded Authority
Principal reached by a Route. A candidate, manifest, registry row, validator
PASS, projection, evidence receipt, or UI action cannot substitute for that
decision, and no participant gains effect authority by proximity. [Evidence:
Product Thesis `31dab58d…` §Governance; Nyquist §Runtime/effect ownership;
Turing §Smallest manifest; Quine Required non-collapse; closure `ECB-04`.]

## Immutable evidence corrections

The ARE/DSH cache-affinity worktree is **clean but unjoined**, not dirty:
`/home/vrondelli/projects/domainspec-core-are-dsh-cache-affinity`, HEAD
`e2f00d9174339154c554f8d58ecca8be22366848`, zero porcelain-v2 changed or
untracked records, merge base `96b75297dc8402a63a18ec96c474fe89419ff624`,
divergence `1 1`, and a 161-file / 10,450-insertion / 469-deletion diff. Those
bytes are not current-main implementation, accepted ontology, a validated
Product Capability, conformance, or joined evidence. [Evidence: Turing
`research.md#agent-3--turing-alan`, §Cache-affinity worktree; closure `ECB-14`.]

ResonantOS is pinned to commit
`e804f16709891e42b67646c1c8387c1ae57185ec` and is design/research material
only: 36 tracked files, zero implementation-language files, zero test-named
files, Phase 2 not started, and no observed reuse license. It supplies no code,
SDK, tests, working integration, or reuse permission for this result. July SDK
and bridge bindings are obsolete design inspiration; only host-retention and
historical design lessons survive. [Evidence: Nyquist §§Immutable source
identity, Failure witness, Drift from the audited Arcanum-as-add-on lead;
ResonantOS `README.md` lines 1–5, `R-12` §14 lines 511–513 and Phase 3 lines
692–716; closure `ECB-15`.]

## Executable witness shapes and degraded modes

`WIT-01` is an unexecuted future bundle. Bind `D1` initial and `D2` changed
definition bytes/digests, `P1` exact harness artifact digest, registry source
selector plus Authority Principal and Route, and `S1` pre-change snapshot. The
positive trace is `D1 -> D2 event -> P1/version/selector-bound index receipt ->
D2 ownership/currentness receipt -> complete S2 and exact delta -> automatic
fresh-browser D2 assertion -> D2 ChallengeIntent -> principal receipt bound to
D2`. Separately prove `P1 verified -> installed -> registered -> invoked ->
disabled -> typed unavailable -> uninstalled`, with host and retained source
truth preserved. Canonical-source mutation, harness semantic mutation, and
unauthorized effect-call counters must each be exactly zero. [Evidence: Shannon
§Concrete event-to-interface sequence; Turing §Executable witness shapes;
Popper minimum future evidence; closure `ECB-11`.]

`WIT-02` is an unexecuted negative suite: an out-of-selector mutation stays
unsupported/unowned; `D2 -> D3` stales the D2 receipt; index failure retains a
conspicuously stale S1 without partial swap; malicious semantic/effect requests
are rejected with zero counters; disable/uninstall preserves source truth;
manifest or PASS never implies admission, enablement, conformance, acceptance,
or effect permission; and HTTP 200 never hides console, DOM, pixel, or visual
failure. [Evidence: Shannon §Negative witnesses; Turing negative witnesses;
Popper discovery and harness repairs; closure `ECB-12`.]

`WIT-03` kills the inference that one internal harness proves cross-host
embeddability. A later second-host trace must bind exact host and adapter
identities, requested and available features, explicit capability profile,
unavailable features with reasons, typed user-visible degradation, no privilege
fallback, no equivalence claim, and disable/removal with retained truth.
[Evidence: Nyquist edge-specific inference; Popper host/guest repair; closure
`ECB-13`.]

Required degraded modes are typed `unsupported`, `indeterminate`, or `blocked`
ownership; dependency-scoped `stale`; conspicuous last-known-good after index
failure; no partial snapshot swap; stale receipt on digest mismatch; typed guest
unavailable; reduced host profile without equivalence; provider-cache telemetry
`unknown` when absent; explicit journal eviction; separate server/browser/visual
proof; and exclusion of active-worktree-only features from current-main claims.
These are requirements, not passed tests. [Evidence: Shannon
§Freshness/degraded-mode requirements; Turing §Typed harness catalog and browser
witnesses; `synthesis-revised.md#degraded-state-requirements`; closure
`ECB-09`–`ECB-14`.]

## Candidate / owner / witnessed / sound / verdict matrix

Here, “witnessed” means witnessed within this dispatch at the stated proof
surface; `no` never means disproved unless the verdict says KILL. “Sound” means
the candidate preserves the reviewed distinctions, not that it is canonical,
adopted, implemented, or accepted. [Evidence: exact dispositions in closure
`ECB-01`–`ECB-16`.]

| Candidate | Required owner | Witnessed now? | Definitionally sound? | Verdict |
|---|---|---:|---:|---|
| PT-01 owner-preserving surfacing | Product Thesis owner | Source basis yes; behavior no | Yes, after Quine repair | SURVIVES as BUILD-FROM-OWNED proposal |
| PT-02 revision trigger | Product Thesis owner | No; future falsifier | Yes | BOUND revision criterion |
| Universal plug-in slogan | Product Thesis owner | No | No | KILL |
| Current plug-in-platform identity/capability | Product and capability owners | No | No as current claim | KILL |
| DEF-01..16 vocabulary | Definitions owners | Candidate distinctions only | Conditionally | DEFER canonicalization to definitions governance |
| Add-on ontology kind | Definitions owner | Drift counterevidence yes | No | KILL; retain non-canonical distribution language |
| ARC-01 per-edge guest/host topology | Architecture and edge owners | Design precedent only | Yes per edge | CONDITIONAL HYPOTHESIS; implementation deferred |
| Current generic manifest/internal kernel | Registry/lifecycle owner unresolved | Counterevidence yes | No as current claim | KILL; future sketch deferred |
| WS-01 static inspect/navigation | Workspace owner | Exact bytes observed; runtime not run here | Yes within bounded claim | BOUNDED CURRENT CANDIDATE |
| WS-02 automatic source-to-Workspace | Source, index, Workspace, and principal owners | No | Yes as repaired contract | NOVEL-ATTEMPT; DEFER |
| HB-01..12 Product offering portfolio | Separate owner per item | No common lifecycle witness | No as umbrella offering | KILL offering; retain research backlog |
| WIT-01 source/UI/lifecycle bundle | Exact fixture and proof-surface owners | No | Yes as shape | DEFER; unexecuted |
| WIT-02 negative controls | Exact fixture and proof-surface owners | No | Yes as shape | DEFER; unexecuted |
| One harness proves cross-host support | Architecture and host-adapter owners | No | No | KILL inference; second-host witness deferred |
| ARE/DSH dirty-worktree claim | ARE/DSH worktree owner | Fresh status contradicts it | No | KILL; replace with clean-but-unjoined |
| ARE/DSH unjoined bytes as current-main evidence | ARE/DSH and join owners | Unjoined state observed | No | KILL current-main claim |
| ResonantOS reusable current code/SDK/tests | ResonantOS/reuse and integration owners | Absence observed | No | KILL; design comparison only |
| Research authorizes D65 successors | Each separate successor owner | No | No | KILL current authority; decisions deferred |

## Ordered D65 continuation routes

The only sound continuation preserves predecessor and owner separation:

1. `CA2-ROUTE-DEFINITIONS` decides the candidate terminology and non-collapse
   rules.
2. `CA2-ROUTE-DEFINE` may form a candidate Product Capability for automatic
   source-owned meaning surfacing and owner-routed continuation.
3. `CA2-ROUTE-GOVERNANCE` may define capability-local business ontology,
   edge roles, principals/routes, lifecycle, authority/effect boundaries,
   exact selected ontology dependencies, and degraded states; the suspended
   Python runtime remains diagnostic only.
4. `CA2-ROUTE-PLAN` may author DomainSpec v2 source, deterministic graph/system
   ontology, exact binding, and witness plan; existing Goals blockers cannot be
   bypassed.
5. `CA2-ROUTE-IMPLEMENT` may implement only the smallest WIT-01 vertical under
   exact authorization and without absorbing registry ownership.
6. `CA2-ROUTE-VALIDATE` may execute WIT-01/02 and later WIT-03 on their separate
   proof surfaces.
7. A separate `CA2-ROUTE-GOVERNANCE` decision is required for Product
   Capability adoption, definition acceptance, ontology admission,
   implementation conformance, and every effect decision.
8. `CA2-ROUTE-PUBLISH` requires a separate exact publication envelope.

These are planning routes only; this research authorizes none of them.
[Evidence: `synthesis-revised.md#ordered-d65-follow-on-routes`; confirmed
dispatch claim ceiling; closure `ECB-16`.]

## Open residue

- Canonical Product/Project/Product Capability/implementation capability/
  endpoint/Host/plug-in distribution/installed guest/Package/Add-on/Harness/
  Adapter/Projection/Authority Principal/Route terms remain undecided.
- Internal registry ownership is unresolved.
- Automatic source discovery, selector closure, Workspace delta, challenge,
  and owner-receipt contracts are unimplemented.
- `D1/D2/S1/S2/P1` and cross-host degraded-feature witnesses have not run.
- Harnesses remain a backlog, not a Product offering.
- Provider-cache observability is missing and therefore unknown.
- The ARE/DSH commit is clean but unjoined.
- ResonantOS license, code, tests, and integration evidence are absent at the
  pinned commit.
- Inventory lookup readiness remains blocked by six source-coverage failures;
  it is a lead-selection aid, never authority.

These residues preserve every deferred and killed disposition in
`evidence-closure.md#residue` and `ECB-01`–`ECB-16`; none is silently converted
to PASS, admission, acceptance, or authorization.
