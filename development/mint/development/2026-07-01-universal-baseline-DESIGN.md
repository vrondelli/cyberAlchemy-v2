---
node_type: design
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: invoke (mode=design)
target_artifact: Mint (cyberAlchemy-v2/development/mint/) — the "Universal Governance Baseline" addition
target_owner_cycle: sigil-development lifecycle
consumes: development/research/2026-07-01-universal-baseline-partition/findings.md (frozen partition)
note: Paths repo-root-relative from domainspec-core/.
---

# Universal Governance Baseline — DESIGN

## Design decision
Add a **Universal Governance Baseline** to Mint's stage-2 emit: seed the 27 inherit-as-baseline
definitions + the 2 SPLIT formats as a baseline every minted repo carries, composed exactly like the
existing 2026-07-01 additions (new templates + EMIT-PROCEDURE steps + §7 self-checks). It does NOT
touch cav2's definitions; it seeds their FORMS (how any repo governs), never cav2's rows — so the
circularity guardrail holds by construction (all 12 re-fusion risks were localized in the partition).

## The two baseline shapes (the partition's load-bearing distinction)
| Shape | Meaning | Seeded as |
|---|---|---|
| **Rule-baseline** | "the domain's own actions must satisfy X" | a rule in a baseline constitution |
| **Primitive/format-baseline** | "a structure the domain fills / a vocabulary it uses" | a referenced primitive / an empty contract |
Seeding a format as if it were a satisfied rule is the failure mode (Popper's mild-D21 echo) — kept separate.

## Surface (decision: SPLIT into two files + one format; separate from the domain constitution)
1. **`baseline-constitution.md` → `authority/constitutions/<DOMAIN>-BASELINE-CONSTITUTION.md`** — the
   **rule-baselines** (D21 four-facet keystone, D16 typed-coupling, D18 residue-discipline, D23
   lifecycle-axis-separation, D24 provenance-first, D25 schema-amendment-witness, D26 append-only-ledger,
   D28 value-cycle-guard, D30 bounded-recursion-guard). Separate from `<DOMAIN>-CONSTITUTION.md` (which
   holds the 5 domain-authored meta-rules) so the universal baseline is visibly distinct and not editable-away.
2. **`baseline-primitives.md` → `authority/BASELINE-PRIMITIVES.md`** — the **vocabulary/primitive
   baselines** (D31 primitive-type, D32–D37 method/definition/authority/provenance/traceability/gate,
   D39 intent, D40 challenge-contract-protocol, D3 authority-layer, D7/D8 import, D10/D11 tower,
   D13 queue, D14 source-space, D17 reflection-tower, D20 craft-method). Each a reference to its cav2
   D-ID for provenance; the domain specializes locally. Integrates with the existing `DEFINITIONS-INDEX` (#8).
3. **`project-space-roles.md` → `authority/PROJECT-SPACE-ROLES.md`** — the D15 SPLIT format: each folder
   declares its authority role (empty format; localize cav2's folder list).
4. **D42 governed-artifact-tree — DEFERRED**: build decides fold-into-#3 or a thin interface checklist.

## Strip-bindings (3, baked into the templates)
- **D31** — substitute the literal `authority_scope=CAV2` / `owner=definitions-governance`
  (`DEFINITIONS.md:1986-1987`) with the domain's own scope/owner.
- **D11** — omit cav2's space enumeration; seed only the space-typing rule.
- **D40** — seed the 8-tuple challenge protocol; omit cav2's ontology NODE-MODEL consumers.

## Propose → owner-ratify gate (decision: the 27 are PROPOSED baseline)
The frozen partition is *candidate* (no per-definition owner ratified it). So the baseline set is emitted
**PROPOSED**, and the cav2/domain owner **ratifies** it — reusing the existing ratify-CLOSE machinery
(#11, `decision-mint-ratify.md`): the baseline set gets a `ratify`/`defer` verdict alongside the domain
kinds. No baseline governs before ratification (consistent with D49's own owner-gate). This keeps
claim ≤ proof: Mint proposes the universal baseline; the owner makes it live.

## Emit-logic composition
- **EMIT-PROCEDURE Step 13** — emit baseline-constitution + baseline-primitives (stage 2), PROPOSED.
- **EMIT-PROCEDURE Step 14** — emit project-space-roles (D15); D42 fold-or-seed per build decision.
- **Ratify** — the baseline set flows through stage-3 ratify-CLOSE (#11) with the kinds.
- **New §7 self-checks:** #11 four-facet — every emitted action-governing artifact declares the four
  facets (D21) or carries typed residue; #12 baseline-present — baseline-constitution carries all N
  rule-baselines + baseline-primitives references all M primitives; #13 baseline-no-leak — every baseline
  cites cav2 only as a provenance D-ID, never as a resolution path.

## Circularity reconciliation
All 12 re-fusion risks were localized in the partition (Russell's demotes). Every item that reaches a
baseline template is a FORM. The 3 strip-binding items carry cav2 instance-wiring that the templates
explicitly strip. So this addition cannot re-fuse the two System-5 levels — the guardrail is enforced
at the template level + self-check #13.

## Dispatch technique trace
- `artifact_contract_bridge` → baseline templates bind the frozen partition's D-IDs to seeded rules/primitives.
- `authority_split_gate` → propose (Mint) vs ratify (owner) on the baseline set.
- `owner_boundary_check` → invoke authors; sigil-development builds; owner ratifies.
- `residue_ledger` → D42 fold decision + the candidate→ratified status are the named open gaps.
- `concrete_path_evidence` → strip-bindings cite `DEFINITIONS.md:1986-1987`.
- Skipped full dispatch JSON → single addition to an owned capability; the partition dispatch already ran + closed.

## Next
→ [2026-07-01-universal-baseline-PLAN.md](./2026-07-01-universal-baseline-PLAN.md) (layering + work-pack + SWUs + validation).
