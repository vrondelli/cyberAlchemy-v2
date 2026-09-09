# W0C-UI — Fixture-Backed Workable Example

- Entry: the 2026-07-22 split is applied and `SWU-IOLM-00C-A` passed. Historical A1–A3 receipts exist, but the latest A4 replay proved their pinned Key-and-Door fixture generation is stale.
- Superseded unit: `SWU-IOLM-00C-UI-A`; it never ran, never passed, and is not a parent or reusable receipt.
- Historical completed units: original A1, A2, A3, and the bounded A3 Firefox event-target repair; all remain immutable audit evidence.
- Historical blocked attempts: A4 runs `20260722T160251Z-firefox` and `20260722T182915Z-firefox-replay` are immutable and emitted no browser-acceptance handle.
- Selected unit: exactly one fresh `SWU-IOLM-00C-UI-A1` current-fixture rebind.
- Sequence: selected A1 rebind `iolm-fixture-boundary/v1` -> gated A2 regeneration `iolm-demo-snapshot/v1` -> gated A3 revalidation `iolm-interactive-viewer/v1` -> gated A4 Firefox replay.
- Merge policy: four bounded Task Sessions, one selected at a time; Context Builder and a compact Goal prepare only the current unit.
- Rebind policy: preserve DomainSpec bytes, re-read the exact three Key-and-Door allowlisted paths immediately before A1 mutation, bind all current hashes and expected values, write only the A1 implementation subset plus a new A1 `rebinds/<run-id>` lifecycle, and stop on any further drift.
- Exit: pending; a fresh current-generation `iolm-fixture-boundary/v1` returns to Invoke Refresh before A2 selection. Required human browser and assistive-technology evidence remains truthfully `NOT_RUN` until performed.
- Recomposition: a later compiler-backed input may replace only the gateway after the unchanged upstream receipts pass and only while the versioned `DemoSnapshotV1` contract holds.
- Authority: this wave cannot affect `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`, `CROSS_FEATURE_UNSUPPORTED`, promotion, or publication.
- Stop: return the current typed receipt and do not select the next SWU automatically; after A1, return to Invoke Refresh for A2 selection.
