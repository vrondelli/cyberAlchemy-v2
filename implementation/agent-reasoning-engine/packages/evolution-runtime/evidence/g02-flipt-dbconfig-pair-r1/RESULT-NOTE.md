# G02 Flipt database-configuration matched development pair

The one-command source-only runner completed a matched ARE–DSH pair on Flipt Go task `09f45300` (separate database credential keys). Both predictions and costs were sealed before native scoring. Full receipts are at `/opt/are-benchmark-runs/g02-cross-layer-flipt-dbconfig-r1` on the GLM VPS; the `FREEZE.json`, `PAIR-PRE-SCORE-SEAL.json`, and `PAIR-DECISION.json` SHA-256 values are respectively `26284f0405ca788f8a99db4d5def6bceddbb41f57756dc223813b49e7c9597f7`, `0a17b79f963bb6ef0101dea54990af2c0f21e83c9973300ffde54f1ffe544682`, and `f4e2c576462219cb269c923ced291beb58f54f25f8f81d1812d37618fdbb7787`.

| Arm | Native Span-F1 | Native File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.41221 | 0.33333 | 76,679 | 119.01 |
| DSH | 0.35484 | 0.33333 | 218,115 | 227.11 |

ARE had higher Span-F1 and used about **64.8% fewer tokens** and **47.6% less time**. File-F1 tied, so the predeclared strict four-gate decision is **fail**, not pass. Both arms selected the same three files (`config/config.go`, `config/config_test.go`, `storage/db/db.go`); their span choices explain the quality difference. The gold spans nine files. ARE delivered two additional gold files (`cmd/flipt/flipt.go`, `storage/db/migrator.go`) but did not select them; the remaining gold files were not delivered. This is diagnosis after sealing, not a retrospective selector win.

The raw initial ARE packet was noisy, but later discovery recovered relevant config code. Native score SHA-256 anchors are `26ac830ca1d81372d7299a52820831b74fb6747f82d44aeeb016f29ce0c7f6c1` (ARE) and `4f472530ee8ae1f8a0c706aa47a833444c177c8a0f0c113796a3edd911ff15dd` (DSH). This row supports an accuracy/efficiency advantage on Span-F1 but does not satisfy the frozen file-quality gate or prove broad generalization.

## Open Questions

- Can a source-only finalization mechanism retain relevant delivered entrypoint/migration evidence without adding unrelated files?
- Do cross-repository quality and efficiency gains persist on other Flipt task types under the unchanged candidate?
