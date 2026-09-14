# Craft ORODI Product Capabilities

This private package owns six CAV2-D67 Product Capability records for the Craft
Product lineage formerly named DomainSpec v2. `CA2-PROJECT-CRAFT`
coordinates them through `CA2-GOAL-CRAFT-ORODI-INTEGRATION` without becoming
the Product, capability meaning, ontology authority, implementation, or runtime.

The six records cover offline evidence evaluation, denied runtime projection,
canary evaluation, rollback verification, a run-ready local lab, and separately
gated local commissioning. Their record digests are frozen in
`immutable-records.json`; a material outcome, Product, scope, or owner change
requires a successor record.

`admission-owners.json` identifies the only routes that can adopt the Product
Capabilities or admit the business ontology and DomainSpec profile. The exact
six-record manifest is adopted in `admission-decisions.json` with all six
identities preserved. The registry binds the standalone immutable owner-decision
record by digest. Business ontology and DomainSpec profile admission remain
pending.

The frozen records retain their candidate-time `awaiting-product-owner-adoption`
posture because those bytes are the immutable object of the decision. The
separate admission-decision registry is the current owner-authorized state
overlay; it does not rewrite the evidence that was reviewed.

Validation proves shapes, sources, reference closure, record digests, Project
and Goal closure, and the exact owner decision. It does not admit the business
ontology or DomainSpec profile, establish implementation conformance or runtime
truth, commission, publish, release, or deploy anything.

Run the validator directly from either the historical umbrella checkout or the
current extracted sibling checkout:

```bash
python3 product/craft/capabilities/orodi/scripts/validate.py
python3 -m unittest product.craft.capabilities.orodi.tests.test_validate_layout
```

A nonzero result preserves current source, schema, Project, or admission drift;
it must not be converted into a fresh owner decision by updating digests.

## Related work and current reconciliation

[Related work](RELATED-WORK.md) connects the definitions, promotion record, ontology,
successor, implementation, operator interface, alerts, DomainSpec bindings, Alch event
integration, and Craft coordination to these existing capability identities.
It owns the current open questions and distinguishes runnable product construction
from canonical-definition reconciliation and deferred commissioning. Historical
status statements above are not a fresh verification of their source dependencies.

## Current definition admission

[Reconciliation and admission](definition-reconciliation/README.md) resolves the
missing CAV2-D83 through CAV2-D92 sections from the exact selected source voices.
`definition-bindings.json` now selects language v3 and the new digest-bound Craft
semantic decision. The six capability identities are preserved. This admission
covers definitions only; historical ontology/profile and runtime claims are not
revalidated by it. Open questions are tracked in the reconciliation package.
