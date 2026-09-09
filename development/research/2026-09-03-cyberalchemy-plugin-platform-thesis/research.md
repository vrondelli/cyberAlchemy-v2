# Explorer Research Returns

These three returns are preserved by the parent strategist as the explorer
evidence stream. Their claims remain subject to synthesis, exact-binding
closure, reviewer attack, and final audit.

## Agent 1 — Shannon, Claude

Shannon explorer receipt — read-only, no mutations.

### Bottom line

**Inference:** The highest-priority product thesis should not commit to “a
plug-in platform” as a delivery mechanism. It should commit to the user-visible
invariant that newly relevant source-owned meaning becomes discoverable and
inspectable at the right work moment, with identity/currentness/owner/boundary
visible, and that every challenge or next action routes to the retained owner.
“Plug-in/add-on,” watcher implementation, manifest format, host API,
packaging/install/update lifecycle, and exact projection schema belong below
the thesis. This follows PRODUCT-THESIS’s already committed dynamic work fit,
shared meaning, owner/evidence continuity, honest incompleteness, and
owner-safe choices—not evidence for a new top-level product identity.

### Observed product commitments vs lower layers

**Observed fact — thesis:** `PRODUCT-THESIS.md` §Thesis lines 14–35 commits to
the ergonomic governed loop and explicitly says the thesis is not Definition
or promoted Spec authority. §First-Order Product Principles lines 54–85 commits
human agency, visible bounded authority, dynamic work fit, shared meaning,
evidence/owner continuity, and honest incompleteness. §Product Ergonomics lines
197–227 requires current/historical/stale/unresolved state, evidence/relations,
relevant bounded actions, and next owner to be visible. §How CyberAlchemy
Creates Value lines 271–294 says meaningful moments are noticed/selected and
projected types must preserve rather than replace business meaning. §Product
And Delivery Form lines 343–354 leaves delivery form open.

**Proposal — belongs in thesis:** Add only: (1) source-owned meaning relevant
to the present work should surface without requiring the person to reconstruct
where it lives; (2) every surfaced item must disclose identity, provenance,
currentness, owner route, boundary, and claim ceiling; (3)
inspection/challenge/routing remain human-visible and source-owner-retaining;
(4) automatic surfacing may reduce discovery burden but cannot create semantic
or decision authority.

**Proposal — architecture:** An owner-preserving host/extension topology;
event adapter; deterministic indexer; currentness/ownership resolver;
projection service; read-only interface; command routing adapter. The frontend
is a view/controller over typed intents, never the semantic engine.

**Proposal — packaging:** Whether these pieces ship as plug-ins/add-ons,
bundled modules, host adapters, manifests, compatibility/version declarations,
install/update/uninstall and capability negotiation. PRODUCT-THESIS §Product
And Delivery Form explicitly leaves this open.

**Proposal — Product Capability:** “Automatically surface source-owned
semantic changes in Workspace for inspection and owner-routed continuation.”
This is realization-independent and testable. Workspace README lines 3–12
already establishes an inspect-only capability independent of registry/ontology
ownership.

**Proposal — definitions:** Canonical meanings for Semantic Source Notice,
Index Observation, Currentness Verdict, Projection Candidate, Workspace
Projection, Challenge Intent, Owner Route Intent, plus separately Plug-in and
Add-on only if governance concludes those labels are coherent. Do not define
plug-in from UI metaphor.

**Observed fact — implementation/interaction precedent:** `ide-ergonomics`
README §Working Hypothesis lines 28–57 offers candidate-definition, route,
knowledge-reference, hover, and self-assembly actions; §Proposed Shape lines
80–93 explicitly says first artifact is not an IDE plugin; §Candidate UX
Primitives lines 95–112 routes each action to its owner; §Boundaries lines
140–162 retains source/canonical authority. Self-assembling README §Load-Bearing
Rule lines 26–32 and §Loop lines 34–51 establish “assembled and green is not
shipped”; this is a lower-level interaction/governance witness, not a
thesis-level plug-in commitment.

### Concrete event-to-interface sequence (candidate)

1. `SemanticSourceObserved`: a filesystem/VCS/registry adapter reports
   new/changed candidate bytes `{source_ref, byte_digest, observed_at,
   event_kind}`. It makes no semantic claim.
2. `IndexMaterializationAttempt`: a deterministic indexer parses only declared
   source kinds, computes `{indexer_version, selector_set, record_id,
   source_digest, material_digest}` and emits `indexed | unsupported | invalid |
   ambiguous`.
3. `OwnershipCurrentnessCheck`: authoritative registries/owner bindings are
   consulted by a non-frontend service. Result `{owner_route,
   registration_state, currentness: current|stale|blocked|indeterminate,
   compared_epoch, blockers[]}`. Missing/ambiguous owner or digest fails closed.
4. `ProjectionCandidateBuilt`: only an evaluable record becomes `{collection,
   stable_id, label, status, meaning, owner_route, source_refs, boundary,
   claim_ceiling, source_epoch, derivation_posture}`. Blocked/indeterminate
   observations become visible residue/notices; they are not silently omitted
   or labeled current.
5. `WorkspaceSnapshotAdvanced`: projection service deterministically computes
   a new immutable snapshot/epoch and an exact delta `{added, changed, blocked,
   removed}`. Workspace current code already computes sourceEpoch and immutable
   record fields, but only from static inputs/registered catalog.
6. `WorkspaceProjectionPresented`: frontend receives the read model and shows
   “new/changed” badge, freshness state, digest/epoch, owner, provenance,
   boundary, and claim ceiling. It may search/focus/inspect relations.
7. `HumanDispositionCaptured`: person chooses `inspect | challenge | route |
   defer | dismiss`. `inspect/defer/dismiss` affect local presentation/session
   state only. `challenge` emits `ChallengeIntent` with selected record/digest
   and rationale to the source owner. `route` emits `OwnerRouteIntent`; the
   owner capability must separately validate and act.
8. `OwnerReceiptProjected`: owner returns accepted/rejected/deferred/blocked
   plus immutable receipt ref. Workspace displays it; it does not decide it.

**Observed fact:** Workspace DomainSpec node `workspace-interface.json` lines
3–8 exposes only local inspect and grants no semantic/validation/admission/
Project authority. `workspace-explorer.json` lines 3–8 emits only
selection/navigation intents and has all authority flags false. Existing
`OntologyCanvas.tsx` detail UI shows stable identity, status, owner route, claim
ceiling, incoming/outgoing relations and says “Projection, not authority.”

### Typed vocabulary candidate

- `SemanticSourceNotice` = non-authoritative observation of exact bytes.
- `IndexMaterializationAttempt` = deterministic parse/index result bound to
  source digest and indexer version.
- `OwnershipBinding` = declared owner route and binding source; never inferred
  from a rendered record.
- `CurrentnessVerdict` = `current | stale | blocked | indeterminate`, relative
  to an exact compared epoch.
- `ProjectionCandidate` = provenance-bearing candidate read model; no authority
  effect.
- `WorkspaceSnapshot` = immutable source-epoch projection (existing candidate
  term).
- `ProjectionDelta` = exact change between two snapshot identities.
- `ChallengeIntent` = human-authored request to the retained meaning owner; not
  a semantic mutation.
- `OwnerRouteIntent` = requested continuation to an owner; not acceptance or
  execution.
- `OwnerDispositionReceipt` = owner-issued immutable response projected back
  to UI.
- `FrontendAuthorityEffect` = literal `none` invariant.

### Positive witnesses

- Add a registered definition source with exact owner and valid bytes → index
  deterministically → new epoch/delta → card shows candidate/canonical posture
  and owner → user challenges → challenge routes to definitions owner → receipt
  displayed; source unchanged by frontend.
- Change ontology bytes so catalog/currentness returns blocked → Workspace
  shows changed/blocked with old last-known-good epoch clearly marked, offers
  inspect blocker/route to owner, and never calls it current.
- User dismisses a notice → local attention state changes, underlying record
  remains indexed and discoverable.

### Negative witnesses

- Frontend edits `meaning`, `status`, `owner_route`, or claim ceiling: reject;
  those are source-owned projection fields.
- New unregistered file with plausible ontology name: must not be auto-admitted
  or assigned an inferred owner; show unsupported/unowned residue or omit from
  authoritative collections with a visible diagnostic count.
- Digest changes after owner receipt: old receipt cannot bind new bytes;
  currentness becomes stale/blocked.
- Indexer fails: retain last-known-good snapshot only with conspicuous stale
  status; no empty “current” workspace and no partial silent refresh.
- Clicking Route/Challenge directly mutates canonical source or promotion
  status: prohibited. UI produces intent; owner issues any consequential
  receipt.
- Graph renderer invents relation semantics or maps unknown predicates as
  known: prohibited; exact predicate remains visible and unmapped is explicit.

### Freshness/degraded-mode requirements

**Proposal:** Every view carries snapshot ID, source epoch, generation/
observation time, per-record source digest, currentness verdict,
compared-against identity, and indexer version. Freshness is dependency-scoped:
unrelated source drift cannot invalidate a record, while any selected
dependency drift must mark it stale/block. Atomic snapshot swap only after full
deterministic materialization. Preserve last-known-good with `stale_since`,
failed-attempt identity, blocker codes, and coverage counters. Never equate
catalog PASS with semantic acceptance. Unsupported/unowned/ambiguous records
remain honest residue. Challenge/route controls disable or require explicit
stale acknowledgement when exact receipt binding is impossible.

**Observed gap:** Current `build-workspace-snapshot.mjs` lines 18–47 pins an
accepted baseline and fails on bound-source drift; lines 49–78 only reads
Workspace definitions/nodes/relations plus the ontology catalog; lines 81–136
materialize fixed categories; lines 138–154 emits a snapshot. This is
deterministic materialization, not automatic discovery of a new arbitrary
definition path. `build-workspace-graph.mjs` lines 9–18 reads only static
nodes/relations, and lines 59–63 detects generated drift.
`workspace-binding.json` lines 6–7 invalidates only on generated source-epoch
change. Therefore the requested source-event watcher, discovery coverage,
ownership/currentness resolver, delta/notices, and degraded-mode UI are
proposals/unresolved—not current capabilities.

### Bounded amendment language

**Proposal:**

> CyberAlchemy should notice when source-owned meaning relevant to the work
> becomes available or changes and surface it through a reviewable Workspace
> projection without requiring the person to reconstruct the repository. Each
> projection must preserve exact source identity, provenance, currentness,
> ownership, boundary, and claim ceiling; uncertainty and stale state remain
> visible. A person may inspect, challenge, defer, or route the item through its
> retained owner. Automatic discovery and presentation reduce coordination
> burden, but neither the Workspace nor any host extension gains semantic,
> acceptance, promotion, or execution authority.

This belongs after Product Ergonomics or in How CyberAlchemy Creates Value. Do
not use “plug-in platform” in the thesis until delivery-form/product evidence
justifies narrowing §Product And Delivery Form.

### Unresolved

- No current evidence proves arbitrary new source discovery, trigger latency,
  exact path eligibility, watcher semantics, or full coverage.
- No canonical plug-in/add-on definition exists in this scoped corpus.
- Whether blocked/unregistered source notices appear in the four semantic
  collections or a fifth diagnostics rail requires owner decision.
- Challenge taxonomy, receipt contract, ownership registry, allowed source
  kinds, and per-record dependency closure are unspecified.
- Current Workspace implementation is a bounded candidate and its use of the
  suspended Python ontology runtime is diagnostic only under root policy; it
  cannot furnish mandatory admission/currentness authority.

### Exact source identities / selectors (SHA-256 of current bytes)

- `cyberAlchemy-v2/product/PRODUCT-THESIS.md` SHA-256
  `31dab58d79a40c193f5407f180625245d821e3dc3f084945a07e8d31f30380b0`;
  selectors §Thesis, §First-Order Product Principles, §Governance And
  Authority, §Product Ergonomics, §How CyberAlchemy Creates Value, §Product And
  Delivery Form, §Evidence That Would Require Revision.
- `projects/ide-ergonomics/README.md`
  `760944d61f6531f922a7422d89672d6014bc2294a72ec4ebe700143ad4ceb884`;
  §Working Hypothesis, §Proposed Shape, §Candidate UX Primitives, §Boundaries.
- `projects/ide-ergonomics/self-assembling-ergonomics/README.md`
  `7ee58bd8c826fc16cd46b62d7da3a326e646d67f82d2f1d68074d5aae7eb07bd`;
  §Load-Bearing Rule, §Loop, §Why each step is owner-safe, §Boundaries.
- `projects/ide-ergonomics/self-assembling-ergonomics/SPEC.md`
  `be9b1d777dddcff50ecee2958a3b61b5c7060a7eea3d6a4976e4ea76f428e13a`;
  §§2–10.
- `cyberAlchemy-v2/workspace/README.md`
  `91f46e79a4f95de6f2cebb001afdbda6e3b3d0b811fdbd0427efcd484496a064`;
  lines 3–26.
- `cyberAlchemy-v2/workspace/definitions.json`
  `7ac9e10c80369fe60855ca4afc19aea22613709528f0b05c40242c0f52ceb1cb`;
  selectors `proposals[WORKSPACE-DEF-001..004]`.
- `cyberAlchemy-v2/workspace/runtime/scripts/build-workspace-snapshot.mjs`
  `bf15b7f0fc6b9ce20c568e027f077e24874dda59f070c8e18c7573b6f936b9b7`;
  lines 18–154.
- `cyberAlchemy-v2/workspace/runtime/scripts/build-workspace-graph.mjs`
  `aeb8036e647504c537b9e3fb35470d8fd74ceeffafaf7a6fc6d6c27bd9e61c41`;
  lines 9–63.
- `cyberAlchemy-v2/workspace/domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-interface.json`
  `fa09111be86a72082dae52dc3836d3426e735960248a141daab01e1903c077d0`;
  `node_id` plus `intent/body`.
- `cyberAlchemy-v2/workspace/domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-explorer.json`
  `572611304200201efb77eed8c78fbfda7c0ee8058e1be1cf31beff06d95db31f`;
  `intent/body`.
- `cyberAlchemy-v2/workspace/domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-binding.json`
  `1ecdba2a093042cc8a6778af59537c807e93b994b993b5ab598ed9db6f2e8837`;
  `intent/body`.
- `cyberAlchemy-v2/workspace/runtime/src/features/ontology/OntologyCanvas.tsx`
  `15d1ab0a84ceeb3a4a63f98713710b581ed26ef7725511f9dec1bd44a5e3c720`;
  selectors `DetailDialog`, `Canvas`.
- Inventory packet (used only to select leads, never authority): SHA-256
  `dad4fd7f9ee685cc6ab37b3824f032f81ce7db7d97a297e2adda7cdf93c509aa`;
  selectors `lookup_readiness`, `lookup_status`, `non_authority_notice`,
  `direct_source_leads`, `design_consequences`, `unresolved_gaps`, `validation`.

## Agent 2 — Nyquist, Harry

### Verdict

**ADAPT**, not direct adoption. Current ResonantOS strongly supports
CyberAlchemy’s “guest across hosts, host for internal plug-ins” thesis, but the
July audited add-on implementation lead has materially drifted. ResonantOS is
now a research-only, pre-Phase-2 architecture corpus—not the earlier
`2.0.0-alpha` add-on SDK/product checkout.

### Immutable source identity

- Repository: `https://github.com/ManoloRemiddi/resonantos`
- Commit: `e804f16709891e42b67646c1c8387c1ae57185ec`
- Checked-out/default branch: `main`; `origin/HEAD -> origin/main`
- Commit date: `2026-09-02T13:29:42+02:00`
- License: **unresolved / no license granted in the observed tree**. There is
  no `LICENSE`/`COPYING`; the architecture says license selection and legal
  review are future prerequisites before public contribution (`R-12` §14,
  lines 511–513).
- Cleanup: exact temporary directory `/tmp/cav2-resonantos.2K7Xeb` deleted and
  absence verified.
- Repository worktrees: not mutated.

### Observed facts

#### Product thesis and boundaries

ResonantOS defines itself as a personal-sovereignty layer whose value lies in a
small restartable baseplate and explicit rules for combining independently
contained components. “Plugging in” is the fundamental operation; anything
that cannot be independently unplugged is not an element (`CONCEPT.md` §The
core idea, lines 23–35; §Principles, lines 56–67).

Its current taxonomy is more precise than a generic “plug-in” abstraction:

- Five independently implementable families: agents, memory, tools, loops,
  apps.
- Eight bounded trusted services: identity/domains, custody/signing,
  consequence intent, inference, scheduling/admission, task/run records,
  trajectory/audit, and workspace/trusted attention.
- Passive skills are instruction-store profiles.
- Product/domain experiences are bundles.
- Packaging does not determine semantic class (`CONCEPT.md` §Element families,
  lines 37–54; `R-20` §6.1–6.2, lines 194–219).

#### Discovery and registration lifecycle

An element’s plug-in manifest declares stable identity, one home authority
domain, independently versioned contracts, verbs and consequence classes,
requested trusted services/host capabilities, pub/sub visibility,
health/shutdown behavior, and resource budgets (`R-12` §7.1, lines 230–246).
Discovery is domain-scoped and explicitly prevents ambient enumeration of
another personal domain (`R-12` §7.2, lines 248–253).

The public distribution registry is only future design: self-hostable/federated,
with an optional canonical index and provenance, signatures, verification,
scope/history diffs, and compatibility (`R-12`, lines 511–513).

#### UI integration

The workspace is not merely a render surface. It is a trusted-attention/security
boundary hosting ordinary app surfaces and visibly distinct system chrome for
approvals, grants, policy, health/recovery, capability disclosure, and
emergency revoke (`CONCEPT.md` §Augmentor, lines 93–96; `R-12` §11.5, lines
436–438). Ordinary plug-in UI must not impersonate host approval authority.

#### Runtime/effect ownership

The core owns only synchronous routing, domain-aware identity resolution,
authorization, and logical lifecycle invariants. It explicitly does not
execute element code, hold keys, schedule work, store application state,
render UI, or call host lifecycle APIs (`R-12` §4.2, lines 114–123).

Calls and events are distinct. Awaited effects are calls; irreversible/external
effects require persisted intent, idempotency, `unknown` reconciliation, and
sometimes prepare–approve–commit (`R-12` §7.3, lines 255–270). Capability
authority is principal × domain × verb × resource × limits × expiry, and
delegation may only shrink it (`R-12` §8.1–8.2, lines 292–312).

#### Persistence and configuration

No process may be the sole holder of required durable state. Registry and
authority indexes rebuild from protected stores; critical stores use WAL,
ordered revisions, snapshots, anchored digests, and verified restoration
(`R-12` §10.1–10.3, lines 353–378). Signed principal-values/policy
configuration belongs behind the host-owned inference seam rather than inside
an element (`CONCEPT.md` §Models, lines 98–103).

### Literal witnesses

#### Integration witness — design-level, not executed

The repository contains a literal plug-in sequence:

`principal reviews manifest/scopes → authenticated approval → supervisor
verifies exact artifact/host/domain/budgets → starts containment → element
registers contracts/verbs/topics/quotas → core resolves
grants/visibility/membership → registry acceptance and stable addresses → audit
record → bounded health beacons`.

Hot unplug is separately specified as authenticated intent → TERM →
grace/flush → KILL → domain removal event (`research/diagrams/02-element-plug-in.mmd`,
lines 1–20).

#### Failure witness — current actuality

The checked commit contains 36 tracked files, **zero implementation-language
files and zero test-named files**. README says Phase 2 design has not started
(`README.md`, lines 1–5). The fault-injection list is a future Phase-3
obligation, not passing evidence (`R-12` §Phase 3, lines 692–716).

### Drift from the audited Arcanum-as-add-on lead

| Audited July lead | Current primary-source state | Drift verdict |
|---|---|---|
| ResonantOS `2.0.0-alpha` product with `AddOnManifest`, SDK validation, bridge routes, installations and grants | Research reboot on `main`; no source code, manifest type, validator, bridge implementation, or tests | **Historical bindings invalidated** |
| One ResonantOS-native Arcanum “add-on” | Current taxonomy distinguishes family contracts, trusted services, surfaces, instruction profiles and bundles | **Adapt into multiple typed relationships** |
| ResonantOS owns discovery, installation, grants, runtime truth, effects and lifecycle | Current architecture independently reasserts domain registry, scoped grants, supervisor lifecycle, S3 effects, durable host state | **Principle retained and strengthened** |
| Augmentor is proposal/UI projection only | Current workspace remains trusted host; app surfaces cannot own or spoof authorization | **Retain** |
| Existing product primitives could support future integration | Current implementation evidence is absent | **No current witness** |
| Manifest-shaped fixture approached an existing SDK contract | Current manifests and SDK are Phase-2/3 design outputs | **Reclassify as obsolete design inspiration only** |

The local audited selectors used were:

- `.arcanum/inventory/entries/arcanum-resonantos-addon-research-result-synthesis.md#recommendation-and-claim-ceiling`
- `research/2026-07-30-arcanum-resonantos-addon/synthesis-revised.md#recommendation-and-claim-ceiling`
- `…#owner-and-use-mode-map`
- `…#complete-validator-shaped-manifest-design-fixture`
- `…#resolver-to-owner-proof-chain`

### Adopt / adapt / reject

| Decision | CyberAlchemy implication |
|---|---|
| **Adopt** | Plug/unplug as a lifecycle invariant; exact manifest identity; bounded contracts; domain/scoped capabilities; host-owned approval/effects; durable owner truth; explicit degraded state; UI projection separated from trusted confirmation. |
| **Adapt** | Treat “plug-in” as an umbrella product relationship, then type each contribution as capability provider, instruction/profile, UI surface, runtime adapter, or composed bundle. A single extension may implement several independently versioned contracts. |
| **Adapt** | Use CyberAlchemy as a guest through host-specific adapters, with explicit capability profiles and honest degraded modes; do not claim identical host guarantees. |
| **Adapt** | Use a small internal plug-in kernel: discovery indexes candidates, installation binds exact bytes, admission grants bounded authority, enablement activates, and execution remains with the capability/effect owner. |
| **Reject** | One manifest or marketplace entry as authority, admission, installation, enablement, or execution proof. |
| **Reject** | Plug-in-owned routing truth, approval database, scheduler, credentials, durable run truth, artifact truth, or release authority. |
| **Reject** | Importing the old ResonantOS SDK/bridge types as if current, or claiming a working integration from the diagram/future tests. |
| **Reject** | Making “important” functionality part of the core; importance is not a placement rule. |

### Inference

What ResonantOS concretely teaches CyberAlchemy is a **recursive host/guest
symmetry**:

- As a guest across IDEs, CLIs, operating systems, or agent hosts,
  CyberAlchemy should carry portable typed intent and capability contracts
  while accepting the host’s lifecycle, presentation, credential, containment,
  and effect ceilings.
- As a host for internal extensions, CyberAlchemy should offer stable protocol
  seams, bounded registration, deterministic resolution, scoped grants, and
  owner-backed state—without absorbing each plug-in’s domain behavior into its
  core.
- The same artifact can be a guest at one boundary and a host at the next. What
  matters is not the “plug-in” label, but which side owns truth, authority,
  lifecycle, and effects at each edge.

### Proposal: candidate product-thesis implications

1. “CyberAlchemy is both embeddable and compositional”: it can enter many hosts
   through bounded adapters and can host independently governed capabilities
   internally.
2. Replace singular “plug-in” ontology with typed relationships such as
   `hosted_by`, `registers_with`, `implements_contract`, `requests_capability`,
   `projects_state_from`, `executes_via`, and `persists_truth_in`.
3. Define a minimal host kernel around exact identity, deterministic discovery,
   authority-bounded admission, lifecycle state, and evidence routing.
4. Keep host-owned across every embedding: credentials, process/containment
   control, trusted approval UI, persistence locations, external-effect
   mediation, installation/enablement/revocation, and release/deployment policy.
5. Require a literal install/register/execute/degrade/uninstall witness before
   promoting “plug-in platform” from product thesis to implemented capability.

### Unresolved

- Whether “plug-in” should become a canonical CyberAlchemy term or remain
  explanatory language over several typed contracts.
- Which CyberAlchemy components are families/capabilities, instruction
  profiles, surfaces, adapters, or bundles.
- Minimum shared manifest fields across all external hosts versus host-specific
  extensions.
- Whether CyberAlchemy itself owns an internal registry or only compiles
  projections consumed by a host owner.
- License compatibility: current ResonantOS grants no observable reuse license.
- No current code or test evidence establishes that ResonantOS’s architecture
  works.

## Agent 3 — Turing, Alan

### Executive finding

**Observed fact:** Current main already contains a coherent set of separately
owned, no-authority harness primitives: deterministic context construction,
append-only reasoning state, bounded runtime journaling, semantic
evaluation/replay, advisory intent routing, Codex transport/conformance
canaries, and a continuous-construction decision composition.

**Inference:** CyberAlchemy can credibly be a **host for capability plug-ins
and evidence harnesses**, but not a new universal harness owner. The strongest
product thesis is: *CyberAlchemy composes owner-retaining capabilities through
immutable contracts, then exposes their evidence without converting a plug-in
result into route, semantic, effect, admission, or promotion authority.*

**Proposal:** Treat “plug-in” as a typed host relationship, not a lifecycle
status or authority kind:

```text
Host --loads--> PlugInManifest
Host --invokes--> CapabilityEndpoint
PlugIn --emits--> CandidateArtifact | EvidenceReceipt | GateRequest
OwnerRoute --decides--> admission / acceptance / effect
```

The manifest can prove compatibility and containment; it cannot decide
repository routing, meaning, truth, admission, promotion, or effects.

### Current-main evidence boundary

Current checkout:

- Branch: `codex/are-context-live-benchmark-source`
- HEAD: `01be3f28dd5ce7eea5d12823739c8d6ee56372ba`

Representative immutable Git blob selectors:

- DSH research README: `HEAD:cyberAlchemy-v2/research/agent-reasoning-engine/deepseek-harness-context-management/README.md` → `eb41fed990e64ad23877a139af04bc8a9d230814`
- DSH distilled design: `HEAD:.../distill.md` → `196c6a9224d44f6be2dd50e5693a49d763be5a8c`
- DSH pattern catalog: `HEAD:.../patterns/additional-gems.md` → `071b8342df5ec9b1948867f5533a2a6edde6c73e`
- Context runtime package: `HEAD:.../context-basis-runtime/package.json` → `f302a870de580dae1665a444456993a13d25372c`
- Reasoning-state contract: `HEAD:.../reasoning-state-runtime/README.md` → `8e9c5010bc057d9c1767e07f20e856459a278f9c`
- Runtime-journal contract: `HEAD:.../runtime-journal/README.md` → `31a16175bf83839d52c191b216dccdcc9ab18d24`
- Semantic evaluator contract: `HEAD:.../semantic-judgment-evaluator/README.md` → `e4a5648ceed983518540b49f5c91d855be43cef0`
- Existing add-on precedent: `HEAD:.../intent-route-resolver/addon-manifest.json` → `d619b39c093f773a6e3ca2f964f0997984972ab1`
- Construction-loop Product Capability: `HEAD:.../continuous-construction-task-loop/product-capability.json` → `538ccbd09d5eb4ff1329d588d04d6c4b5636dea7`

The strategy Inventory packet is parseable and fresh but `lookup_readiness:
blocked` due to six source-coverage errors. Its matches are discovery leads
only.

### Cache-affinity worktree

**Observed fact:**

- Path: `/home/vrondelli/projects/domainspec-core-are-dsh-cache-affinity`
- Branch: `codex/are-dsh-cache-affinity`
- HEAD: `e2f00d9174339154c554f8d58ecca8be22366848`
- Dirty status: **clean**; `status --porcelain=v2 --untracked-files=all` returned
  no changed or untracked records.
- Divergence from current checkout: `1 1`; each side has one unique commit.
- Merge base: `96b75297dc8402a63a18ec96c474fe89419ff624`
- Unique worktree commit: `e2f00d917 feat(are): stabilize reasoning product and Codex continuity`
- Diff from merge base: **161 files, 10,450 insertions, 469 deletions**.

**Observed unjoined content:** cache-affinity ontology nodes;
completion-frontier, reasoning-state branching/reduction/replay/locking
concepts; five planning packs; durable-gateway and reconnect changes; a
real-reasoning benchmark corpus and improvement loop; product-level ARE facade;
provider/cache canary receipts; context selector extensions; and define-CLI
integration changes.

**Inference:** The packet’s “dirty worktree” description is stale or
imprecise. The meaningful risk is not uncommitted dirt but a large **unjoined
divergent commit**. Those bytes must not be cited as current-main
implementation, accepted ontology, validated Product Capability, or
conformance.

### Typed harness catalog

| Plug-in capability | Current owner / host contract | Typed input → output | Effect authority | Lifecycle / exact identity | Overlap and duplication risk |
|---|---|---|---|---|---|
| Context selection and envelope | `context-basis-runtime`; pure ESM API | live source snapshots, definition selectors, ontology selector locks, request hints → `ContextBasis`, `ContextWindowView`, sealed `ContextEnvelope`, refresh result | `none` | `@cyberalchemy/context-basis-runtime@0.1.0-candidate`; bind package blob plus source digests and selector set | Must not duplicate repository router, ontology owner, or source admission |
| Prefix/cache affinity | DSH research; provider-owned cache observation | exact event-prefix cut plus provider/model/system/ordered tools/config/renderer header → local projection-cache receipt plus provider usage observation | `none` | DSH source commit `49a606bc…`; proposed request-series identity must include every ordered request-affecting component | Highest confusion risk: local projection cache, provider KV cache, provenance, and currentness are four different facts |
| Observation masking | Context projection policy / evaluator observation admission | typed events with visibility and authority posture → model-visible projection plus exclusion records | `none` | policy digest plus exact input prefix plus exclusion selector set | “Masking” can silently erase defeaters or residue; exclusions must remain inspectable and replayable |
| Compression/reduction | DSH reduction ladder | exact large payloads and token budget → spill refs, deterministic pruning record, or provenance-bound summary shadow | `none` | source artifact digest plus shadowed sequence range plus reducer/version digest | Summary can be mistaken for fact or source replacement; raw bytes must remain addressable |
| Reasoning-state ledger, branch, replay | `reasoning-state-runtime` | explicit reasoning events → hash-chained epochs, checkpoints, frontiers, reconstructed dispatch | `none` | `@cyberalchemy/reasoning-state-runtime@0.1.0-candidate`; ledger ID, sequence, predecessor digest, epoch digest, checkpoint binding | Can duplicate ACI/session/journal ownership; branching must bind fresh tools and authority, never inherit effects |
| Diagnostic event replay | `runtime-journal` | canonical in-process runtime events → immutable cut, deterministic replay, explicit eviction receipt | `none` | package identity plus journal/cut digest | It is deliberately non-durable and cannot reconstruct evicted content; must not masquerade as the reasoning-state source |
| Semantic evaluator | `semantic-judgment-evaluator` | frozen request, authority/catalog/context bindings, observations/challenges → typed semantic outcome plus `ReasoningReceipt` | `none`; only a separate exact-effect gate may act | `semantic-judgment evaluator@1`; bounded L0 witness is promoted, whole engine is not | Evaluator must not absorb actor orchestration, authority resolution, confidence, or effect permission |
| Advisory intent routing | `intent-route-resolver` | `intent-route.request@1` plus catalog → candidate/ambiguous/no-match/invalid disposition | none; `required_permissions: []`, `side_effects: false` | existing `intent-route.addon-manifest@1`, add-on `intent-route-resolver@0.1.0` | Must not become the repository router or silently dispatch/mutate |
| Evidence / benchmark harness | evaluator fixtures, wrapper canaries, DSH replay proposal, self-harness held-out gate | immutable manifest plus fixtures/traces → scored result, replay report, negative-case residue | none | manifest digest, corpus/split digest, evaluator digest, environment/provider binding | Passing tests or held-out non-regression can be mistaken for capability adoption, proof, or promotion |
| Browser / UX proof | current ARE intent-route browser worker and browser receipts; broader owner remains UX/browser harness | exact build/artifact plus browser/runtime profile plus scenario selectors → console/network/DOM/pixel evidence receipt | loopback/browser-test effects only | artifact digest plus browser binary/version plus scenario ID plus viewport plus receipt digest | HTTP reachability, browser execution, pixel correctness, UX adequacy, and product readiness must stay separate |
| Ontology / Inventory projection | ARE ontology package and repository Inventory, each retaining its owner | exact source records and selectors → generated graph/read model/source manifest/build receipt | none | ontology ID/epoch plus selected record IDs plus source digests plus generator digest; Inventory entry ID/path/selectors | Generated projections may be mistaken for definitions, admission, routing, or accepted ontology |
| Construction / conformance loop | `continuous-construction-task-loop` | continuation assessment plus exact C19/D65 construction evaluation → direct/gated/blocked/complete candidate decision | none | Product Capability ID plus exact implementation binding and both immutable input receipts | Must not turn planning, validator PASS, or generated candidate into implementation/admission/terminal authority |

### Smallest manifest that preserves owners

```json
{
  "schema_version": "cyberalchemy.plugin-manifest@1",
  "plugin_id": "owner.namespace.capability",
  "plugin_version": "immutable-version-or-digest",
  "owner": {
    "meaning_owner": "named-owner",
    "runtime_owner": "named-owner",
    "promotion_owner": "named-owner-route"
  },
  "host_compatibility": {
    "host_protocol": "cyberalchemy.capability-port@1",
    "required_host_features": []
  },
  "capabilities": [{
    "capability_id": "stable-id",
    "entrypoint": "./bounded-entrypoint",
    "input_protocol": "typed-input@1",
    "output_protocol": "typed-output@1",
    "authority_effect": "none",
    "side_effects": false
  }],
  "bindings": {
    "artifact_digest": "sha256:...",
    "source_selectors": [],
    "dependency_digests": {}
  },
  "permissions": [],
  "forbidden_claims": [
    "repository-routing-authority",
    "semantic-authority",
    "admission",
    "promotion",
    "effect-permission"
  ],
  "witnesses": {
    "positive": ["fixture-id"],
    "negative": ["fixture-id"]
  }
}
```

**Proposal:** A capability relation record outside the plug-in is still
needed:

```text
HostCapability --may_invoke--> PlugInCapability
PlugInCapability --returns--> CandidateEvidence
CandidateEvidence --reviewed_by--> RetainedOwnerRoute
```

This is smaller and safer than making the plug-in registry an authority graph.

### Executable witness shapes

Positive context/cache witness:

```json
{
  "case": "stable-prefix-successor",
  "given": {
    "prefix_head_digest": "sha256:A",
    "selected_dependency_digest": "sha256:B",
    "request_affinity_digest": "sha256:C"
  },
  "expect": {
    "reconstructed_request_byte_equal": true,
    "projection_cache_reused": true,
    "provider_cache_claim": "observed_or_unknown",
    "authority_effect": "none"
  }
}
```

Negative affinity witness:

```json
{
  "case": "ordered-tool-schema-drift",
  "mutation": {"ordered_tool_schema_digest": "sha256:DIFFERENT"},
  "expect": {
    "same_affinity_epoch": false,
    "provider_cache_hit_inferred": false,
    "context_currentness_changed": false,
    "dispatch_blocked_if_identity_claimed_equal": true
  }
}
```

Positive branch/replay witness: recover only a verified, checkpoint-bound
completed frontier; reproduce the prior client-visible outcome byte-for-byte
with zero model, evaluator, continuation-provider, tool, effect, or successor
calls; bind new tools/permissions before any successor branch.

Negative branch witness: torn tail, wrong predecessor, mixed ledger, changed
completion bytes under the same identity, or inherited effect permission must
fail closed without rewriting the log.

Positive masking/compression witness: optional diagnostic excluded; exclusion
receipt names exact event IDs; content-addressed raw bytes remain retrievable;
mandatory selected meaning remains byte-identical.

Negative compression witness: a summary changes a mandatory claim, drops a
defeater, lacks a shadowed-range selector, or is treated as admitted
observation; outcome must be blocked/invalid, never silently accepted.

Positive evaluator witness: frozen inputs produce the same typed outcome and
receipt bytes on replay; `RecommendedUnderSnapshot` remains advisory until an
independently bound exact-effect gate passes.

Negative evaluator witness: stale authority snapshot, missing Context Item,
catalog substitution, unsupported domain, or defeated claim yields typed
non-positive outcome and zero effect calls.

Positive browser witness: exact artifact digest loads in pinned
browser/runtime; receipt separately records HTTP status, console errors,
network activity, DOM assertions, pixel/visual assertions, and scenario
identity.

Negative browser witness: 200 response with blank canvas or console exception
must fail browser/visual proof despite successful serving.

### Product-thesis implications

**Observed fact:** The present architecture already enforces the crucial
distinction: orchestration, semantic outcome, replay, validation, and effect
permission are non-substitutable.

**Inference:** The differentiated product is not “an app store of autonomous
agents.” It is an **owner-preserving capability fabric** where plug-ins can
contribute computation and evidence while CyberAlchemy keeps composition,
visibility, and explicit handoff boundaries legible.

**Proposal:** Lead with three product promises:

1. Install a bounded capability without surrendering source or decision
   ownership.
2. Reconstruct exactly what context, configuration, and evidence crossed each
   boundary.
3. Convert every plug-in result into an inspectable candidate or gate
   request—not silent action.

**Negative thesis:** Do not claim that CyberAlchemy “automatically improves
itself,” that cache affinity proves reasoning reuse, or that a harness PASS
promotes a capability. Self-harness evidence specifically supports a
proposer-blind held-out non-regression gate only as advisory evidence to an
existing owner.

### Unresolved

- No canonical CyberAlchemy definition yet establishes whether “plug-in” is a
  product term, packaging form, capability relation, or all three.
- Final Codex/provider request bytes and provider cache telemetry are not fully
  observable at the wrapper boundary.
- Correction/supersession, compaction, retrieval, context import,
  privacy/retention, encryption, and multi-writer locking remain open.
- Current-main has no complete DSH-derived durable context-event store or
  provider-cache witness.
- Branching is research/proposal territory; current reasoning-state support is
  completed-frontier/recovery oriented, not a generally admitted branching
  service.
- ACI ownership overlap remains material: integrated journal facts, acceptance
  identity, replay cursor, and effect intents cannot be reassigned to an ARE
  plug-in by similarity.
- Browser receipts demonstrate bounded scenarios only; no general reusable
  UX-quality capability is proven within the inspected ARE roots.
- The unjoined worktree’s substantial product, benchmark, ontology, and
  gateway bytes need a separate join/review decision before use.

No files were mutated, staged, cleaned, or validated.
