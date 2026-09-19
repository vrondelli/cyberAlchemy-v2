# Application layout implementation review

Candidate: DSV2-APPLICATION-LAYOUT-001. Local product construction complete;
product acceptance pending. No publication, release or deployment performed.

The implemented layout separates generated composition code, domain code,
runtime support, input provenance, build evidence and native binaries. AlchLang
function builds bind DomainSpec's exported versioned contract. Existing direct
DomainSpec builds retain their layout; select the new one explicitly with
`--output-layout domainspec.application-layout/v1` on both build and verify.

```text
<application>/
├── app/function/             Node entry/launcher/behavior or Rust crate
├── domain/<language>/src/    Generated domain source (and Node API wrapper)
├── domain/typescript/lib/    Compiled Node domain implementation
├── runtime/                 Node boundary/tracing support or function/runtime.rs
├── modules/<alias>/          Independent imported bundles using this layout
├── provenance/function/     Full source and composition/ontology metadata
├── provenance/lowering/     Exact lowered compiler inputs
├── evidence/                Receipt, composition trace and lowering evidence
├── bin/alch-function         Native Rust executable
├── package.json              Node target only; npm start selects the launcher
├── deployment.json           Declared target entry and launcher
└── manifest.json             Final file inventory and digests
```

Runnable examples are retained in [module-conformance/node](module-conformance/node)
and [module-conformance/rust](module-conformance/rust). These include both Pricing
and Shipping modules. Build caches and temporary inputs are outside the bundles.
Rust support is a separate included source file, not an independently versioned
runtime crate. Lowered source snapshots remain as exact compiler inputs; duplicate
application composition files and duplicate generated Rust trees were removed.

## Validation

- Both compiler builds and AlchLang typecheck pass.
- 34 DomainSpec tests pass, covering CLI behavior, legacy layouts, receipt
  schemas, deterministic builds, moved applications and runtime/provenance drift.
- 36 Node-side tests pass, covering both function profiles, real HTTP launchers,
  tracing, guarded bindings, module input mappings and relocated imported bundles.
- Native Rust fixture, failure, tracing and HTTP-boundary regression passes after
  moving the complete generated bundle.
- Cross-language checkout conformance passes all 16 fixtures, including both
  imported modules, provider failures, exact arithmetic and request decisions.
- All six retained root/module bundle inventories and their generated artifact
  receipts match file sizes/hashes; all six receipt schemas validate.
- Scoped whitespace check passes. The previously released private archive retains
  SHA256 8ca3405e974a9b2ffac3b388bc542c1dc1dd6ef60962eacdd84b3427d2494f57.

Initial runs caught stale launcher-test paths and a generated-directory merge
issue; both were fixed. A validation build overlapping an earlier test run
correctly triggered compiler-input drift checks. Final runs use stable compiler
bytes. The first DomainSpec run also lacked Python referencing and exceeded a
cold Cargo compilation timeout; the final run uses the existing prepared Python
environment and warm Cargo cache. Initial logs are retained alongside final logs.

## Scope and remaining decisions

Product frontier: implemented and tested local candidate, ready for product
review. No remaining implementation blocker in the selected function-output scope.
Operational support: the user owns any later release/publication decision, with
no affected construction stage. That operational work remains deferred.

Existing bundles, frozen candidates and host/event compiler profiles are unchanged.
This is bounded layout validation, not a new full release qualification. Existing
consumers that directly import root-level function files must use deployment.json
or the new documented paths when rebuilding. Direct low-level DomainSpec clients
remain compatible unless they opt into the new layout.

Open questions: product acceptance for this exact candidate and any later release
or default-layout policy decision. Tests grant no such authority.
