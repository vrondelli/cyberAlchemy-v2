---
title: ARE Module Port Architecture
status: l8-signed-distribution-envelope-verified-local
updatedAt: 2026-09-08
owner: Agent Reasoning Engine runtime owner
authority_effect: none
---

# ARE Module Port Architecture

## Design Outcome

ARE should gain an injected, capability-addressed **Module Port**, not a general
plugin loader. The port lets ARE start with zero optional adapters, binds each
available capability to one exact adapter, validates typed inputs and outputs,
and returns a digest-bound receipt or an explicit unavailable/blocked result.

The port does not discover packages, import arbitrary paths, select routes,
invent fallbacks, admit modules, or grant authority.

## Implementation Status

L0 through L8 are implemented at their explicitly bounded candidate or selected
local states. L4 materializes governance evidence and ordered decisions; L5
adds the exact Rust binding; L6 realizes the local executable cutover; L7 runs
the exact packaged Linux x64 verifier without a runtime compiler; and L8 adds a
test-only signed distribution envelope with offline verification. L8 does not
alter startup composition, establish release trust, or authorize publication,
installation, deployment, or effects. `packages/module-port/` is integrated
with request-intent, the Router, Context Basis, the standalone ARE CLI, and the
Codex wrapper composition root. One wrapper instance injects the same immutable
module-set snapshot into request-intent and Router. The selected execution
profile is synchronous: a Promise-returning adapter blocks with
`module.invoke-must-be-synchronous`. Static startup composition now binds
reviewed adapter factories by exact module identity, version, and manifest
digest; validates a closed acyclic dependency graph; and gives semantic and
context consumers one immutable module-set snapshot.

The candidate language contract is
`language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/module-port.alch`.
Its compiled bundle derives ontology and finite validation evidence while
retaining `ontology_admitted: false`, `constitution_adopted: false`, and
`authority_effect: none`.

Those fields describe the unchanged compiled candidate projection. The exact
capability-local Constitution has since been adopted in its separate governance
decision record; adoption does not rewrite or self-promote the compiled bytes.

## Current Problem

The original static semantic imports in request-intent and Router are removed.
The wrapper no longer requires a definition catalog or ontology snapshot at
construction. Context Basis resolves explicit per-operation dependency slots
and localizes required-source failure at `context-dependencies` before request
selection, closure, or selector locking.

The exact tested product candidate is approved and its digest-bound,
capability-local Constitution is adopted. One exact production-style semantic
core configuration is compiled from `.alch`, with current conformance evidence
for its sole bound adapter and three explicit entry points. That exact
configuration and Rust binding are admitted through their separate decisions.
The exact subject is operationally authorized, activation is selected, and
local cutover is realized at the declared executable seams. Binding receipts
remain self-nonauthorizing and adapter effect authority remains none. The L8
envelope separately verifies distribution bytes with a public deterministic
test key; it does not establish a release identity. Discovery, hot reload,
external installation, publication, and deployment remain outside this
architecture.

Existing packages provide partial patterns:

- `semantic-input-runtime` verifies explicit profiles, exact provider paths and
  digests, rejects ambiguous bindings, and distinguishes not-applicable from
  blocked.
- the wrapper already accepts explicit provider functions at composition time;
- `intent-route-resolver/addon-manifest.json` demonstrates protocol metadata,
  but is packaging evidence rather than a loader or isolation boundary; and
- `conversation-runtime` returns explicit unavailable-handler diagnostics, but
  its callback map is not sufficient for digest-bound semantic capabilities.

## Optimization Decision

### Round 1: General module registry and loader

Rejected. It combines discovery, code loading, trust, version negotiation,
invocation, fallback, lifecycle, and policy in one service-locator abstraction.
It would also suggest that hashing an ESM entrypoint makes top-level or
transitive code safe, which is false.

### Round 2: Capability-addressed Module Port

Selected. Its closed responsibility is:

1. validate and freeze one process-local module-set snapshot;
2. resolve one capability ID to at most one injected adapter;
3. validate canonical invocation input;
4. invoke the typed adapter;
5. validate the capability-specific output protocol; and
6. return a receipt, unavailable result, or blocked result.

This is the smallest unit that allows zero modules without losing provenance or
collapsing unavailability into a semantic answer.

## Architecture

```text
Composition root
  ├── ARE core
  └── zero or more reviewed adapter factories
          ↓
     Module Port
       ├── immutable module-set snapshot + digest
       ├── exact capability index
       ├── input/output protocol validators
       └── invocation receipts
          ↓
  ┌───────────────┬─────────────────┬─────────────────┐
  │ Router        │ Request Intent  │ Context Basis   │
  │ typed port    │ typed port      │ typed port      │
  └───────────────┴─────────────────┴─────────────────┘
          ↓                 ↓                 ↓
  semantic text       objective/Define   definition and
  evidence            judgments          ontology inputs
```

The generic layer owns lifecycle and evidence only. Every capability keeps a
typed facade, such as `SemanticTextPort` or `DefinitionCatalogPort`, so consumer
code never depends on a universal `invoke(name, any)` API.

## Core Concepts

### Module Manifest

Describes executable compatibility, not authority:

```json
{
  "schema_version": "are.module-manifest/v1",
  "module_id": "alch-semantic-prelude",
  "version": "1-candidate",
  "adapter_protocol": "are.module-adapter/v1",
  "capabilities": [
    {
      "capability_id": "text.semantic-key/v1",
      "input_protocol": "are.text-input/v1",
      "output_protocol": "are.semantic-key-output/v1"
    },
    {
      "capability_id": "text.contains-phrase/v1",
      "input_protocol": "are.phrase-input/v1",
      "output_protocol": "are.phrase-match-output/v1"
    }
  ],
  "required_permissions": [],
  "side_effects": false,
  "authority_effect": "none",
  "manifest_digest": "<sha256>"
}
```

Version ranges are forbidden in v1. Module IDs, capability IDs, operation
protocols, and bytes are exact. Duplicate providers for a capability invalidate
the complete module-set snapshot; the port has no priority or fallback chain.

### Adapter

The composition root supplies a reviewed adapter factory. The Module Port does
not scan the filesystem or resolve package names.

```js
{
  manifest,
  invoke({
    invocation_id,
    consumer_id,
    capability_id,
    input,
    input_digest,
    module_set_digest
  }) { /* capability implementation */ }
}
```

For v1, only reviewed built-in factories are eligible. Dynamic ESM import is
not a sandbox: imported top-level and transitive code can execute. Supporting
untrusted modules requires a separate worker, service, or plugin-security
architecture.

### Module-Set Snapshot

```js
const port = createModulePort({
  adapters: [],
  output_validators: {
    "are.semantic-key-output/v1": validateSemanticKeyOutput
  }
});
```

An empty adapter set is valid. The result is immutable and carries one
`module_set_digest`. Adding, removing, or replacing an adapter creates a
successor snapshot; v1 requires process restart instead of hot reload.

### Dependency Posture

The consumer, not the port, declares why it needs a capability:

- `optional-enrichment`: omit enrichment and continue;
- `required-for-judgment`: withhold only the dependent judgment; or
- `required-for-operation`: block that operation, not the whole engine.

These postures cannot be inferred from whether a module happens to be
installed.

## Invocation Contract

```json
{
  "schema_version": "are.module-invocation/v1",
  "invocation_id": "invocation:request-123:semantic-key",
  "consumer_id": "request-intent-runtime",
  "capability_id": "text.semantic-key/v1",
  "input": {"text": "Build—a—new system"},
  "dependency_posture": "required-for-judgment",
  "authority_effect": "none"
}
```

Successful resolution:

```json
{
  "ok": true,
  "disposition": "available",
  "capability_id": "text.semantic-key/v1",
  "module_id": "alch-semantic-prelude",
  "module_version": "1-candidate",
  "value": {"key": "build a new system"},
  "reason_codes": [],
  "receipt": {
    "manifest_digest": "<sha256>",
    "module_set_digest": "<sha256>",
    "input_digest": "<sha256>",
    "output_digest": "<sha256>"
  },
  "authority_effect": "none"
}
```

Absent capability:

```json
{
  "ok": false,
  "disposition": "unavailable",
  "capability_id": "text.semantic-key/v1",
  "value": null,
  "reason_codes": ["module.capability-unavailable"],
  "receipt": {
    "module_set_digest": "<sha256>",
    "input_digest": "<sha256>"
  },
  "authority_effect": "none"
}
```

An adapter that is present but malformed, drifted, throwing, or returning an
invalid result is `blocked`, not unavailable. Initial reason codes are:

- `module.manifest-invalid`
- `module.manifest-drift`
- `module.capability-duplicate`
- `module.capability-unavailable`
- `module.input-invalid`
- `module.invoke-failed`
- `module.output-invalid`
- `module.authority-effect-forbidden`

Reason codes are stable, sorted, and public-safe. Stack traces and absolute
paths stay in local diagnostics and never enter the portable receipt.

## Typed Consumer Facades

Consumer code receives a typed facade over the generic port:

```js
const semantics = createSemanticTextFacade(modulePort, {consumer_id: "request-intent-runtime"});
const result = semantics.semanticKey(request, {invocation_id});
```

The facade fixes capability IDs and protocols. It does not contain backup
normalization logic.

Dependent judgments become tri-state:

```json
{
  "schema_version": "are.define-intake/v2",
  "disposition": "unavailable",
  "required": null,
  "reason_codes": ["module.capability-unavailable"],
  "dependency_receipt_digest": "<sha256>",
  "authority_effect": "none"
}
```

`unavailable` is not `false`. A missing classifier cannot mean that Define is
not required.

## ARE Behavior Without Semantic Or Definitions Modules

### Semantic module absent

- exact caller-supplied objective candidates and replay may still be processed
  when their path does not require semantic normalization;
- lexical objective inference and Define-intake classification are unavailable;
- lexical Router matching is unavailable;
- if structured objective evidence uniquely selects a route, the route registry
  still decides it; and
- if no route can be selected without lexical evidence, Router returns an
  explicit gate/block such as `route.semantic-capability-unavailable`.

No lowercase, substring, regular-expression, old-runtime, or model fallback is
allowed unless a future exact policy explicitly selects a different capability.

### Definitions module absent

ARE may start with an empty module set. It can expose health, inspection,
ledger, exact structured routing, and operations whose declared dependency
posture does not require Definitions.

Context Basis represents definition and ontology dependency slots as
`available`, `unavailable`, `blocked`, or `not-applicable`. It must not create a
fake empty definition catalog. A route whose context contract requires
definition closure blocks only at that context boundary with exact reasons.

The L2 and L3 implementations provide:

1. removing direct package imports through the Module Port; and
2. wrapper/context construction in which Definitions and ontology are explicit
   per-operation dependencies instead of global constructor inputs; and
3. exact static assembly of multiple reviewed capability families into the
   same Module Port without adding discovery or a plugin loader.

## Authority Boundary

The Module Port may transform input and report evidence. It cannot:

- define canonical vocabulary or ontology meaning;
- select a route, route priority, or exclusion;
- determine objective-transition or Define-intake policy;
- decide that a Definition Pack is ready;
- adopt a Constitution or admit a module;
- authorize an effect;
- install, update, or activate code; or
- write persistence, call models, tools, networks, or credentials.

Every manifest, result, and receipt carries `authority_effect: none`. Router,
request-intent, Context Basis, and semantic-input retain their existing owners.

## Loading And Security Boundary

The v1 trust boundary is intentionally narrow:

- no filesystem discovery or environment-selected package names;
- no semver ranges or automatic upgrades;
- no untrusted in-process code;
- no adapter effects or permissions;
- no symlink/path escape for any exact file-backed binding;
- no provider replacement during a module-set epoch;
- no hot reload; and
- no partially upgraded dependency set.

If later modules require effects, credentials, third-party code, independent
deployment, or remote protocols, this design expires. Use an isolated process
or service contract rather than widening the in-process Module Port.

## Required Validation Matrix

- empty adapter set is valid and deterministic;
- one valid synthetic capability returns a digest-bound receipt;
- absent capability returns unavailable, never false;
- duplicate module or capability IDs block snapshot construction;
- malformed manifest, unsupported exact version, and digest drift block;
- input and output protocol violations block;
- thrown or rejected invocation blocks without leaking stack paths;
- authority-bearing module result blocks;
- manifest permutation produces the same module-set digest;
- concurrent invocations cannot mutate port state;
- missing semantic module withholds lexical intent and routing judgments;
- caller-supplied non-semantic objective paths still work;
- missing Definitions never becomes an empty catalog;
- Unicode separator and substring non-collapse behavior remains unchanged when
  the semantic adapter is available; and
- module replacement requires a successor module-set snapshot.

Deferred hostile cases for a later isolation design include top-level effects,
tampered transitive imports, verify/load races, and stale ESM cache behavior.

## Optimizer Trace

- Mode: Standard, one proposal track, two recursive rounds.
- Proposer: proposed a general loader, then reduced it to a frozen
  capability-addressed port.
- Balancer objection categories: abstraction, authority, security,
  determinism, versioning, dependency semantics, degraded behavior, and tests.
- Reconciliation: accept generic lifecycle envelopes; require typed capability
  facades; reject discovery, universal invocation in consumers, and fallback.
- Abstraction guard: passed after removing loader and plugin responsibilities.
- Recomposition proof: the wrapper owns one port; consumers receive typed
  facades; module-specific policy remains with each consumer.
- Evolution profile: expected internal modules justify stable capability IDs
  and protocols, but not discovery or hot reload.
- Boundary-object check: manifest and receipt are shared between module owner,
  ARE, and consumer without becoming authority.
- Cognitive-load check: one lifecycle vocabulary replaces separate ad hoc
  missing-provider behaviors.
- Requisite-variety check: available, unavailable, blocked, and not-applicable
  cover current failure distinctions without a general plugin lifecycle.
- Premortem: failure is most likely if callbacks bypass receipts, empty catalogs
  conceal absence, boolean false conceals unavailability, or modules begin
  selecting routes. Closed schemas and consumer-owned policy guard these seams.

## Frame-Expiry Conditions

Reopen the architecture if any module requires untrusted code, process
isolation, runtime installation, hot reload, effects, credentials, remote
transport negotiation, or simultaneous incompatible major protocol versions.

## Navigation

Start implementation with [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md).
The first vertical is the Module Port plus the semantic-text adapter. L2 proves
Definitions-independent startup and localized Context Basis degradation. L3
adds exact static multi-module composition. L4 binds its candidate Constitution,
policies, ownership, evidence, and ordered decisions. L5 binds the exact admitted
subject into a Rust verifier. Product approval, Constitution adoption, and
runtime admission, exact Rust binding admission, and exact operational
authorization and activation selection are recorded. The compiled Alch cutover
contract and synchronous Rust-first startup guard now protect the decision CLI,
app server, and gateway executable seams. The guard invokes an exact packaged
Linux x64 artifact directly, without Cargo or compiler fallback. A separate
offline verifier now checks its test-only signed distribution envelope before
any hypothetical installation. External hook installation, real release
signing, publication, and deployment remain outside this boundary.

## Open Questions

- Which additional production operations should opt into
  `optional-enrichment` or `not-applicable` after owner review?
- Should a future Context Envelope revision promote module receipts from the
  composition dependency slots into its portable selected-dependency surface?
- Should the first exact adapter factory be owned by the ARE composition root
  or by the Alch semantic package with an ARE-owned wrapper?
- Which additional executable entry points should be admitted into a successor
  exact cutover subject?
- Which owner and protected custody system may establish a real release-signing
  identity?
- Which concrete operational requirement comes next: a Windows-native artifact
  or an external host integration?
