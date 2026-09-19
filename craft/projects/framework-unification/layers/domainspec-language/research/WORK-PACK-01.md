# Work Pack 01 — Smallest Validateable DomainSpec Surface

Status: `draft` (not executed). Derived from `DESIGN-PACKAGE.md` §7 and §11.
Scope is deliberately Layer A (structural) only. No Layer B obligation
validation, no parser for a DSL, no Craft artifact mutation (handoff Non-Goals).

## Outcome

A deterministic structural validator that accepts/rejects a single `example`
document against a single leaf `schema`, proven on **one Craft fixture and one
non-Craft (dispatch) fixture plus one negative fixture** — the handoff's
"smallest validateable language surface" (steps 5–6).

## Hard precondition (gate)

- **G-1:** OD-1 (syntax strategy) ratified at a decision-gate. The work pack
  assumes the provisional recommendation (Option D: YAML-canonical). If the gate
  chooses otherwise, revise tasks T2–T5 before execution.
- Recommended also-ratify: OD-2 (`handoff` as profile), OD-3 (schema dialect).

## Tasks

| ID  | Task                                                                                                                                                                | Done when                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| T1  | Freeze the canonical envelope (DESIGN-PACKAGE §3) as `domainspec/v0.1/envelope.schema.yml`                                                                          | 9 required + 2 optional fields specified with types/enums; reviewed |
| T2  | Author `example` document spec: add `expect`, `targets`, `subject_contract`, `schema_ref`+`schema_version`                                                          | Spec covers positive + negative fixtures                            |
| T3  | Normalize **Craft** fixture: take `CRAFT-INTERFACE-EXAMPLE.yml` shape, wrap with the v0.1 envelope, `expect: pass` (copy, do NOT mutate the source)                 | Validates conceptually against its leaf schema                      |
| T4  | Normalize **non-Craft** fixture from `dispatch.schema.yml`, `expect: pass`                                                                                          | Proves genericity beyond Craft                                      |
| T5  | Author one **negative** fixture, `expect: fail`, `targets` a `block`-severity rule (closes blocker B-2)                                                             | A rule is provably tripped                                          |
| T6  | Implement the 7-step structural validator (DESIGN-PACKAGE §7): header → version pin → required fields → enums → patterns → reference integrity → assert vs `expect` | Deterministic; no obligation logic                                  |
| T7  | Run validator over T3/T4/T5 fixtures; record a `validation`/receipt record                                                                                          | 2 pass, 1 fail-as-expected                                          |
| T8  | Capture residue as iteration #1 seed: B-1 (`obligation_id`s), R-1 (prose rules), OD-3/OD-4/OD-5                                                                     | Residue file written                                                |

## Out of scope (this pass)

- Layer B / obligation / gate validation (blocked on B-1 `obligation_id`s).
- `extends` resolution and the custom `reference` type beyond simple integrity.
- `authority`/promotion enforcement (§8.3 P8).
- Any DSL grammar or projection (deferred by OD-1 Option D).
- Mutating Craft artifacts.

## Verification surface

- Validator is deterministic and reproducible on all three fixtures.
- Runs unchanged against a Craft and a non-Craft fixture (proves boundary §1).
- Negative fixture demonstrably trips a `block` rule (proves the validator can
  reject, not just accept).

## Blocked stop condition

Stop and escalate if: G-1 is not ratified; or T3/T4 reveal the v0.1 envelope
cannot wrap both corpora without Craft-specific fields (would reopen §3); or a
schema-dialect gap (OD-3) blocks structural checks on the dispatch fixture.
