# R15 compatibility and migration qualification

Status: **pass**  
Date: 2026-09-15  
Authority effect: **none**

R15 qualifies the additive reconciled compiler without changing the existing
default. Omitted selection retains the legacy build and instantiation plans and
their v1 receipts. Explicit selection works for TypeScript, Python, and Rust
through build, verify, stronger verification, node/project instantiation, source
APIs, and checked-snapshot APIs.

Both reconciled output views are covered: the flat generated view and
`domainspec.application-layout/v1`. Invalid versions, profiles, languages,
layouts, incomplete bindings, links, stale source, stale artifacts, and existing
targets fail without falling back to legacy behavior or rewriting source/output.

## Public migrations

The stable package root now exposes the three already implemented explicit
migration helpers:

- `migrateTypedPolicyV1`
- `migrateLegacyStateMachine`
- `planWorkflowOccurrenceMigration`

They produce reviewable candidate data and require caller-supplied identities or
bindings where meaning cannot be inferred. They do not edit source, add graph
relationships, register a replacement graph, or publish artifacts.

## Verification

The selected 11-file campaign initially passed 65/66. Its only failure was a
stale test regex expecting TypeScript-specific wording after project selection
became language-generic. The CLI correctly rejected the invalid multi-language
selection before source access. The assertion was updated to the current
`single selected language` contract and the affected lane passed 9/9, yielding
a transparent composite 66/66 result.

Strict TypeScript compilation with the pinned compiler and the stable package-
export boundary both pass. The complete 15-case matrix is in
`R15-COMPATIBILITY-MATRIX.json`; machine-readable qualification is in
`R15-QUALIFICATION.json`.

This evidence performs no default cutover, admission, publication, or release.
R16 owns reproducible archive and clean-install qualification.
