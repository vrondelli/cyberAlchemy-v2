# Evolution operational-index posture — native candidate check

Status: candidate implementation evidence, 2026-10-04. This check is not a
release, installation, recovery, or proof of an executing Evolution worker.

## Behavior

The Evolution observer now reports durable-ledger evidence and disposable
operational-index posture separately. A verified ledger can have a healthy
index, an index requiring rebuild, or an index whose status cannot be safely
read. Registry-only and unverified-ledger observations do not assert an index
status. The dashboard retains an expired observation only as **Last seen**.
The Evidence page qualifies a verified-ledger explanation with the separate
index posture. No dashboard control rebuilds or mutates the index.

The index probe uses an immutable, read-only SQLite connection only when
there is no non-empty WAL. A missing index remains missing after observation;
an unsafe concurrent or WAL state returns unavailable rather than implying a
current digest. This is diagnostic visibility, not a recovery decision.

## Verification

- Source Evolution runtime suite: 25 cases, 23 passed and two Windows-only
  cases skipped on Linux.
- Dashboard source suite: 67 of 67 passed.
- Offline Rust `cargo check` in the pinned Linux builder passed.
- The extracted, unsigned and uninstalled Linux package passed three native
  WebKitGTK journeys at an actual 340 × 740 window: healthy index,
  rebuild-required index, and registry-only. These checked the seven panels,
  product diagnostic, first useful content, and horizontal overflow.
- The configured local runtime's read-only observation returned a verified
  ledger with 33 commits, five cycles, and `rebuild-required` index posture.
  No recovery was run against that root.

Package: `dist/are-companion_0.1.0_amd64-index-health-20261004.deb`.
SHA-256: `050a31b76841fe0c26d34f169dedb9f198b233747dd066125157a0335b66ad24`.
It has 846 product-closure files, closure digest
`38cea89ebf435801be4dd4aff0c710c7a9eeb1602b1be6c232f31284613c5ad2`,
and bundles Node 26.8.1 and the native orb candidate.

## Claim ceiling

The checks cover an extracted Linux package and bounded fixture data. They do
not establish installed lifecycle, current worker liveness, Windows WebView2
parity for this source revision, screen-reader acceptance, or an admitted
Evolution cycle. The live index diagnostic is not permission to rebuild it.

## Open Questions

- Rebuild and test the same source revision with the Windows toolchain when
  Windows interop is available; keep installer installation separate.
- Decide who owns recovery of a missing or mismatched operational index and
  what preconditions its non-read-only operation must satisfy.
- Complete human assistive-technology and installed lifecycle review before
  treating the Companion as accepted desktop UI.
