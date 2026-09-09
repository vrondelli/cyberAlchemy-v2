# KEP deployment — 2026-09-06

**PASS_BOUNDED: deployed to https://kep.cyberalchemylab.com/console-experience/.**

User authorization: "deploy the current version", following the tested clock-fix result. CA2-ROUTE-PUBLISH; operational-support lane. Deployment selected the exact source snapshot captured at the start of that request, including the console, security hardening, normalized persistence and monotonic clock repair.

## Checks and effects

- Current UI tests, source/bundle equality and white-paper generation checks passed. Prior clock-fix test manifest verified before build: 31 regular Rust tests, seven PostgreSQL tests, three real HTTP trials with 216 acknowledgements. Those are prior local test results, not a new live transaction test.
- Built hosted image from an isolated allowlisted context. Archive checksum matched after transport. Exact root filesystem and normalized Docker runtime configuration matched; the first raw comparison exposed omitted default metadata, including Labels:null, which was diagnosed before application replacement.
- Restored a production snapshot into a separate private rehearsal database. Exact image migrated it, loaded 41 normalized documents, preserved three payloads, 44 journal records and the legacy state fingerprint. Six image route/readiness checks passed; rehearsal container stopped. Snapshot and rehearsal database retained privately on the VPS.
- Stopped the live writer, created a quiescent custom-format database dump, verified its restore listing, preserved prior Compose, and replaced only the application image. Database container and environment unchanged. Migration produced layout version 1; legacy fingerprint, payload count and journal count matched after cutover.
- New application is healthy. Eight public HTTPS route checks passed, including console, landing page, white paper and readiness. Served console JS and CSS match the frozen image source exactly.

## Preserved and excluded

Concurrent work added response_admission to src/lib.rs during the build. It was preserved and deliberately excluded from this tested deployment; concurrent-work.json records the boundary. No source changes, Git commit/push, local preview restart, key use or public-chain transaction occurred in this deployment task. Prior failed test epochs and unrelated dirty work remain intact.

## Recovery and limits

receipt.json records the old/new images, Compose and source digests, backup location and database identity. Pre-update backup is private on the same VPS, not an independent disaster-recovery copy. Do not roll back only the binary: the new persistence layout requires coherent database recovery. No automatic rollback or restore was performed.

This is successful bounded deployment evidence, not a comprehensive security or capacity guarantee. Longer soak, slow-reader/disconnect tests, independent backup and operational monitoring remain separate follow-up work. Public checks did not execute a wallet exchange or a browser download. Local localhost:8783 remains the existing preview and is not the production URL.
