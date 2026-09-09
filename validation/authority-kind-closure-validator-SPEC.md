# Spec: Authority-Kind Closure Validator (CANDIDATE — not built)

Status: candidate spec (design only; **promotion/build blocked by AUTHORITY-MODEL OQ-1**)
Owner route: sigil-development (tool lifecycle) + constitution-governance (the rule it enforces)
Enforces: [CAV2-D49 closed authority-kind enumeration](../authority/definitions/DEFINITIONS.md#cav2-d49-closed-authority-kind-enumeration) — the default-deny catch-all row in the [AUTHORITY-MODEL Authority Kinds table](../authority/AUTHORITY-MODEL.md#authority-kinds)
Rule-text of record: the superseded `CAV2-C16` draft in [source-clusters/authority-lifecycle.md](../authority/definitions/source-clusters/authority-lifecycle.md)
Decision: [2026-06-23 authority-kind closure catch-all row](../authority/decisions/2026-06-23-authority-kind-closure-catchall-row.md)

## Purpose

The deterministic half of closure enforcement. The catch-all row enacts `CAV2-D49`
in **review mode** today; this validator would add the **deterministic** half so the
rule becomes `hybrid`. It is **specified, not built** — see the Build Block.

## Checks

### Deterministic (low-risk presence lints — buildable once a kind-declaration convention is stable)

- **C-1 — closure declared.** The AUTHORITY-MODEL Authority Kinds table contains the
  default-deny catch-all row. (Guards against silent removal of the closure.)
- **C-2 — kinds live in their home.** Every `CAV2-D*` is in `DEFINITIONS.md`; every
  `CAV2-C*` in `STABLE-REPOSITORY-CONSTITUTION.md`; etc. — each enumerated kind's
  artifacts sit in its "Counts where" location.
- **C-3 — no authority artifact in a non-enumerated location** → flag.

### Review / OQ-1-gated (the genuinely hard, semantic part — NOT deterministic yet)

- **R-1 — unenumerated governing kind.** Detect a *new kind* that governs but is not
  a table row (the live OQ-2 case: `invariant`/`axiom`). This needs a **kind-declaration
  convention** that does not yet exist — so it stays **review** until the authority
  object schema stabilizes (OQ-1).

## Validation mode

`hybrid` — deterministic presence lints (C-1..C-3) + review (R-1). Today the
deterministic adapter is **none-yet**; closure runs review-mode via the catch-all row.

## Fixtures (for the experiment harness, when built)

- **pass:** an artifact of an enumerated kind in its home location; catch-all row present.
- **fail (C-1):** catch-all row missing from the table.
- **fail (C-3):** an authority-bearing artifact in a non-enumerated location.
- **review-flag (R-1):** `invariant`/`axiom` governing while absent from the kind table (today's real case).

## Observability

`.arcanum/observability/` exists — on each run emit: kinds checked, artifacts scanned,
C-1/C-2/C-3 pass/fail, R-1 review flags, and the closure-row presence result.

## Build Block (claim ≤ proof)

**Do not build or promote this validator yet.** AUTHORITY-MODEL **OQ-1**: write the
deterministic check only *after* the authority object schema and promotion records
are stable, to avoid freezing the wrong shape. cav2's `validation/` and `specs/`
surfaces are still stubs, confirming the schema is not yet stable. Sequence:

1. stabilize the authority object schema + a kind-declaration convention (unblocks R-1);
2. build C-1..C-3 (cheap presence lints) first, behind a harness with the fixtures above;
3. add R-1 once the convention exists; then constitution-governance flips the closure
   rule's mode from review to `hybrid` and cites this validator.

Until then: closure enforcement is **review-mode**, and this spec is the design of record.
