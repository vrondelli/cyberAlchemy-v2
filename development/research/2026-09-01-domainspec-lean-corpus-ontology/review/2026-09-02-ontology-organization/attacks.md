# Ontology Organization Review — Attack Record

Dispatch: `2026-09-02-lean-corpus-ontology-organization-review`

This record preserves the initial and final positions of the three read-only attackers. These are review findings, not ontology changes or authority decisions.

## Initial position — Abramsky, Samson (mechanics/correctness)

1. **MAJOR — Empty relation registry is documented but not enforced.**

   Evidence: `ontology-candidate/relations.json:4-5` says `"relations": []` because accepted research does not establish canonical semantic relations. Yet `scripts/validate.py:243-257` accepts any non-empty relation set when IDs are unique, endpoints resolve, and `authority_effect` is `none`; relation `type` is otherwise unconstrained.

   Proposed fix: require `relations == []` while `semantic_owner_status` is unselected, or introduce an explicit noncanonical relation-candidate shape and validated lifecycle gate.

2. **MAJOR — Declaration selectors are only substring checks, not exact Lean declaration bindings.**

   Evidence: `scripts/validate.py:171-174` reduces every selector to its last component and accepts it when `leaf in text`. This can pass a comment, use site, `#print`, or differently namespaced declaration. The live audit happened to find genuine declaration sites for all selectors, including `Edge.WellTyped` at `SpecificationOntologyKernel.lean:145` and `wrongDirection_rejected_of_final_batch` at `CAV2EdgeGrammarComposition.lean:107`, but the validator does not prove that exactness.

   Proposed fix: resolve fully qualified names through Lean elaboration/environment inspection, or minimally require a declaration-form match plus reconstructed namespace and reject ambiguous hits.

3. **MAJOR — Source-to-finding closure is one-way and leaves five registered sources unreachable.**

   Evidence: `scripts/validate.py:234-235` checks only that node references are subsets of source IDs; it never checks reverse coverage. Independent live result: 12 sources, 7 used, with `SRC-AGENT-PERMISSION-KERNEL`, `SRC-EVIDENCE-CLOSURE`, `SRC-M6-COUNTER`, `SRC-SECOND-LAW-DISCRETE`, and `SRC-SYNTHESIS-REVISED` orphaned.

   Proposed fix: require every source to have a reverse reference, or classify unreferenced material explicitly as corpus/context evidence outside the finding-support registry.

4. **MAJOR — Receipt currency can be selected by filename and receipt fields are under-validated.**

   Evidence: `scripts/validate.py:288-303` lexically sorts filenames and checks content/package currency only for `paths[-1]`; it does not validate `validated_at`, `receipt_id`, `validator`, schema version, digest shapes, or content-key closure for every receipt. The latest named receipt matches all ten content digests, while the earlier historical receipt differs in exactly the schema and validator bytes.

   Proposed fix: validate every receipt against its full receipt schema and append-only identity rules, then select currentness using a parsed, unique timestamp/supersession relation rather than filename ordering.

No CRITICAL finding: the live validator returned `result: pass`, package digest `a868c8e72665435dae5b444938c468e00f393e4e0d34a29da9533b360344f964`; all three research-artifact SHA-256 values, all nine commit/path/blob bindings, current selector declaration sites, unique IDs, existing endpoint references, and latest receipt digests independently matched. These are structural candidate results only, not admission or authority.

## Initial position — Peirce, Charles Sanders (semantic fidelity/typed grammar)

1. **MAJOR — The node schema cannot preserve the accepted `ResearchFinding` contract.**

   Evidence: `synthesis-revised.md:46` defines a finding as containing full supporting selectors, method, uncertainty, claim ceiling, and `promotion_prerequisite_gap`. Yet `ontology-candidate/schema/package.schema.json:50-62` permits only a prose definition, free-form `proposed_record_kind`, source IDs, routes, coarse gap IDs, status, and authority fields. All eight nodes therefore omit method, uncertainty, per-claim ceiling, exact selector attribution, and accepted prerequisite text.

2. **MAJOR — `RF-DUAL-OWNER-ELIGIBILITY` misnames formal roles and drops the predicate distinction.**

   Evidence: `nodes.json:22-23` says the predicate requires the assertion owner and formalization owner. At commit `169d4a46…`, `SpecificationOntologyKernel.lean:188-195` requires role-distinct formal/fidelity receipts binding the same assertion with `.accept` and `.acceptFidelity`. The accepted synthesis calls these formal-claim and business-meaning review roles.

3. **MAJOR — `RF-PROJECTION-DISCLAIMER` asserts semantic preservation that its cited Lean declaration does not model.**

   Evidence: `nodes.json:61` says a projection can preserve source-local semantics. `SpecificationOntologyKernel.lean:344-353` gives `IntegratedProjection` only input digests, output digest, and `claimsAuthority`; `DisclaimsAuthority` means solely `claimsAuthority = false`, with an explicit warning that this is not a complete admissibility judgment.

4. **MAJOR — Finding-specific prerequisite gaps were replaced by coarse D65 labels.**

   Evidence: `synthesis-revised.md:178-185` preserves distinct requirements for each finding, while `nodes.json` references only generic D65/owner gaps, losing these obligations.

5. **MAJOR — Relation contract, relation instance, predicate, and invariant are collapsed into opaque strings.**

   Evidence: `nodes.json:9-10` uses `proposed_record_kind: "relation-and-invariant"`, while the schema accepts any string. `RelationKind`, `Edge`, and `Edge.WellTyped` are distinct at `SpecificationOntologyKernel.lean:133-148`. The empty relation registry is honest, but the node does not preserve these distinctions.

6. **MINOR — Five registered sources have no traceability edge or residue explanation.**

   The unused sources are `SRC-AGENT-PERMISSION-KERNEL`, `SRC-EVIDENCE-CLOSURE`, `SRC-M6-COUNTER`, `SRC-SECOND-LAW-DISCRETE`, and `SRC-SYNTHESIS-REVISED`.

Proposed remedies: extend the research-finding shape with exact accepted fields; correct the dual-owner language; retain only the projection disclaimer while marking semantic preservation unevaluated; add finding-local prerequisites; type source-local facets without creating canonical relations; add provenance/closure references and explicit exclusions. No repository files were modified.

## Initial position — Yanofsky, Noson (ownership/reference integrity)

Structural check: `PASS`, package digest `a868c8e72665435dae5b444938c468e00f393e4e0d34a29da9533b360344f964`, two receipts. This is candidate validation only.

1. **MAJOR — Proposed review routes are dangling, non-canonical identifiers.**

   Evidence: all nodes use labels such as `ontology-governance`, `definitions-governance`, and `domainspec-v2-admission-review`, while the machine registry declares IDs such as `CA2-ROUTE-IMPLEMENT`, `CA2-ROUTE-DEFINITIONS`, and `CA2-ROUTE-GOVERNANCE`. `validate.py:236-237` checks only that the array is non-empty.

2. **MAJOR — Exact declaration selector validation is only an unanchored leaf-substring test.**

   Evidence: `validate.py:171-174` strips each qualified selector to its leaf and tests only `leaf in text`; nodes refer to a coarse source ID rather than the exact supporting selector.

3. **MAJOR — Source-to-finding provenance is incomplete and unauditable.**

   Five of twelve declared sources are unused by all eight nodes, and the validator does not require every source to be used or explicitly excluded.

4. **MAJOR — Historical receipt validation can be gamed.**

   Evidence: `validate.py:288-299` checks every receipt only for minimal top-level properties and verifies content/package digests only for the lexicographically last filename. The descriptive schema is not invoked.

5. **MAJOR — Materialization authority is asserted without an immutable authorization binding.**

   Evidence: `materialization.json:9-14` says `blockers: []`, owner route `CA2-ROUTE-IMPLEMENT`, and `ontology_state_write_allowed: true`; yet `residue.json` records all D65 predecessors unresolved, including semantic owner unselected, and `profile.json` separates operational routing from semantic ownership.

6. **MINOR — Per-node prerequisite closure omits one declared D65 gap entirely.**

   `GAP-IMPLEMENTATION-BINDING` is referenced by no node; subset validity does not establish required/global gap coverage.

Proposed remedies: validate registry-backed route IDs or mark review roles non-executable and unselected; bind exact selector records; require a disposition for all sources; validate every receipt and explicit supersession; replace the ambient write boolean with a scoped historical materialization decision reference; distinguish global from node-specific gaps.

Claims that withstood attack: all three research-artifact digests match; all nine commit/path/blob bindings resolve at `169d4a46aeaafba62c8bad127fc0522c3223e962`; the latest receipt matches the current ten-file package digest; ownership non-selection and authority ceilings are explicit; the empty relation registry honestly avoids canonical semantic relations. No admission, acceptance, implementation, conformance, publication, or external-effect authority is established.

## Final positions after robot talks

### Abramsky, Samson

No CRITICAL finding. Abramsky agrees that the normalized node projection loses required `ResearchFinding` fields, mislabels the dual formal/fidelity roles, overclaims projection semantics, flattens finding-specific prerequisites, ambiguously names non-executable review responsibilities as routes, uses inexact selectors, leaves five sources undisposed, and under-validates receipt history. He retains all four initial findings, downgrades ambiguous materialization authorization provenance to MINOR, drops the unreferenced implementation-binding gap as an independent finding, and adds a MINOR executable-schema-version finding.

Prioritized requests:

1. **MAJOR:** Restore the complete finding-local contract: exact supporting selectors, method, uncertainty, claim ceiling, and exact local prerequisites distinct from global D65 residue.
2. **MAJOR:** Correct unsupported node semantics for formal/fidelity owner roles and projection disclaimer.
3. **MAJOR:** Type concept, predicate, relation-contract, relation-instance, invariant, mapping, schema, and review-responsibility facets.
4. **MAJOR:** Enforce empty relations while semantic ownership is unselected.
5. **MAJOR:** Resolve Lean selectors through exact declarations.
6. **MAJOR:** Require a disposition for all twelve sources.
7. **MAJOR:** Validate every receipt and explicit currentness/supersession semantics.
8. **MINOR:** Bind materialization permission to immutable, exhausted historical scope.
9. **MINOR:** Pin and execute schema-version validation.

Verified baseline remains structural only: package digest `a868c8e72665435dae5b444938c468e00f393e4e0d34a29da9533b360344f964`; current artifact hashes, commit/path/blob bindings, declaration sites, IDs, endpoints, and latest receipt bytes match.

### Peirce, Charles Sanders

No CRITICAL finding. Peirce agrees with the four mechanics findings and the selector, provenance, receipt, ambiguous review-responsibility, and materialization-provenance concerns. He refutes replacing review responsibilities directly with router IDs because that would collapse semantic responsibility into operational routing authority. He also rejects the unreferenced implementation-binding gap as an independent node defect and downgrades the materialization issue to MINOR. He upgrades undisposed sources to MAJOR and adds that receipt validation contradicts the candidate's own currentness invariant.

Prioritized requests:

1. **MAJOR:** Enforce the empty relation ceiling.
2. **MAJOR:** Replace substring selectors with exact declaration identities.
3. **MAJOR:** Restore the accepted `ResearchFinding` contract.
4. **MAJOR:** Correct semantic distortions in dual-owner eligibility, projection disclaimer, typed direction, lifecycle residue, and the semantic/provenance envelope.
5. **MAJOR:** Require a disposition for all twelve sources.
6. **MAJOR:** Validate receipts through explicit currency and supersession semantics.
7. **MAJOR:** Separate proposed review responsibility from operational routing.
8. **MINOR:** Bind materialization permission to immutable historical authorization evidence.

### Yanofsky, Noson

No CRITICAL finding. Yanofsky agrees on empty-relation enforcement, exact declaration binding, total source disposition, receipt hardening, restoration of the complete finding contract, corrections to dual-owner and projection semantics, and typed proposed facets. He retracts the claim that review labels are necessarily dangling routes and reframes it as MINOR namespace ambiguity. He merges the standalone implementation-gap issue into the broader prerequisite-loss finding, keeps materialization authorization binding at MAJOR, and adds a MINOR finding that immutable commit-object validity is improperly coupled to mutable checkout HEAD.

Prioritized requests:

1. **MAJOR:** Restore exact per-finding selectors, method, uncertainty, ceiling, prerequisites, and evidence disposition.
2. **MAJOR:** Replace substring matching with qualified declaration-kind resolution.
3. **MAJOR:** Enforce empty relations while ownership is unselected.
4. **MAJOR:** Correct formal/fidelity and projection-disclaimer semantics.
5. **MAJOR:** Type proposed facets and reject arbitrary record-kind strings.
6. **MAJOR:** Give all twelve sources a total disposition.
7. **MAJOR:** Preserve local prerequisites and explicit global D65 closure.
8. **MAJOR:** Harden every receipt and supersession/currentness rule.
9. **MAJOR:** Replace ambient write permission with immutable scoped historical authorization.
10. **MINOR:** Separate review responsibilities from executable routes.
11. **MINOR:** Separate frozen Git-object validity from checkout-HEAD diagnostics.

The three final positions preserve the same ceiling: review-only change requests for an unregistered private research candidate. They establish no canonical meaning, owner selection, relation adoption, implementation, conformance, admission, enforcement, publication, release, deployment, or external effect.

## Verifier convergence

Both independent verifiers returned `PASS` on final `findings.md` SHA-256 `a3e758a5f5319c19ebac9f89602021979d682a2ddb709cc275b6cafcc12f7a33`.

- Gödel: `KEEP` CR-1 through CR-11; CR-1 through CR-7 and CR-9 MAJOR, CR-8/CR-10/CR-11 MINOR. The final precision correction to CR-10 is accepted. No blocker-level formal-evidence objection remains.
- Hacking: identical dispositions and severities. CR-9 is MAJOR and supplies no fallback mutation authority. No blocker-level authority/scope objection remains.

Verifier convergence does not constitute final approval; coverage audit remains downstream.

## Coverage audit — Loregian, Fosco

Verdict: **FAIL**. Parent final approval cannot proceed for the frozen findings digest.

| Required surface | Result | Audit |
| --- | --- | --- |
| Frozen dispatch and findings digests | PASS | Both exact digests match |
| Eight nodes | PASS | Every node ID is explicitly mapped |
| Twelve sources | FAIL | Seven source IDs lack explicit per-source disposition |
| Eight invariants | FAIL | Only `INV-RESEARCH-CEILING` is explicitly named |
| Nine prerequisite gaps | FAIL | Six gap IDs are not explicitly named |
| Empty relations | PASS | CR-4 preserves and enforces the empty ceiling |
| Two receipts | PASS | Both files and their differing bindings are addressed |
| Degraded Inventory/indexing residue | PASS | Retained as non-authoritative lifecycle residue |
| Refuted formulations and claim ceiling | PASS | Retractions are dropped and authority remains bounded |

Exact omissions:

- Sources: `SRC-FINDINGS`, `SRC-SPEC-ONTOLOGY-KERNEL`, `SRC-SPEC-ONTOLOGY-INDEPENDENCE`, `SRC-AUTHORITY-LIFECYCLE-RESIDUE`, `SRC-EDGE-GRAMMAR-FIXTURE`, `SRC-EDGE-GRAMMAR-COMPOSITION`, `SRC-EVIDENCE-ENVELOPE-BOUNDARY`.
- Invariants: `INV-TYPED-DIRECTION`, `INV-DUAL-OWNER-NON-SELECTION`, `INV-CURRENTNESS-BOUND`, `INV-EVIDENCE-NOT-DISCHARGE`, `INV-PROJECTION-NON-AUTHORITY`, `INV-RESIDUE-NOT-PROMOTION`, `INV-ENVELOPE-NON-AUTHORITY`.
- Gaps: `GAP-PRODUCT-CAPABILITY`, `GAP-BUSINESS-ONTOLOGY`, `GAP-DOMAINSPEC-SOURCE`, `GAP-COMPILED-SYSTEM-ONTOLOGY`, `GAP-CONFORMANCE-EVIDENCE`, `GAP-CURRENT-BUILD`.

The aggregate phrases “seven support candidates,” “all eight IDs,” and “all nine” do not meet the dispatch's per-record audit-trail requirement. The confirmed graph has no coverage-auditor-to-writer feedback edge, so this dispatch preserves the gap rather than silently extending its execution graph.
