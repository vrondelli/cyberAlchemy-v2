# IOLM Workable Example — Manual Browser Protocol

These checks require named human runners and cannot be satisfied by Node,
Playwright, screenshots, DOM assertions, or this document. The current run
stopped on an automated Firefox implementation defect before any manual check.

| ID | Required human protocol | Current state |
| --- | --- | --- |
| `MANUAL-01` | Keyboard-only journey from question to relation, provenance inspector, and all three lenses, with visible focus and stable selection | `NOT_RUN` |
| `MANUAL-02` | Verify focus order, persistence through lens changes, and absence of keyboard traps | `NOT_RUN` |
| `MANUAL-03` | Named Firefox/reduced-motion run proving no essential information depends on animation | `NOT_RUN` |
| `MANUAL-04` | Human comparison of rendered 4/3 and 2/1 identity/count parity across graph, outline, and table | `NOT_RUN` |
| `MANUAL-05` | Visual semantics audit proving posture, direction/class, selection, validation, and failure states remain legible without color | `NOT_RUN` |

To change a state, record the runner, date, Firefox version, assistive-technology
pairing where applicable, protocol steps, raw observations, and evidence paths.
Automation must never update these rows to `PASS`.
