# B03 — ORODI recovery evaluator prototype

B03 adds a distinct, closed recovery evidence contract and a pure evaluator inside ORODI. Existing operational contracts and entrypoints are unchanged. BoundReference and EvidenceState are imported from ORODI.

The caller supplies exact JSON text and independently pins the expected binding digest and evaluation instant. The evaluator checks duplicate keys, closed shapes, all 18 reference roles, document hashes, binding lifetime, invalidation digest, scenario identity, all 60 required slots and source selectors. It compares selected facts with equality predicates in the bound scenario contract. Supplied PASS labels do not bypass comparisons. Receipts preserve unknown runtime outcomes, causal non-pass states and original source selectors.

Historical integrity is a separate claim from fresh observation. A historical record cannot acquire freshness by setting the evaluation time. Fresh-mode normalized records require a separately bound observer and valid capture interval. Formation-only F26 and mixed F27/F30 retain their classes. The evaluator has no database, network, process, clock-read or effect callback API.

## Practical boundary

This tests normalized-fact evaluation with synthetic documents. It does not establish that those documents accurately represent database behavior, observer independence, timing provenance or non-interference. B04 must implement and test that bridge, map meaningful predicates for all original recovery constraints, enforce observer and attribute policies, and import historical results without laundering them into fresh evidence. B05 then tests an exact composite against the real recovery campaign.

`compiled-system.json` contains the serialized executable schemas and the explicit prose-policy to wire-policy mapping. This is local materialization from TypeScript, not a claim of admitted DomainSpec compiler output.

## Verification

Type-check: PASS. Focused recovery tests: 23/23 PASS, including 30 missing-slot and 30 fact-mismatch variations.

The earlier combined compatibility run had 150/152 passes (22 recovery tests at that point, 128/130 existing tests). Both failures are at the old test's fixture-schema assertion before evaluator execution: it scans every hostile JSON and mistakes two Body War files for hostile-case/v1 descriptors. This is recorded as operational-support residue; the full existing suite is not reported as passing. The subsequent binding-lifetime additions passed the final 23-test focused run and type-check. Existing evaluator bytes did not change.

From `projects/domainspec-v2/impl`:

```sh
node node_modules/typescript/bin/tsc --project operational-resilience/tsconfig.json --noEmit
node --import tsx --test operational-resilience/test/recovery-product-test.test.ts
```

B04 is dependency-ready. No product approval, profile admission or operational effect is granted. Existing frozen design, recovery runtime and evidence packets were preserved.
