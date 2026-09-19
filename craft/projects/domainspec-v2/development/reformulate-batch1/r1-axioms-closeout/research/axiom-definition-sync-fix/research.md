# R1 Axiom Definition-Sync Research

Dispatch: `2026-07-09-r1-axiom-definition-sync-fix-research`

This file is the strategist-appended transcript of explorer returns.

## Agent 1 - Tarski, Alfred

**Findings**
- `CAV2-D53 axiom` in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3572) is a world/domain truth held as given, with fan-out into premises, invariants, and constitution rules. It must not be a system must-hold.
- `CAV2-D54 invariant` in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3675) is a checkable must-hold on system behavior/artifacts. `CAV2-D49` is explicitly one of these invariants.
- `CAV2-D49 closed authority-kind enumeration` in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3247) means `axiom` and `invariant` are not current authority kinds. Per [AUTHORITY-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48), they govern as `Definition` unless an owner-gated table amendment adds them.
- There is a live ID hygiene issue: `CAV2-D53/D54` cite `CAV2-D34` as constitution, but current `CAV2-D34` is `Authority` in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2171). Do not encode `CAV2-D34 = constitution` into DomainSpec tests without an upstream correction.

**Acceptance Tests**
1. A DomainSpec axiom entry passes only if its proposition is about the world/domain, is held true, is not derived inside the system, and has fan-out to a family of downstream premises/invariants/constitution rules. Cite `CAV2-D53`.
2. Any statement of the form "the system/artifact/process must..." fails as an axiom unless rewritten as a derived invariant. Cite `CAV2-D54`.
3. Any checkable breach condition whose violation is drift/defect must be typed as invariant, not axiom. Cite `CAV2-D54`.
4. Constitution material must appear only as downstream operationalization: scoped rules/selectors/validation modes/precedence are not axiom content. Cite `CAV2-D53`, `CAV2-D54`, and [AUTHORITY-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:110), not `CAV2-D34` until fixed.
5. Validator/gate material must not be embedded as axiom semantics. Pass/flag/block/defer, criteria, evidence requirements, and record effects belong to `CAV2-D37 gate`, not axiom. Cite [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2364).
6. Definition material must not be smuggled into AXIOMS. Term-meaning changes route through `CAV2-D33 definition` / definitions-governance. Cite [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2103).
7. YAML authority metadata must not use `authority_kind: axiom` or `authority_kind: invariant` under current CAV2. Use `Definition` / `kind.definition` rollup unless DomainSpec has an explicit owner-gated amendment. Cite `CAV2-D49` and [AUTHORITY-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:63).
8. `ontology/AUTHORITY-KINDS.md` is candidate routing support, not the deciding authority surface; do not use it to override the active authority model. Cite [AUTHORITY-KINDS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md:1) and [SOURCE-MAP.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/SOURCE-MAP.md:29).

**Repair Implications**
- Minimal repair is classification cleanup, not broad R1 closeout editing.
- Keep true axioms in `projects/domainspec-v2/authority/AXIOMS.{md,yml}` as foundational "why" propositions.
- Move or relabel system must-holds as derived invariants, with upward axiom trace and downward validation/constitution trace.
- Separate `canonical_kind: axiom` from `authority_kind: Definition`; do not invent a first-class authority kind.
- Add fan-out/trace fields only where needed to prove `CAV2-D53` alignment.

**Open Decision Needs**
- Upstream CAV2 must resolve the `CAV2-D34` constitution citation mismatch.
- Owner decision needed before `axiom` or `invariant` can become first-class authority kinds.
- If DomainSpec wants prescriptive axioms, that waits on `AX-OQ-1`; current repair should assume descriptive-primary axioms.

## Agent 2 - van Lamsweerde, Axel

**Patch Targets**

- [AXIOMS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.md:7): add a short "CAV2 definition alignment" note. Say the file name is R1 continuity, not a claim that `axiom` is a first-class authority kind; A1-A3 are local governing propositions whose normative parts are mostly `CAV2-D54` invariant-shaped.
- [AXIOMS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.md:22): prefer renaming the section/table language from "Retained Axioms" to "Retained Governing Propositions" or "Retained R1 Basis". Keep headings/anchors unless you also update constitution links.
- [AXIOMS.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.yml:2): rename ambiguous `authority: authority/axioms` to `authority_surface` or `canonical_surface`. Add explicit `authority_kind_rollup: Definition`; do not add `authority_kind: axiom` or `authority_kind: invariant`.
- [AXIOMS.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.yml:14): preferred rename is `retained_axioms` -> `retained_governing_propositions`. Compatibility option: keep `retained_axioms` and add `cav2_shape` per entry.
- [domainspec-v2-CONSTITUTION.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:86): only update the A2 link text/anchor if AXIOMS headings change. Constitution owns operational rules, not CAV2 term definitions.
- [source-spine.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/source-spine.md:15): keep `authority/AXIOMS.{md,yml}` as primary DomainSpec source, but describe it as R1 governing proposition/invariant-basis material. Preserve CAV2 as supporting precedent, not v2 authority.

**Recommended Field Shape**

```yaml
canonical_surface: authority/AXIOMS.{md,yml}
authority_kind_rollup: Definition
cav2_alignment:
  source_kind: supporting-source
  definition_refs:
    axiom: CAV2-D53
    invariant: CAV2-D54
    authority_kind_closure: CAV2-D49
  first_class_axiom_or_invariant_authority_kind: false

retained_governing_propositions:
  - id: A2
    label: Decisions Belong To The Domain, Not Adapters
    local_role: r1_authority_basis
    cav2_shape:
      primary: invariant
      reason: system/artifact behavior can violate it; breach is drift/defect
    authority_kind_rollup: Definition
```

For A1/A2, optional `grounding_axiom_statement` is acceptable if the owner wants to preserve a true "why" layer. A3 should be treated as invariant-shaped unless rewritten into a broader domain truth plus derived invariant.

**Update List**

- Required for minimal repair: `AXIOMS.md`, `AXIOMS.yml`.
- Conditional: constitution A2 link if heading anchors change.
- Conditional: `source-spine.md` and README-style references if prose says "axioms" in a way that now implies CAV2-D53.
- Historical R1 closeout evidence should not be rewritten as if the earlier closeout meant this distinction. Add a small follow-up receipt for the definition-sync repair instead.
- Do not edit Saturn routing, do not move these into `definitions/`, and do not split out a new `INVARIANTS.yml` unless an owner explicitly expands scope.

**Validation Risks**

- Current state is green: `AXIOMS.yml` parses and `npm --prefix projects/domainspec-v2/impl run validate` passes.
- There is no dedicated `AXIOMS.yml` schema consumer, so field drift is mostly review-detected today.
- Biggest risk: adding `authority_kind: axiom` or `authority_kind: invariant` violates the CAV2-D49 closure posture, since those are not first-class authority kinds yet.
- Second risk: heading renames break the constitution's A2 anchor.
- Best post-patch checks: YAML parse, `npm --prefix projects/domainspec-v2/impl run validate`, `git diff --check` on touched files, and an `rg` check for forbidden `authority_kind: axiom|invariant`.

## Agent 3 - Simon, Herbert

**Simon / Herbert Result**

**Minimal Route**
Repair inside the existing R1 closeout stream, preferably as the first step of `SWU-R1A-002`, not as a new redesign. Keep `AXIOMS.{md,yml}` in place, preserve A1/A2/A3 and routed A4/A5/A6, but add a small CAV2-alignment layer.

The key repair is semantic classification: current A1/A2/A3 are written mostly as `CAV2-D54` invariant-shaped governance constraints, not clean `CAV2-D53` axioms. They can keep historical `A*` IDs, but the files should stop implying that every row is a pure CAV2 axiom unless each row states its CAV2 role.

Also clean the YAML kind posture: [AXIOMS.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.yml:2) currently says `authority: authority/axioms`, which reads too much like minting an unenumerated authority kind. Under `CAV2-D49`, `axiom`/`invariant` are not yet first-class authority kinds; unenumerated kinds default-deny, and existing invariant/axiom vocabulary currently routes through existing authority governance, not a new kind.

**Decision Needs**
No new decision is needed if the repair only:
- clarifies CAV2-D53 vs CAV2-D54 role per retained row;
- renames or explains `authority: authority/axioms` as an authority surface, not an authority kind;
- preserves R1 scope and the existing SWU receipt.

A new decision is required if anyone wants to:
- add `axiom` or `invariant` as a first-class authority kind;
- change A1/A2/A3 substance or the Saturn routing split;
- move AXIOMS into definitions;
- alter A2/C6 constitution meaning.

**Sequencing**
1. Patch only [AXIOMS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.md:12) and [AXIOMS.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/AXIOMS.yml:14).
2. Add a CAV2 alignment note: historical R1 "axiom" IDs are retained, but rows must declare whether they are axiom-shaped or invariant-shaped.
3. In YAML, avoid any unenumerated `authority_kind: axiom` / `kind.axiom` claim; represent `authority/AXIOMS.{md,yml}` as the local authority surface.
4. Then run `SWU-R1A-002` parent sync: manifest, Craft ledger, CRAFT human view.
5. Do not touch R2, R5, R6a/R6b, engine rules, or Saturn authority.

**Closeout Validation Criteria**
Before R1 closes:
- YAML parses.
- No unenumerated authority-kind value is introduced.
- Each retained row passes the CAV2 subject test: world/domain truth for `CAV2-D53`, system must-hold constraint for `CAV2-D54`.
- A1/A2/A3 remain retained; A4/A6 and A5-reflection remain routed pointers.
- `impl/spec/AXIOMS.md` remains absent or non-authority.
- Existing gates from [WORK-PACK.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/reformulate-batch1/r1-axioms-closeout/WORK-PACK.md:113) pass: `validate`, `tags:test`, `engine:test`, `typecheck`.
- Parent sync records R1 closed or names any remaining residue without closing R5/R6a by accident.
