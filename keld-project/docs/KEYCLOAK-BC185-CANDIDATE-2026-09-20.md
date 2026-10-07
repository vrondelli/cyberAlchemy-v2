# Keycloak Bouncy Castle 1.85 candidate

Date: 2026-09-20. Status: experimental downstream remediation candidate;
scanned and rehearsed in isolation, not deployed, not approved for production.

## Outcome

The candidate replaces the complete Bouncy Castle set in the pinned Keycloak
26.7.4 image with version 1.85, the vendor-fixed release for
`CVE-2026-8763` and `CVE-2026-13506`. Its exact raw High/Critical scan no
longer reports either CVE. Live staging remains on the stock Keycloak image.

This is not an upstream-supported Keycloak release. It is useful evidence and a
bounded fallback for security-owner review, not an automatic promotion path.

## Exact implementation

- Stock input:
  `quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c`.
- Candidate source: [Keycloak.Dockerfile](../deploy/Keycloak.Dockerfile),
  SHA-256
  `e025d23928dac2ba474e4864e325fa75f1af653dd66e738e17be975cce2cf0de`.
- Candidate image:
  `keld-keycloak:26.7.4-bc185-candidate-r2`, exact image ID
  `sha256:603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f`.
- `bcprov-jdk18on-1.85.jar` SHA-256:
  `20af26bf6060bb8005cc2389916812c1e0e998dc48d2ced7131b89461b54cff7`.
- `bcpkix-jdk18on-1.85.jar` SHA-256:
  `c9f82b2d4e99c4bbdfccf684e52cc06ea06a0b567bfd0d08f9c5a3f417055996`.
- `bcutil-jdk18on-1.85.jar` SHA-256:
  `590f55ed5d68529239898a4a5c4f730b6e37f45d1cfa3fbe51f8485abe32c42d`.

Keycloak's generated Quarkus application model refers to the three server-side
files by their original `1.84` filenames. The candidate therefore preserves
those internal path names while replacing their bytes with the exact 1.85
artifacts. The client-side provider uses its normal `1.85` filename. The
CycloneDX result recognizes all four locations as Bouncy Castle 1.85.

The first build (`candidate-r1`) merged the builder directory into a fresh stock
final stage. Docker copy semantics retained the stock client-side 1.84 file, and
the raw scan correctly retained all five CVEs. That image was rejected without
deployment. The r2 final stage deletes `/opt/keycloak` before copying the built
tree; a regression test now requires deletion to precede the copy. Exact file
enumeration proves that no 1.84 client JAR remains.

## Evidence

| Evidence | Result | SHA-256 |
| --- | --- | --- |
| Raw Trivy 0.74.0 High/Critical vulnerability plus secret scan | 3 unique CVEs; zero secrets; both Bouncy Castle findings removed | `fffff892acfeeb47eba7e8be8ad4124cc39640e2bc2d349aa58847dce4c044da` |
| Isolated restored-state rehearsal | 9 users, 2 realms, readiness 200, issuer discovery 200, read-only root, internal network, no host-bound ports | `c2982325c97da5cc61e2715dbe4e6c7e3667a7ea61e624937da1fdcceb37996f` |
| CycloneDX SBOM | 556 components; exact OCI image ID; Bouncy Castle 1.85 recognized | `fdc8e4286632bbf6b83418926c4c43aab16971ada275c836d231e1ed4e6dd076` |
| Initial candidate license scan | 44 OS-package matches; retained as historical evidence but superseded because it omitted loose-file classification | `08a886a559e481bae36ab04660a63de8d8c308d59a08424dd7cc77c0e34b4b7f` |
| Like-for-like stock full-license scan | 52 matches with Trivy 0.74.0 `--license-full` | `1c86b483771bcd935ed776656758882ec9bdf2445b2bba5eb85456b3c595ab0d` |
| Like-for-like candidate full-license scan | 52 matches with Trivy 0.74.0 `--license-full` | `6a16b2d4e8b4b33fa407cf0e37558e76590c48b1ebb4946adbadb525ba81e227` |
| Exact-image normalized license delta | 52 common; zero candidate-only and zero stock-only classifier entries | `0f5b4231c2e2b5f6cdfc25134ff9070b0260940be5569a8b312a98ea30d2a2de` |
| Private Chromium identity surface | Registration created one disposable user (9 to 10), fresh login issued a code, and logout completed with zero candidate-page console errors | `b67ccb38138dcbe2701b63024332504cc69c67d1b8ee8f33d2df7544e27aaa79` |
| Candidate-backed application rehearsal | Two registrations and real PKCE callback exchanges; forced token renewal; logout; buyer A order count 1, buyer B count 0, and cross-buyer restore denied 404; internal network and no published ports | `ab4df442d59de7f8a7dc225831904af180d7fd2f162f3403e7b5346b1ca37ac3` |
| Candidate-backed Chromium receipt | Both final candidate pages had zero console errors; no payment provider invoked and no live state changed | `d9bf4f019d0774745a5a9cbdd6d9eea26c2a442bc3e8793c27c6bcffc028576c` |

The private VPS evidence is under
`/opt/keld-staging/security-evidence/`. Matching mode-`0600` off-VPS copies,
plus the exact Dockerfile, are under
`/home/vlad_/.local/share/keld-staging-operator/security-evidence/keycloak-bc185-candidate-r2-20260920T1202Z/`.

The first candidate license report and the earlier stock report were produced
with different effective coverage: only the stock result contained the loose-
file classification target. They cannot support a delta claim. Both images were
therefore rescanned with the same Trivy 0.74.0 invocation and
`--license-full`. The reusable
[license comparator](../deploy/compare-keycloak-license-reports.py) binds the
two exact image IDs, requires both OS-package and loose-file targets, and fails
on any normalized classifier difference. The corrected evidence finds 52
matches in each image—15 notice, 7 reciprocal, 18 restricted, and 12 unknown—
with zero differences. This narrows the candidate review to the unchanged
stock-image obligations; it is not legal clearance or proof that notices and
source-offer duties have been fulfilled.

At the intentionally changed component boundary, the stock SBOM contains the
four Bouncy Castle locations as version 1.84; the candidate SBOM contains the
same four locations as version 1.85 and identifies their license as MIT. Direct
inspection of the three exact 1.85 artifact hashes (including both copies of
`bcprov`) finds `META-INF/LICENSE.md` in every JAR with the same SHA-256,
`0e01f1549c9022f406392ac2947d32223b7c2e977d21ea2f8c182fdeb4dae5fd`.
The upstream project also publishes the Java distribution under its MIT-based
license. The owner still must ensure the copyright and permission notice is
carried with distributed copies.

The reusable [rehearsal script](../deploy/rehearse-keycloak-candidate.sh)
creates an internal Docker network, restores the private Keycloak dump into a
fresh non-root/read-only PostgreSQL container, starts the candidate read-only
with no published ports, verifies health and realm discovery, records only
non-secret evidence, and removes every disposable object on exit. The first
rehearsal attempt also failed closed when the mode-`0600` source dump could not
be read by the restore UID. The corrected script preserves the source mode and
uses a private disposable transfer volume with mode `0400` for UID 70.

The first browser run reached the private candidate over an SSH loopback tunnel into
the internal Docker network; the candidate still had no published host port.
Registration and a fresh login each issued an authorization code for the
configured client, and the logout confirmation ended on the candidate's logged-
out page. The live callback correctly returned 401 because the rehearsal used a
synthetic state and localhost issuer. Therefore this proves the candidate's
registration/login/logout surface, not a valid live application session,
renewal, or candidate-backed two-buyer isolation.

A second, complete application rehearsal closes that boundary. The reusable
[candidate-backed app harness](../deploy/rehearse-keycloak-app-candidate.sh)
restored the Keycloak and session databases, reset only the disposable session
rows to use an ephemeral custody key, copied the commerce database, assigned an
ephemeral confidential-client secret and rehearsal redirect URI in the restored
Keycloak database, and placed the exact r11 application plus candidate Keycloak
behind a private TLS proxy. Keycloak remained HTTP-only behind that proxy.

Two isolated Chromium contexts registered separate users through the real
application PKCE callback and token exchange. The restored user count moved
from 9 to 11. A forced five-second access-token lifetime exercised renewal; the
session evidence reached generation 6 through repeated bounded renewals. Buyer
A saw one synthetic local order, buyer B saw zero, and buyer B's attempt to
restore buyer A's order returned `404 not-owned`. Buyer A logout produced one
revoked session while buyer B remained active. Final evidence recorded two
session families, one active and one revoked, zero published ports, an internal
network, cleanup success, and no live mutation. No payment adapter was invoked.

## Remaining raw findings and decision boundary

The r2 raw scan retains:

- `CVE-2025-59250` in the unused SQL Server JDBC driver;
- `CVE-2026-75595` in the unused Keycloak-side TLS/SNI path; and
- `CVE-2026-22020` against `java-21-openjdk-headless`
  `1:21.0.12.1.1-1.2.el9`.

The first two have configuration-bound statements for the stock image. Those
statements cannot be reused silently because OpenVEX is bound to an exact image
subject; any candidate promotion requires candidate-specific statements and
security-owner acceptance.

An exact-subject [candidate OpenVEX proposal](../deploy/keycloak-bc185-candidate-r2.openvex.proposed.json)
now makes that pending review concrete. It proposes `not_affected` for the
Netty and SQL Server findings, using the already rehearsed HTTP-only/PostgreSQL
execution boundaries, and keeps the OpenJDK finding `under_investigation`.
The [proposal verifier](../deploy/verify-keycloak-bc185-candidate-vex-proposal.mjs)
requires the canonical SBOM PURL, all three raw findings, the unapproved marker,
candidate absence from every Compose file, and absence of proposal consumption
by operational deployment files. It is deliberately not passed to Trivy and
does not change the raw three-finding result.

For `CVE-2026-22020`, Red Hat's tracker records that the CVE was officially
rejected as bogus, and its Fedora OpenJDK child is closed `NOTABUG`. The
candidate's installed OpenJDK 21.0.12 is also newer than the Oracle 21.0.11
release cited as containing the library update. Trivy still emits the raw
finding with no fixed version, so it remains visible. This is strong evidence
for a scanner/vendor-status disposition, not permission to delete the raw
record or self-approve a waiver.

References:

- [Bouncy Castle CVE-2026-8763](https://github.com/bcgit/bc-java/wiki/CVE%E2%80%902026%E2%80%908763)
- [Bouncy Castle CVE-2026-13506](https://github.com/bcgit/bc-java/wiki/CVE%E2%80%902026%E2%80%9013506)
- [Bouncy Castle Java license](https://github.com/bcgit/bc-java/blob/main/LICENSE.md)
- [Red Hat CVE-2026-22020 tracker](https://bugzilla.redhat.com/show_bug.cgi?id=2460045)
- [Fedora OpenJDK child, closed NOTABUG](https://bugzilla.redhat.com/show_bug.cgi?id=2460614)
- [Keycloak 26.7.4 release](https://www.keycloak.org/2026/09/keycloak-2674-released)
- [OpenVEX specification v0.2.0](https://github.com/openvex/spec/blob/main/OPENVEX-SPEC.md)

## Promotion gates

1. Obtain security-owner acceptance for the downstream dependency overlay and
   either approve/revise the exact-subject proposal for every retained raw
   finding or reject it in favor of a supported upstream image.
2. Obtain license-owner review of the candidate SBOM/license delta.
3. If accepted, back up live state, update Compose to the exact candidate
   identity, run a canary with explicit rollback thresholds, and capture a new
   immutable release manifest. Otherwise keep stock 26.7.4 and wait for a
   supported upstream release.

No step above authorizes live deployment by itself.
