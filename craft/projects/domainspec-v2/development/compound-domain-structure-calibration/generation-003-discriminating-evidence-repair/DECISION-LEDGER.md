---
artifact_id: CDSC3-DECISIONS-v0.1
status: fixed-for-plan
---

# Generation 3 Decision Ledger

| ID | Decision | Rationale | State |
| --- | --- | --- | --- |
| `DEC-CDSC3-001` | Create an append-only generation-3 package and protect generations 1/2. | Closed audit forbids continuation inside generation 2. | fixed |
| `DEC-CDSC3-002` | Freeze six atomic targets before browser observation. | Compound target clauses caused partial coverage and six indeterminate cells. | fixed |
| `DEC-CDSC3-003` | Target decomposition may use parent substitution text only. | Prevent outcome optimization and historical reinterpretation. | fixed |
| `DEC-CDSC3-004` | Use a source-derived browser harness outside Savvy. | Browser evidence is missing, while fixture repositories remain read-only. | fixed |
| `DEC-CDSC3-005` | Treat structured browser state as primary and screenshots as supporting evidence. | Machine replay cannot depend on visual inspection alone. | fixed |
| `DEC-CDSC3-006` | Preregister a finite test-impact differential and accept empty `D`. | Usefulness must be measured without assuming a desired result. | fixed |
| `DEC-CDSC3-007` | Import UI-repair portability evidence as a stable limit only. | Corpus/dossier policy has a separate closed owner and remains below threshold. | fixed |
| `DEC-CDSC3-008` | Preserve the six parent explanation statements. | Generation 3 tests discriminability, not post-hoc explanation invention. | fixed |
| `DEC-CDSC3-009` | Preserve evaluator v1 and suite decision tables. | Calibration method outcomes are not under repair. | fixed |
| `DEC-CDSC3-010` | Accept every total F3/suite outcome and route without promotion. | Evidence cannot be selected to force survival of the hypothesis. | fixed |
| `DEC-CDSC3-011` | Authorize a pinned package-local Playwright and Chromium install for SWU002. | An isolated runtime best preserves replayability and avoids coupling evidence to another project's installed dependencies. | selected |

No blocker decision remains before L0 or the browser-runtime preflight. Any proposed target change, source
mutation, evaluator change, portability collection, or authority route requires
a new decision gate and cannot be auto-selected by Task Session.

## DEC-CDSC3-011 - Browser Runtime Source

- Decision question: how should SWU002 obtain a real Playwright/Chromium runtime?
- Classification: blocker for SWU002 and later browser work.
- Selected option: pinned isolated install.
- Authorization: SWU002 may create a package-local runtime manifest and lockfile,
  install pinned `@playwright/test` plus Chromium, and freeze package, browser,
  executable, and lock digests within its declared write scope.
- Rationale: the package owns its replay contract and does not depend on mutable
  `node_modules` belonging to Body War, IDE Extension, UI Prototyping Studio, or
  Savvy. The accepted cost is a browser download and local disk use.
- Considered alternative: bind IDE Extension Playwright 1.61.1 and the existing
  Chromium 1228 cache. Rejected because it would avoid a download at the cost of
  cross-project environment coupling.
- Considered alternative: defer and emit a blocked receipt. Rejected because it
  would stop generation-3 progress before browser evidence.
- Source of decision: user selected option 1 through Decision Gate.
- Timestamp: `2026-07-12T17:57:58Z`.
- Remaining decision blockers: none.
- Remaining execution gap: `GAP-CDSC3-009` stays open until SWU002 proves launch,
  structured DOM access, screenshot support, deterministic descriptors, and
  protected-source integrity.
- Reversibility: before SWU002 installs the runtime, a new Decision Gate may
  supersede this choice. After evidence records runtime digests, changing the
  runtime requires a new evidence generation rather than rewriting receipts.
