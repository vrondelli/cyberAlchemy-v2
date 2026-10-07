# Live image SBOM and license review

Date: 2026-09-20

This review inventories the eight distinct images used by the nine live
KELD/ARE staging containers. It is technical evidence, not legal advice,
license clearance, a security waiver, or production authorization.

## Bound evidence

Trivy 0.74.0, pinned by image digest, generated CycloneDX 1.6 SBOMs and separate
full license-classifier reports from each exact live image ID. The private
receipt binds the schema-v2 r13 release manifest, eight runtime identities,
sixteen report hashes, scanner settings, and evidence boundaries:

`/opt/keld-staging/security-evidence/sbom-live-r13-20260920T1108Z.receipt.json`

Receipt SHA-256:
`f2be158a7dc0d830c676f9bd1c0d097d42c89498976b36d020ebeb3040eca867`.
All seventeen files are mode `0600` on the VPS and have a verified private
off-VPS copy under
`/home/vlad_/.local/share/keld-staging-operator/security-evidence/live-r13-sbom-20260920T1108Z/`.

The eight SBOMs contain 1,019 components across images. This is an
across-image count, not a deduplicated product package count. The license scan
reported 1,195 file/header classifier matches: 319 notice, 16 reciprocal, 513
restricted, eight unencumbered, and 339 unknown. Those numbers include repeated
matches in shared base layers and package copyright files. They do not mean the
product has 1,195 unique obligations or that a scanner severity is a legal
distribution decision.

## Complete High/Critical inventory

A second exact-image scan intentionally omitted `--ignore-unfixed`. Its private
receipt is:

`/opt/keld-staging/security-evidence/vuln-live-r13-full-20260920T1111Z.receipt.json`

Receipt SHA-256:
`6d91fd3e26853d6d167ca0473cda84100294073272f9b7ad271bf3da80c061f2`.
The receipt and eight mode-`0600` reports also have a verified off-VPS copy.

| Image | Raw H/C records | Unique CVEs | Fix available | Interpretation |
| --- | ---: | ---: | ---: | --- |
| KELD r10 application | 88 | 31 | 0 | Debian reports 67 affected, 19 fix-deferred, and two will-not-fix records. This explains why the release-policy scan with `--ignore-unfixed` was empty; it does not make the raw inventory empty. |
| Caddy r12 edge | 0 | 0 | 0 | Full High/Critical inventory empty. |
| PostgreSQL r2 | 0 | 0 | 0 | Full High/Critical inventory empty. |
| Keycloak 26.7.4 | 7 | 5 | 4 | Four unique dependency findings have an upstream fixed version; one OpenJDK finding is currently reported affected without a fixed version. Production remains on hold. |
| Four ARE roles | 0 | 0 | 0 | Full High/Critical JSON inventory empty for every exact live role image. |

Across all eight images, the reports contain 95 raw records representing 36
unique CVEs: 87 High and eight Critical records. Four unique fixed-available
findings are all in Keycloak: the already-reviewed unused SQL Server driver and
Netty TLS-path findings, plus the two Bouncy Castle findings. The additional
Keycloak `CVE-2026-22020` OpenJDK record is High, status `affected`, with no
fixed version in the scanner database. It has no deployment-specific
affectedness assessment yet.

The earlier zero-High/Critical claims remain valid only for the documented
`--ignore-unfixed` policy and exact images covered by those reports. They must
not be restated as a clean raw dependency inventory.

## Application provenance and exact-release successors

The r13 receipt remains immutable evidence for the exact images it names, but
it is no longer the current staging application inventory. The r11 application
and worker used `keld-sandbox:security-plan-20260920-r11`, exact image ID
`sha256:426ccdeb6c033a5f21f9bb841e2fd9d5e0b384373a2934059ab63138f5b337d3`.
The digest-pinned full scan for that exact image contains zero vulnerability
records and zero secret records. Its fresh CycloneDX SBOM contains 93
components, and its separate full license classifier contains 109 repeated
file/header matches. All three private reports have hash-verified mode-`0600`
off-VPS copies. See
[ALPINE-APPLICATION-PROMOTION-2026-09-20.md](ALPINE-APPLICATION-PROMOTION-2026-09-20.md)
for exact hashes, smoke evidence, rollback state, and the current manifest.

The schema-v3 r16 manifest additionally binds all 84 files in the preserved
application build context. A separate receipt proves that all 82 runtime-source
files match the exact r11 image byte-for-byte, and a Trivy 0.74.0 filesystem
scan reports zero secret findings in that context. This closes the source-to-
image provenance gap that remained after r15 bound only the canonical
Dockerfile. It does not replace the image scan, SBOM, or license-owner review.

Schema-v3 r17 retains that complete KELD evidence and additionally binds the
exact four ARE image IDs, three declared package manifests, three independently
observed `/srv` tree manifests, the edge source, and their receipt. Broker and
gateway agree with their declared package payloads. Public chat has no missing
declared files and explicitly records two changed plus four additional
build-generated files. The r17 manifest binds 36 deployment/evidence inputs and
passed the scheduled monitor at `2026-09-20T13:13:02Z`. This is exact observed
image-content evidence, not an independent clean-room rebuild or license approval.

Image history traced the r17 mismatch to a second `COPY dist/` overlay. The
source-clean replacement, exact image
`sha256:3321c0ec32f4b6ac7a1df753003f1c3428b0fd0e20882502720bfba5c41df76b`,
retains all 96 declared payload files byte-for-byte and removes only four stale
unreferenced chunks. Its Trivy 0.74.0 build-context scan has zero secret
findings; its exact-image scan has zero High/Critical vulnerabilities and zero
secrets. The constrained isolated smoke and live Firefox chat/refresh/reset
journey pass. Schema-v3 r18 binds the replacement and independently confirms
zero missing, additional, or changed files for every ARE package tree. Its
manifest SHA-256 is
`443e64e8ca52a9b282d458559c8130d2e5e1f3df8d36f13374ab54f502cc63f5`.

Schema-v3 r20 retained that exact runtime evidence and added the reviewed image
archive capturer, exact-ID recovery verifier, and r20 archive/recovery receipts
to the allowlisted deployment inputs. The r20 manifest
SHA-256 is
`a5fe38eb63782b88d64a2f87feb42970f43808db21fb3ec410f374cdfb85ec0d`.
A private archive covers all seven r20 custom image IDs and verifies
91 OCI blobs. Its automated empty Docker 29.8.1 containerd-snapshotter load
recovered all seven exact manifest IDs in 15.566 seconds with zero containers
before and after.

Schema-v3 r21 replaced only the KELD application/worker image with
`keld-sandbox:fixed-brl-5.10-20260920-r12`, exact image ID
`sha256:ce4f9a238238d2a36ec0c1a5c97f3eccd24fd2b13e7415bcedb7f9430e4fee3e`.
Its digest-pinned Trivy 0.74.0 scan reports zero High/Critical vulnerability
findings and zero secrets. The current schema-v3 r23 manifest
`staging-r23-provider-paid-delivery-evidence-20260920T162129Z.json`, SHA-256
`6906d38c7457f1cb4aaa3d56d5d28df1e0bdfbaf975435689ef1894c2f3b0c96`,
binds 43 allowlisted inputs and all nine live containers. The r20 archive is now
rollback evidence. The fresh r21 archive verifies the current seven-image set
and 91 blobs; an empty Docker 29.8.1 containerd-snapshotter load recovered all
seven exact IDs in 28.78 seconds with zero containers. The archive and both
receipts have matching off-VPS hashes, and r23 binds the receipts and tools.
State/configuration restore and public cutover remain separate gates.

The 31 unique CVEs in the table above therefore describe the retained r10
rollback image, not the live r12 application. The unchanged exact Keycloak
image remains the current live High/Critical dependency gate. A final frozen
production candidate still needs one aggregate receipt covering its complete
exact image set.

## Release decisions still required

- A security owner must disposition all five unique Keycloak findings. The
  Alpine application replacement removed the old live KELD base-image gate; a
  clean supported upstream Keycloak image is preferred to expanding downstream
  VEX statements.
- A license owner or counsel must derive the actual notice, attribution,
  reciprocal-source, source-offer, and redistribution obligations from the
  SBOM and shipped artifact. Trivy categories are triage input only.
- The owner must approve the production artifact identity and rights, customer
  license, support destination, support window, refund/dispute terms, and the
  exact notices delivered with the artifact.
- Any image rebuild invalidates the image-bound evidence and requires fresh
  SBOM, vulnerability, license, secret, release-manifest, and regression proof.
