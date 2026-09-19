# Evidence Contracts

## Kernel

Every record carries `contract_id`, `contract_version`, `record_id`,
`content_digest`, `digest_algorithm`, `generation_id`, optional
`predecessor_generation_id`, input handles, and status. DEC-UIR-001 fixes
`canonical-json-v1` and `sha256-v1` as the v1 contract.

`canonical-json-v1` projects only schema-declared semantic fields, recursively
sorts object keys, preserves array order, preserves string content, serializes
as UTF-8 JSON, distinguishes missing from `null`, and permits only JSON safe
integers for numeric semantic fields. Unsupported numbers fail validation.

`content_digest` excludes timestamps, storage paths, predecessor links, and
invalidation reasons. Same content plus the same predecessor produces the same
successor identity or a no-op. Human decisions are inputs, never replayed
inferences.

## S1 Rule Adapter

`attribute-nonempty/v1` accepts a present value with at least one
non-whitespace character. It must be registered by generation, Markdown
validation, generated-instance validation, and the total rule classifier
before any candidate selects it. Existing `attribute-present` is unchanged.

Both validation paths fail closed on unknown rule identifiers. Normative
violations use registry `ui-repair-violations/v1`: `ATTRIBUTE-MISSING`,
`ATTRIBUTE-EMPTY`, `ATTRIBUTE-WHITESPACE`, `DUPLICATE-KEY`,
`CRITERIA-CONFLICT`, `FIXED-VALUE-MISMATCH`, `NONSTRING-VALUE`, and
`UNKNOWN-RULE`. Messages are non-normative.

## S2 Mutation Ledger

Each case records mutation kind, criterion selector, semantic input digest,
fixture digest, expected and observed outcome/code, validator contract version,
and receipt handles. The mandatory base is 52 deletion + 52 empty + 52
whitespace + 9 wrong-fixed. Duplicate keys are detected from raw input and fail
before structured parsing; contradictory criteria fail schema preflight. No
precedence exists. Duplicate and conflict extensions remain separate from the
165-case base and wait for SWU-UIR-003 implementation evidence.

## S3 Reroute Receipt

Source outcome: `rejected | accepted | invalid`.
Destination outcome: `shape-accepted | rejected | pending-owner | not-testable`.
The two evaluations must be independent. `pending-owner` closes only the
handoff record and cannot establish destination identity.

## S4 Formation Dossier

Hard conjuncts: independent positive, stable contrast, label erasure,
criterion erasure, changed consequence, typed negatives, corpus-bound
portability, and owner firewall. Missing or disputed conjuncts yield `DEFER`.
Finite zeroing yields `DOSSIER-ZEROED`, leaving DS-D1 adjudication external.

## S5 Corpus Receipt

Pin revision, repository-relative path, file digest, selector, excerpt digest,
extractor/version, corpus/style, literal observations, omissions, and prohibited
inferences. Reviewer projections are separate records. Use `not-observed` until
a bounded absence contract is approved.

## S6 Relationship-Owner Packet

Name authority state, exact question, affected signatures, finite options,
positive/negative examples, changed consequence, owner, closure evidence, and
prohibited inference. A packet is transport, not adjudication.

## S7 Orchestration Index

Append generation entries and handles to separately owned receipts. Replay
compares semantic fields and frozen input digests; it excludes timestamps.
Invalidation appends a successor record and reason. No prior record is edited.
