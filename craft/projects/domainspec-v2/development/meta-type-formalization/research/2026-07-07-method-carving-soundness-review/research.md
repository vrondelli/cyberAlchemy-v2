---
node_type: research
is_session: false
status: candidate
created: 2026-07-07
authored_by: domainspec-subagents-strategy (review dispatch 2026-07-07-metatype-method-carving-soundness)
final_approver: parent
note: >
  Verbatim-compressed transcript of the red-team dispatch (attackers' initial + robot-talks final
  positions, synthesizer, verifiers). The adjudicated report is findings.md. Paths repo-root-relative.
---

# Transcript — Meta-Type Method + Carving Red-Team (review-2026-07-07)

**Question.** Is DomainSpec v2's methodology of defining meta-types by machine-checkable
structural criteria + edge-participation signatures conceptually sound, and does the carving of
25 meta-types + 31 typed edges make sense (complete, non-redundant, principled)?

**Design.** review, 3 attackers / 1 group (robot_talks) + 1 synthesizer + 2 verifiers (zig-zag).
Anti-bias triangle: completeness (inflationary/ADD) vs parsimony (deflationary/MERGE) vs
foundation (anti-collapse). check-tension PASS on both independent gate agents (all four tests).

## Attackers — solo pass (INITIAL)

**Lawvere (completeness).** The 25+31 alphabet is expressive for synchronous CRUD-over-entities
but NOT closed under real-domain composition. Holes, each witness-backed, each claimed to pass
D18: no Schedule/Timer (a clock is unconstructible), no Aggregate/consistency-boundary
(cross-entity invariant Σpostings==0 can't bind to state), no backend Projection/read-model
(mistypes as Entity), Saga's `compensates` edge missing, VO can't nest in VO, Interface can't
publish→Event, Rule can't gate a Query (contradicts the Query card's own "authorization rules").

**Quine (parsimony).** The carving is mostly defensible — Entity/VO, Operation/Query, Rule/Policy
survive (distinct edge participation = distinct composition, D3 pass). The one genuine over-cut:
**Saga = Workflow + `scope` tag** (identical edge participation; survived only because D18 EXEMPTS
node formation). Redundant twin `orchestrates` signatures. No node-level non-collapse gate exists
(systemic — it let Saga through). Concedes owns/belongs-to (already-answered D18), enforces-cross
(already deprecated).

**Wittgenstein (foundation).** On disk, only 3 of 14 backend distinguishers read real structure
(Entity ≥1 identity field; VO none+equality; Enum value-table); the other 11 are SELF-DECLARED
TAGS checked by string-compare — the validator never inspects the concept. So discrimination is
vacuous by construction (the negative fixture is built by flipping the tag the criterion reads).
Corrected a prior: State Machine is NOT structural on disk (`state-machine-ok.md` has zero
transitions). Also: the method-kind imports a DDD/CQRS ontology while claiming "any domain"; the
primitives (identity/field/typedness) are asserted not grounded; the 4-category scheme collapses
to a 2-way partition (structural-table vs declared-tag).

## Attackers — robot-talks (FINAL) — collapse detection

**Lawvere FINAL.** Abandons "ADD nodes" as default. Concedes Quine's Saga merge and folds the
compensation finding into it (−1 node, +1 `compensates` edge). Retreats Aggregate to a single
`Rule→constrains→Entity` edge. Keeps Projection only via Quine's OWN edge-participation test.
Concedes Wittgenstein's genre attack: the additions merely COMPLETE the DDD/CQRS ontology — only
the missing **time genre** (a clock) is genuinely cross-genre and unconstructible. Accepts that
adds must ground in structure, not a new self-declared tag. *"Its true failure is not missing
pieces of its own picture; it is that it has only one picture."*

**Quine FINAL.** Holds the Saga merge — the combined Wittgenstein+Lawvere remedy (compensation
table + `compensates` edge) is SHARED with Workflow, so it discriminates nothing; concede only if
the owner rules `compensates` Saga-exclusive. Adopts Wittgenstein's structural witness as an
OBLIGATION bound to `scope: cross-feature`, not a second node. CONCEDES Schedule as a genuine new
kind (producerless source). Adds `compensates [Workflow,Saga]→Operation`, widens `contains`
source to include VO, resolves Rule→Query with a narrow `authorizes` edge; REJECTS Aggregate and
Projection as nodes; CONTESTS Interface→Event as redundant. *"D18 disciplines edges but exempts
nodes, so an attribute bought a node it never earned."*

**Wittgenstein FINAL.** Corrects own fix — the "compensation table" witness FAILS (Workflow has
one too); concedes Saga's as-built verdict to Quine (Saga≠Workflow only by the scope tag). His
"keep" survives only if cross-feature fan-out becomes a COMPUTED graph property (feature-ownership
is not modeled today), else concede the merge. His structural-witness and Quine's node non-collapse
gate are COMPLEMENTARY (the gate = the law; the witness = the admission standard). Holds against
Quine's concession: distinct edge-participation proves a TYPE non-collapsible but leaves
MEMBERSHIP uncheckable. Isolates the IRREDUCIBLE KERNEL: **Rule/Policy/Calculation** — return-sort
is semantic, the moat forbids parsing the Formal cell, so no structural witness is publicly
constructible. *"That trio, not Saga, is the true fault line."*

## Synthesizer (Mac Lane)

Deduped to 14 candidates (Lawvere-F4 + Quine-F1 = ONE Saga finding; Quine-F3 + Wittgenstein-F2 +
the node-exemption = ONE structural ROOT). Verdicts: methodology FIX (sound at edge layer, broken
promise at node layer per solo pass), carving FIX/mostly-KEEP (~24 nodes: Saga out, Schedule in).
Root cause: the D18 node-formation exemption. Highest-leverage: a node non-collapse gate. Surfaced
7 decidable owner questions (OQ-1..7). Kept the genuine forks (Projection node yes/no; Saga
merge-vs-conditional-keep) as forks, not fake consensus. [Full table → findings.md.]

## Verifiers (zig-zag)

**Simon (empirical, traced disk).** #1 SURVIVES (a mutating action tagged `state_change=no`
passes `query.schema.yml` via attribute-equals; no fixture tests a truthfully-mistyped concept).
#3 SURVIVES (`workflow.schema.yml`/`saga.schema.yml` `edge_participation` byte-identical;
TAXONOMY gives both a compensation table). #4 NEEDS-NARROWING (no single value passes both Rule
and Calculation; reframe to "string-swap evades classification"). #5 SURVIVES (Event `target_of:
[emits, produces]` only; a clock has no producer; unconstructible). #12 NEEDS-NARROWING (the
taxonomy's own `ExternalGatewayToEvent` isn't constructible — Mapping can't target Event — but no
producer-less external event is witnessed; narrow toward "derivable, reject"). #14 SURVIVES
(`attribute-present` never reads the value column; `interface_kind | banana` passes).

**Popper (definitional, dominant filter).** #2 SURVIVES/CONFIRMED (D18 promotion-boundary text:
"governs relationship promotion, **not DS-D1 meta-type formation**"; D6/D7 carry only coverage
challenges — no node non-collapse rule exists). **#4 REFUTED** — reducible to the conceded moat:
D15's declared-attribute check IS a decidable predicate that runs without the engine, so DEFINE's
promise is met at shape level; the residue (tag not verified against the Formal cell) is the
disclaimed moat verbatim. **#1 OVER-SEVERE** — DEFINE: "Passing = the meta-type is a checkable
type, NOT proof of meaning"; the flip-the-tag fixture satisfies SURVIVED as written; legitimate
residue is a LOW/transparency nit the method should own in prose. #3 exclusivity REFUTED —
`compensates` is NOT Saga-exclusive (Workflow compensates too; the edge is absent from
relationships.yml) → decides the merge. #6 SURVIVES/MEDIUM — "any domain" is on record (TAXONOMY
L3), over-claimed. Edge proposals: `constrains` clean only as a new verb on a new pair;
Rule→Query contradiction real (card vs `enforces` target law); `compensates` admissible-conditional
(must cite a D23 composition-path property); `contains` refuted **on a misread** (Popper checked an
Entity→Entity widen — the actual proposal is a VO→VO source-widen, which stands; corrected on P8
review).

## Residue

- The dramatic solo-pass claims (trio "structurally unkeepable"; "vacuous validator") were
  DOWNGRADED/REFUTED by verification — recorded here so the inflation is visible, not hidden.
- The Projection node fork (OQ-3) and the Saga feature-ownership condition (OQ-2) are unresolved
  owner calls, not review verdicts.
- Fine-grained edge decisions (`constrains`, `compensates`, `contains`-VO-widen, Projection) are
  engineer-view / DEFINE open-decision material, routed OUT of the discovery (too fine-grained).
