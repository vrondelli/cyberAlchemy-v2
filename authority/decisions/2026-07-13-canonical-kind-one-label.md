# Decision: `canonical_kind` is the one label. `node_type` is its old name.

Status: accepted
Date: 2026-07-13
Owner: repository owner (Boscaro)
Route: decision-gate
Governed object: the document-type label carried by every artifact
Authority kind: Decision (`CAV2-D49`)

## Question

`cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md` enumerates `canonical_kind`.
`implementation/domainspec/vault/ontology-conventions.md` (`status: consolidated`,
v2.3.0) enumerates `node_type` and calls it "Document Role". Are these **one label
under two names**, or **two orthogonal labels** (a schema-type and a role)?

The two enumerations share only 6 of 27 distinct values, so the question is not
cosmetic — it decides whether an artifact carries one type or two.

## Decision

**One label. Its name is `canonical_kind`** — chosen over `node_type` because it is
more explicit about what it names: the *kind* the artifact is, drawn from a governed
enumeration.

`node_type` is hereby the **old name of the same field**. It is not a second axis.

### What this overturns

A prior claim in `CANONICAL-KINDS.md` — *"A canonical kind names a schema, not a role
… The two are orthogonal (`CAV2-D22`)"* — is **false** and is removed by this decision.
So is `OQ-7`, which was self-authored, self-closed within one session, and rested
entirely on that orthogonality. Both were written by an agent (2026-07-09) without an
owner gate, and both are struck.

The consolidated vault constitution's section heading *"`node_type` — Document Role"*
is **superseded as to the label's name and cardinality**, not as to its content: what
that file calls a role, this decision calls the kind. The vault catalog's *edges* are
untouched and remain authoritative (see `## Not decided here`).

## The enumeration (22 values)

The 17 already in `CANONICAL-KINDS.md`:

`discovery` · `research` · `session` · `ledger` · `axiom` · `definition` ·
`constitution` · `decision` · `spec` · `discipline` · `runtime contract` ·
`projection` · `residue` · `premise` · `invariant` · `review` · `handoff`

Plus 5 admitted from the vault's `node_type` list:

`implementation-plan` · `audit` · `conceptual` · `backlog` · `readme`

**Not admitted:** `test`, `discussion`, `domainspec-subagents-strategy`,
`subagents-research`, `subagents-findings`. (`test` is presently carried by one session
file — see the residue below.)

### Sessions

A session record's `canonical_kind` is **`session`** — not the role it played. A session
that did audit work is a `session`, not an `audit`. What a session *did* is expressed as
**edges leaving it**, not as its type. `session` is therefore a kind that is used, not an
orphan row.

## Scope: forward-looking. Nothing is migrated.

This decision **defines**; it does not rewrite the corpus.

The 37 files in `sessions/` keep their existing `node_type: discovery | conceptual |
audit | constitution | implementation-plan | test` frontmatter, and `close-session`
keeps writing it. They are **not** re-typed. `.arcanum/`, `projects/`, and the vault are
untouched.

## Known, accepted gap (recorded per `CAV2-D38`)

**The corpus does not conform to this enumeration, and is not required to.** Concretely:

- No file in the repository carries a `canonical_kind:` field. Zero. The field is
  defined and unused.
- All 37 session records declare a role-value (`discovery`, `audit`, …) where this
  decision would put `session`.
- One session file carries `test`, which is not an admitted value.

These are **not defects to fix**. They are the expected consequence of deciding without
migrating, and they are written here so that no later reader mistakes the enumeration
for a description of the repository. Whether the corpus is ever migrated is a separate
decision, not taken here.

## Not decided here

- **The edge catalog.** `implementation/domainspec/vault/ontology-conventions.md`
  (consolidated, v2.3.0) owns a 22-edge catalog with typed endpoints, inverses, and a
  deprecation table. `CANONICAL-KINDS.md`'s `## Edges` section forks it — reviving six
  edges the catalog explicitly retired and omitting `creates`/`created-by`. That
  collision is **open** and is not touched by this decision.
- **`process_origin`.** The vault already carries a producer edge — `creates` /
  `created-by` (session → any, *"A produced B as output"*) — and an inputs edge —
  `derives-from` (*"the new artifact declares `derives-from` toward its sources"*).
  Whether `process_origin` should be wired to `created-by` or retired is open
  (`CA-OQ-2` on `CAV2-D51`).
- **`residue`.** It is an enumerated canonical kind with no producer. Owner-parked.
- **`CAV2-D51`'s formal clause.** `origin(a) = process(kind(a))` calls `process(·)`,
  which has had no definition in the spine since the `CAV2-D56` retraction (2026-07-09).
  The clause is not false — it is **not truth-evaluable**. Open.

## Evidence

- Enumeration counts: vault `node_type` = 16 values; `CANONICAL-KINDS` = 17 rows;
  intersection = 6 (`discovery`, `research`, `axiom`, `premise`, `constitution`, `spec`).
- Corpus: `grep -rl "^canonical_kind:"` → zero files. `grep -h "^node_type:" sessions/*.md`
  → `discovery` 17, `conceptual` 8, `audit` 7, `constitution` 3, `test` 1,
  `implementation-plan` 1 (n = 37).
- Review: [reviews/2026-07-09-post-correction-audit/findings.md](../definitions/reviews/2026-07-09-post-correction-audit/findings.md)
  — five subagents; the verifier dropped three attacker findings precisely *because* this
  ruling existed nowhere in writing. This record closes that hole.

## Consumers

- [../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md) — the enumeration
- [../definitions/DEFINITIONS.md](../definitions/DEFINITIONS.md) — `CAV2-D51` canonical artifact
- [../definitions/DEFINITION-DRIFT-AUDIT.md](../definitions/DEFINITION-DRIFT-AUDIT.md)
