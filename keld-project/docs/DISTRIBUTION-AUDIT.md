# ARE customer distribution audit

Date: 2026-09-17. Candidate evidence for the private engine's sale preparation.

## Original relocation result

The complete declared product closure was copied outside the checkout, preserving
file bytes, modes and symlinks. Its doctor and full product suite passed:

- Version: `0.10.0-signed-envelope-candidate.2`.
- 3,414 files, 53,877,844 bytes; no components removed to obtain a pass.
- 156 test files, 1,244 test cases, 26 passing component/integration/product targets.
- Source closure digest: `b2587ae5c7f8e88a78b1c1b4545551d3a92e2018b1949edd968a3f9117b5a03d`.
- No external symlinks or flagged sensitive filenames in the enumerated closure.
- Temporary copy removed after verification, including on failure.

This proves relocation of the declared closure using the existing workstation
toolchain. It does not prove installation on a clean customer machine, live host
compatibility, licensing completeness, or that every included file is distributable.
The filename check is not a comprehensive secret scan.

## Reproduce and inspect

From the repository root:

```sh
tools/toolchain/run node keld-project/scripts/audit-distribution.mjs --full-tests
```

Omitting `--full-tests` runs relocation and doctor only. The report records whether
the full tests ran. Current machine-readable results and exact inventory are under
ignored `keld-project/evidence/distribution-audit.json` and
`keld-project/evidence/distribution-source-closure.json`; reruns replace them.
The durable figures above identify this run, not future working-tree revisions.

The auditor reuses the engine's [closure implementation](../../implementation/agent-reasoning-engine/src/product.mjs)
and [copy verifier](../../implementation/agent-reasoning-engine/src/product-isolation.mjs).

## Gaps before customer packaging

1. **License materials.** The closure contains one detected license file, under
   the bundled TypeScript dependency. This does not establish an ARE license or
   a complete third-party notice inventory. The starter's intended Apache-2.0
   terms need to be reconciled with ownership and actual distribution materials.
2. **Distribution boundary.** Dependencies include compiler and Define sources
   from both `cyberAlchemy-v2` and `domainspec-core`. Selling ARE does not imply
   distributing the whole umbrella repository. Classify every required file and
   retain full functionality while establishing the distributable boundary.
3. **Local references.** 68 files contain workstation-style absolute references.
   Examples include development scripts, documentation and generated receipts.
   These did not prevent this relocated suite passing. Review executable paths
   separately from historical evidence and remove private workstation details
   from customer-facing materials where appropriate.
4. **Fresh installation.** Node is pinned to 26.8.1 in the current product. Test
   documented runtime/native prerequisites in an unrelated clean environment;
   do not assume a customer has this workstation's tools or caches.
5. **Real integration.** Follow the package tests with one documented supported
   host connection and a failure/recovery exercise. Generic adapter contracts
   alone do not prove compatibility with every agent.

## Proposed first artifact contract

### Repeatable file and package review

Run `node keld-project/scripts/distribution-inventory.mjs --archive` to regenerate
`evidence/distribution-inventory.json`. It binds every file to its hash, heuristic
content category and nearest included JavaScript package manifest. Each file
starts as `unreviewed`; neither a package license string nor a successful test
grants distribution approval. Adjacent notice files are enumerated without
assuming they cover nested packages or unrelated files.

For the exact closure above, there are 76 `package.json` manifests. 75 have no
declared license and no adjacent notice file included in the closure. The single
exception is bundled TypeScript 6.0.3, declaring Apache-2.0. The corrected notice
matcher finds both `LICENSE.txt` and `ThirdPartyNoticeText.txt` in that package;
the earlier one-file count missed the latter, which was already packaged. Many manifests are
internal or generated; these counts are not counts of third-party dependencies,
nor proof that each needs a separate license document. A governing distribution
license and ownership mapping still need to be established.

The report includes declared dependencies, optional dependencies, peer dependencies
and engine constraints to support review. It is not a complete cross-language
SBOM: Cargo dependencies, undeclared imports and rights outside package metadata
remain review work. The file categories do not remove anything from the closure.

Verification: `node --test keld-project/scripts/distribution-inventory.test.mjs`
passes ownership-boundary, notice-association and classification checks, including
nested packages and similarly named sibling directories.

### Archive and handoff

Keep the full current product as the candidate scope until the owner selects an
explicitly different release. Preserve necessary relative directory layout in a
local, unpublished archive. Include an install entry point, prerequisite check,
quickstart, versioned capability limits, license and notices, and file inventory.
Reject path traversal and symlinks escaping the extraction root.

The release manifest should bind engine/product IDs, exact version, source-closure
digest, archive SHA-256 and byte size, supported runtimes/platforms, documentation
version and validation evidence. KELD receives public offer metadata and a private
artifact locator separately. Publication and sale approval remain explicit fields;
a passing test must not automatically set either field.

Validate the extracted archive, not only its source staging directory. Compare its
inventory, run doctor and product tests, then exercise the supported integration.
Retain bounded reports and the selected artifact; delete disposable build trees.

## Original exact-archive content review

`python3 keld-project/scripts/review-archive-content.py` scanned the packaged engine
`b95a07e0ab880465aa1d2b4a3e8e243f983b0af4b38683ad9c732a0e63cb3962`.
It verifies the archive hash and each member's size/hash against the source closure
before producing location-only findings in `evidence/archive-content-review.json`.
No file contents or matched credential values are copied into the report.

All 3,414 entries were accounted for: 3,412 UTF-8 files, one non-UTF-8 file, and one
symlink. The latter two are explicitly not text-scanned. Tested private-key/token
patterns yielded no hits; this narrow pattern set is not a complete secret scan.

The extended Windows/Linux workstation-path search found 69 files, compared with
68 under the old narrower source scan:

| Review group | Files | Next disposition |
| --- | ---: | --- |
| Generated provenance/receipts | 55 | Fix path emission at its generator and regenerate bound evidence; do not edit signed/hash-bound receipts in the archive |
| Documentation | 6 | Replace workstation instructions with portable customer instructions while preserving historical evidence separately |
| Code/configuration | 7 | Resolve executable defaults and distinguish references from runtime dependencies |
| Bundled TypeScript declarations | 1 | Upstream documentation examples; retain upstream notice/ownership context |

Direct review of the seven code/configuration files found:

- Five development integration scripts use workstation defaults for Node or Codex.
  These are packaged development entry points, separate from the customer launcher
  that already requires an explicit supported Codex binary.
- One AlchLang definition pack contains a local reference that needs source-owner
  review before regenerating dependent evidence.
- `domainspec-core/projects/secret-management/secret_management/store.py` declares
  workstation defaults for SOPS/age tools and a key-file location. This is a path
  disclosure/runtime-portability finding, not evidence of packaged secret keys.

No files were removed from the product and no dependency scope was silently reduced.
The current source closure now differs from the archived closure. `--archive` reads
package metadata from the hash-verified archive; the default inventory command
continues to describe current source. Do not mix those identities in release claims.

Validation: three notice/inventory tests and two content-scanner tests pass. Tests
cover notice naming, package boundaries, Windows/Linux paths, location-only output,
and explicit non-UTF-8 handling. Rights clearance, broad credential detection, and
runtime reachability analysis remain separate review work.

## Portable integration defaults repair

Five source scripts identified above now avoid workstation-specific executable
paths. Both JavaScript validators use `process.execPath`; the Python validator
resolves `NODE_BINARY` when supplied, otherwise `node` from PATH, and refuses a
missing executable. The interactive client requires `--upstream` or `CODEX_BINARY`;
the live canary requires `CODEX_BINARY`. Existing protocol validation still applies.
This does not select a compatible agent by guessing from PATH.

Nine tests pass across the existing interactive-session suite and
`keld-project/scripts/portable-integration.test.mjs`. The latter verifies missing
Codex configuration, malformed upstream arguments, and unavailable explicit Node
configuration fail before session/validation work. Historical governance receipts
have not been rewritten to conceal source changes. Their exact-byte bindings may
require a separately evaluated regeneration; portable defaults alone do not make
those governance validators admitted or their historical evidence current.

Generated provenance, the AlchLang source reference, and the sibling secret-store
defaults remain separate work. No sibling files were changed by this repair.

## Refreshed candidate after portability repair

The rebuilt complete archive is `ad4da3c4ad072753e32b367430e0ed060c0b1b03d2a5e9a0532577455b855ea2` (10,455,861 bytes),
closure `36d33f5b04a35120a0b29d22722f25024d7ccd3ba1d9943c0f0096d1459b63e5`. All 3,414 files remain included. Its extracted
suite passed 1,244 cases across 156 files. The customer bundle passed isolated
installation/context projection, and a real customer task plus completed-state
replay passed against this engine identity.

The repeat scan finds workstation references in 64 files, down from 69: the five
repaired executable defaults are gone. Generated receipts, documentation, one
AlchLang reference, the sibling secret-store defaults, and upstream declarations
still require their respective handling. The archive inventory still finds both
TypeScript license/notice files. Historical counts above retain their original
artifact identity; current ignored reports bind the refreshed archive.

## Provenance generator correction

The remaining generated paths originate in AlchLang's
`implementation/src/derived-ontology.ts` and `implementation/src/service-builder.ts`
under `language/capabilities/alchlang/plans/general-compiler-v1/`. Function ontology,
service ontology, and service assembly traces previously serialized resolved host
paths. The compiler now emits source filenames together with the existing SHA-256
and line references, following the existing semantic-contract compiler convention.
A filename alone is not a globally unique source identity: consumers must retain
its digest and owning artifact context. Internal file access, source-drift checks,
and import containment continue using resolved paths.

The compiler was rebuilt. Ten targeted ontology/service tests pass, including CLI
versus source parity, source-content binding, declaration meanings/identities,
executable fixtures, and service route behavior. Relocation tests compare provenance
for identical sources under different input roots. The service determinism test
also builds from relocated inputs and compares every emitted file byte-for-byte.

This is a generator change, not a claim that existing bundles have been regenerated.
The current customer archive above remains unchanged and still has 64 path-finding
files. Next regenerate affected ARE/Define artifacts from their authored sources,
verify their manifests and behavioral consumers, then rebuild and rescan the customer
archive. Historical receipts must not be patched to hide source or artifact drift.

## Regenerated runtime bundles

Seven ARE/Define bundles have now been regenerated from authored sources using
`node keld-project/scripts/regenerate-portable-bundles.mjs`. The process staged all
outputs before writing, rejected concurrent target drift, preserved complete file
inventories, and verified unchanged authored source copies and all 23 compiled
decision files. It updated 204 generated files, including manifests and provenance
hash bindings. Historical approval/conformance receipts were not rewritten.

Define's recompilation verifier also exposed an older semantic-prelude compiler
binding. A temporary rebuild proved only compiler-entry/package hashes differed;
that binding and its manifest were regenerated with all source/runtime bytes
unchanged. Define's verifiers and 69 consumer tests now pass.

Current engine archive: `bc5cc9357dec36c1ac3b683685eb218014dd6ecc140a27d68f92f173155721ad`; closure
`75eb99e6edbead54cc2e0ad16d1ed2b2570416c46fd29df52b316c264b90570f`; 3,422 files, 11,075,518 compressed
bytes. The compiler rebuild brought the current declared closure to this count;
no functionality was removed. All 1,244 extracted-engine tests passed, followed by
isolated customer-bundle installation, a real task and completed-state replay.

The exact-archive scan now reports **12** workstation-reference files (previously
64): three historical receipts/assessments, six documentation files, one definition
pack, one upstream TypeScript declaration file, and the sibling secret-store
implementation. No tested credential pattern matched; this remains a limited scan.
Ignored reports bind the current archive, while earlier sections preserve prior
artifact identities. The next distribution work concerns these remaining sources
and ownership/license review, not further edits to regenerated function provenance.

## Portable documentation update

The six README files identified in the latest scan have been edited in source.
Node examples use `node` on PATH with the supported version stated explicitly;
benchmark commands name their starting directory relative to `cyberAlchemy-v2`.
GLM integration-test examples require an explicit installed secret-management
package path and use the caller's Python. Credential-reference examples use the
customer's home directory without embedding a developer username.

Historical GLM setup notes are labeled as historical validation environment, with
home-relative locations; they do not assert a customer has a vault or configured
credentials. Historical scores and receipts remain unchanged. Unquoted placeholder
arguments that Bash treated as redirection were corrected. All 53 shell blocks in
these six files pass `bash -n`; no live benchmark or credential commands were run.
This verifies shell syntax, not successful execution on arbitrary customer hosts.

These README changes are staged in source and are not yet in the current archive.
The current archived scan remains 12 findings; a future rebuild must measure the
new count rather than inheriting the source-only result. The remaining source work
is the sibling secret-store defaults, the definition-pack reference, and an explicit
distribution treatment for historical receipts and upstream examples.

## Secret-store default portability

The exact shipped sibling dependency
`../domainspec-core/projects/secret-management/secret_management/store.py` now
resolves default tool, key and vault paths under `Path.home()` rather than a named
developer account. Existing explicit constructor/CLI overrides and executable
SHA-256 pins are unchanged. For the original account this preserves the same paths;
no live vault or key was opened, moved, or initialized by this change.

An isolated-process test substitutes two hypothetical home directories (including
one containing a space), verifies all defaults and explicit overrides, and proves
that constructing the store creates no filesystem state. The full sibling test
suite initially exposed a separate hard-coded Python 3.12 path in its CLI harness;
that harness now uses its running Python interpreter and current-user tool paths.
After that correction, all 31 sibling tests pass, including the temporary-vault
CLI and SOPS/age integration cases.

The definition-pack finding is an explicit evidence reference into another private
project, not an executable default. It remains intact pending distribution-scope
review; removing it to lower a path count would remove semantic evidence. Historical
receipts and upstream TypeScript examples likewise retain their evidence identities.
The published-readiness decision must review those inclusions rather than treat
zero scanner findings as the objective.

This source change and the six portable README updates await the next artifact
rebuild; the current archive's recorded scan remains unchanged until then.

## Current portable distribution refresh

The portable secret-store defaults and six README changes are now packaged.
Current engine: `a81380ca8e14f948dd7c87575b4ed9bd5e38892fab4f25c723a55120c57469d6`; closure
`24688ae36896adf30f83ecc80650368cb34e186b3e9cd5d8a12ca953317a4464`; 3,426 files; 11,079,667 compressed
bytes. The extracted full suite passed all 1,244 tests. Independent Linux startup
and the customer-bundle installation/context checks passed. The current bundle is
`2c5c6f313844b904940c8eafb7380b08741639f5fa3a50a86cd2a756e9dd8c3a` (11,255,905 bytes).

The scan now finds **five** workstation-reference files: three historical
receipts/assessments, one private definition-pack evidence reference, and upstream
TypeScript declaration examples. No active executable default or customer README
remains in this pattern's findings. These five files are retained for explicit
ownership/distribution review; this is not a claim of complete content clearance.
The last real-model task/replay check remains bound to the preceding archive
`bc5cc9357dec36c1ac3b683685eb218014dd6ecc140a27d68f92f173155721ad`; it was not
rerun merely for these documentation/default-path changes.

The customer quickstart now leads with the separate customer project and bundle
launcher, correcting an older example that selected ARE's own repository profile.
Shell syntax and local links were checked; no claim of a bundled graphical client
or guided project-authoring wizard is made.

## Open Questions

The [current archive notice audit](NOTICE-AUDIT.md) reconciles the 76-manifest
count into 51 generated, 24 other project and one bundled TypeScript package,
and separately identifies 21 Cargo registry dependencies in the lockfile. It
rechecks the current engine archive hash without rebuilding it. Missing manifest
license fields are not a count of distinct third-party dependencies.

Owner decisions and commercial terms remain in [project intake](PROJECT-INTAKE.md#open-questions).
Linux/Node and the first host integration now have bounded evidence in the customer
bundle reports. Complete notice/ownership review, portable development entry points,
provenance regeneration and the final releasable dependency scope remain unresolved.
See [delivery order](DELIVERY-PLAN.md) for the dependent work.
