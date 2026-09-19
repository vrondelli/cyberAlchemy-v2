# Auth Foundation

Status: **proof-and-evidence candidate with a local D65 Rust vertical, concrete trusted-input registries, and an in-process authorization service**

This project starts a new authorization foundation without changing
`projects/auth-user-management/`.

The formalization package, business ontology, owner-accepted business meaning,
and one Auth-owned L0 FormalClaim candidate now exist. A pure, local
authorization decision kernel is generated from the bounded DomainSpec
meta-type CLI profile and has local static conformance evidence. A pure Rust
adapter now constructs the generated evaluation context through five trusted
ports and exposes only `Allow` or `Deny`. A successor Rust provider now resolves
the four durable ports from one SQLite transaction while keeping the decision
clock injected. There is no authentication or token service, administrative
write API, transport, deployment, multi-node, or production-security claim yet.
An L6 candidate derives the internal authorization command from trusted
authentication-evidence and server-owned route-binding ports. Its DomainSpec
Rules and Rust boundary pass local technical gates, but the new definitions are
not owner-admitted, so semantic conformance remains `not_evaluable`.
The L11/L12 successor now defines those inputs storage-neutrally, generates a
typed Rust Query that constructs `Resolved(TrustedInputSnapshot)`, binds its
repository concerns through the provider-neutral system-integration profile,
and realizes that binding with versioned local SQLite infrastructure. It
composes the result with the existing trusted boundary and authorization
provider; provider and end-to-end fail-closed tests pass.
Credential verification, token handling, administrative writes, HTTP,
deployment, and production-security claims remain excluded.

Canonical artifacts are JSON and JSON Schema under [`formalization/`](formalization/).
Markdown files are human navigation only.

The first implementation-bearing slice lives under
[`implementation/`](implementation/). It carries the accepted Auth definitions
through a Product Capability, a proposed capability-local business ontology,
DomainSpec v2 authored source, deterministic generated graph and system
ontology, an exact Rust implementation binding, and local conformance evidence.
The Rust candidate is deterministically instantiated by the standard
DomainSpec CLI from a property-closed Operation. The specialized Auth generator
has been retired. A frozen copy of its evaluator remains only as an independent
behavioral oracle; it has no generation or implementation authority.
The successor runtime construction keeps those L3 bytes immutable while binding
the binary runtime contract, runtime system ontology, adapter implementation,
and deterministic in-memory adapter evidence. A second successor binds the
SQLite provider contract, schema migration, provider system ontology, exact
implementation bytes, and in-memory plus file-backed evidence without changing
the L3 or L4 receipts.
The L6 successor likewise leaves the L3–L5 artifacts unchanged while adding a
separate definition pack, Product Capability, business ontology, DomainSpec
Operation, generated Rust kernel, trusted-boundary adapter, and bounded
evidence receipt.
The L11/L12 successor adds a separate candidate definition/capability/ontology
chain, linted storage-neutral DomainSpec source, deterministic typed graph,
generated Rust Query and provider-neutral integration contract, concrete
SQLite infrastructure adapter, in-process service, exact implementation
bindings, and technical evidence. Generated Rust passes; semantic conformance
remains explicitly `not_evaluable` because the product meaning is candidate-only.
It is a merge candidate, not a deployment or production-security claim.

## Starting question

Can a small session-based RBAC model preserve a clear business meaning while
remaining extensible enough to support secure session currentness, trusted
scope construction, stronger policy profiles, formal proof, and runtime
evidence later?

## Current boundary

The first model says:

- authentication establishes an active session for a user;
- a session activates roles;
- a role grants permissions;
- a permission names a resource, action, and scope;
- trusted application code constructs an authorization request;
- authorization allows exactly when the session is current and an active role
  grants the exact required permission;
- every other result is deny.

The exact business meaning and interpretation are accepted by the Auth
Foundation owner. The FormalClaim that binds them is still a candidate and
requires its own admission decision. The first case is under
[`formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/`](formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/).
