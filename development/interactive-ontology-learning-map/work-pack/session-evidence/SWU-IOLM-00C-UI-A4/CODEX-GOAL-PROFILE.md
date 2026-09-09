# Codex Goal Profile — SWU-IOLM-00C-UI-A4

## Codex Goal Profile Result

- Selected unit: `SWU-IOLM-00C-UI-A4`
- Readiness: `pass`
- Goal budget: `4000 characters; pass`
- Capability policy: Task Session owns A4 evidence; Playwright CLI drives real Firefox; A4 cannot edit A1–A3 implementation
- Strict coverage: `pass`, 12/12
- Native Goal:

```text
/goal Execute only SWU-IOLM-00C-UI-A4 against the passing iolm-interactive-viewer/v1 chain. Use the bundled Playwright CLI wrapper with named session iolm-a4 and --browser firefox against the validated 127.0.0.1 server. Run exact PW-BB-01 through PW-BB-10 in order, snapshot before element refs and after material changes, and retain snapshots, screenshots, network, console and assertion evidence under the A4 lifecycle output path. Write only MANUAL-CHECKS.md, one generated run result set, and A4 lifecycle evidence. Preserve every unperformed human check as NOT_RUN and apply exact aggregation precedence. Rerun all deterministic suites only after a complete automated browser pass. On any implementation defect, stop immediately, write a typed defect receipt to its A1/A2/A3 owner, do not modify implementation, and do not emit iolm-browser-acceptance/v1. Preserve the complete six-value exclusion fence and never claim accessibility, usability, authority, compiler support, promotion or publication.
```

- Current stop: `PW-BB-04` exposed `B-IOLM-A3-FIREFOX-EVENT-TARGET`; route to A3 and retain A4 `FAIL/BLOCK` evidence.
