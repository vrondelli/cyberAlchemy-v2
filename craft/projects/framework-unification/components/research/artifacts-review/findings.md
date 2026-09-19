---
tags: [framework-unification, artifacts, review, red-team, change-requests]
node_type: findings
is_session: false
layer: architecture
nature: reference
status: draft
created: 2026-06-16
dispatch_id: 2026-06-16-artifacts-catalog-review
dispatch_type: review
target: projects/framework-unification/components/ARTIFACTS.md
---

# Red-Team Findings — ARTIFACTS.md (Artifact Catalog)

Scope: `dispatch_type: review` of [../ARTIFACTS.md](../ARTIFACTS.md) (single artifact).
Three attackers (governance / mechanics / reference-integrity), two rounds each (initial +
robot-talks confrontation), then a writer synthesis and a two-corpus verifier pass
(literal-text + built-engine). **Every finding below survived independent verification.**
Taxonomy: CRITICAL = breaks system / contradicts governing law; MAJOR = functional gap /
drift / doc-vs-code mismatch / load-bearing omission; MINOR = wording / stale / fuzzy pointer.

## Findings — ARTIFACTS.md

| # | file:line | evidence (quoted) | severity | proposed fix |
|---|---|---|---|---|
| F1 | ARTIFACTS.md:78 | paired-views Producers `ontology-view / system-view / engineer-view`, Status `built` | **CRITICAL** | Split the row: keep `ontology-view` as the domainspec producer; mark `system-view`/`engineer-view` and the `paired-views` composite as Arcanum **tier-D** (repo-root) skills, or footnote that paired-views is produced by Arcanum, not the pipeline. |
| F2a | ARTIFACTS.md:87-88 | "The proposed **root of provenance**: every downstream artifact should trace back to it (invariant I2)." | **MAJOR** | Drop the "(invariant I2)" attribution; relabel single-root as a proposal under OQ-2. CONCEPT-MAP I2 is per-edge resolvability ("no dangling provenance"), not a single-root claim. |
| F2b | ARTIFACTS.md:73 | `problem-statement | — (none yet) | … | root | to-create` | **MAJOR** | The designated provenance root has no producer and does not exist, yet the table prints `root` as settled. Scope a minimal producer (OQ-2), or add an explicit I2 carve-out exempting `to-create` root nodes until built. |
| F3 | ARTIFACTS.md:71, :83 | `Node kind` column (`root/node/composite/leaf`); code cell `leaf (tagged)` — neither marked `(proposal)`, though :110 says the granularity rule is "proposed, not ratified (see OQ-1)" and the header convention (:18) is "Conventions proposed here are marked **(proposal)**." | **MINOR** | Add a note under the Tier-A table that node-kind values are proposed pending OQ-1/OQ-3. |
| F4 | ARTIFACTS.md:122, :125 | Producer cells name `domain-dictionary` (:122) and `backlog-pattern` (:125) — no skills of those names exist (`domainspec-feature-glossary`, co-listed, does exist). | **MINOR** | Mark the two as proposed/non-existent, or move to the existing "candidates, not resolved" note (:127-128). |
| F5 | ARTIFACTS.md:77 | `discovery` listed as a produced Tier-A row (Status `built`) | **MINOR** | Note that discovery is a pipeline **precondition** (Step 0 of `domainspec-pipeline`), produced out-of-band by `domainspec-discovery-writer`, not a pipeline output step. |
| F6 | ARTIFACTS.md:79 | `plan … built (no schema; often inline)` | **MINOR (note)** | No change required. SCHEMA-INVENTORY confirms plan has no schema (enforce:none); the cell self-qualifies. Honest soft-built. |
| F7 | ARTIFACTS.md:83 | `code … built` with `leaf (tagged)` | **MINOR (note)** | No change required. Internally honest (generated + tag-linked) and flagged by OQ-3. |

## Verdict: **FIX**

One CRITICAL (F1) + two MAJOR (F2a, F2b) survived verification. The decisive defect is the doc
committing the exact **tier-A / tier-D conflation** its own central thesis (:27-28, "mixing the
**product** (tier A) with the **engine** (tier D) is the single most common confusion") names as
the load-bearing error to avoid — plus an invariant **mis-citation** that dresses an unratified
proposal in I2's authority. The dominant pattern across all findings: *the catalog renders
unbuilt / proposed things (paired-view producers, the I2 provenance root, node kinds) in
built / settled typography.*

## Verification record

- **F1** — built-engine verifier: `implementation/domainspec/.claude/skills/` contains `ontology-view` only; repo-root `.claude/skills/` holds all four view skills; `domainspec-pipeline/SKILL.md` grep for the four views = 0 matches. Decision rule (downgrade if system-view/engineer-view found in submodule) **not triggered** → stays CRITICAL.
- **F2a** — literal-text verifier: CONCEPT-MAP:140 I2 = "Connection integrity — every `connections.to` resolves to a real artifact; no dangling provenance" — no single-root/convergence claim. Attribution genuinely unearned → SURVIVES.
- **F2b, F3, F4, F5, F6** — confirmed against literal text and/or engine (SCHEMA-INVENTORY:40 `Plan … no | none`; pipeline Step 0 = discovery check, Step 1 = Plan, Step 2 = Spec). All SURVIVE.

## Refuted attacks (closed — not change requests)

- **Route-3 "Spec→Plan vs plan-then-spec" contradiction** — REFUTED. The Tier-A table orders `plan` (:79, "pipeline Step 1") before `spec` (:80, input "discovery / plan"); the engine orders Plan (Step 1) before Spec (Step 2). No inversion in doc or engine.
- **OQ-5 cross-document collision** — REFUTED. CONCEPT-MAP uses OQ-A..E (no numeric OQ-5); its "closes discovery OQ-5" points at `discovery.md`'s namespace (submodule init), distinct from ARTIFACTS-OQ-5 (:188, plane-3 sufficiency). No in-document collision. *(Residual, out of target scope: the session file's unqualified "OQ-5" is sloppy.)*
- **Connections table** — SURVIVED. All four pointers (:209-212) resolve; rows hold.
- **"taxonomy-framing-unmarked"** — RETRACTED by its own author (the four-tier/three-plane cut is presented as the doc's analytical lens, not smuggled as external fact).

## Change requests (severity order)

1. **[CRITICAL] F1 (:78)** — split the paired-views row; credit `system-view`/`engineer-view`/`paired-views` to Arcanum tier-D, not the domainspec pipeline; correct or qualify "built".
2. **[MAJOR] F2a (:87-88)** — drop "(invariant I2)"; relabel the single-root claim as a proposal under OQ-2.
3. **[MAJOR] F2b (:73)** — give `problem-statement` a scoped producer, or add an I2 carve-out for `to-create` root nodes.
4. **[MINOR] F3 (:71, :83)** — mark node-kind values `(proposal)` pending OQ-1/OQ-3.
5. **[MINOR] F4 (:122, :125)** — mark `domain-dictionary` / `backlog-pattern` as non-existent/candidate producers.
6. **[MINOR] F5 (:77)** — note discovery is a Step-0 precondition, not a pipeline output.

## Connections

| Document | Type | Description |
|---|---|---|
| [../ARTIFACTS.md](../ARTIFACTS.md) | `reviews` | The target artifact under red-team review. |
| [attacks.md](attacks.md) | `derives-from` | Verbatim attacker + verifier returns this synthesis rests on. |
