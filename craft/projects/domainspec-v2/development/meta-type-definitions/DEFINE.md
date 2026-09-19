---
node_type: define
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: define)
target_artifact: meta-type definitions — promote the vocabulary used in the meta-type formalization to real, tracked definitions
scope: projects/domainspec-v2 (definitions surface)
owner_route: definitions-governance (canonical definitions) + batch-1 R7 (DS-D1/D2 domain vocab) + layering-governance (schema-format vocab)
source_contracts:
  - development/meta-type-formalization/ (DEFINE / DESIGN / WORK-PACK + REFRESH reports)
  - impl/spec/meta-types/**/*.schema.yml (the 14 formalized meta-types + their criteria)
  - impl/spec/TAXONOMY.md (the 25 meta-types, incl. UI-11)
  - definitions/DEFINITIONS.md (existing domainspec-v2-D1..D5 + the 3-voice card format)
promotion_boundary: PUBLIC vocabulary; NO canonical definition is promoted without owner approval — the candidate list gates it.
---

# Define — Meta-Type Definitions

## Intent
The meta-type formalization introduced and used a body of vocabulary — the 25 meta-types (14 now with formal
criteria), the validation-method terms, the schema-format vocabulary — that today lives only inside the package
and the `.schema.yml` files. Promote the **load-bearing** terms to **real, tracked definitions** in the
canonical surface: each with a stable ID, three voices, and (for meta-types) a pointer to its `.schema.yml`
criterion — so the vocabulary is authoritative, discoverable, and drift-audited.

**Nothing is promoted without owner approval.** This package's deliverable is a **candidate list**
([CANDIDATES.md](./CANDIDATES.md)) the owner approves per item/tier; only then does each term's owner route
write the canonical card.

## The gap
`definitions/DEFINITIONS.md` holds `domainspec-v2-D1..D5` (drift / validation-governance / edge-law /
executable-typed-graph / two-plane). The meta-type vocabulary — `Entity`/`Rule`/…, "formal criterion",
"content validator", "instance", the criterion rule kinds — is used everywhere but **defined nowhere
canonical**. The drift audit already flags load-bearing terms with no card as defects; this closes that class
for the meta-type surface.

## Scope — three tiers (the candidate list details each)
- **Tier 1 — domain meta-types (DS-D1) + edge verbs (DS-D2).** The 25 concept types; the 14 backend now carry a
  formal criterion (their schema), the 11 UI are descriptive-only (criterion deferred). Owner route: **batch-1
  R7** into root `definitions/DEFINITIONS.md` + `definitions/DEFINITIONS-INDEX.md`; implementation schemas are
  cited evidence, not definition authority.
- **Tier 2 — method/framework terms.** meta-type, category, formal criterion, edge-participation signature,
  content validator, instance, instance validator, aspect file, Concept Registry. Owner route:
  **definitions-governance**, root `definitions/DEFINITIONS.md` (`domainspec-v2-D6+`).
- **Tier 3 — schema-format / implementation vocabulary.** The 7 criterion rule kinds + the declared-attribute
  keys. Recommendation: **document in a schema-format reference, NOT as canonical definitions** (internal
  validator vocab) — still listed for approval so the owner can pull any up a tier.

## Non-goals
- Auto-promoting any term (approval-gated).
- Formalizing UI-11 criteria (deferred; those definitions stay descriptive).
- Defining edge-verb signatures (that is R3A root relationship authority; edge-verb definition cards consume
  `definitions/relationships/relationships.yml` after owner approval).
- Re-deriving or exposing the engine `src/rules` δ-rules (moat) — meta-type definitions **cite** the public
  `.schema.yml`, never the derivation.

## Open decisions (surfaced)
- **DD-D1 — Tier-2 scheme/placement:** method terms as `domainspec-v2-D6+` in root `definitions/` (recommended)
  vs a new `DS-M*` method scheme.
- **DD-D2 — Tier-3 disposition:** document rule-kinds/attribute-keys in a schema-format reference (recommended)
  vs promote as definitions.
- **DD-D3 — Tier-1 home: RESOLVED 2026-07-02 (owner) → root `definitions/DEFINITIONS.md`** (a `DS-D1 Meta-Type
  System` section, anchor `#ds-d1-meta-type-system`), NOT `impl/spec/DEFINITIONS.md`. The `.schema.yml` machine
  files stay in `impl/spec/meta-types/` (validator-loaded); the definition **cards** live in the single
  canonical root home (consistent with the `authority/definitions/` consolidation, and with the
  definitions-governance concept-registry-aggregation which already cites `definitions/DEFINITIONS.md#ds-d1-meta-type-system`).
  **Supersedes** R7's `impl/spec/DEFINITIONS.md` home — R7 is redirected to point the spec at root `definitions/`.

## Falsifiable acceptance
Every load-bearing term the meta-type surface **uses** resolves to either (a) an approved canonical definition
(indexed + drift-audited) or (b) an explicit "document elsewhere / defer" disposition — with **no** load-bearing
term left both used-as-authority and untracked.
