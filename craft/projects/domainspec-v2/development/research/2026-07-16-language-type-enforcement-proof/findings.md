---
node_type: findings
is_session: false
status: accepted
created: 2026-07-16
dispatch_id: 2026-07-16-domainspec-language-type-enforcement-proof
dispatch_type: research
final_approver: "Vlachopulos, Ioannis — ACCEPT"
source_boundary:
  - .arcanum/inventory/
  - projects/domainspec-v2/
  - projects/framework-unification/
authority: non-authority research synthesis
non_authority: This candidate report does not define vocabulary, amend DS authority, promote Framework material, or certify an implementation.
---

# DomainSpec Language Type Enforcement And Proof — Findings

## Answer and verdict

**Current DomainSpec has bounded, sampled post-parse endpoint rejection plus observed trace artifacts; stale relative metatheory and designed notation are complementary fragments, not an operative unified language or proof chain.** [S1][C1][P1]

The **candidate repair architecture survives** review. The claim that an operative unified language or end-to-end proof chain already exists does not. “Typed” must currently mean only the named judgment actually checked; it must not imply an intrinsically typed representation, implementation conformance, runtime correctness, or semantic satisfaction. [C1][S2]

## Evidence boundary and citation key

This report synthesizes the verbatim explorer returns in sibling `research.md`. Status words are orthogonal evidence labels, not one monotone assurance scale: **current** = active repository authority or executable surface; **observed** = a dated run or artifact behavior witnessed by the dispatch; **precedent** = useful prior formal result outside the current proof gate; **candidate** = proposed architecture or interpretation; **open** = no defensible assurance yet.

Every evidence key below names both the transcript heading and its underlying repository selectors:

- **[C1]** `research.md` → **Agent 1 — Curry, Haskell**, especially **Post-discussion final position**; `projects/domainspec-v2/formalization/README.md:1-8,59-95`; `projects/domainspec-v2/formalization/DomainSpecEdgeSignature.lean:188-219,263-281,342-376`; `projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:13-44`.
- **[C2]** `research.md` → **Agent 1 — Curry, Haskell / formal reconstruction**; `projects/framework-unification/layers/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md:33-82`; `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:1-11,102-132,181-210,268-308`; `projects/framework-unification/CONCEPT-MAP.md:113-146`.
- **[S1]** `research.md` → **Agent 2 — Shannon, Claude / current DomainSpec v2 enforcement**; `projects/domainspec-v2/definitions/relationships/relationships.yml:1-18,84-97`; `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts:85-143,170-189,474-499`; `projects/domainspec-v2/impl/tools/validate-relationships.ts:24-65`; `projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts:22-49`; `projects/domainspec-v2/development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-004/TASK-SESSION-RESULT.md:64-97`.
- **[S2]** `research.md` → **Agent 2 — Shannon, Claude**, especially findings 3–5 and **Post-discussion final position**; `projects/domainspec-v2/definitions/DEFINITIONS.md:1012-1027,1055-1068,1123-1150`; `projects/domainspec-v2/definitions/meta-types/meta-types.yml:13-36`; `projects/domainspec-v2/impl/tools/validate-content.ts:99-119`; `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts:248-297,474-499`.
- **[P1]** `research.md` → **Agent 3 — Spivak, David / cross-layer preservation map** and **Post-discussion final position**; `projects/framework-unification/layers/domainspec-language/SCHEMA-INVENTORY.md:86-114`; `projects/framework-unification/CONCEPT-MAP.md:113-126,199-203`; `projects/domainspec-v2/impl/spec/minted-project/node.schema.json:5-16`; `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:18-67`.
- **[P2]** `research.md` → **Agent 3 — Spivak, David**, findings 3–5; `projects/domainspec-v2/impl/tools/minted-project/compiler.ts:315-359,363-440`; `projects/domainspec-v2/impl/test-derivation-engine/src/index.ts:1-33`; `projects/domainspec-v2/impl/test-derivation-engine/src/README.md:73-93,119-132`; `projects/domainspec-v2/authority/source-spine.md:34-53`.
- **[I1]** `research.md` → **Agent 2 — Shannon, Claude / Local tensions and gaps** and **Agent 3 — Spivak, David**, finding 4; `.arcanum/inventory/index.json:3633-3674,9999-10010`; `.arcanum/inventory/entries/evidence-cards/2026-06-21-category-theory-domainspec-language-cards.md:140-159`.

Inventory is a parseable but partial **non-authority read model**. Its candidate categorical reading and stale edge-law residue may guide retrieval, but neither can override current DomainSpec v2 owner routes or certify a claim. [I1][P2]

### Vocabulary contract

- **candidate language architecture:** the repair proposed here, pending owner decisions and experiments;
- **parser:** the boundary that turns authored material into a declared IR and accounts for every in-scope input;
- **endpoint-admissibility checker/calculus:** the bounded judgment over relation, profile, source kind, and target kind—not a general type system;
- **witness:** one concrete acceptance, rejection, or mutation result;
- **receipt:** trace evidence that a command or translation ran with named inputs and outputs;
- **proof under assumptions:** a quantified claim discharged relative to explicit authority, encoding, build, and trust premises;
- **trace retention:** observed survival of selected IDs, digests, provenance, obligations, or residue;
- **judgment preservation:** a stated and tested relation `J(x) -> J(Tx)`;
- **semantic preservation:** preservation of meaning or satisfied obligations, which is currently open;
- **escape:** classified degradation that remains visible as residue rather than strict conformance; and
- **provenance edge / domain edge:** distinct edge universes for artifact lineage and domain concepts. [C1][S1][P1][P2]

## What exists now

| Surface | Status | Defensible claim | Boundary |
|---|---|---|---|
| Contract/schema/iteration document language | candidate/design | Separates meaning, machine-checkable representation, and change records. | No parser; syntax, dialect, addressable obligations, and several gates remain unresolved. [C2] |
| DS-D1/DS-D2/DS-D8 graph authority and TypeScript checker | current; sampled behavior observed | Live 30-signature authority drives post-parse source/target membership rejection and selected schema-participation checks. | Not a general type system; parsing can omit material, profile maturity is not checked here, and most authority fields are not executed. [S1][S2] |
| Imported Lean checker | precedent | A finite earlier signature transcription has a decidable relative `WellTyped` predicate, rule-set metatheorems, witnesses, and tracked escapes. | Non-authority, 29-edge-era, stale, and not locally built; it does not certify current DS-D8. [C1] |
| Minted-project and derivation machinery | current machinery; trace retention observed | Preserves selected IDs, declarations, digests, provenance, obligations, and visible residue across bounded translations. | No governed theorem of judgment or semantic preservation; generated graphs, manifests, and receipts remain read models/evidence. [P2] |

These are **three systems**, not three layers of one implemented language: (1) a designed contract/schema/iteration document language, (2) DS-D1/DS-D2/DS-D8 graph authority plus checker, and (3) minted/derivation translation machinery. The same word `connections` currently spans distinct edge universes—artifact provenance and domain-concept relations—without a typed bridge. [P1][P2]

## Required judgments and statuses

The candidate checker contract is a conjunction of distinct judgments:

```text
Declared(x)
  -> ParsedCompletely(x)
  -> ShapeValid(x)
  -> ProfileAdmitted(profile, x)
  -> EndpointAdmissible(profile, edge)
```

- `Declared` means the source item is present in the claimed input boundary.
- `ParsedCompletely` means every in-scope declaration was consumed or produced a named diagnostic. A parser branch may not silently green an omission.
- `ShapeValid` means the selected schema accepts the representation.
- `ProfileAdmitted` means the node/relationship lifecycle and maturity are admitted for the selected profile.
- `EndpointAdmissible` means the active relation admits the source/target kinds under that profile.
- `Skipped` is a fail-closed result whenever the skipped material is inside the claimed boundary.
- `Escaped` is a degraded, residue-bearing result, not strict well-typedness. The imported Lean term `WellTyped` currently accepts and tracks escapes, so it cannot be reused for strict conformance without changing or splitting the judgment. [S2][C1]

## Assurance verdict matrix

`PASS` below is deliberately local. `KILL` means the named assurance claim is not sustained, not that the underlying artifact has no value.

| ID | Assurance claim | Owner | Witnessed? | Sound for the claim? | Verdict |
|---|---|---|---|---|---|
| A0 | Current parse/shape coverage is complete | parser + content-validator owner | Silent skip paths observed in code | No: missing/malformed registries and unknown schemas can green by omission. [S2] | **KILL** |
| A1 | Current checker discriminates endpoint admissibility | relationship-validator owner | Live count/real-pack run and selected negatives; exact cause established only for bounded witnesses | Yes, only for sampled, exact-cause post-parse endpoint rejection; not all six broad negatives are discriminating. [S1] | **narrow PASS** |
| A2 | Rule-set properties certify current authority | definitions/formalization owners | Relative theorems and witnesses exist in imported source | No current build or authority-fidelity bridge; stale snapshot is **precedent** only. [C1] | **KILL current claim** |
| A3 | Translation preserves declared structure | minted/derivation owners | Digests, manifests, stable obligations, provenance, and residue are emitted | No assurance until destructive preserve/drop tests exist; current result is **observed trace retention** only. [P2] | **no assurance** |
| A4 | Translation preserves judgments or semantics | language + translation owners | None | No theorem of `J(x) -> J(Tx)` and no semantic preservation contract. [P2][C1] | **KILL / open** |
| A5 | Implementation conforms to the spec | implementation-verification owner | None | Endpoint validation and receipts are not code-call or implementation-equivalence proof. [S1][P2] | **KILL / open** |
| A6 | Runtime behavior satisfies the spec | runtime-verification owner | None | Structural admission does not model executions, failures, ordering, or state. [C1] | **KILL / open** |
| A7 | Domain meaning/obligations are satisfied | contract/obligation owner | Narrative and designed obligations only | Shape-valid or endpoint-admitted artifacts can still encode the wrong requirement. [C2][S2] | **KILL / open** |

## Authority-field classification

Authority fields require an explicit classification; checker silence does **not** make a field descriptive. Under current evidence:

- **Normative-executed:** active/deprecated filtering and count agreement, canonical verb identity, endpoint sets, and the currently checked source/target schema projections. [S1]
- **Normative-unenforced:** DS-D1 profile/maturity admission and DS-D8 fields such as `feature_scope`, `multiplicity`, declared obligations, composition/projection rules, and any semantic constraint intended to govern acceptance. Each needs an owner decision and a discriminator before an enforcement claim. [S2]
- **Descriptive:** summaries, examples, and explanatory prose only where the owning authority explicitly makes them non-normative. Absence from the current checker is insufficient evidence for this class. [S2]

## Candidate minimum repair architecture

1. Keep canonical DS authority sovereign; Framework and Inventory remain proposal/evidence inputs, never promotion paths. [P2][I1]
2. Parse into a **profile-indexed IR** with separate edge universes for artifact-provenance edges and domain-concept edges. Any bridge must name its level and preserve its authority posture. [P1]
3. Implement the five judgments separately and model degraded `Escape` with structured residue. Do not call the current surface a general type system or call post-parse rejection “unconstructible.” [C1][S1]
4. Generate both executable and Lean projections from canonical authority. Gate counts, local Lean build, generated drift, and source digest before transferring any theorem to the live registry. [C1]
5. Require isolated, exact-cause positive and negative witnesses for every checked field. A passing negative must identify the mutated field, expected diagnostic, exact subject, and accepted sibling; unrelated global errors must fail the test. [S1]
6. Give every translation a preserve/drop contract. Test `J(x) -> J(Tx)` with one-field mutations for identity, endpoint judgment, obligation identity, provenance, residue, lifecycle, and authority. A receipt is a **witness** of trace retention; only a discharged quantified claim is a **proof under assumptions**. [P2][C1]

## Exact discriminator contracts and typed negatives

| Judgment or boundary | Required positive witness | Typed negative / destructive witness | Exact result |
|---|---|---|---|
| `ParsedCompletely` | Every declared row appears in the parse manifest | Remove/malformed registry header; unknown type/schema; malformed row | Named parse error or explicit `Skipped` failure, never zero checked + green. [S2] |
| `ShapeValid` | Minimal complete object accepted | Mutate exactly one required field/type/enum | Diagnostic names schema, field, subject, and expected constraint. [C2] |
| `ProfileAdmitted` | Active kind and relation accepted in named profile | Candidate/deferred kind or out-of-profile relation | Diagnostic names profile and lifecycle/maturity cause. [S2][P1] |
| `EndpointAdmissible` | Canonical exact tuple accepted | Change one endpoint kind only | Diagnostic names edge and expected source/target set; no global participation error may satisfy it. [S1] |
| Authority projection | Generated TS and Lean tables match the same digest/count | Mutate one canonical signature without regeneration | Drift gate fails before validator/proof claims run. [C1] |
| Translation | Preserve-contract fields and residue survive | Mutate/drop one ID, judgment, obligation, provenance, residue, lifecycle, or authority field | Exact preserve/drop delta; any `Escape` remains visible and degraded. [P2] |

## Contradiction register

| Tension | Resolution for this report |
|---|---|
| Framework says forbidden edges should be unconstructible; current Markdown, JSON, TypeScript, and Lean representations can form them. | Say **post-parse rejection** for the current implementation; reserve unconstructible for a future intrinsically typed constructor/AST. [C2][S1][P1] |
| Imported `WellTyped` accepts unknown edges/opaque nodes as escapes. | Split strict endpoint admissibility from degraded escape; escapes carry residue and cannot satisfy strict well-typedness. [C1] |
| DS-D8 records richer tuples than the runtime checker consumes. | Classify every field as normative-executed, normative-unenforced, or descriptive; no silent demotion. [S2] |
| DS-D1 maturity is profile-sensitive while DS-D8 exposes UI endpoints. | Make object and edge judgments profile-indexed before claiming closure/admission. [S2] |
| `connections` names provenance edges in Framework and domain edges in minted-project. | Separate edge universes; require an explicit typed bridge and preservation law. [P1] |
| Trace artifacts exist, but no translation theorem exists. | Call this observed trace retention, not preservation assurance. [P2] |

## Explicit non-goals

This repair does not require a unified surface syntax, an intrinsically typed AST, full category/functor laws, implementation equivalence, runtime verification, or semantic correctness. Those may be later owner-routed targets; none is a precondition for making current bounded claims exact. [C1][C2]

## Residue, open questions, and next owner-routed experiments

1. **Definitions/authority owner:** decide whether “DomainSpec language” names one composition or three explicit systems; classify every DS-D8 field; decide strict `WellTyped` versus degraded `Escaped`; define provenance edge versus domain edge. [C1][P1]
2. **Parser/validator owner:** implement a parse manifest and fail-closed skips, then build exact-cause positives and one-field negatives for `ParsedCompletely`, `ShapeValid`, `ProfileAdmitted`, and `EndpointAdmissible`. First falsifier: remove or malform a Concept Registry and require a named failure rather than green. [S1][S2]
3. **Formalization owner:** generate TypeScript and Lean signature projections from the same canonical DS authority; require source digest, count agreement, local build, zero-hole receipt, drift negative, and a witness per claimed theorem boundary. Until then, A2 remains precedent. [C1]
4. **Minted/derivation owners:** declare preserve/drop contracts and run one-field destructive mutation tests. First target: node identity, edge judgment, obligation identity, provenance, residue, lifecycle, and authority posture. [P2]
5. **Framework language owner:** only after the above judgments exist, propose a bridge from contract obligation to graph/translation IR with `J(x) -> J(Tx)` tests. Do not choose unified syntax or claim semantic preservation as part of this experiment. [C2][P2]

## Parent verification and closeout residue

- `npm --prefix projects/domainspec-v2/impl run validate:rels` — **PASS**:
  3 specs, 14 checked edges, 30 canonical signatures.
- `npm --prefix projects/domainspec-v2/impl run validate:content` — **PASS**:
  20 concepts and 14 edges in 3 files, with 13 schemas.
- `npm --prefix projects/domainspec-v2/impl run tools:test` — **99/101 tests
  passed**. The two failing assertions are both owned by the existing
  zero-active retired-orchestration reference audit. That audit reported ten
  manifest/allowlist violations already spanning active authority and unrelated
  in-progress artifacts; this new verbatim transcript adds one unclassified
  historical reference. The dispatch does not alter the frozen reference
  manifest or exception allowlist. This is a closeout residue, not evidence
  against the accepted language/enforcement verdict.

## Dispatch closeout

- Final approver: `Vlachopulos, Ioannis` — **ACCEPT**
- Exit reason: `resolved`
- Agents spawned: 8 (`explorer: 3`, `synthesizer: 1`, `skeptic: 2`,
  `writer: 1`, `auditor: 1`, `helpers: 0`)
- Whole-dispatch loops used: 1
- Feedback edges fired: none

No canonical definition, schema, authority, implementation, or Inventory
promotion follows from this accepted research report. The minimum architecture
remains candidate-only.
