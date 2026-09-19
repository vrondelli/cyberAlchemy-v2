# Context Pack — TS-001 validation-contract repair

Session evidence for `invoke:refresh`; authority effect is none.

- Target: `SWU-APE-ENUM-TS-001`
- Mode: direct-user `apply-approved`
- Source blocker: `DECISION_VALIDATION_CONTRACT_MISSING`
- Material targets: six exact planning/evidence files
- Product execution: excluded

## Obligations

1. Preserve the one-file TS-001 decision mutation boundary.
2. Define a closed JSON Schema for the future TypeScript representation decision.
3. Add a zero-dependency Node validator with exact input paths and deterministic output.
4. Bind the user's owned as-const protocol selection through an exact pre-execution profile-owner authorization.
5. Make the Work Pack, task, and SWU manifest name the schema, validator command, owner-review receipt, and current source inputs explicitly.
6. Keep the decision unmaterialized, the provider absent, the profile unactivated, and all authority/publication effects excluded.

## Selected evidence

| Source | Selector | Obligations |
| --- | --- | --- |
| `WORK-PACK.md` | Selection rule and nearest candidate | 1, 5, 6 |
| `TASK-APE-L1-ENUM-TYPESCRIPT.md` | `SWU-APE-ENUM-TS-001` | 1, 2, 3, 4, 5 |
| `work-pack/shared/SWU-MANIFEST.json` | `/swus/6` | 1, 3, 4, 5 |
| `instances/enum/receipts/SWU-APE-ONT-006.json` | candidate protocol and continuation | 2, 4, 6 |
| `ontology.json` | current authority-none ontology digest | 2, 3, 4 |
| `profiles/typescript-strict.profile.json` | Enum candidate protocol | 2, 3, 4, 6 |
| blocked chain preflight | stop reason and frontier | 3, 5 |

## Resolutions

- The owner authorization is a pre-execution input. It does not review nonexistent decision bytes, complete TS-001, or replace the later Task Session terminal receipt.
- Independent validation occurs after materialization through the deterministic validator and is preserved by the Task Session terminal receipt.
- The decision schema and validator are planning-owned validation infrastructure. They are not added to the TS-001 product write scope.
- The validator must verify live ontology, profile, dependency-receipt, schema, and owner-review digests before accepting a future decision.
- Distill is skipped because this is a narrow six-file validation-contract repair that preserves the existing SWU boundary.

## Exclusions

Runtime provider, TypeScript adapter, profile activation, fixtures, BTE, Python,
Rust, canonical definitions, Arcanum sources, publication, deployment, and
release are outside this refresh.

Strict coverage: pass.
