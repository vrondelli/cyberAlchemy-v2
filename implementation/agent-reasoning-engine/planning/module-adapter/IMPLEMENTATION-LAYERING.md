---
title: ARE Module Port Implementation Layering
status: l9-registered-route-availability-implemented-candidate
updatedAt: 2026-09-08
owner: Agent Reasoning Engine runtime owner
authority_effect: none
---

# ARE Module Port Implementation Layering

## Target

Introduce one bounded ARE integration seam for optional internal capabilities
while preserving exact provenance, localized degraded behavior, consumer-owned
policy, and route authority.

The contract shapes and responsibility boundaries are defined in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Layering Method

Each layer answers one decision question. Layer value is the decision unlocked,
operator-visible outcome, and risk reduced; layer cost is implementation time,
verification time, and coordination burden. A layer stops when its next concern
belongs to a different decision boundary.

Every layer preserves:

- zero authority effect;
- no silent or host-local semantic fallback;
- the route registry as sole route authority;
- exact module and protocol identity;
- unavailable distinct from false and not-applicable; and
- no module discovery, installation, hot reload, or untrusted execution.

## L0 — Module Port And First Semantic Vertical (implemented candidate)

Decision question: **After this layer, we know whether request-intent can use an
optional compiled semantic capability without statically importing it or making
ARE unloadable when it is absent.**

Minimum working unit:

- new `module-port` package with closed manifest, invocation, result, and receipt
  records;
- valid empty module-set construction;
- immutable, order-independent `module_set_digest`;
- one injected reviewed semantic-text adapter exposing
  `text.semantic-key/v1`;
- one typed `SemanticTextPort` facade;
- remove the static Alch import from request-intent objective resolution;
- represent semantic-dependent objective and Define-intake judgments as
  evaluated, unavailable, or blocked; and
- synthetic and real-adapter fixtures.

Included scope:

- exact single-provider capability resolution;
- canonical input/output validation;
- no-effect receipts;
- missing, duplicate, malformed, throwing, and invalid-output cases; and
- request-intent behavior with and without the module.

Explicitly deferred:

- Router migration;
- Definitions and ontology optionality;
- module dependencies;
- file-based configuration;
- isolation, hot reload, and governance admission.

Operator-visible outcome: ARE intent packages load with zero adapters. A
semantic-dependent judgment reports `module.capability-unavailable`; unrelated
validated objective-state and replay operations remain usable.

Risk reduced: hard package-load coupling, boolean absence collapse, callback
provenance gaps, and hidden fallback.

Main cost drivers: result-schema evolution, async boundary placement, canonical
receipt design, and preserving current objective fixtures.

Exit evidence:

- empty and single-adapter snapshots are deterministic;
- missing semantic adapter does not prevent package import;
- lexical inference and Define-intake are withheld rather than answered false;
- caller-supplied non-semantic paths retain current behavior;
- exact semantic adapter preserves Unicode separator behavior; and
- all pre-existing request-intent tests remain green or receive an explicit v2
  migration witness.

Promotion decision: continue only if the port remains policy-free and the
semantic facade contains no backup implementation.

## L1 — Router And Shared Semantic Consumers (implemented candidate)

Decision question: **After this layer, we know whether Router and request-intent
can share the same optional semantic adapter while retaining independent
decision authority and degraded behavior.**

Minimum working unit:

- add typed `containsPhrase` to `SemanticTextPort`;
- remove Router's static semantic-contract import;
- inject one module-set snapshot into Router and request-intent;
- declare each lexical judgment `required-for-judgment`;
- return an explicit route gate/block when structured evidence cannot select a
  route and semantic matching is unavailable; and
- retain current non-collapse and separator fixtures.

Included scope:

- exact shared adapter receipt across both consumers;
- no priority or fallback provider;
- route profile remains the selection authority; and
- current L2/L3 semantic governance checks remain usable.

Explicitly deferred:

- Define CLI migration if it remains outside the ARE composition root;
- definition catalogs and ontology snapshots;
- dependency DAGs and configuration discovery; and
- runtime admission.

Operator-visible outcome: structured route requests can still resolve without
semantic text; lexical route requests report why their evidence is unavailable.

Risk reduced: Router/intent drift, semantic fallback, and adapter-owned routing.

Main cost drivers: route-result schema compatibility, CLI receipts, and wrapper
composition changes.

Exit evidence:

- Router and intent share one `module_set_digest`;
- missing adapter never chooses a lexical fallback route;
- explicit objective-kind routing remains deterministic;
- `define` does not match `predefined` when available; and
- Unicode separator fixtures remain green.

Promotion decision: continue only if every route result can identify whether
semantic evidence was evaluated, unavailable, or blocked.

## L2 — Definitions-Free Context Operation (implemented candidate)

Decision question: **After this layer, we know whether ARE can start and perform
declared non-definition-dependent work without a Definitions package or ontology
snapshot.**

Minimum working unit:

- add typed `context.definition-catalog/v1` and
  `context.ontology-snapshot/v1` ports;
- evolve Context Basis to dependency slots with available, unavailable,
  blocked, and not-applicable states;
- remove global wrapper constructor requirements for definition catalog and
  ontology snapshot;
- declare route/operation dependency postures explicitly; and
- preserve missing Definitions as residue rather than fabricating an empty
  catalog.

Included scope:

- startup with zero optional modules;
- health, inspection, ledger, exact structured routing, and other declared
  non-dependent operations;
- localized context blocking for routes that require definition closure; and
- source digest and currentness receipts when inputs are available.

Explicitly deferred:

- broad module discovery;
- arbitrary third-party sources;
- remote providers;
- module dependency graphs; and
- admission or activation.

Operator-visible outcome: ARE reports which operations remain available and
which exact context judgment is withheld because Definitions are unavailable.

Risk reduced: global startup coupling, fake empty catalogs, and accidental use
of incomplete context as complete closure.

Main cost drivers: Context Envelope schema migration, per-route dependency
classification, wrapper compatibility, and current-source refresh behavior.

Exit evidence:

- wrapper starts with zero Definitions and ontology modules;
- required definition closure blocks only its owning operation;
- optional context enrichment can be absent without a false completeness claim;
- no empty catalog can satisfy a required dependency; and
- full configured operation remains byte- and behavior-compatible.

Promotion decision: this layer proves the user's Definitions-free objective.
Continue only if dependency posture is explicit for every exercised operation.

## L3 — Static Multi-Module Composition (implemented candidate)

Decision question: **After this layer, we know whether a second and third
internal capability can integrate without turning the Module Port into a plugin
framework.**

Minimum working unit:

- static startup configuration referencing reviewed adapter factories;
- exact module manifest and protocol conformance checks;
- explicit dependency IDs only when a real module dependency exists;
- cycle rejection and deterministic topological order; and
- successor module-set snapshot on any change.

Included scope:

- multiple independent capability families;
- exact versions and digests;
- closed dependency graph; and
- module-set observability.

Explicitly deferred:

- filesystem scanning;
- semver negotiation;
- installation and updates;
- hot reload;
- untrusted modules;
- cross-process transport; and
- effectful adapters.

Operator-visible outcome: operators can inspect the exact module set and
dependency state selected at startup.

Risk reduced: order-sensitive integration, partially upgraded graphs, and
implicit module replacement.

Main cost drivers: configuration validation, dependency fixtures, and migration
of one additional real capability.

Exit evidence:

- manifest permutation yields the same snapshot;
- dependency cycles and missing exact dependencies block;
- a partially upgraded set is unavailable rather than mixed; and
- concurrent calls cannot mutate the snapshot.

Promotion decision: stop here for in-process trusted modules. Any isolation or
deployment need begins a separate architecture.

## L4 — Governance Candidate And Admission Boundary (implemented candidate)

Decision question: **After this layer, an owner can decide whether the exact
Module Port, adapter set, and degraded behavior are suitable for separately
governed adoption and runtime admission.**

Minimum working unit:

- exact conformance evidence;
- compatibility and retirement policy;
- module owner and ARE owner boundaries;
- explicit adoption request; and
- separate runtime admission and activation decisions.

Included scope:

- candidate Constitution or applicable governance rules;
- evidence manifests and hostile cases;
- explicit claim ceiling; and
- adopt, defer, and reject options.

Explicitly deferred:

- automatic activation;
- enforcement by validation alone;
- publication, release, deployment, and external effects; and
- untrusted plugin execution.

Operator-visible outcome: owners review one exact candidate without confusing
passing tests with admission or activation.

Risk reduced: authority collapse and accidental enforcement.

Main cost drivers: cross-owner review, compatibility commitments, and exact
admission evidence.

Exit evidence: candidate passes; owner selection remains separate; admitted
runtime conformance stays not evaluable until its own decision chain completes.

Promotion decision: no implementation or governance artifact self-promotes.

Implementation result:

- one capability-local candidate Constitution with eight scoped rules;
- deterministic and hybrid validation modes mapped per rule;
- exact compatibility, retirement, degraded-mode, and owner-boundary records;
- digest-bound L3 source, compiled projection, implementation, and test evidence;
- one selected exact tested-product approval decision;
- one selected exact capability-local Constitution adoption decision; and
- separately prerequisite-blocked runtime admission and activation requests.

No conflict was found with the stable repository Constitution. Narrower Module
Port rules apply only to `profile:semantic-contract-v1/domain:are-module-port`;
the stable repository authority ceiling retains precedence outside that scope.

## L5 — Exact Rust Governance Binding (implemented candidate)

Decision question: **Can a native binding fail closed on any drift or
substitution across the exact Constitution, decisions, configuration, evidence,
and adapter without granting enforcement authority?**

Implementation result:

- a locked Rust crate with compiled exact identities and SHA-256 bindings;
- semantic checks for selection state, prerequisite closure, module identity,
  entry points, and every no-effect ceiling;
- deterministic no-effect receipts;
- hostile tests for drift, admission substitution, effect smuggling, symlink
  substitution, and nondeterminism; and
- an exact-source admission request that is eligible but unselected.

Promotion result: the exact binding source and locked dependencies are admitted
by explicit owner selection. A later exact owner decision separately grants
operational eligibility for an activation decision, but neither decision grants
enforcement or selects activation.

## L6 — Local Executable Cutover (implemented candidate)

Decision question: **Can the admitted Rust verifier guard every declared local
ARE executable startup seam before any Module Port is exposed?**

Implementation result:

- a canonical `.alch` cutover contract compiled through ontology, Craft,
  DomainSpec, runtime projection, and finite fixtures;
- one synchronous guard bound to the exact activation, authorization, binding,
  configuration, and compiled Alch bytes;
- Rust verification before static module composition;
- fail-closed wiring in the decision CLI, app server, and gateway executables;
- deterministic no-effect cutover receipts; and
- positive, drift, malformed-receipt, verifier-failure, effect-smuggling, and
  symlink-substitution witnesses.

Promotion result: the exact local executable cutover is realized and active.
This does not install external hooks, publish, release, deploy, or grant adapter
effect authority. Library consumers must still inject an already verified port.

## L7 — Packaged Rust Verifier (implemented candidate)

Decision question: **After this layer, we know whether local startup enforcement
can execute the exact admitted Rust verifier without invoking Cargo, a compiler,
or a package manager at runtime.**

Minimum working unit and implementation result:

- a canonical `.alch` artifact contract compiled through ontology, Craft,
  DomainSpec, runtime projection, and finite fixtures;
- one Linux x64 release binary and exact artifact manifest;
- a deterministic builder that rejects drift in the complete admitted Rust
  source set and repository toolchain pin;
- exact platform, target, binary-format, size, mode, and SHA-256 checks;
- direct binary invocation before Module Port composition, with no Cargo
  fallback;
- two-build reproducibility evidence; and
- hostile witnesses for byte drift, non-executable substitution, malformed
  receipts, effect smuggling, and symlinks.

Operator-visible outcome: the three L6 executable seams verify and invoke one
read-only packaged artifact. The development toolchain is needed only to build
a successor artifact, not to start ARE with the current one.

Risk reduced: runtime compiler dependency, opportunistic rebuilding, artifact
identity collapse, and hidden fallback.

Promotion result: the exact local Linux x64 packaged artifact is active under
the existing cutover. No other platform, external installation, signature,
publication, release, deployment, or effect authority is implied.

## L8 — Signed Distribution Envelope (implemented candidate)

Decision question: **Can a recipient verify the exact Linux x64 distribution
payload offline without confusing signature mechanics with release trust or
effect authority?**

Implementation result:

- a canonical `.alch` contract compiled through ontology, Craft, DomainSpec,
  runtime projection, and four finite semantic fixtures;
- an exact envelope manifest binding the artifact manifest and verifier binary
  by path, digest, size, platform, architecture, target, and executable mode;
- deterministic Ed25519 signing with a deliberately public test-only key;
- an offline verifier pinned to the public key and closed policy shape;
- fail-closed checks for drift, malformed JSON, missing files, symlinks,
  signature substitution, and release-claim smuggling; and
- a digest-bound decision record for the user's explicit option `1` selection.

Operator-visible outcome: the current Linux x64 artifact has a locally verified
distribution envelope. The signature establishes deterministic mechanics only.
It is not release-eligible and has not been published, installed, or deployed.

Risk reduced: detached-signature ambiguity, payload substitution, signature
validity collapsing into release trust, and implicit authority escalation.

Promotion result: L8 is a finite local candidate. A real release requires a
separate owner decision, protected key custody, and a newly bound envelope.

## L9 — Registered Route Availability Adapter (implemented candidate)

Decision question: **Can an optional ARE module make one registry-owned route
available or unavailable without ARE owning the module workflow or imposing a
global Define, ontology, or Alch prerequisite?**

Minimum working unit and implementation result:

- one optional `availability_capability_id` on a verified route policy;
- one exact route-to-capability adapter contract and digest-bound receipt;
- a canonical `.alch` availability function compiled through derived ontology,
  Craft/DomainSpec project evidence, and executable behavior;
- availability evaluation before route eligibility;
- an explicit-objective gate that prevents lexical fallthrough when the bound
  route is unavailable; and
- positive, missing, negative, duplicate-provider, identity, lifecycle,
  non-collapse, semantic, and unrelated-route orthogonality fixtures.

Included scope: static configured adapters and routes already present in the
verified registry/profile. Existing policies without a binding retain their
registry lifecycle behavior.

Explicitly deferred: route discovery, module installation, workflow execution,
activation, release, external effects, and treating Define or ontology
compilation as a prerequisite for unrelated ARE routes.

Operator-visible outcome: the route trace says whether availability came from
the registry or an exact module capability and carries its receipt or repair
focus. ARE only routes when the selected route is available.

Risk reduced: ARE-owned module policy, modules inventing routes, silent route
fallback, and global coupling to an optional package.

Promotion result: L9 is a local implementation candidate with authority effect
none. It does not activate a module or admit its workflow.

## Recommended Next Boundary

L9 satisfies the route-availability seam. The next bounded product proof is to
register one genuinely new route and its owning module in a fixture or explicit
owner-selected candidate, then demonstrate end-to-end available/unavailable
routing. Release signing, custody, Windows packaging, and external hosting are
separate choices and are not prerequisites for this product path.

## Product And Operational Lanes

Current product frontier: exact Linux x64 packaged verifier active at all three
declared local executable seams, an offline-verified test-only distribution
envelope, and a registry-owned optional route-availability seam. There is no
runtime Cargo dependency, release claim, module activation, or workflow transfer
to ARE.

Runnable product work after a separately authorized implementation request:

- closed contracts and canonical digest utilities;
- empty/single adapter snapshot;
- typed semantic facade;
- request-intent and Router migration;
- typed definition-catalog and ontology-snapshot ports;
- explicit context dependency slots and localized required-source blocks;
- wrapper startup without global definition or ontology constructor inputs;
- positive and hostile fixtures;
- exact static factory configuration and dependency-DAG rejection;
- one unified semantic and context Module Port at the wrapper composition root;
- compiled Alch semantic-contract and derived ontology evidence.
- optional exact route-availability binding and compiled Alch decision evidence.

Operational work: none is required through L3. Process isolation, installation,
service transport, and deployment remain deferred operational residue and do
not block the in-process proof.

## Open Questions

- Which additional production operations should be declared
  `optional-enrichment` or `not-applicable` by their owners?
- Does Context Envelope v2 carry module receipts directly or reference a
  module-dependency snapshot by digest?
- What exact owner approves the first reviewed adapter factory at the ARE
  composition root?
- Which additional executable entry points, if any, should enter a successor
  exact cutover subject?
- Which owner and protected custody system may establish a real release-signing
  identity?
- Which concrete operational requirement comes next: a Windows-native artifact
  or an external host integration?
- Which first new registry route and owning module should exercise L9 outside a
  synthetic fixture?
