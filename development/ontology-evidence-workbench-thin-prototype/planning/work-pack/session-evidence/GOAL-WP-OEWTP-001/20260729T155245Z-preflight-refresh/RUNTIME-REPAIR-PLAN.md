# Runtime Repair Plan for WP-OEWTP-001

Status: authorized by the direct user instruction on 2026-07-29 and executing.

## Outcome

Repair the two reusable runtime contracts that currently prevent the OEW work
pack from entering its first write:

1. Task Session must distinguish material writes admitted before execution from
   outputs produced by the declared validation run.
2. Invoke must require approval scope to equal the material target set, not
   merely contain it.

This is a shared protocol repair. It is not a TypeScript dependency repair and
does not require another `package.json`, package root, Playwright dependency, or
UI framework.

## Architecture

```text
exact controls + dependencies
        |
        | mirror at identical repo-relative paths
        v
isolated staging root
  + material target bytes
  + material package
  + exact-scope Invoke receipt
        |
        v
Task Session admission request
  materialWrites ----------> package targets / inventory / validatedPaths
  executionOutputs --------> validation-owned outputs, absent before apply
  allowedWrites ------------> exact disjoint union of both sets
        |
        v
admitted material apply
        |
        v
live validation produces declared executionOutputs
        |
        v
verify outputs -> write terminal Task Session receipt last
```

The Task Session receipt is evidence of admission. It is not authority to
invent new paths. The validation commands may create only the predeclared
`executionOutputs`.

## Canonical public Arcanum targets

### Task Session, owned through `sigil-development`

- `arcanum/arcana/task-session/SKILL.md`
- `arcanum/arcana/task-session/README.md`
- `arcanum/arcana/task-session/schemas/mutation-admission-request.schema.json`
- `arcanum/arcana/task-session/schemas/mutation-admission-receipt.schema.json`
- `arcanum/arcana/task-session/scripts/verify-mutation-readiness.py`
- `arcanum/arcana/task-session/development/fixtures/mutation-admission-cases.json`
- `arcanum/arcana/task-session/development/validate-mutation-admission.py`

Required behavior:

- routed and reusable requests carry `materialWrites`, `executionOutputs`, and
  `allowedWrites`;
- all lists are normalized, unique, repository-relative paths;
- `materialWrites` and `executionOutputs` are non-empty where the task declares
  each class and are always disjoint;
- their union equals `allowedWrites`;
- package change targets, package target inventory, and producer
  `validatedPaths` equal `materialWrites`;
- the admission receipt preserves all three normalized lists;
- no execution output is required to exist before material apply;
- live validation may create only declared execution outputs;
- every declared execution output is verified before the terminal receipt;
- the terminal Task Session receipt is written last.

Fixture additions:

- valid split scope admits;
- overlap blocks;
- union mismatch blocks;
- execution output included in the material package blocks;
- undeclared material target blocks;
- expanded full write scope still blocks;
- standalone non-mutating behavior remains unchanged.

### Invoke, owned through `spellcraft`

- `arcanum/spells/invoke/README.md`
- `arcanum/spells/invoke/refresh.md`
- `arcanum/spells/invoke/scripts/material_package_validator.py`
- `arcanum/spells/invoke/development/fixtures/material-package-cases.json`
- `arcanum/spells/invoke/development/run_material_package_fixtures.py`

Required behavior:

- normalize change targets, inventory targets, and approval scope;
- preserve the existing exact equality between change and inventory targets;
- additionally require approval scope to equal that same target set;
- reject both missing and extra approved paths;
- retain owner, authority, publication, dependency, mirror, path, digest, and
  validation gates.

Fixture addition:

- `approval-scope-extra` rejects with an exact-scope mismatch while all current
  cases retain their expected outcomes.

The material-package schema does not need a new field for this minimum repair.
The external OEW approval record is validated separately after materialization
so it can bind the completed material-package digest without a recursive
self-digest.

## Generated repository-local mirrors

After canonical validation passes, regenerate only from canonical Arcanum using
the bootstrap tool. Live owner validation proved that both repository Codex and
Claude surfaces are required. Expected content-bearing mirror changes are
limited to:

- `.agents/skills/task-session/SKILL.md`
- `.agents/skills/task-session/README.md`
- `.agents/skills/task-session/schemas/mutation-admission-request.schema.json`
- `.agents/skills/task-session/schemas/mutation-admission-receipt.schema.json`
- `.agents/skills/task-session/scripts/verify-mutation-readiness.py`
- `.agents/skills/invoke/SKILL.md`
- `.agents/skills/invoke/README.md`
- `.agents/skills/invoke/refresh.md`
- `.agents/skills/invoke/scripts/material_package_validator.py`
- `.claude/skills/task-session/SKILL.md`
- `.claude/skills/task-session/README.md`
- `.claude/skills/task-session/schemas/mutation-admission-request.schema.json`
- `.claude/skills/task-session/schemas/mutation-admission-receipt.schema.json`
- `.claude/skills/task-session/scripts/verify-mutation-readiness.py`
- `.claude/skills/invoke/SKILL.md`
- `.claude/skills/invoke/README.md`
- `.claude/skills/invoke/refresh.md`
- `.claude/skills/invoke/scripts/material_package_validator.py`

The bootstrap dry run must be inspected before regeneration. Any additional
generated delta blocks the route for review. Generated mirrors are never edited
directly.

## Validation sequence

1. Validate both changed JSON Schemas.
2. Run Task Session mutation-admission fixtures, including all new negative
   cases.
3. Run Invoke material-package fixtures, including the approval superset case.
4. Run the complete Task Session and Invoke validation fixture suites.
5. Run a cross-owner fixture proving that the same request admits material
   writes while reserving validation-owned outputs.
6. Dry-run and then regenerate the repository-local native skill mirrors.
7. Compare every listed mirror byte-for-byte with its canonical source.
8. Run scoped `git diff --check`.
9. Confirm no `package.json` or lockfile path changed.
10. Preserve public/private separation and run the parent `make bump-check`
    before any future commit or push.

## OEW planning follow-up after runtime repair

The obsolete nine-target planning patch is not applied. Invoke Refresh must
produce a replacement proposal that:

- mirrors controls and dependencies under the staging root at identical
  repository-relative paths;
- validates the external approval record with the actual JSON Schema;
- binds the approval to the replacement repair-check digest, every staged
  target digest, and the completed material-package digest;
- rejects symlinked staging ancestors using `lstat`;
- re-hashes all staged bytes after write;
- inventories exact material targets separately from exact post-apply
  Plan/Distill receipt outputs;
- uses the installed Refresh receipt fields;
- models validation-owned outputs between admitted apply and terminal receipt;
- marks old Plan/Distill receipts superseded and generates new digest-bound
  receipts after apply.

That replacement is separately validated before any OEW planning apply.

## Boundaries

- No new package manifest, lockfile, package root, or Playwright dependency.
- No write below the old
  `cyberAlchemy-v2/development/ontology-evidence-workbench/` package.
- No OEW planning or implementation mutation in this runtime-repair route.
- No subagent receives a code-mutation role; the parent executes the serial
  owner route after authorization and may use one read-only validation observer.
- No promotion, release, deployment, production, or ontology-correctness claim.

## Authorization gate

The user’s direct instruction to “just implement the thing” authorizes this
repair and continuation through the complete Goal, including the later OEW
planning apply and four serial SWUs. All declared scope, evidence, validation,
no-new-package, and old-development read-only gates still apply.
