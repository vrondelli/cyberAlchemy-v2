# Evolution index disclosure — narrow native package check

Status: candidate implementation evidence, 2026-10-04. This is not an
installation, release approval, index recovery, or worker-liveness check.

## Change

The index posture above verified cycles is now a collapsed disclosure. Its
summary still names a matching, rebuild-required, or unavailable index; the
expanded explanation retains the separate ledger claim and the no-recovery or
worker-liveness qualification. A stale reading remains explicitly last seen.
The previous full paragraph pushed most of the first cycle below a 340 × 740
window. The revised layout shows that cycle's entire collapsed summary in the
first viewport.

## Verification

- Dashboard source tests passed 67/67. The modified browser and native probe
  scripts passed syntax checks; the Chromium browser fixture was not run here.
- An extracted, unsigned Linux package passed WebKitGTK checks at an actual
  340 × 740 window for a matching index, a rebuild-required index, and a
  registry-only view. The checks verified no horizontal overflow, the first
  cycle summary inside the viewport, and expansion and collapse of the index
  explanation. The registry-only view made no index claim.
- The rebuild-required check removed only the disposable fixture's SQLite
  index before observation and confirmed that the read-only UI did not recreate
  it. No live Evolution root was modified.
- The [captured native view](../../../../../output/playwright/are-evolution-index-disclosure-webkit-340-20261004.png)
  shows the matching-index summary and first cycle together.

Package: `dist/are-companion_0.1.0_amd64-index-disclosure-20261004.deb`.
SHA-256: `636745a72e89f9c0a00051b1954d76ac0ee6be7e241d8d4311a281ecf1b50b20`.
Its development closure has 846 files and digest
`38cea89ebf435801be4dd4aff0c710c7a9eeb1602b1be6c232f31284613c5ad2`.
The package was assembled from the freshly compiled native binaries and a new
ARE closure, reusing only unchanged Debian metadata and support files from the
preceding package. A cold build at a short container mount path compiled the
binaries but failed packaging because that path misresolved the repository
boundary; a second build at the proper path encountered stale Tauri cache
metadata pointing to the short path. The extracted package's native test is
the evidence for the resulting candidate, not a claim that the packaging
script completed end to end in this attempt.
The later [path-portability follow-up](ARE-CLOSURE-PATH-PORTABILITY-2026-10-04.md)
fixes the shallow-mount source mapping and completes the standard offline
builder with the same compact Evolution view.

## Claim ceiling

The test covers the extracted Linux package and isolated fixture data. It does
not establish installed lifecycle, Windows WebView2 parity for this revision,
human screen-reader acceptance, an admitted cycle, or an executing worker.

## Open Questions

- Rebuild from a clean, correctly rooted native cache before release packaging.
- Verify this revision in a Windows package when Windows interop is available.
- Review the disclosure with assistive technology and in an installed app.
