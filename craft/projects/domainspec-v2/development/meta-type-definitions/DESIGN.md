---
node_type: design
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: design)
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
target_artifact: meta-type definitions
promotion_boundary: PUBLIC vocabulary; canonical definitions cite public `.schema.yml`, never the δ-rules (moat).
---

# Design — Meta-Type Definitions

## 1. Tiering (what deserves a canonical definition)
| Tier | Terms | Canonical? | Scheme / home | Owner route |
| --- | --- | --- | --- | --- |
| **1** | 25 meta-types + edge verbs | yes — 14 backend now (criterion exists); 11 UI descriptive; edge verbs/signatures promoted from R3A | `DS-D1` / `DS-D2` / `DS-D8` in **root `definitions/DEFINITIONS.md`** (`#ds-d1-meta-type-system`), NOT impl/ — DD-D3 resolved | definitions-governance (R7 redirected here) |
| **2** | method/framework terms (8) | yes | `domainspec-v2-D6+` in `definitions/DEFINITIONS.md` | **definitions-governance** |
| **3** | criterion rule kinds (7) + declared-attribute keys (8) | no — **document**, not define | a schema-format reference (`meta-types/README.md` or SCHEMA-CONSTITUTION-local) | layering-governance |

## 2. Card format (3-voice; matches `definitions/DEFINITIONS.md`)
Each promoted definition carries: Source kind / Evidence / Formal voice / Plain-language voice / Domain-context
voice / Use carefully / Misuse warning / Promotion boundary — the same shape as `domainspec-v2-D1..D5`.

## 3. Meta-type definition ↔ schema (Tier 1)
A meta-type's canonical definition and its `.schema.yml` are **companions**: the schema is the machine criterion,
the definition is the 3-voice human authority that **cites** it. The DS-D1 card's Formal voice restates the
criterion in prose; Evidence links the `.schema.yml` + the TAXONOMY entry. One source of truth (the schema) +
a governed definition — no drift, because the card points at the schema rather than re-encoding it.

## 4. Approval flow (candidate → canonical)
`CANDIDATES.md` (proposed, tiered) → **owner approves per item/tier** → the owner route promotes (R7 for Tier 1;
definitions-governance for Tier 2; schema-format reference for Tier 3) → `DEFINITIONS-INDEX` row + `DEFINITION-DRIFT-AUDIT`
reconciled. **No auto-promotion** (definitions-governance: candidate promotion is never automatic).

## 5. Index + drift-audit
Each promoted card gets a `DEFINITIONS-INDEX.md` row and is reconciled by `DEFINITION-DRIFT-AUDIT.md` (already
backfilled to the mint baseline). The prior governance-card gap (layering/drift governance,
`GAP-DSV2-GOVERNANCE-CARDS`) is now closed by `domainspec-v2-D16` and `domainspec-v2-D17`; the cards remain
adjacent work, not part of this package's meta-type-definition scope.

## 6. Coordination with R7 + meta-type-formalization (no duplication)
Tier 1 **is** R7's DS-D1/D2 content — now concrete because the criteria exist. The DS-D1 cards land in **root
`definitions/DEFINITIONS.md`** (DD-D3), citing the `impl/spec/meta-types/*.schema.yml` machine files; **R7 is
redirected** from its old `impl/spec/DEFINITIONS.md` home to point the spec at root `definitions/`. Edge verbs
(DS-D2) and relationship signatures (DS-D8) now consume **R3A** root relationship authority
(`definitions/relationships/relationships.yml`) and have been promoted by definitions-governance. This package
still owns candidate review for remaining terms; the owner (you) approves each before definitions-governance
writes them.

## 7. Views coverage
Context (§1 tiering) · Structure (§2 card format) · Data ([CANDIDATES.md](./CANDIDATES.md)) · Behavior (§4
approval flow) · Alternatives (DD-D1/D2/D3) · Boundary (§3/§6 — cards cite schemas, never the δ-rules).
