# Ontology Organization Review — Synthesized Findings

Dispatch: `2026-09-02-lean-corpus-ontology-organization-review`  
Frozen dispatch SHA-256: `b808fd2b19970d11b5f570c2d6f4f506e6ebb7a17d9ea706e644a29287b28bdc`  
Synthesis status: review evidence revised after both verifiers returned KEEP on CR-1 through CR-11; pending coverage audit

## Claim ceiling

This synthesis concerns the unregistered, private, `research-candidate` package `CA2-ONTOLOGY-CANDIDATE-DOMAINSPEC-LEAN-CORPUS-2026-09-01`. The frozen profile says `"semantic_owner_status": "unselected"`, `"authority_effect": "none"`, and sets admission, implementation-binding, and conformance claims to `false` (`ontology-candidate/profile.json:6-15`). The latest frozen receipt records package digest `a868c8e72665435dae5b444938c468e00f393e4e0d34a29da9533b360344f964` and `validation_result: pass` (`ontology-candidate/receipts/2026-09-01T23-31-02Z-validation.json:2-22`); the package contains two frozen receipts. These are historical structural candidate records only, not evidence of a current invocation.

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

This organization follows the accepted definition that a `ResearchFinding` contains “full supporting selectors, method, uncertainty, claim ceiling ... `promotion_prerequisite_gap`, and `authority_effect=none`” (`synthesis-revised.md:44-48`). It does not instantiate the research-only relation vocabulary described at `synthesis-revised.md:189-200` as canonical ontology edges.

## Ordered change requests

### 1. MAJOR — Restore the complete finding-local contract

The closed node schema requires only `definition`, an arbitrary `proposed_record_kind`, source IDs, review labels, and coarse gap IDs (`ontology-candidate/schema/package.schema.json:47-62`). It therefore cannot preserve the accepted per-finding supporting selectors, method, uncertainty, claim ceiling, or exact `promotion_prerequisite_gap`. The node projection visibly substitutes generic gap references, for example `RF-TYPED-DIRECTION` uses only `GAP-CANONICAL-DEFINITIONS` and `GAP-SEMANTIC-OWNER` (`ontology-candidate/nodes.json:6-16`), while the accepted row requires “Exact definitions, mapping bytes, build receipt, fidelity decision, owner selection” (`synthesis-revised.md:176-185`).

Requested change: extend the research-finding shape and all eight instances with exact supporting selector records, method, uncertainty, per-claim ceiling, and verbatim or losslessly structured finding-local prerequisite obligations. Preserve the nine global D65 gaps separately; do not treat a global gap ID as a replacement for a local obligation.

Attack provenance: Peirce initial findings 1 and 4; all three final positions. The independent standalone claim that unused `GAP-IMPLEMENTATION-BINDING` is itself a node defect was refuted and is not retained.

### 2. MAJOR — Correct the two demonstrated semantic distortions

`RF-DUAL-OWNER-ELIGIBILITY` currently says eligibility requires “the assertion owner and the formalization owner” (`ontology-candidate/nodes.json:19-29`), but the accepted synthesis identifies formal-claim and business-meaning review roles (`synthesis-revised.md:176-180`). `RF-PROJECTION-DISCLAIMER` says a projection “can preserve source-local semantics” (`ontology-candidate/nodes.json:58-68`), while the accepted source ceiling says the cited declaration defines only “a negative authority guard, not admissibility” (`synthesis-revised.md:126-134`).

Requested change: preserve the formal/fidelity evidence-role distinction without selecting owners. For projection, retain only the supported non-authority disclaimer and mark semantic preservation/admissibility unevaluated unless separately evidenced.

Attack provenance: Peirce initial findings 2 and 3; all three final positions.

### 3. MAJOR — Type proposed facets without creating ontology authority

The schema permits any string for `proposed_record_kind` (`ontology-candidate/schema/package.schema.json:52-59`), and `RF-TYPED-DIRECTION` collapses distinct structures into `"relation-and-invariant"` (`ontology-candidate/nodes.json:6-16`). The accepted handoff distinguishes `LeanDeclarationSource` and `ResearchFinding` records (`synthesis-revised.md:38-46`) and separately describes research-only support, review-responsibility, and prerequisite-gap relations (`synthesis-revised.md:189-200`).

Requested change: use a closed proposal grammar limited to the frozen-evidence distinctions `relation`, `predicate`, `invariant`, `mapping`, and `schema`. Type source/provenance and proposed review-responsibility fields separately. Do not introduce a concept taxonomy, a generic instance ontology, or relation-contract/relation-instance semantics. Every proposal remains explicitly noncanonical and `authority_effect=none`.

Attack provenance: Peirce initial finding 5; Abramsky and Yanofsky final positions.

### 4. MAJOR — Enforce the intentionally empty relation ceiling

The package truthfully records `"relations": []` because research does not establish canonical semantic relations (`ontology-candidate/relations.json:4-5`). Yet the validator accepts any relation whose ID is unique, endpoints resolve, and `authority_effect` is `none` (`ontology-candidate/scripts/validate.py:243-257`).

Requested change: while semantic ownership remains unselected, require the relations array to be exactly empty. A distinct noncanonical relation-candidate surface is only an optional future design and would require separate authorization and evidence; it is not part of this change request.

Attack provenance: Abramsky initial finding 1; all three final positions.

### 5. MAJOR — Bind selectors to exact Lean declarations

The validator reduces a selector to its final component and accepts any occurrence of that leaf string in the source text (`ontology-candidate/scripts/validate.py:167-174`). This does not establish namespace-qualified identity or declaration kind, although `sources.json` presents qualified selectors such as `Edge.WellTyped` and `FormalizesAssertion.Eligible` (`ontology-candidate/sources.json:24-36`).

Requested change: resolve the fully qualified declaration name and declaration kind through the frozen Lean environment, or use an equivalently exact declaration-form/namespace check that rejects comments, use sites, print commands, and ambiguous matches. Store the exact selector on each supported finding, not only on a coarse source record.

Attack provenance: Abramsky initial finding 2; Yanofsky initial finding 2; all three final positions.

### 6. MAJOR — Require a total disposition for all twelve sources

The validator checks only that each node's references are a subset of registered source IDs (`ontology-candidate/scripts/validate.py:234-235`). Five registered sources are unreachable from every node: `SRC-AGENT-PERMISSION-KERNEL`, `SRC-EVIDENCE-CLOSURE`, `SRC-M6-COUNTER`, `SRC-SECOND-LAW-DISCRETE`, and `SRC-SYNTHESIS-REVISED` (`ontology-candidate/sources.json:12-21,51-81`).

Requested change: require every source to be either support for an exact finding-local selector or explicitly classified as corpus/context evidence, excluded evidence, or residue, with a reason. Do not manufacture semantic edges merely to satisfy coverage.

Attack provenance: Abramsky initial finding 3; Peirce initial finding 6; Yanofsky initial finding 3; all three final positions. Final consensus makes this MAJOR.

### 7. MAJOR — Validate every receipt and define currentness explicitly

The candidate invariant says a historical pass cannot become current evidence without exact request and binding currency (`ontology-candidate/invariants.json:18-21`). The validator, however, checks only minimal identity/binding fields on every receipt, then chooses the lexicographically last filename and validates content/package digests only for that file (`ontology-candidate/scripts/validate.py:284-304`). The two receipts bind different schema/validator digests (`ontology-candidate/receipts/2026-09-01T23-29-23Z-validation.json:8-20`; `ontology-candidate/receipts/2026-09-01T23-31-02Z-validation.json:8-20`).

Requested change: validate each historical receipt for its own internal integrity under the applicable pinned receipt-schema and validator version: closed shape, digest formats, internally complete content-key set, package-digest derivation, unique append-only identity, and parseable timestamp. Do not compare an older receipt's historical content digests to current package bytes. Define currentness and supersession separately from historical integrity and do not derive either from filename order.

Attack provenance: Abramsky initial finding 4; Yanofsky initial finding 4; all three final positions.

### 8. MINOR — Separate proposed review responsibility from executable routing

Nodes use labels such as `ontology-governance`, `verification-owner-review`, and `domainspec-v2-admission-review` (`ontology-candidate/nodes.json:12,38,103`). The accepted research says these are proposed review responsibilities and “not ownership assignment” (`synthesis-revised.md:217-227`). The validator checks only that the list is non-empty (`ontology-candidate/scripts/validate.py:236-237`).

Requested change: rename and type this facet as non-executable proposed review responsibility. Do not replace it directly with machine router IDs and do not infer owner selection.

Attack provenance: Yanofsky initially called the labels dangling routes, then retracted that formulation; Peirce explicitly refuted direct replacement with router IDs. Only the converged namespace-ambiguity finding is retained.

### 9. MAJOR — Remove or evidence the ambient materialization permission

The materialization decision says `"blockers": []`, names `CA2-ROUTE-IMPLEMENT`, and sets `"ontology_state_write_allowed": true` (`ontology-candidate/materialization.json:2-15`), while the profile still says semantic ownership is unselected and all authority claims are false (`ontology-candidate/profile.json:6-15`), and all nine prerequisite gaps remain unresolved (`ontology-candidate/residue.json:15-69`).

The frozen evidence does not prove that a historical package-materialization authorization exists. Requested change: represent the package as non-authorizing state, or separately evidence an immutable, exhausted, exact-scope historical authorization that binds the permitted paths/effects and `authority_effect=none`. In either case, the record must not authorize future ontology mutation.

The attacker disagreement is preserved as provenance: Yanofsky rated this **MAJOR**, while Abramsky and Peirce rated it **MINOR**. Both verifiers kept the finding and resolved the review severity as **MAJOR** because the frozen record exposes present-tense write permission without an immutable authorization binding.

### 10. MINOR — Pin and execute schema-version validation

The descriptive receipt definition leaves `schema_version` as an unconstrained string (`ontology-candidate/schema/package.schema.json:87-102`). Package content files also carry top-level version fields, but the manual validator checks their presence as part of exact-key shapes without executing the declared schema or rejecting unsupported version values.

Requested change: pin supported schema-version constants and execute the declared JSON Schema, or state precisely which manual validator is normative and test version rejection.

Attack provenance: Abramsky final position.

### 11. MINOR — Decouple immutable object validation from mutable checkout HEAD

Before validating commit/path/blob bindings, the validator fails unless the Lean repository checkout `HEAD` equals the frozen commit (`ontology-candidate/scripts/validate.py:135-142`). This couples immutable Git-object evidence to mutable workspace state.

Requested change: validate the named commit object and its tree directly; report checkout-HEAD drift as a separate diagnostic unless the requested operation explicitly depends on the checkout.

Attack provenance: Yanofsky final position.

## Coverage map

| Required surface | Synthesis coverage |
| --- | --- |
| Eight nodes | All eight remain `ResearchFinding` records. `RF-TYPED-DIRECTION` and `RF-EDGE-GRAMMAR` are covered by typed relation/invariant proposals; `RF-DUAL-OWNER-ELIGIBILITY` and `RF-PROJECTION-DISCLAIMER` by semantic correction; `RF-REQUEST-INDEXED-CURRENTNESS` and `RF-EVIDENCE-DISCHARGE-SEPARATION` by contract/currentness preservation; `RF-LIFECYCLE-RESIDUE` and `RF-SEMANTIC-PROVENANCE-ENVELOPE` by typed mapping/schema proposals plus lifecycle residue. |
| Twelve sources | CR-6 requires total disposition. Seven currently reachable sources remain support candidates; the five named unreachable sources require explicit context/exclusion/residue disposition. |
| Eight invariants | All eight IDs in `invariants.json` are retained as candidate invariants. CR-2 corrects the meanings feeding dual-owner and projection invariants; CR-4 protects relation non-adoption; CR-7 enforces currentness; `INV-RESEARCH-CEILING` remains the global ceiling. |
| Nine prerequisite gaps | All nine in `residue.json` remain unresolved global residue. CR-1 restores distinct finding-local prerequisites and includes `GAP-IMPLEMENTATION-BINDING` in global closure without inventing a standalone node defect. |
| Empty relation registry | Covered by CR-4; no canonical relation is proposed or adopted. |
| Two receipts | Covered by CR-7; each remains a historical record whose internal integrity is evaluated under its applicable pinned version. Currentness and supersession are separate evaluations. |
| Degraded Inventory and post-result indexing | Inventory remains a degraded discovery projection, not authority. This review performs no Inventory mutation or post-result indexing; both remain explicit lifecycle residue for a separately authorized continuation. |
| Refuted formulations | Dropped: “review labels are necessarily dangling routes,” direct substitution with router IDs, the unused implementation-binding gap as an independent defect, and invented concept/generic-instance or relation-contract/relation-instance ontologies. No zero-findings red flag applies: both verifiers KEEP all eleven corrected requests. |

## Coverage-auditor handoff

Both verifiers returned KEEP on CR-1 through CR-11 subject to the corrections incorporated above. The coverage auditor should confirm the complete surface mapping, the resolved MAJOR materialization finding, and the preserved ceiling. Any later remedy must still reject canonical meaning, relation adoption, owner selection, D65 advancement, or authority inferred from a frozen validation receipt.
