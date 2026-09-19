# Confirmed feedback traversal: synthesizer -> reviewers, round 1

This is the single global feedback loop authorized by the confirmed dispatch sheet. It consumes one of two `synthesizer -> reviewers` zig-zag capacities and the dispatch-wide `max_loops: 1` capacity.

Read only:

- `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/reviews/round-1/synthesis-input.json`
- `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/skeptic-precedent.json`
- `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/skeptic-non-vacuity.json`
- `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/skeptic-definitional.json`
- the previously admitted `research.md` and three explorer receipts when an exact source binding is required

Return one complete revised synthesis receipt in the response. Do not write files. Do not inspect or mutate canonical DomainSpec, CyberAlchemy v2, Arcanum, Inventory, telemetry, or Git surfaces.

The revision must:

1. Treat TOP-03 only as a conditional design recommendation. Canonical adoption and non-vacuity remain blocked. TOP-02 remains the automatic authority-correct fallback if no shared syntactic owner is ratified.
2. Make the common contract genuinely syntax-only: stable identity, immutable version/digest, provenance pointer, exact typed reference, source binding, and assertion limit. Owner-local kind schemas, relation semantics, lifecycle events, transition rules, obligation discharge, and status meanings must not be shared semantics.
3. Separate `semantic_owner_ref`, `lifecycle_authority_ref`, `promotion_authority_ref`, `authority_kind_ref`, and derived `external_mapping_refs`. Separate materialization origin, authority posture, record currentness, obligation status, evaluation outcome, and projection freshness.
4. Separate observational evidence, formal proof object, proof-checker execution evidence, evaluator receipt, attestation statement/mechanism/verifier receipt, lifecycle decision, and publication authorization. Catalogs may carry only exact immutable pointers or explicitly derived adapters unless the producing owner adopts the record itself.
5. Add an exact claim-evidence table for every load-bearing topology and owner claim: full local path or primary-source URI, exact selector, complete digest or immutable version, explorer receipt path and digest, evidence scope, and observed/executed/unverified status. External precedent remains design evidence, never local authority.
6. Convert the absent complete EVF execution chain into an explicit typed evidence-readiness blocker. Do not imply a complete positive witness, non-vacuity, discharge, reproducibility, or readiness. Keep the stale-runtime example a specific planned currentness blocker, not a successful domain negative control.
7. Define the seven requested negative cases as version-exact fixture contracts with expected validator, first stop, forbidden effects, and current status. Because execution is outside this research scope, mark unexecuted cases and receipts as missing; do not fill them with prose evidence.
8. Decompose validation ownership: common validator checks syntax only; DomainSpec validators own DomainSpec meaning and discharge inputs; CAV2 validators own authority, privacy, and promotion; projection validators own exact regeneration and publication authorization; any aggregate command only orchestrates.
9. Bound the machine index to proof-obligation projection, deny Inventory/discovery/authority/promotion powers, and require exact generator/input/policy bindings.
10. Move the complete EVF witness out of owner gates into evidence-readiness blockers. Preserve all genuine owner gates, add cross-project mapping and publication-authority gates, and return a dependency-ordered non-executed Work Pack.

Return status `revised`, include the prior synthesis digest and all three review digests, preserve the original claim ceiling, and state whether the repaired result is ready for one final review pass or remains blocked without further owner or execution authority.
