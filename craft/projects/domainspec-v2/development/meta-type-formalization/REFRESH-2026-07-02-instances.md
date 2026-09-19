---
node_type: refresh
is_session: false
status: applied — deltas I1–I7 applied to DEFINE/DESIGN/WORK-PACK/implementation-layering 2026-07-02
created: 2026-07-02
authored_by: invoke (mode=refresh)
target_artifact: meta-type-formalization package
note: Paths repo-root-relative from domainspec-core/. Adds machine-generated instance validation.
---

# Meta-Type Formalization — REFRESH REPORT (instances) (invoke mode=refresh)

## Source signals (typed)
- **S1 · owner-intent (2026-07-02):** "we didn't do the validator for the machine-generated files — it
  should create an instance of the schema in YAML, and it should be validated too."
- **S2 · session evidence:** `validate-content` validates only human-authored **markdown** aspect files.
  Nothing generates a machine-readable instance, and nothing validates generated files. The validators-as-moat
  DECISION (2026-07-02) classifies a structural instance validator as asset **#1 — PUBLIC, free authoring aid,
  moat-safe** (checks shape, never derivation) — so this is on the correct side of the line.

## Interpretation (claim ≤ proof)
**Taken:** the meta-type validation gains a **second surface — machine-generated instances**:
- **generate** — a YAML **instance** per concept (`<concept>.instance.yml`) conforming to its meta-type schema
  (the concept normalized to structured data: `meta_type`, `fields[]` with identity flag, `attributes{}`).
- **validate** — a validator checks each generated instance against its `.schema.yml` using the **same criterion
  rules**, so machine-generated files are validated too, not only the authored markdown.

**Fork to confirm — the instance SOURCE (new open decision DEF-D3):**
- **(A, taken)** extracted from an authored aspect file (markdown → YAML instance → validate) — a normalization
  so the machine form is validated; enables round-trip conformance.
- **(B)** a canonical example generated FROM each schema (schema → example instance → validate) — a self-test
  that every schema is instantiable.
- **(C)** both.

## Proposed + applied typed deltas
### DEFINE.md
- **I1 · revise · S1** — Scope "in scope" gains machine-generated instance validation.
- **I2 · add · S1** — Glossary gains `instance` + `instance validator`.
- **I3 · add · S1** — new open decision **DEF-D3** (instance source A/B/C) — taken A, flagged.

### DESIGN.md
- **I4 · add · S1/S2** — new **§8 Machine-generated instance validation** (instance YAML shape, generator,
  instance validator reusing the criterion rules, moat note = public structural #1).

### WORK-PACK.md
- **I5 · add · S1** — SWU manifest gains **MT-INST** (generate + validate instances).
- **I6 · add · S1** — MT-INST section (write scope / steps / acceptance / validation / verification + its test).

### implementation-layering.md
- **I7 · add · S1** — the instance layer joins promotion evidence (generated instances validate; round-trip).

## No-op assessment
Not a no-op: S1 adds a capability (instance generation + instance validation) the plan never had — only
authored-markdown validation exists today.

## Dispatch technique trace
`artifact_contract_bridge` (each delta binds the signal to a section/SWU) · `owner_boundary_check`
(validation-governance owns the instance validator; the generator NORMALIZES shape, it does not derive — no
δ-rules; validators-as-moat confirms this is public asset #1) · `concrete_path_evidence` (paths + reuse of
the existing `validate-content` criterion engine) · `residue_ledger` (DEF-D3 source + committed-vs-gitignored
instances are the open gaps). No full dispatch JSON — single-package refresh.

## Next route
**DEF-D3 RESOLVED 2026-07-02 → (B) example-from-schema.** task-session MT-INST **DONE**: `impl/tools/instances.ts`
(`generate` + `validate`) + `tools/tests/instances.test.ts`; 14 schemas → 14 validated example instances; a
mutated instance is rejected; `tools:test` 20/20; gate green. Public structural (moat-safe).
