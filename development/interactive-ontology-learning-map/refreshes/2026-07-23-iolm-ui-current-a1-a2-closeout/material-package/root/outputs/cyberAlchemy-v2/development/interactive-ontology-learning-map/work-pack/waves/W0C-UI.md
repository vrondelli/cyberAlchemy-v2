# W0C-UI — Fixture-Backed Workable Example

- Entry: the 2026-07-22 split is applied and `SWU-IOLM-00C-A` passed. Historical A1–A3 receipts exist, but the latest A4 replay proved their pinned Key-and-Door fixture generation is stale.
- Superseded unit: `SWU-IOLM-00C-UI-A`; it never ran, never passed, and is not a parent or reusable receipt.
- Historical completed units: original A1, A2, A3, and the bounded A3 Firefox event-target repair; all remain immutable audit evidence.
- Historical blocked attempts: A4 runs `20260722T160251Z-firefox` and `20260722T182915Z-firefox-replay` are immutable and emitted no browser-acceptance handle.
- Current-generation completed unit: fresh `SWU-IOLM-00C-UI-A1` rebind `20260723T002902Z-current-fixture-rebind` passed and emitted `iolm-fixture-boundary/v1`.
- Selected unit: exactly one `SWU-IOLM-00C-UI-A2` current-generation regeneration.
- Sequence: passed A1 rebind `iolm-fixture-boundary/v1` -> selected A2 regeneration `iolm-demo-snapshot/v1` -> gated A3 revalidation `iolm-interactive-viewer/v1` -> gated A4 Firefox replay.
- Merge policy: four bounded Task Sessions, one selected at a time; Context Builder and a compact Goal prepare only the current unit.
- Regeneration policy: preserve DomainSpec bytes and A1 implementation, re-read the exact fresh A1 receipt and guarded Key-and-Door bundle immediately before A2 mutation, write only the A2 implementation subset plus a new A2 `regenerations/<run-id>` lifecycle, and stop on any further drift.
- Exit: pending; a current-generation `iolm-demo-snapshot/v1` returns to Invoke Refresh before A3 selection. Required human browser and assistive-technology evidence remains truthfully `NOT_RUN` until performed.
- Recomposition: a later compiler-backed input may replace only the gateway after the unchanged upstream receipts pass and only while the versioned `DemoSnapshotV1` contract holds.
- Authority: this wave cannot affect `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`, `CROSS_FEATURE_UNSUPPORTED`, promotion, or publication.
- Stop: return the current typed receipt and do not select the next SWU automatically; after A2, return to Invoke Refresh for A3 selection.
