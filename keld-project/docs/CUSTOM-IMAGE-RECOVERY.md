# Custom image recovery rehearsal

Date: 2026-09-20

This evidence covers restoration of the seven custom KELD/ARE images from the
historical r13 off-VPS Docker archive. It does not prove state restoration,
service startup, public traffic cutover, or production authorization. The r13
archive is no longer the current live set after the r11 application and r18
public-chat replacements.

## Current r21 recovery proof

The r21 fixed-rate release has a fresh private archive covering all seven
current custom image IDs. It verifies 91 OCI blobs, seven image entries, and
one attestation descriptor. The archive SHA-256 is
`811cf5e1e6557fb024079516c79b4cb6274a1aca3977174ff812636aa4b8e18c`;
the receipt SHA-256 is
`96b06bfde0faed53f151c345c8f1759428d47b281adbc9f47b433b060fcc0f16`.

An automated verifier loaded it into an empty Docker 29.8.1
containerd-snapshotter image store in 28.78 seconds, recovered all seven exact
manifest IDs, and observed zero containers before and after. The recovery
receipt is
`/opt/keld-staging/security-evidence/r21-clean-load-rehearsal-20260920T153500Z/verified-recovery.json`,
SHA-256
`1c69b4f9b4cafc9ab1d95ea0fa82e0c29972f03f394c9ca70fa5e9fa1f85f928`.
Matching mode-`0600` off-VPS copies of the archive, capture receipt, and recovery
receipt exist under
`/home/vlad_/.local/share/keld-staging-operator/images/custom-images-r21-20260920T153109Z/`
and
`/home/vlad_/.local/share/keld-staging-operator/security-evidence/r21-clean-load-rehearsal-20260920T153500Z/`.
Schema-v3 r23 binds the current receipts and reusable tools. Its manifest is
`staging-r23-provider-paid-delivery-evidence-20260920T162129Z.json`, SHA-256
`6906d38c7457f1cb4aaa3d56d5d28df1e0bdfbaf975435689ef1894c2f3b0c96`.

## Previous r20 recovery proof

A private archive covers all seven custom image IDs in the r20 baseline,
including the r11 KELD application and source-clean r18 public chat. The reusable capturer
requires exact local image IDs, refuses existing outputs, verifies every OCI
blob digest and the exact seven-entry Docker manifest, and permits only explicit
BuildKit attestation descriptors. The archive verifies 91 blobs, seven image
entries, and one attestation descriptor.

The mode-`0600` off-VPS files are under:

`/home/vlad_/.local/share/keld-staging-operator/images/keld-staging-r18-custom-images-20260920T1345Z/`

Archive SHA-256:
`485dc62239636f1fc7ded7dbb4d3f2be1033481641ff19ade52afd59b5a8412c`.
Receipt SHA-256:
`52095c562c324327f101f142245fffcfd4fedac6491ea0c38f2cf3fb249584d6`.

The r20 archive was loaded into an empty, isolated Docker 29.8.1 image store
using the same `io.containerd.snapshotter.v1` mode as staging. The automated
verifier required zero initial images and containers, checked the archive and
capture-receipt hashes, observed exit code zero, inspected all seven recovered
IDs, and confirmed zero containers after the load. The measured load was
15.566 seconds and every recovered manifest ID matched exactly.

The private mode-`0600` recovery receipt is available on the VPS at:

`/opt/keld-staging/security-evidence/r19-clean-load-rehearsal-20260920T135721Z/verified-recovery.json`

Its matching off-VPS copy is under:

`/home/vlad_/.local/share/keld-staging-operator/security-evidence/current-image-recovery-r19-20260920T135721Z/`

Recovery receipt SHA-256:
`d60e3d0302075e213becd995b51b7cdf1c475a8bb404287f0f64d88b1672e004`.

The reusable verifier is `verify_custom_image_archive_recovery.py`. Schema-v3
r20 bound the archive receipt, recovery receipt, capture tool, and verifier as
40 allowlisted release inputs. Its manifest is
`staging-r20-current-image-recovery-verified-20260920T142313Z.json`, SHA-256
`a5fe38eb63782b88d64a2f87feb42970f43808db21fb3ec410f374cdfb85ec0d`.
No live container was recreated for this proof. Schema-v3 r21 subsequently
replaced the application image with the fixed-rate r12 successor. The archive
therefore remains valid rollback evidence for r20; the current r21 archive and
empty-engine load are recorded above.

The rehearsal also found an important compatibility boundary. Loading the same
archive into a classic `vfs` graphdriver engine returned exit code zero and
imported seven payloads, but exposed their config digests rather than the seven
manifest IDs pinned by Compose. That result was rejected. Exact-ID recovery
therefore requires the containerd snapshotter image store; a successful
classic-graphdriver load is not equivalent evidence.

## Historical r13 result

The archive was loaded into the off-VPS WSL Docker engine after verifying that
the engine had zero containers and only the unrelated `hello-world:latest`
image. The load completed in 37 seconds with exit code zero. Six named images
restored with their original tags; the intentionally untagged ARE inference
broker restored by ID and was tagged as `are-broker:presentation-recovered`.

All seven recovered image IDs exactly matched the live image IDs recorded in
the source receipt. Docker 29.8.1 reported each restored descriptor as
`application/vnd.oci.image.index.v1+json`; this rehearsal therefore supersedes
the earlier conservative assumption that Docker save/load would necessarily
discard these OCI index identities.

The private mode-`0600` recovery manifest is:

`/home/vlad_/.local/share/keld-staging-operator/images/keld-staging-r13-custom-images-restore-20260920T105803Z.json`

Its SHA-256 is
`525f89e707a1d2155e572a402838fa8b021ac82c573a602098d58114cd879637`.
It binds the source archive and receipt hashes, engine details, load timing,
retag action, expected and recovered IDs, and explicit evidence boundaries.

## Rehearsal sequence

1. Verify the archive and receipt are regular private files and compare the
   archive byte count and SHA-256 with the receipt.
2. Require a containerd-snapshotter Docker engine with zero images and zero
   containers. A classic graphdriver does not preserve the pinned manifest IDs.
3. Load the gzip archive directly with `docker image load --input ARCHIVE`.
4. Treat process exit as necessary but insufficient. Reject any load output
   containing an error, then inspect every expected reference and ID.
5. If a restored deployment requires named references, the broker has no source
   `RepoTags` entry. Tag exact image ID
   `sha256:c97781ae0ee05e69fd0ab8fe145c154c62c7ec807591dd58dcc0bdaa41fd96a3`
   as `are-broker:presentation-recovered` before admission.
6. Require seven exact ID matches and capture a private immutable recovery
   manifest. After restoring deployment configuration and state, capture and
   verify a fresh release manifest before starting public traffic.

## Failure found during rehearsal

A first attempt used a single-ID user namespace. Docker printed an ownership
error while returning exit code zero because image layers contain supplemental
UID/GID ownership. That attempt was rejected. A valid recovery host must support
the archive's file ownership through a normal rootful engine or correctly
configured subordinate UID/GID ranges. Operators must validate output and exact
image inventory rather than accepting exit code alone.

## Remaining recovery gates

- approved second storage destination and retention schedule;
- independent recovery-key custody;
- approved RTO/RPO with full-service timing evidence;
- a bounded public rollback/cutover drill;
- a fresh release manifest after state and configuration restoration.
