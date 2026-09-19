# Application output layout candidate

Product construction: implement the user-selected separation of app, domain,
runtime, modules, provenance, evidence and binaries. Runnable frontier: shared
layout contract -> compiler projection -> AlchLang integration -> executable tests
-> exact candidate review. No current causal construction blocker.

Operational support: user owns any later release decision (no construction stage).
Publication and release remain deferred. Existing frozen candidates remain intact.

Prototype definitions: app is generated composition and entry code; domain is
DomainSpec-generated implementation; runtime is reusable execution support;
provenance is input snapshots and composition metadata; evidence is certificates,
traces and build receipts; bin holds produced native executables. Modules contain
independent recursive bundles. These are navigation scaffolds, not admitted terms.

Product prototype: a relocated Node or Rust bundle remains executable, traceable
and digest-verifiable with no dependency on its build staging directory.
Business prototype: consumers can distinguish generated application code from
runtime and evidence without maintaining duplicate copies.
Ontology scaffold: application contains app/domain/runtime; derives from
provenance; has evidence; imports modules; produces bin. No authority effects.
DomainSpec prototype: opt-in domainspec.application-layout/v1 on build/verify,
recorded in the receipt; legacy direct build paths remain compatible.
Compiled-system prototype: one generated path per artifact with current hashes.
Implementation prototype: DomainSpec owns the shared layout and Rust projection;
AlchLang binds that contract and adds launchers, lowering evidence and JS output.

Scope: function-v1 and declarative-function-v1 application builders (Node/Rust),
DomainSpec application build option, trace/conformance consumers and tests.
Legacy host/event compiler profiles and accepted release bundles are excluded.

Open questions: product acceptance and any future default change for direct
DomainSpec builds are separate decisions after current tests.
