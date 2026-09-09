---
module: interactive-ontology-learning-map
version: 0.1.0-candidate
status: candidate
updatedAt: 2026-07-20
docType: domainspec-spec
scope: private
ownerRoute: private-learning-map-product-owner
---

# Interactive Ontology Learning Map — SPEC

## Purpose

Define a private learning application that projects independently owned knowledge into an inspectable mental map. It teaches how source artifacts, semantic concepts, claims, evidence, governance, Craft workflow state, and learner navigation connect while keeping their types and authority effects distinct.

## Product proposition

A learner starts from a focus question, explores a bounded spatial neighborhood, switches to an equivalent hierarchy or relation table, opens exact sources and challenges, and follows an authored journey. All surfaces share stable identities; none may silently alter semantic meaning or owner authority.

## Success contract

The candidate L0C witness succeeds only when it can:

1. compile a repository-local minted-project graph with explicit `candidate` posture, stable identities, source digest, compiler version, and build receipt;
2. preserve one normalized graph contract and one projection pipeline that can later rebind read-only to an exact owner-issued `FPR-04` `Sg` without treating candidate evidence as authority evidence;
3. preserve six internal classification planes without claiming they are canonical CAV2 kinds or replacement DomainSpec graph types;
4. emit separately serialized `semanticView`, `learnerView`, and `navigationView` over stable IDs;
5. prove learner/navigation removal leaves deterministic semantic bytes unchanged;
6. preserve the owner-admitted DomainSpec relation and retain incompatible or rejected local mappings only as attempted-relation residue;
7. teach the Craft operational-to-speculative claim ladder with explicit posture;
8. expose the same records, relations, sources, statuses, challenges, and actions through spatial and non-spatial surfaces;
9. serve only GET operations and infer no promotion, owner decision, FPR closure, engine acceptance, runtime proof, comprehension, accessibility conformance, or publication verdict.

## Scope

### Included in the private L0C witness

- An explicit private source allowlist and revision-pinned manifest.
- Machine-readable project, feature, one-node-per-file, and one-connection-per-file sources compiled by the minted-project runtime.
- A visible and machine-readable `candidate` posture on every build and view.
- Candidate record/relation/view schemas and non-collapse validators.
- Deterministic candidate compilation, immutable projection generation, and graph/hierarchy/table parity.
- Agent Execution Orchestrator typed-negative witness.
- Financial Settlement positive learner fixture.
- One complete Craft intention-to-residue journey across five claim classes.
- GET-only query surface.
- React Flow spatial view with precomputed ELK coordinates.
- First-class DOM hierarchy and native relation table.
- Source, claim/proof, authority, and challenge details.
- Determinism, parity, accessibility, and bounded-performance evidence.

### Deferred to the L0A authority rebind

- An exact read-only handle to the owner-generated bounded `FPR-04` `Sg` and its prerequisite receipts.
- Equivalence or explicit stable-ID migration evidence from the candidate source adapter to the authoritative `Sg` adapter.
- Authority labeling of any DomainSpec relation or graph output.

### Excluded

- Source editing; ontology authoring; authority mutation; promotion or demotion.
- Reconstructing DomainSpec semantic nodes or admitted relations from feature SPEC tables, local parser labels, or learner material.
- Changing the retired-reference guard, FPR status, supported profile, precedence, quotient, retraction, or engine acceptance.
- Challenge adjudication or owner decisions.
- A live canonical CAV2 ontology or new CAV2 canonical kinds.
- Treating Craft ledger relations as categorical morphisms by default.
- Runtime correctness claims for source-described systems.
- Account-backed progress, collaboration, comments, or analytics.
- Canvas/WebGL renderer switching.
- Public release or a redacted private build.

### Deferred behind separate gates

- Production website integration after an exact website host and owner are selected.
- Maintained learner content after an editorial owner is named.
- Account persistence after privacy/data-governance design.
- Scale renderer review after measured triggers.
- Separately built Arcanum-only public candidate after projection and publication owners exist.

## Core domain model

### Internal planes

| Plane | Responsibility | Authority effect |
|---|---|---|
| L0 Source | Revision-pinned artifacts and exact anchors | none |
| L1 Semantic | Owner-imported DomainSpec `Sg` plus other source-local concepts, definitions, and admissible typed relations | source-local only |
| L2 Epistemic | Claims, evidence, proof scope, analogy, interpretation, unknowns | none unless separately decided |
| L3 Governance | Owners, gates, decisions, envelopes, promotion records | displayed, never inferred |
| L4 Operational | Craft contexts, artifacts, conditions, residue, gates, recomposition | continuation only |
| L5 Projection | Focus questions, journeys, layouts, annotations, view policy | none |

### Derived views

| View | Contents | Forbidden behavior |
|---|---|---|
| `semanticView` | Owner-imported DomainSpec `Sg` records/relations plus other source-backed semantic material | importing learner sequence or locally reconstructed DomainSpec relations as semantics |
| `learnerView` | Focus questions and labeled propositions | changing `semanticHash` |
| `navigationView` | prerequisites, learn-next, breadcrumbs, journey order | implying endorsement or promotion |

## Candidate record contract

Every record has a stable ID, source references, namespaced source-local kind/status, candidate normalized axes where useful, owner route, authority effect, and explicit forbidden collapses. `proofStatus` is nullable and domain-scoped. No generic `evidenceStatus` field is allowed. `generatedAt` is excluded from canonical bytes.

### DomainSpec graph consumer boundary

The normalized graph boundary accepts exactly one declared provenance posture:

- `candidate`: machine-valid minted-project sources and receipts that support private learning-product work but grant no FPR, release, or ontology authority;
- `authoritative`: an exact owner-issued `Sg` plus its prerequisite receipts, available only after `G-DSV2-SG` passes.

Both postures feed the same read model. Imported authoritative DomainSpec records
and relations retain their `Sg` identity, profile, source-manifest, and authority
provenance. Projection schemas may wrap them for query and learning views, but
cannot redefine their node kind, endpoints, relationship label, direction, or
admission posture. Candidate records cannot masquerade as those imports.

The exact normalized enums remain candidate until a projection-schema owner and the relevant source definition owners approve them. See [GLOSSARY.md](./GLOSSARY.md).

### DomainSpec executable-evidence consumer contract

Accepted `DEC-GCP-002` adds an independent proof lane without changing either
graph posture. IOLM consumes exact upstream evidence handles through
`../domainspec-v2/iolm-consumer/consumer-contract.yml` and emits receipts shaped
only by `../domainspec-v2/iolm-consumer/receipt.schema.json`.

- `SWU-IOLM-DSC-A` consumes a successful `evf-l0-core` handle after the
  candidate substrate exists. It proves only that a real private application
  preserved IDs, relations, provenance, semantic bytes/hashes, and view parity.
- `SWU-IOLM-DSC-B` later reruns the same contract against a fresh green
  `bte-core` handle covering 13 node kinds and 16 backend signatures. Only this
  breadth receipt is eligible for `SWU-BTE-010`.

Each run is independently owned and fresh. A missing or failed IOLM receipt
leaves the upstream EVF/BTE core verdict unchanged; it blocks only the combined
consumer claim that requires that receipt. Neither run defines `O_spec`, selects
a profile or predicate, closes FPR, changes `G-DSV2-SG`, or grants release,
production, or publication authority.

## Non-collapse invariants

The fourteen laws in the [accepted findings](../research/2026-07-14-interactive-ontology-learning-map/findings.md#core-non-collapse-laws) are normative for this candidate package. The minimum implementation fixtures MUST demonstrate:

- artifact instance is not semantic concept;
- source anchor is not evidence record or source authority;
- canonical kind, concept role, authority kind, authority state, and workflow status remain distinct;
- verification, proof, authority, evidence confidence, and commitment confidence remain independent;
- learner edge is not semantic relation;
- projection is not promotion or publication;
- renderer success is not comprehension or accessibility conformance.

## Witnesses

### W-01 Agent Execution Orchestrator

- Traverse the owner-produced two-node/one-admitted-edge `FPR-04` `Sg`; do not rebuild its relation from the AEO feature table.
- Fail when required input is missing or empty instead of returning an empty-success graph (`EGI-008`).
- Retain an incompatible or unapproved local edge mapping as `AttemptedRelation` plus operational residue (`EGI-010`).
- Require mutated node, field, edge direction, edge, and quotient fixtures to fail the independent `Sg -> G -> Sg_canonical` comparison (`EGI-011`).
- Never export attempted mappings into `semanticView`, relabel them as CAV2 morphisms, or mint replacement FPR/gap identities.
- Keep schema/endpoint documentary posture separate from executable endpoint and runtime evidence, both initially `NOT_RUN`.

### W-02 Financial Settlement

- Teach `NoDuplicateMakeupRule --enforces--> GenerateSettlement --produces-for--> SettlementTransaction`.
- Show exact document anchors and separate them from runtime/business conformance.

### W-03 Craft claim ladder

Teach five separately typed positions: operational method, domain-scoped formal correspondence, structural analogy, philosophy of making, and universal/reality horizon. The UI MUST NOT imply an upward proof relation between them.

## Independent gates

| Gate | Requirement | Define status |
|---|---|---|
| G-OWNER | Combined projection owner and vocabulary approval route selected | `PASS` — [decision](work-pack/shared/G-OWNER-DECISION.md) |
| G-POSTURE | Candidate-first execution posture explicitly selected | `PASS` — `DEC-CAV2-IOLM-POSTURE-001` |
| G-CANDIDATE | Candidate provenance, stable identity, source digest, compiler version, and authority non-collapse validate | `PASS` — [SWU-IOLM-00C-A result](work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md) |
| G-DS-CONSUMER-NARROW | Exact successful EVF L0 handle is consumed under the versioned IOLM machine contract | `NOT_RUN`; blocked by candidate substrate and upstream EVF receipt |
| G-DS-CONSUMER-BREADTH | Exact green BTE core handle is consumed at 13-kind/16-signature breadth | `NOT_RUN`; blocked by narrow consumer run and BTE core |
| G-DSV2-SG | Exact FPR-01/02/03 owner receipts plus schema-valid bounded FPR-04 `Sg`, explicit `Sg -> G`, and independent retraction receipt | `BLOCKED` for authoritative labeling/rebind only |
| G-HOST | Private L0 witness root selected | `PASS` — `./prototype/` |
| G-SOURCE | All emitted records resolve to allowed revision-pinned anchors | `NOT_RUN` |
| G-SEMANTIC | Kinds/relations are source-local or explicitly candidate | `NOT_RUN` |
| G-ENDPOINT | Both relation endpoints are admissible | `NOT_RUN` |
| G-PROOF | Claim, proof, verification, assumptions, and counterevidence separated | `NOT_RUN` |
| G-DETERMINISM | Repeated builds agree on canonical bytes, layout, indexes, hashes, ETags | `NOT_RUN` |
| G-A11Y | Equivalent journeys work with keyboard, touch, reduced motion, and tested screen readers | `NOT_RUN` |
| G-PERF | Measured curated witness stays inside accepted budgets | `NOT_RUN` |
| G-PUBLICATION | Separate allowed public build and exact-manifest verdict | out of L0; `NOT_RUN` |

Passing one gate never closes another.

## Acceptance criteria

- AC-01: A schema validator rejects every fixture that violates a named non-collapse law.
- AC-02: Two identical builds produce byte-identical semantic output, stable coordinates/search index, equal hashes, and equal ETags.
- AC-03: Modifying only learner or navigation content leaves semantic bytes and `semanticHash` unchanged.
- AC-04: W-01 exports exactly the admitted relation and retains the rejected attempt only in residue/challenge material.
- AC-05: W-02 is navigable from concept registry through source anchors without a runtime-conformance claim.
- AC-06: W-03 labels each claim class and exposes its evidence/proof posture and challenge route.
- AC-07: Spatial graph, hierarchy, and table expose equivalent record/relation information and preserve selected stable ID across lenses.
- AC-08: All spatial interactions have non-drag alternatives; color is not the only state signal.
- AC-09: API surface is GET-only; mutation verbs and authority actions are absent.
- AC-10: L0 outputs remain inside the approved private host; no file is written under public `arcanum/`.
- AC-11: The DomainSpec input binds exact FPR/profile/source/graph identities, rejects missing or empty input, preserves imported relations unchanged, retains unapproved mappings as residue, and fails all named retraction mutants.
- AC-12: Every candidate build and view carries posture, source digest, compiler version, and provenance; no candidate receipt can satisfy `G-DSV2-SG`.
- AC-13: The narrow consumer run binds one exact successful EVF L0 receipt, preserves imported identity/provenance and semantic/view invariants, rejects every declared negative class, and emits one fresh non-admitting IOLM receipt.
- AC-14: The breadth rerun binds one exact green BTE core receipt with 13/13 kinds and 16/16 signatures; a narrow, stale, fixture-only, schema-only, or self-authored receipt cannot satisfy the BTE consumer slot.

## Authority and lifecycle

- Source meaning: source-local owners.
- Candidate projection contract: `private-learning-map-product-owner`; projection fields/enums only, with authority-relevant handback to definitions governance and affected source owners.
- Learner content: `UNRESOLVED`.
- Implementation/evidence: bounded to `./prototype/`. Candidate work requires G-OWNER and G-POSTURE; authoritative labeling/rebind additionally requires G-DSV2-SG. Production website integration remains a separate host decision.
- Public derivative and publication: outside L0 and separately owned.
- Next authoring route: none selected; the applied refresh supersedes the historical define/design mutation route without rewriting those receipts.
- Next mutation route: option 1 is selected in `DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001`; the BTE planning contradiction was refreshed and independently accepted, but `SWU-IOLM-00C-B` remains blocked until the admitted upstream Task Session chain returns a passing cross-feature-support receipt. 00C-C remains unselected. G-DSV2-SG remains open for the later L0A rebind.
- Consumer route: `DEC-GCP-002` is accepted. `SWU-IOLM-DSC-A` and
  `SWU-IOLM-DSC-B` are planned but unselected; they remain independent of the
  L0A authority rebind and cannot change an upstream core verdict.

## FPR-02B consumer-proof handoff

The accepted FPR-02B profile decision makes this map an independent, read-only
consumer proof surface. The input handle must carry:

- `feature-with-independent-node-and-edge-files@1` candidate or authoritative
  posture;
- source, profile, registry, schema, graph, generated-root, `O_spec`, `O_gen`,
  `T_gen`, `E_run`, and receipt identities/digests;
- unchanged imported node/edge IDs and source provenance;
- semantic, learner, navigation, layout, index, and ETag hashes; and
- negative results for missing, empty, mismatched, unapproved, stale, unknown-ID,
  and semantic-mutating overlays.

IOLM may verify and project those handles but cannot define `O_spec`, admit the
successor profile, close FPR-02B, change Craft continuation, or authorize
production. `G-DSV2-SG` remains `BLOCKED` until the IOLM-owned exact receipt and
bounded `Sg` requirements pass; this refresh does not close that gate.
