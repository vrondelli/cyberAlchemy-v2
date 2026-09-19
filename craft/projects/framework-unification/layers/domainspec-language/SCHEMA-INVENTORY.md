# Schema Inventory — Phase 1 (DRAFT)

> Empirical floor for `domainspec-language`. Harvests the de-facto schemas that the
> `../domainspec` pipeline already emits at every node, finds the shared meta-shape,
> and proposes a single **node envelope** a validator can check.
>
> This is a thinking artifact, not a commitment. Every claim here is grounded in a
> real file under `../domainspec`; the open questions at the end are for the human.

## Locked decisions (from strategy session 2026-06-15)

- **Scope:** DomainSpec pipeline artifacts only. Arcanum sigils and Lean nodes are
  deferred to a later universal pass.
- **Target (rung 1):** **Validator** — read the artifacts the pipeline already writes
  and return pass/fail against the envelope. Not a DSL, not a type system yet.
- **Home:** this project (`projects/domainspec-language/`), private. `../domainspec`
  is the *evidence source*, not the build site.

## Why one envelope is even possible

The pipeline applies itself recursively (`../domainspec/TUNING-LOOP.md`): every stage
is the same process at a different altitude. Because every node is born of the same
process, every node shares a meta-shape. That recursion is the *proof* that one
envelope can govern ~15 artifacts instead of 15 ad-hoc schemas.

---

## A. Inventory table — what each node carries today

`carrier` = where the schema lives. `enforce` = how it is checked today:
`compiler` (won't build) · `parser` (machine-validated) · `script` (validator run) ·
`review` (human eye) · `none`.

| Stage / View | Output artifact | Schema carrier today | Has schema? | Enforce |
|---|---|---|---|---|
| Define (interview) | project-overview.md, initial-definitions.md, hypotheses.md, experiment-candidates.md | body sections + `Evidence Type` column | partial | review |
| Research | research.md + findings.md | frontmatter (`node_type: subagents-findings`) + fixed section order (R16) + verdict matrix | yes | review (R17 cite rule) |
| Discovery | discovery.md | mandatory sections + `Connections` block | yes | review |
| Specs | SPEC.md, architecture.md, glossary.md, aspect files | frontmatter + concept table + typed aspect rows | yes | review |
| Plan | execution plan + task list | prose + task list | **no** | none |
| Stories | STORIES.md | classic/BDD + coverage matrix | partial | review |
| Tests | TEST-SPEC.md | traceable derivation rows (source→obligation→type) | yes | review (claim ≤ proof) |
| Implement | code + code-tags.json + drift report | code contracts + tag schema | **no template** | script (tag drift) |
| Observability | observability.md | OTel decl format (O1–O16) | yes | review |
| OTel verify | OBSERVABILITY-REPORT.md | instrument classification table | yes | script |
| Infra | prometheus.yml, alerts/*.rules.yml | YAML config | yes | parser |
| Verify | PASS/FLAG/BLOCK verdict | verdict + details | no | script |
| Signals | pipeline-signals.jsonl | **Signal Envelope (JSON, typed)** | yes | parser |
| system-view | system-view.md | mandatory sections + stance→verdict table | yes | review |
| engineer-view | engineer-view.md | decision inventory table + residue ledger | yes | review |
| ontology-view | ontology-view.md | typed node/edge rows + forbidden-edge + residue ledger | yes | review/parser (by-type) |

**Two readings of this table:**

1. The strongest, already-machine-checked schemas are at the **ends**: the signal
   envelope (JSON, typed, parser-enforced) and the ontology-view by-type edges. The
   soft middle (plan, stories, define) is `review`/`none`. A validator buys the most
   where it is cheapest: the middle.
2. Two stages have **no schema at all** (`plan`, `implement`-as-prose). Those are the
   honest gaps, not the place to start — start where a shape exists to validate against.

---

## B. The recurring meta-shape (the envelope, grounded)

These fields recur across the artifacts above regardless of stage. Counts are
`grep` hits across `../domainspec` templates + skills.

| Envelope field | Surfaces today as… | Evidence |
|---|---|---|
| `intent` | Objective / Summary / Goal (≤2–3 sentences) | 19 files |
| `connections` | edges / derives-from / implements / Connections block | 25 files |
| `residue` | Open Questions + Residue ledger | 17 + 6 files |
| `epistemic_tag` | `Evidence Type` (observed\|stated\|hypothesized) · `veracidade`/`convicção` · `claim ≤ proof` | 23 files (veracidade) + pervasive |
| `identity` | node_type · version · status · last_updated | 37 files (lifecycle) |
| `body` (varies) | the stage-specific typed tables | per-stage |

**The load-bearing insight:** `epistemic_tag` shows up in **three different costumes**
(`Evidence Type`, `veracidade`, `claim ≤ proof`) that nobody has unified. Unifying
*that one field* is the highest-value move, and it is exactly the seam where
`cyber-alchemy-lean-fusion` plugs in: give the epistemic tag a **type**, and the
soft `review` enforcement becomes mechanical.

---

## C. Candidate node envelope (validator-first framing)

What a validator checks on **any** pipeline artifact. Stage-specific `body` is
delegated to a per-stage profile; the envelope is the universal part.

```yaml
# every pipeline node carries this, whatever its stage
node:
  identity:
    kind: <stage-artifact-type>        # discovery | findings | engineer-view | ...
    version: <semver>
    status: <draft|refined|gated|implemented|validated|promoted|blocked>
  intent: <=3 sentences                 # what this node pins down
  connections:                          # typed edges upstream/downstream
    - { to: <artifact-ref>, type: derives-from|cites|supersedes|implements }
  body: <stage-profile-ref>             # the typed tables specific to the stage
  residue:                              # open questions / preserved residue
    - { claim: <text>, status: open|closed, ref: <evidence> }
  epistemic:                            # the unified status tag (the key field)
    grade: observed|stated|hypothesized # de-facto enum already used in define stage
    proof: <ref-or-null>                # claim <= proof: null grade caps at 'stated'
```

Validator rung-1 checks (cheap, no new authoring required):
1. **Envelope presence** — every node has identity + intent + connections.
2. **Connection integrity** — every `connections.to` resolves to a real artifact.
3. **Residue honesty** — `status: closed` rows must carry a `ref`.
4. **Epistemic floor** — any `grade: observed` claim must carry a non-null `proof`
   (this is `claim ≤ proof` made checkable; the rung the Lean fusion later hardens).

---

## D. Collapse-test (the anti-"rename" proof)

Before building anything, prove the envelope is real on 3 artifacts that today have
*different* ad-hoc schemas:

- a `discovery.md` (section-discipline dialect)
- an `engineer-view.md` (decision-inventory + residue dialect)
- a research `findings.md` (frontmatter + verdict-matrix dialect)

Pass condition: all three map onto the **same** envelope (C) with only `body`
differing. If the envelope has to be tortured to fit any of them, it is a rename —
stop and rethink, do not ship the validator.

---

## E. Open questions for the human

1. **Epistemic enum.** Adopt the define-stage `observed|stated|hypothesized` as the
   canonical grade, or the vault `veracidade/convicção` pair? They are not the same
   shape (one enum vs. two graded axes). This choice sets what the validator enforces.
2. **`plan` and `implement` have no schema.** Bring them under the envelope now, or
   leave them out of rung 1 since there is nothing to validate against?
3. **Where does the validator run?** As a `../domainspec` skill it would couple the
   private language to the public-ish pipeline. As a tool here it stays private but
   must reach into `../domainspec` artifacts. (Boundary decision.)
4. **Does the collapse-test pass?** Not yet run — it is the gate before any code.
