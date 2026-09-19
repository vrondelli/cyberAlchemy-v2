# Ledger-close governance sidecar receipt

- Status: diagnosed; parent retry authorized by unchanged accepted bytes.
- Root cause: the non-interactive shell did not resolve `node` (`command -v node` exited 1), so the append-only close appender never started and the failed command exited 127.
- Affected invariant: the dispatch remains open until exactly one valid close row is appended. The failed attempt changed no ledger bytes.
- Minimal repair: invoke `/home/vrondelli/.nvm/versions/node/v22.13.0/bin/node implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/append-dispatch.cjs .register-dispatch.tmp.json`.
- Staged close-record SHA-256: `e79272e533c11ad6f321e7e8210edb4f867739f2772c87f438d09679b10efd96`.
- Appender SHA-256: `31b6f081604121166548bcc0db80830e0df7256467ea59f2bdfc330c539dea52`.
- Node binary: `/home/vrondelli/.nvm/versions/node/v22.13.0/bin/node`, version `v22.13.0`, SHA-256 `af8d5d1e234beb26b3095e6bebf80edc781f79c9435553a383037eccec2716f8`.
- Sidecar changed-byte inventory: none.
- Required revalidation: preserve retry exit status; require exit 0 and the expected close receipt; verify exactly one close row, its staged payload, and the ledger/native-event structural validations.
- Renewed owner acceptance: not required while the staged record, appender, and accepted evidence bytes remain unchanged.
- Permanent regression proposal: preflight and record the absolute Node path/version before the close edge, and add a no-`node`-in-`PATH` regression that fails before mutation while preserving the nonzero status.
- Authority ceiling: diagnosis and repair proposal only; the sidecar did not append, promote, publish, commit, push, or touch product/canonical/public bytes.
