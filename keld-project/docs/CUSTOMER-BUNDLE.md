# Standalone customer bundle candidate

Date: 2026-09-17. This is a private packaging result, not sale approval.

## Exact result

- Archive: `evidence/customer-bundle/are-customer-bundle.tar.gz`.
- Size: 11,257,823 bytes.
- SHA-256: `b5c0864c1c932647f54e4d29fcc337609cea64cadc2279699bbb57ef63e8b097`.
- Embedded engine SHA-256: `a81380ca8e14f948dd7c87575b4ed9bd5e38892fab4f25c723a55120c57469d6`.
- Exact file inventory and validation: `evidence/customer-bundle/manifest.json`.

The bundle includes the unchanged complete engine archive, engine manifests,
verified extractor/installer, customer setup tool, separate-root agent launcher,
standalone README and a complete synthetic sample project. It does not bundle
Codex, credentials, model access or the development checkout.

## Reproduce

```sh
python3 keld-project/scripts/build-customer-bundle.py
```

Requires the already-built private engine candidate, Python, Node and the existing
local Node 26.8.1 container image. It never pulls an image. The build creates two
archives and compares their digests, verifies extracted members, runs the included
installer, and checks the resulting installation in an isolated container.

The container mounts only the extracted bundle read-only. It uses a writable
temporary customer directory, no network, no host home directory or source
checkout, and no added capabilities. Engine doctor, real customer-profile loading
and real wrapper context projection all passed. Temporary build trees and the
container are removed; one selected bundle archive and manifest remain.

The sample generator is a build-time dependency only. The delivered setup and
launcher import the engine from the explicit installation root and do not import
the development repository. The bundle's [standalone README source](BUNDLE-README.md)
contains the actual install and launch commands.

## Evidence boundaries

The embedded engine's full extracted suite previously passed 1,244 cases. The
current bundle check exercises installation and customer-context preflight; it
does not repeat the full suite or invoke a model. The separate
[real-task check](CUSTOMER-PROFILES.md#real-task-and-recovery-result) establishes
one completed model task and completed-state restoration for these tools.

The outer manifest binds every bundled file, including tooling and sample inputs.
It is an unsigned private manifest, not an authenticated customer delivery system.
`sale_approved` and `publication_approved` remain false. Keep this archive outside
the storefront preview's served directory.

## Customer-authored project starter

The current bundle includes `create-customer-project.mjs` and
`project-spec.example.json`. Customers can supply terms, meanings, instructions and
an explicit persistence choice. The tool creates a new explanation-only project,
binds its policy hashes and validates it with the installed engine. Existing
projects are refused. The isolated bundle check verifies this path and records
`customer_authoring: PASS`. See [authoring instructions](CUSTOMER-AUTHORING.md).
Broader routing and migration remain incomplete; this starter makes no semantic
admission or arbitrary-effect claim.

## Open Questions

The owner superseded the starter's Apache-2.0 direction with candidate custom
source-available terms. Paid resale of an ARE-derived copy requires substantive
new functionality or material functional improvement. The reseller must offer
that version's source code without charge to verified ARE purchasers; no binaries,
future upgrades or human support are required by this rule. [Candidate license
clauses](ARE-LICENSE-CANDIDATE.md), distribution ownership and third-party
notices still require legal and rights review.
Commercial policies, authenticated delivery, interrupted-task recovery and update
migration remain in [the delivery plan](DELIVERY-PLAN.md).
