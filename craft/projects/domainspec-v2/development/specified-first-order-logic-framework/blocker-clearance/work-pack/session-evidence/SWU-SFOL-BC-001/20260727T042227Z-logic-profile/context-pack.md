# Task Session Context — SWU-SFOL-BC-001

Mode: standard, strict. Authority: session evidence only.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| BC001-O1 | Explicit profile admission for `body.logic` | task contract; compiler profile shape | covered |
| BC001-O2 | Released profile registry remains byte-identical | supported-profiles registry baseline digest | covered |
| BC001-O3 | Logic schema path and digest are bound | UI development-profile precedent; proposed SFOL profile | covered |
| BC001-O4 | Wrong profile/kind/version/schema/schema-digest fail distinctly | compiler error registry and focused tests | covered |
| BC001-O5 | Canonical structured value and source-byte bindings survive build/projection | compiler graph construction; source manifest; node-source projection | covered |
| BC001-O6 | Closeout can synchronize exact targets | blocker-clearance and parent work packs; closeout contract | covered |

## Selected context

- `blocker-clearance/WORK-PACK.md` — selected row, gate ledger, closeout contract.
- `blocker-clearance/tasks/TASK-SFOL-LOGIC-PROFILE.md` — exact task contract.
- `impl/tools/minted-project/compiler.ts` — profile and node admission surface.
- `impl/spec/ui-profile/minted-project-profile.json` — development-only
  profile precedent.
- `definitions/minted-project/supported-profiles.yml` — released registry
  baseline that must not change.
- `impl/test-derivation-engine/src/sfol/node-source/index.ts` — canonical
  projection contract.
- `closeouts/SWU-SFOL-010/INVOKE-REFRESH-RECEIPT.json` — dependency pass.

Strict coverage: pass, 6/6. No blocker decisions remain.
