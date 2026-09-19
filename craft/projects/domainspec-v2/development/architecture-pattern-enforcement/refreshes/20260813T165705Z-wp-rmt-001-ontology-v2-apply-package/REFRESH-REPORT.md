# Invoke Refresh report — WP-RMT-001 ontology v2 apply package

## Result

- Package authoring: pass.
- Exact staged target inventory: 5/5.
- Immutable raw modified-target preimages: 3/3.
- Archived-v1 validation: pass after a staged-only correction to respect `cycle_policy: not-applicable`.
- V2 schema, implementation, relation, projection, promotion-gate, and hostile validation: pass.
- Ordinary staged validator invocation with no environment overrides or private flags: pass.
- Live-like installed-path simulation with no environment overrides or private flags: pass.
- Ordinary validator coverage: 23 legacy check groups; 2/2 JSON Schema contracts and 2/2 full admitted-ontology cross-schema integrations; 9/9 owner-gate negative controls; 5/5 structural regressions; 3/3 semantic relation/subtype positives; 19/19 count-aware mixed-population positives; 29/29 semantic hostiles; 9/9 projection-root hostiles; and 10/10 standalone-schema negatives.
- Acceptance-claim regression coverage: 4/4, comprising one exact positive gate and three current-acceptance inflation hostiles.
- Decision evidence: 3/3 exact artifacts; canonical gate presented REL-A/REL-B/REL-D and the user selected `REL-A`.
- Proposal binding: historical base only; amended exact-byte owner acceptance is required and absent.
- Historical proposal acceptance: accepted.
- Amended package acceptance: absent.
- Schema installation authorization: absent.
- Current staged state: 6 implementation instances / 0 supporting instances / 0 materialized relation instances / 4 deferred relation blueprints / 0 PromotionRecords.
- Live targets: unchanged.
- Candidate bytes: unchanged.
- Independent exact-byte audit: pending.
- Apply authorization: absent.

## Exact package

- Manifest: `apply-manifest.json`
- Material package: `material/MATERIAL-PACKAGE.json`
- Material receipt: `material/MATERIAL-RECEIPT.json`
- Validation result: `VALIDATION-RESULT.json`
- Staged postimages: `material/staged/`
- Immutable raw preimages: `material/preimages/`
- Relation-ownership decision evidence: `decisions/`

The package contains exactly two added-schema postimages and three modified-target postimages. The live baselines still match the accepted proposal: both schema paths are absent; the ontology is `2b36051d...6003` / 125,549 bytes; the projection is `1999767a...6cc5` / 26,798 bytes; and the validator is `ab191dfe...cb9a` / 32,088 bytes.

## Staged semantic state

The ontology postimage preserves the exact v1 definition-source catalogue and five definition catalogues. It contains six evidence-bound implementation instances, zero supporting instances, zero materialized relation instances, four deferred relation blueprints, and zero PromotionRecords.

Every implementation retains separate definition, evidence, admission, authority, and meta-type-maturity axes. Every staged implementation remains `not-admitted` with `authority_effect: none`; there is no current relation instance to admit.

The v2 projection preserves all 25 prior meta-type rows and adds exact derived implementation, supporting, and relation views. The current derived views contain 6/0/0 rows. Its policy explicitly forbids lifecycle authorship and authority grants.

REL-A remains the selected historical design amendment: a relation-owner candidate and evidence may be independent from the source and target candidates and evidence. It does not make any edge materializable by itself. Each edge must have one exact per-edge `relation_assertion_ref`; each endpoint must bind its own candidate ID, exact candidate/projection-receipt/terminal-receipt evidence, and an `endpoint_assertion_ref` that resolves the asserted endpoint identity and architecture type. A relation PromotionRecord must preserve those exact relation and endpoint bindings in its accepted subject scope.

## Validator repair disclosed

The unchanged current validator rejected `architecture.constructed_by` and `architecture.validated_by` because its legacy rule treated every value-constraining relation as cycle-applicable. Both accepted definitions explicitly use `cycle_policy: not-applicable`. The staged validator narrows that rule only for this case: applicable value-constraining relations must still be acyclic. The exact archived-v1 ontology, projection, profiles, fixtures, and expected outputs then pass all 23 legacy check groups. No live validator was repaired.

## Validation boundary

The live validator discovers the repository upward from its own installed or staged location, resolves the exact v1 archive through `historical_preimage_refs` and `historical_projection_ref`, verifies containment plus hash and size, reads the current v2 ontology and projection from its own target directory, and runs its v2 checks internally. It contains no timestamped apply-package path and does not invoke the package validator.

The separate package validator binds the historical proposal receipt and 12-material digest, the exact three-file Decision Gate chain, and an explicit bounded-amendment contract requiring fresh acceptance. It rehashes all 15 historical accepted inputs and five live baselines; checks exact raw preimages, amended staged hashes, path containment, regular-file/no-symlink hygiene, UTF-8 and whitespace; executes Draft 2020-12 validation with Python `jsonschema`; runs the ordinary validator and a temporary live-like installed-path simulation without environment overrides; checks exact v1 catalogue continuity; checks six implementation rows, zero supporting rows, zero materialized relation rows, four deferred relation blueprints, five independent axes, zero PromotionRecords, exact derived projections, the unchanged historical 37/37 hostile catalogue bound by the accepted proposal, and the separate live semantic regression matrix; and verifies rollback and authority ceilings.

An independent audit rejected an earlier staged validator because it hard-required the package's then-current six implementation, zero supporting, three relation, and zero PromotionRecord state, which made the schema's future owner-gated admissions unreachable. That freeze is superseded. Exact current-state assertions now remain in the package validator, while the live validator accepts variable typed populations and validates both non-admitted and admitted states. Its ordinary no-environment run internally proves one admitted implementation path and one admitted relation path as synthetic in-memory fixtures, plus nine owner-gate negative paths, including exact subject, candidate, evidence, immediate-predecessor, owner-decision, accepted-scope, one-to-one record, and ontology plus standalone-projection bindings. Both full admitted documents traverse the ontology schema's exact external PromotionRecord `$id`; the compatibility transform is fail-closed to the historical proposal schema's one-root-ID/local-JSON-Pointer shape. Five further regressions cover relation meta-type ownership, endpoint identity collision, exact projection source path, a cross-family `constructed_by` pair, and a two-edge `composed_from` cycle. Supporting instances and relations touching them remain non-admissible. No simulated relation or PromotionRecord is written into this package's ontology.

A later consolidated audit found that independent source-type and target-type membership was too weak, supporting types and lifecycle evidence were self-asserted, count claims were staleable, `cycle-permitted` was schema-unrepresentable, PromotionRecord subject kinds were insufficiently closed, and same-candidate relation ownership prevented real architecture edges. The user selected REL-A through the Decision Gate. The amended validator now uses cycle-safe subtype closure while preserving explicit family pairs, checks supporting eligibility, semantically closes candidate/receipt/terminal evidence and lifecycle axes, binds exact variable counts, accepts valid cycle-permitted transitions, and validates independent relation-owner/source/target evidence through PromotionRecord scope. These controls execute in ordinary and installed-path validation; the historical hostile catalogue bound by the accepted proposal remains unchanged at 37/37 and the separate ordinary matrix now reports 3/3 semantic positives, 19/19 count-aware mixed-population positives, 29/29 semantic hostiles, 9/9 projection-root hostiles, and 10/10 standalone-schema negatives.

The first implementation of the new positive simulations failed at the external PromotionRecord schema boundary because Python `jsonschema` 4.10.3 reset resolver scope for the referenced schema's local fragments. A disconnected ontology-with-empty-records plus standalone-record check was briefly tested and explicitly rejected because it did not prove the actual external integration. The final validator retains the ontology schema's exact external `$ref`, binds that exact PromotionRecord `$id`, and uses a guarded in-memory compatibility copy with absolute forms of its local JSON Pointer refs. It fails closed if the accepted one-root-ID/local-pointer assumptions change. Both the live validator and the independent package validator now validate the two full admitted ontology documents through that integrated path.

A final relation-provenance review found that the current Enum candidate's `/composition` row names three language nodes but does not supply a stable per-edge relation assertion, an exact source identity, exact source and target architecture types, or endpoint candidate assertion references. Treating those names as three exact graph edges would infer evidence the candidate does not contain. The repair preserves the finding and demotes the three Enum `architecture.composed_from` rows from `relation_instances` into one fourth `deferred-exact-endpoint-materialization` blueprint. The schemas and validator still support REL-A relations when exact `relation_assertion_ref`, relation-owner evidence, and independent source/target endpoint assertion evidence are present; the current staged ontology truthfully materializes none.

## Rollback boundary

Before any PromotionRecord exists, a separately authorized rollback may restore the three exact raw preimages and remove only the two added schemas. Any PromotionRecord blocks v1 restoration under this v2 model. A separately proposed, validated, and owner-accepted reversal/export schema is required before reconsideration.

## Boundary and next gate

The final governance audit found one wording defect in the package validator output: an affirmative unqualified schema/package gate conflated the historically accepted proposal with the amended package. This repair makes the gates explicit—historical proposal acceptance is accepted; amended package acceptance, schema installation authorization, and apply authorization are absent—and permanently rejects current package or schema acceptance claims. The parent task reverified only this isolated governance-mechanics repair; no chat artifact was fabricated as package evidence.

This report proves only that a separately staged, amended five-target package exists and passes its declared validation. The terminal `APPLY-PACKAGE-RECEIPT.json` remains absent until independent exact-byte audit passes. Because the relation-provenance repair changed acceptance-bound ontology, projection, schema, and validator bytes after the historical proposal, fresh exact owner acceptance of the amended package digest is required before any live apply.

No live target, candidate, candidate receipt, registry, lifecycle authority, publication surface, release, or deployment was changed. REL-A selection and synthetic validator admissions confer no live or candidate authority. Live apply, candidate mutation or migration, implementation or relation admission, PromotionRecord creation, and promotion remain unauthorized.
