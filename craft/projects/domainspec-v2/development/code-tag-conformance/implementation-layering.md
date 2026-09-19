---
node_type: implementation-layering
is_session: false
status: candidate
created: 2026-07-06
authored_by: invoke (mode: plan)
work_pack: ./WORK-PACK.md
design: ./DESIGN.md
target_artifact: projects/domainspec-v2/impl/governance/tags
---

# Code-Tag Conformance — Implementation Layering

**Layer-boundary heuristic:** each layer removes one class of non-conformance and stays green. Value = one
more way the code-tag layer matches the v2 pattern (root authority / machine schema / one gate); cost =
regression risk. **Promotion requires the previous layer green** (validator RC 0 + discriminating fixture),
never preference.

**Homing invariant (`DEC-DSV2-SPEC-HOMING`):** the code-tag tools read root authority directly; no
`impl/spec/*.md` projection is a source. R0 did this for relationships; L0 here does it for taxonomy.

| Layer | Slice | Minimum working unit | Promotion evidence (gate to next layer) |
| --- | --- | --- | --- |
| **L0 — consume root + clean state** | CT-1 taxonomy→root schemas · CT-3 waiver reset + v1 path fix | `validate-code-tags` reads the type set from the 14 meta-type `.schema.yml` files (not `spec/TAXONOMY.md`); waivers v2-clean; no `docs/features` residue | `tags:test` green from root taxonomy; flip a fixture concept type → still flagged; `validate`/`engine:test`/`typecheck` RC 0; **R2 landmine closed** (`spec/TAXONOMY.md` deletable without CT-VAL-001) |
| **L1 — contract as schema** | CT-2 `code-tag.schema.yml` (SCHEMA-CONSTITUTION) + shape validation | The tag contract is a machine schema; a malformed tag (missing `concept.id` / bad `concern`) is rejected against it; `CODE-TAG-SCHEMA.md` retained as companion pointer | pos/neg tag fixtures discriminate; `tags:test`/`validate` green; no moat leak (shape only) |
| **L2 — one gate** | CT-4 fold code-tag validation into `npm run validate` | `validate` runs the code-tag check (extract→validate over the corpus); no separate hand-added gate | `npm run validate` covers code-tags and stays RC 0; `tags:test` remains as the unit suite |

**Dependency order:** {CT-1, CT-3} → CT-2 → CT-4.  CT-1 and CT-3 are independent and both cheap.

**Cross-pack dependencies:** **CT-1 is a prerequisite of batch-1 R2** (TAXONOMY.md deletion). **CT-3 is the
code-tag half of `SWU-APE-004`.** CT-1's UI-type recognition rides on `GAP-SH-UI11-MIGRATE` (backend-14 works
today).

**Recomposition:** L0–L2 green ⇒ the code-tag subsystem is fully conformant (root authority, machine
contract, one gate) ⇒ the Batch-2 `code-tag` reformulation row (`IMPORT-MANIFEST.md`) closes.

**Layer risks / residue:** CT-2 risks ballooning into a `validate-code-tags` rewrite — bounded to
schema+shape-validation MVP (D-CT-3). CT-4 depends on a deterministic tag corpus; if only fixtures exist, it
wires the fixture check and records the residue (D-CT-4).
