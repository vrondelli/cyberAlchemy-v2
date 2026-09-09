# Ontology Organization Coverage Repair — Synthesized Findings

Dispatch: `2026-09-02-lean-corpus-ontology-coverage-repair-review`  
Frozen repair dispatch SHA-256: `05670ac51fc6d6575f8258899a55725304d31a08618c1d3d6d618ff655a336f7`  
Repaired prior findings SHA-256: `a3e758a5f5319c19ebac9f89602021979d682a2ddb709cc275b6cafcc12f7a33`  
Coverage attack/audit record SHA-256: `fd0b95974b124b0065d16ba8d3a1c6775c1afc0e2bdf97b473829e10f8dbc08a`  
Synthesis status: review-evidence coverage repair; pending independent repair verification and coverage audit

## Claim ceiling

This synthesis concerns the unregistered, private, `research-candidate` package `CA2-ONTOLOGY-CANDIDATE-DOMAINSPEC-LEAN-CORPUS-2026-09-01`. The frozen profile says `"semantic_owner_status": "unselected"`, `"authority_effect": "none"`, and sets admission, implementation-binding, and conformance claims to `false` (`ontology-candidate/profile.json:6-15`). The later frozen receipt records package digest `a868c8e72665435dae5b444938c468e00f393e4e0d34a29da9533b360344f964` and `validation_result: pass` (`ontology-candidate/receipts/2026-09-01T23-31-02Z-validation.json:2-22`); the package contains two frozen receipts. These are historical structural candidate records only, not evidence of a current invocation.

Nothing below selects canonical meaning or an owner; creates a canonical relation; establishes a current Lean build or proof; adopts a Product Capability; supplies DomainSpec v2 source, an implementation binding, or conformance; or grants admission, enforcement, publication, release, deployment, or external-effect authority.

## Proposed organization

The eight accepted items should remain `ResearchFinding` records, not ontology records. Their organization should expose only distinctions present in the frozen evidence rather than overload `proposed_record_kind`:

| Section | Candidate contents | Existing finding instances |
| --- | --- | --- |
| Research finding | The eight `ResearchFinding` records, each retaining the accepted finding-local contract | all eight nodes |
| Typed proposal facet | Closed values limited to relation, predicate, invariant, mapping, and schema, each explicitly noncanonical | all eight nodes according to their accepted proposed `record_kind` |
| Provenance/source | Exact research-artifact digest or Lean commit/path/blob/qualified declaration/kind/selector; total source disposition | all eight nodes and all twelve source records |
| Review responsibility | Non-executable proposed review responsibility, separate from provenance and machine routing | all eight nodes |
| Invariant | Source-local predicate/invariant proposals | the eight existing invariant records and their `applies_to` closure |
| Lifecycle/residue | Finding-local promotion gaps, global D65 gaps, review responsibility, ownership non-selection, and unresolved indexing/materialization residue | all nodes; all nine prerequisite gaps |

This organization follows the accepted definition that a `ResearchFinding` contains full supporting selectors, method, uncertainty, claim ceiling, `promotion_prerequisite_gap`, and `authority_effect=none`. It does not instantiate the research-only relation vocabulary as canonical ontology edges.

## Explicit node dispositions — 8/8

| Node ID | Disposition | Current target record |
| --- | --- | --- |
| `RF-TYPED-DIRECTION` | **Support.** Retain as a research finding: typed direction and equal-count insufficiency are preserved; distinct noncanonical facets, exact selectors, method, uncertainty, ceiling, and local prerequisites must be restored. No canonical relation follows. | `ontology-candidate/nodes.json:6-16` |
| `RF-DUAL-OWNER-ELIGIBILITY` | **Support with semantic correction.** Preserve distinct formal-claim and business-meaning/fidelity review roles, but select, merge, and authorize no owner. | `ontology-candidate/nodes.json:19-29` |
| `RF-REQUEST-INDEXED-CURRENTNESS` | **Support.** Retain request-and-binding-indexed currentness; a stored or historical PASS is not current evidence by itself. | `ontology-candidate/nodes.json:32-42` |
| `RF-EVIDENCE-DISCHARGE-SEPARATION` | **Support.** Retain the separation: validating evidence cannot determine, select, or authorize an owner discharge decision. | `ontology-candidate/nodes.json:45-55` |
| `RF-PROJECTION-DISCLAIMER` | **Support, bounded.** Retain only the negative non-authority disclaimer. Semantic preservation and admissibility remain unevaluated unless separately evidenced. | `ontology-candidate/nodes.json:58-68` |
| `RF-EDGE-GRAMMAR` | **Support.** Retain typed-direction and admissible-composition discrimination, require exact selector bindings, and use only a closed explicitly noncanonical proposal kind. | `ontology-candidate/nodes.json:71-81` |
| `RF-LIFECYCLE-RESIDUE` | **Residue.** Retain as deferred research. Non-empty residue is not promotion, and this record advances no D65 stage. | `ontology-candidate/nodes.json:84-94` |
| `RF-SEMANTIC-PROVENANCE-ENVELOPE` | **Support, bounded.** Retain only as a candidate schema proposal: selectors, provenance bytes, and their combination grant no decision authority. | `ontology-candidate/nodes.json:97-107` |

## Explicit source dispositions — 12/12

| Source ID | Disposition | Current target record |
| --- | --- | --- |
| `SRC-FINDINGS` | **Support.** Common research-artifact provenance for the findings; it is not canonical authority. | `ontology-candidate/sources.json:6-10` |
| `SRC-EVIDENCE-CLOSURE` | **Context-only.** Closure context, not direct support without a finding-local selector. | `ontology-candidate/sources.json:12-16` |
| `SRC-SYNTHESIS-REVISED` | **Context-only.** Accepted research-contract context, not canonical semantics. | `ontology-candidate/sources.json:18-22` |
| `SRC-SPEC-ONTOLOGY-KERNEL` | **Support candidate.** May support the five named finding themes only after each exact qualified declaration and declaration kind is validated and bound finding-locally. | `ontology-candidate/sources.json:24-37` |
| `SRC-SPEC-ONTOLOGY-INDEPENDENCE` | **Support candidate.** May support typed-direction and evidence/discharge findings only after exact declaration binding. | `ontology-candidate/sources.json:39-49` |
| `SRC-AGENT-PERMISSION-KERNEL` | **Excluded with reason.** No finding-local support binding connects the permission theorem to an accepted finding; no semantic edge is invented. | `ontology-candidate/sources.json:51-60` |
| `SRC-SECOND-LAW-DISCRETE` | **Excluded with reason.** Corpus/context only; it supplies no accepted finding-local semantic support. | `ontology-candidate/sources.json:62-71` |
| `SRC-M6-COUNTER` | **Excluded with reason.** Corpus/context only; it is not direct support for an accepted finding. | `ontology-candidate/sources.json:73-82` |
| `SRC-AUTHORITY-LIFECYCLE-RESIDUE` | **Support candidate.** May support `RF-LIFECYCLE-RESIDUE` only after exact declaration-name and declaration-kind validation. | `ontology-candidate/sources.json:84-93` |
| `SRC-EDGE-GRAMMAR-FIXTURE` | **Support candidate.** May support `RF-EDGE-GRAMMAR` only after exact declaration-name and declaration-kind validation. | `ontology-candidate/sources.json:95-104` |
| `SRC-EDGE-GRAMMAR-COMPOSITION` | **Support candidate.** May support `RF-EDGE-GRAMMAR` only after exact declaration-name and declaration-kind validation. | `ontology-candidate/sources.json:106-115` |
| `SRC-EVIDENCE-ENVELOPE-BOUNDARY` | **Support, bounded.** Supports candidate envelope evidence, not decision-resolution authority, ownership, or product truth. | `ontology-candidate/sources.json:117-126` |

## Explicit invariant dispositions — 8/8

| Invariant ID | Disposition | Current target record |
| --- | --- | --- |
| `INV-TYPED-DIRECTION` | **Retain.** Direction and count are not semantically equivalent; no canonical relation follows. | `ontology-candidate/invariants.json:6-10` |
| `INV-DUAL-OWNER-NON-SELECTION` | **Retain with terminology correction.** Preserve distinct formal/fidelity review roles plus non-selection and non-authorization. | `ontology-candidate/invariants.json:12-16` |
| `INV-CURRENTNESS-BOUND` | **Retain.** Historical PASS is not current evidence without exact request and binding currency. | `ontology-candidate/invariants.json:18-22` |
| `INV-EVIDENCE-NOT-DISCHARGE` | **Retain.** Evidence validation neither determines nor authorizes discharge. | `ontology-candidate/invariants.json:24-28` |
| `INV-PROJECTION-NON-AUTHORITY` | **Retain.** Projection implies no adoption, admission, promotion, or implementation authority; semantic preservation remains unevaluated. | `ontology-candidate/invariants.json:30-34` |
| `INV-RESIDUE-NOT-PROMOTION` | **Retain.** Unresolved non-empty residue is not promotion. | `ontology-candidate/invariants.json:36-40` |
| `INV-ENVELOPE-NON-AUTHORITY` | **Retain.** Combined semantic-selector and provenance evidence is candidate evidence, not decision authority. | `ontology-candidate/invariants.json:42-46` |
| `INV-RESEARCH-CEILING` | **Retain.** Every node remains a research finding, not an admitted ontology record or successor D65 artifact. | `ontology-candidate/invariants.json:48-60` |

## Explicit prerequisite-gap dispositions — 9/9

| Gap ID | Disposition | Current target record |
| --- | --- | --- |
| `GAP-CANONICAL-DEFINITIONS` | **Unresolved.** Exact meanings still require definitions-owner selection and acceptance. | `ontology-candidate/residue.json:17-21` |
| `GAP-PRODUCT-CAPABILITY` | **Unresolved.** Requires an exact owner-adopted Product Capability. | `ontology-candidate/residue.json:23-27` |
| `GAP-BUSINESS-ONTOLOGY` | **Unresolved.** Requires a capability-owned, accepted bounded business ontology. | `ontology-candidate/residue.json:29-33` |
| `GAP-DOMAINSPEC-SOURCE` | **Unresolved.** Requires admitted DomainSpec v2 authored source binding selected meanings. | `ontology-candidate/residue.json:35-39` |
| `GAP-COMPILED-SYSTEM-ONTOLOGY` | **Unresolved.** Requires a deterministic bound compiled graph/system-ontology candidate. | `ontology-candidate/residue.json:41-45` |
| `GAP-IMPLEMENTATION-BINDING` | **Unresolved global D65 gap.** No node reference is required, and its absence as a node reference is not an independent node defect. | `ontology-candidate/residue.json:47-51` |
| `GAP-CONFORMANCE-EVIDENCE` | **Unresolved.** Requires current owner-bound evidence over an exact implementation binding. | `ontology-candidate/residue.json:53-57` |
| `GAP-CURRENT-BUILD` | **Unresolved.** Requires a live build and proof bound to the current request and source bytes. | `ontology-candidate/residue.json:59-63` |
| `GAP-SEMANTIC-OWNER` | **Unresolved and unselected.** Ownership cannot be inferred from paths, blobs, labels, or nearby ontologies. | `ontology-candidate/residue.json:65-69` |

## Ordered change requests

### 1. MAJOR — Restore the complete finding-local contract

The closed node schema requires only `definition`, an arbitrary `proposed_record_kind`, source IDs, review labels, and coarse gap IDs. It therefore cannot preserve the accepted per-finding supporting selectors, method, uncertainty, claim ceiling, or exact `promotion_prerequisite_gap`. The node projection visibly substitutes generic gap references, for example `RF-TYPED-DIRECTION` uses only `GAP-CANONICAL-DEFINITIONS` and `GAP-SEMANTIC-OWNER` (`ontology-candidate/nodes.json:6-16`), while the accepted row requires exact definitions, mapping bytes, build receipt, fidelity decision, and owner selection.

Requested change: extend the research-finding shape and all eight instances with exact supporting selector records, method, uncertainty, per-claim ceiling, and verbatim or losslessly structured finding-local prerequisite obligations. Preserve the nine global D65 gaps separately; do not treat a global gap ID as a replacement for a local obligation.

Attack provenance: Peirce initial findings 1 and 4; all three final positions. The independent standalone claim that unused `GAP-IMPLEMENTATION-BINDING` is itself a node defect was refuted and is not retained.

### 2. MAJOR — Correct the two demonstrated semantic distortions

`RF-DUAL-OWNER-ELIGIBILITY` currently says eligibility requires “the assertion owner and the formalization owner” (`ontology-candidate/nodes.json:19-29`), but the accepted synthesis identifies formal-claim and business-meaning review roles. `RF-PROJECTION-DISCLAIMER` says a projection “can preserve source-local semantics” (`ontology-candidate/nodes.json:58-68`), while the accepted source ceiling defines only a negative authority guard, not admissibility.

Requested change: preserve the formal/fidelity evidence-role distinction without selecting owners. For projection, retain only the supported non-authority disclaimer and mark semantic preservation/admissibility unevaluated unless separately evidenced.

Attack provenance: Peirce initial findings 2 and 3; all three final positions.

### 3. MAJOR — Type proposed facets without creating ontology authority

The schema permits any string for `proposed_record_kind`, and `RF-TYPED-DIRECTION` collapses distinct structures into `"relation-and-invariant"` (`ontology-candidate/nodes.json:6-16`). The accepted handoff distinguishes `LeanDeclarationSource` and `ResearchFinding` records and separately describes research-only support, review-responsibility, and prerequisite-gap relations.

Requested change: use a closed proposal grammar limited to the frozen-evidence distinctions `relation`, `predicate`, `invariant`, `mapping`, and `schema`. Type source/provenance and proposed review-responsibility fields separately. Do not introduce a concept taxonomy, a generic instance ontology, or relation-contract/relation-instance semantics. Every proposal remains explicitly noncanonical and `authority_effect=none`.

Attack provenance: Peirce initial finding 5; Abramsky and Yanofsky final positions.

### 4. MAJOR — Enforce the intentionally empty relation ceiling

The package truthfully records `"relations": []` because research does not establish canonical semantic relations (`ontology-candidate/relations.json:4-5`). Yet the validator accepts any relation whose ID is unique, endpoints resolve, and `authority_effect` is `none`.

Requested change: while semantic ownership remains unselected, require the relations array to be exactly empty. A distinct noncanonical relation-candidate surface is only an optional future design and would require separate authorization and evidence; it is not part of this change request.

Attack provenance: Abramsky initial finding 1; all three final positions.

### 5. MAJOR — Bind selectors to exact Lean declarations

The validator reduces a selector to its final component and accepts any occurrence of that leaf string in the source text. This does not establish namespace-qualified identity or declaration kind, although `sources.json` presents qualified selectors such as `Edge.WellTyped` and `FormalizesAssertion.Eligible` (`ontology-candidate/sources.json:24-36`).

Requested change: resolve the fully qualified declaration name and declaration kind through the frozen Lean environment, or use an equivalently exact declaration-form/namespace check that rejects comments, use sites, print commands, and ambiguous matches. Store the exact selector on each supported finding, not only on a coarse source record.

Attack provenance: Abramsky initial finding 2; Yanofsky initial finding 2; all three final positions.

### 6. MAJOR — Require a total disposition for all twelve sources

The validator checks only that each node's references are a subset of registered source IDs. Five registered sources are unreachable from every node: `SRC-AGENT-PERMISSION-KERNEL`, `SRC-EVIDENCE-CLOSURE`, `SRC-M6-COUNTER`, `SRC-SECOND-LAW-DISCRETE`, and `SRC-SYNTHESIS-REVISED` (`ontology-candidate/sources.json:12-21,51-81`). The explicit 12/12 table above also records the bounded disposition of all seven reachable sources.

Requested change: require every source to be either support for an exact finding-local selector or explicitly classified as corpus/context evidence, excluded evidence, or residue, with a reason. Do not manufacture semantic edges merely to satisfy coverage.

Attack provenance: Abramsky initial finding 3; Peirce initial finding 6; Yanofsky initial finding 3; all three final positions. Final consensus makes this MAJOR.

### 7. MAJOR — Validate every receipt and define currentness explicitly

The candidate invariant says a historical pass cannot become current evidence without exact request and binding currency (`ontology-candidate/invariants.json:18-21`). The validator, however, checks only minimal identity/binding fields on every receipt, then chooses the lexicographically last filename and validates content/package digests only for that file. The two receipts bind different schema/validator digests (`ontology-candidate/receipts/2026-09-01T23-29-23Z-validation.json:8-20`; `ontology-candidate/receipts/2026-09-01T23-31-02Z-validation.json:8-20`).

Requested change: validate each historical receipt for its own internal integrity under the applicable pinned receipt-schema and validator version: closed shape, digest formats, internally complete content-key set, package-digest derivation, unique append-only identity, and parseable timestamp. Do not compare an older receipt's historical content digests to current package bytes. Define currentness and supersession separately from historical integrity and do not derive either from filename order.

Attack provenance: Abramsky initial finding 4; Yanofsky initial finding 4; all three final positions.

### 8. MINOR — Separate proposed review responsibility from executable routing

Nodes use labels such as `ontology-governance`, `verification-owner-review`, and `domainspec-v2-admission-review` (`ontology-candidate/nodes.json:12,38,103`). The accepted research says these are proposed review responsibilities and not ownership assignment. The validator checks only that the list is non-empty.

Requested change: rename and type this facet as non-executable proposed review responsibility. Do not replace it directly with machine router IDs and do not infer owner selection.

Attack provenance: Yanofsky initially called the labels dangling routes, then retracted that formulation; Peirce explicitly refuted direct replacement with router IDs. Only the converged namespace-ambiguity finding is retained.

### 9. MAJOR — Remove or evidence the ambient materialization permission

The materialization decision says `"blockers": []`, names `CA2-ROUTE-IMPLEMENT`, and sets `"ontology_state_write_allowed": true` (`ontology-candidate/materialization.json:2-15`), while the profile still says semantic ownership is unselected and all authority claims are false (`ontology-candidate/profile.json:6-15`), and all nine prerequisite gaps remain unresolved (`ontology-candidate/residue.json:15-69`).

The frozen evidence does not prove that a historical package-materialization authorization exists. Requested change: represent the package as non-authorizing state, or separately evidence an immutable, exhausted, exact-scope historical authorization that binds the permitted paths/effects and `authority_effect=none`. In either case, the record must not authorize future ontology mutation.

The attacker disagreement is preserved as provenance: Yanofsky rated this **MAJOR**, while Abramsky and Peirce rated it **MINOR**. Both verifiers kept the finding and resolved the review severity as **MAJOR** because the frozen record exposes present-tense write permission without an immutable authorization binding.

### 10. MINOR — Pin and execute schema-version validation

The descriptive receipt definition leaves `schema_version` as an unconstrained string. Package content files also carry top-level version fields, but the manual validator checks their presence as part of exact-key shapes without executing the declared schema or rejecting unsupported version values.

Requested change: pin supported schema-version constants and execute the declared JSON Schema, or state precisely which manual validator is normative and test version rejection.

Attack provenance: Abramsky final position.

### 11. MINOR — Decouple immutable object validation from mutable checkout HEAD

Before validating commit/path/blob bindings, the validator fails unless the Lean repository checkout `HEAD` equals the frozen commit. This couples immutable Git-object evidence to mutable workspace state.

Requested change: validate the named commit object and its tree directly; report checkout-HEAD drift as a separate diagnostic unless the requested operation explicitly depends on the checkout.

Attack provenance: Yanofsky final position.

## Additional required surfaces

| Surface | Explicit disposition | Current target record |
| --- | --- | --- |
| Empty relation registry | Retain **exactly empty** while semantic ownership is unselected. No canonical edges are proposed, inferred, or adopted. | `ontology-candidate/relations.json:4-5` |
| `2026-09-01T23-29-23Z-validation.json` | Historical structural candidate evidence only under its own bindings. Its PASS is not current proof; its historical schema/validator digests must be assessed under the applicable pinned versions. | `ontology-candidate/receipts/2026-09-01T23-29-23Z-validation.json:2-22` |
| `2026-09-01T23-31-02Z-validation.json` | Historical structural candidate evidence only under its own bindings. Filename order establishes neither currentness nor supersession, and its PASS grants no authority. | `ontology-candidate/receipts/2026-09-01T23-31-02Z-validation.json:2-22` |
| Materialization | Retain CR-9 as **MAJOR** residue. The present-tense write allowance has no immutable authorization binding and supplies no future mutation authority. | `ontology-candidate/materialization.json:2-15` |
| Inventory | Degraded discovery-only residue: `machine_index_gap` means Inventory is not evidence authority and cannot replace direct inspection of target bytes. No Inventory mutation occurred. | repair dispatch `context` and coverage-attacker contract |
| Post-result indexing | Degraded lifecycle residue. No post-result indexing occurred; any indexing requires separately authorized continuation and cannot promote this review result. | repair dispatch `context` and coverage-attacker contract |

## Refuted formulations preserved as excluded

- **Excluded:** proposed review-responsibility labels are necessarily dangling machine routes.
- **Excluded:** direct replacement of proposed review-responsibility labels with router IDs.
- **Excluded:** the unreferenced `GAP-IMPLEMENTATION-BINDING` is an independent node defect; it remains an explicitly unresolved global D65 gap.
- **Excluded:** invented concept/generic-instance taxonomies or relation-contract/relation-instance ontologies.
- **Excluded:** any zero-findings red flag; both prior verifiers kept all eleven corrected change requests.

These exclusions do not weaken CR-8's retained namespace-ambiguity request and do not create semantic relations, owners, definitions, proof currency, D65 progress, or authorization.

## Preserved verifier convergence and repair handoff

The prior two independent verifiers returned `KEEP` on CR-1 through CR-11: CR-1 through CR-7 and CR-9 remain **MAJOR**; CR-8, CR-10, and CR-11 remain **MINOR**. This repair changes only the explicit coverage trail that the prior auditor found incomplete. It neither reopens nor upgrades the verified findings.

The repair verifier must compare every disposition above to the current frozen target records and return `KEEP`/`DROP` for all eleven change requests plus `PASS`/`FAIL` for every record disposition. The coverage auditor may return PASS only if all 8 node IDs, 12 source IDs, 8 invariant IDs, 9 gap IDs, the exactly empty relation registry, both receipts, materialization residue, degraded Inventory/post-result indexing residue, every retained and refuted formulation, and this claim ceiling remain explicit.

Verifier convergence or coverage completeness is review evidence only. It cannot constitute owner selection, ontology admission or acceptance, implementation or conformance, a current proof, publication, deployment, or external-effect authority.
