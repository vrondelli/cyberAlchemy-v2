# KEP relocation into CyberAlchemy Exchange

Status: completed physical relocation under explicit user instruction.
Owner: Exchange product owner. Authority effect: none.
Evidence: [RELOCATION.json](RELOCATION.json).

## Layout

KEP moved from `product/knowledge-exchange-protocol/` to
`cyberalchemy-exchange/knowledge-exchange-protocol/`. Exchange is the product;
KEP is its internal protocol. The new parent README links the current product
intake and purchase design, which remain in the Define review package.

The old path is a relative compatibility symlink to the new physical location.
There is one KEP tree. Keeping its nesting depth preserves existing root discovery.
Recorded identities, source paths, digests, decisions, build scripts, generated
files and historical evidence remain unchanged and resolve through the alias.
Current project-index paths, Source Map navigation and Exchange intake/design
links use the new location. Index source digests did not need refreshing because
the moved source bytes did not change.

## Scope and verification

- All 2,120 files, directory/file modes and contents matched the pre-move snapshot.
- Every legacy file path resolves to the moved bytes.
- Cargo offline metadata resolves all four workspace packages and is equivalent
  before/after after accounting for the directory path change.
- The existing project-lookup suite passed all 13 tests.
- Model validation reports the same two pre-existing parent-source digest errors.
- White-paper validation reports the same eight pre-existing source-drift errors.
  Full before/after validator results were identical; no new errors were introduced.

No cryptography, KEP semantics, runtime behavior, compiler bindings or historical
approvals were rewritten. No Rust compilation, deployment, real purchase, commit,
push or submodule-pointer change was performed. Runtime correctness is outside
this relocation check.

## Construction boundary

This is the user's bounded repository-layout request, not a successor product
capability or authority promotion. Existing KEP definition/capability/ontology
and implementation evidence retains its existing D65 status. The new directory
and passing relocation checks grant no new admission. Product construction
continues with the separately scoped purchase binding described in the
[design](../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md).
Operational deployment and source-authority refresh are separate work owned by
Exchange operators and the relevant source owners; neither blocks this relocation.

## Open Questions

- Source owners: resolve the existing model and white-paper drift through their
  normal evidence-review process; the move does not refresh their approvals.
- Repository owner: retire the legacy symlink only with an explicit migration of
  all pinned paths and their consumers. Historical records must not be silently
  rewritten to make a new location appear to have been previously approved.
- Product scope and purchase questions remain owned by the
  [Exchange intake](../define/reviews/cyberalchemy-exchange/INTAKE.md#open-questions).
