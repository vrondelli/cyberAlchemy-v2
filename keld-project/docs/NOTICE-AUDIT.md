# ARE archive notice scope

Date: 2026-09-17. Read-only evidence review of the existing private engine archive.
No ownership certification, legal conclusion, new license or release approval.

## Exact subject

Archive: `evidence/private-candidate/are-private-candidate.tar.gz` under KELD.
SHA-256, recomputed from actual bytes:
`a81380ca8e14f948dd7c87575b4ed9bd5e38892fab4f25c723a55120c57469d6`.
Closure: `24688ae36896adf30f83ecc80650368cb34e186b3e9cd5d8a12ca953317a4464`.
Existing inventory and manifest match this identity. This pass inspected tar
members and manifest contents in memory, without extracting, rebuilding or running
archive code. The separate customer bundle and external runtime distributions
are outside this pass.

## What the existing counts mean

The 76 included JavaScript manifests break down by path as follows:

| Category | Count | Meaning |
| --- | ---: | --- |
| Paths containing `/generated/` | 51 | Generated package manifests; missing license fields do not establish distinct third-party dependencies |
| Other project paths | 24 | Project/development package manifests; ownership and governing terms need mapping |
| Bundled `node_modules` package | 1 | TypeScript, declaring Apache-2.0 |

All 140 regular files beneath `node_modules` are under
`cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/node_modules/@typescript/old/`.
Its `LICENSE.txt` and `ThirdPartyNoticeText.txt` are included. This checks notice
presence, not upstream byte identity, modification history or complete compliance.
The other 75 manifests have no declared license in the existing inventory. Do not
describe them as 75 external dependencies needing independent replacement licenses.

One included Rust package, `module-port-governance-binding-rust`, has a Cargo
manifest and lockfile. The manifest declares `serde_json` and `sha2`; the lockfile
contains 21 registry packages including transitives. No archive member was found
under `/vendor/` or `/target/`, and no regular filename ended with `.so`, `.dll`,
`.exe`, `.rlib`, `.a` or `.wasm`. That is a bounded filename inspection, not a
complete binary-format detector or proof against embedded/copied dependency code.
Locked build dependencies must be distinguished from actually bundled sources or
binaries. A future binary distribution needs its own exact dependency/notice audit.

A narrow Python import check found no top-level import line naming `yaml`,
`requests`, `cryptography`, `httpx` or `pydantic`. This is not a Python dependency
inventory; dynamic imports, subprocess programs and other packages remain outside
that check. No dependency-absence claim follows from it.

## Remaining work and owners

### TypeScript upstream comparison completed

The archived TypeScript 6.0.3 package was compared with the
[npm version metadata](https://registry.npmjs.org/typescript/6.0.3) and its
[published tarball](https://registry.npmjs.org/typescript/-/typescript-6.0.3.tgz).
The 4,515,854-byte compressed download matched the registry's SHA-512 integrity
value. All **140 regular files match by relative path and SHA-256**, with no missing,
extra or changed regular files. Both the license and third-party notice match.
The local alias directory `@typescript/old` does not indicate modified content.

Evidence: `keld-project/evidence/typescript-upstream-audit.json` (ignored local
report), bound to the archive hash above. No code was executed, dependencies
installed, archive rebuilt or upstream tarball retained. This establishes regular
file provenance and notice preservation, not an upstream security audit, signature
verification, filesystem-mode equivalence or approval of the overall ARE license.

- **Release/IP owner:** map rights across ARE, Define/compiler and sibling
  DomainSpec sources. Repository path and package namespace do not establish
  ownership or authority to apply the proposed custom license.
- **Release engineer:** TypeScript regular-file provenance and existing notice
  preservation are now verified above; retain those exact materials when packaging.
  Review how their scope is distinguished from the final owner-controlled license.
- **Dependency reviewer:** inventory non-JavaScript runtime/build requirements and
  copied sources. Avoid turning lockfile entries into claims of bundled binaries.
- **Product owner:** settle exact custom resale terms for owner-controlled code.
  The older distribution-audit reference to intended Apache terms is historical
  and superseded by [the owner's license direction](LICENSE-PAYMENT-RESEARCH.md).
- **Content reviewer:** decide treatment of the five workstation-reference files
  in the existing archive scan; zero matches is not a substitute for rights review.

## Open Questions

Exact rights mapping, license wording and remaining source-content decisions are
owned by [project intake](PROJECT-INTAKE.md#open-questions). This evidence narrows
the review scope; it does not clear any file for publication or customer sale.
