# Durable Knowledge Storage Capability Start

Status: candidate definitions only
Authority effect: none

This package begins the D65 construction path for provider-neutral durable
knowledge storage. Responsibility is separated as follows:

```text
Durable Storage
  -> owns generic definitions and required semantic slots
  -> later owns the reusable Product Capability

Solana Co-Ownership
  -> later instantiates the adopted Durable Storage capability
  -> reuses or specializes definitions in a successor Solana set
  -> fills commitment, readiness, failure, policy, and cost values

Storage implementation binding
  -> later selects provider, adapter, environment, and credential references
```

The generic storage flow is:

```text
encrypted artifact or recipient-envelope bytes
  -> immutable durable object
  -> content-addressed identity
  -> write receipt
  -> verified retrieval
  -> later protocol commitment
```

It also fixes the failure boundary:

```text
missing bytes | mismatched bytes | stale binding | unauthorized retrieval
  -> typed storage failure
  -> no dependent consumer effect
```

The definitions deliberately do not choose IPFS, Arweave, S3-compatible object
storage, a database, a local filesystem, replication counts, retention periods,
availability targets, credentials, or production deployment.

The currently accepted Solana definition set predates this contract and remains
unchanged. It does not yet instantiate durable storage. After this generic
definition set and its Product Capability are accepted, Solana requires a
separately reviewed successor candidate; the existing DomainSpec system-
ontology candidate must remain unadmitted until that successor is authored.

Current D65 state:

```text
durable-storage definitions: authored candidate
Product Capability: not_evaluable until definition acceptance
business ontology: not_evaluable
DomainSpec v2 source: not_evaluable
compiled system ontology: not_evaluable
implementation binding: not_evaluable
runtime evidence: not_evaluable
```
