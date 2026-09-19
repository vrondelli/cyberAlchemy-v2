# Queries: DomainSpec Implementation Conformance

## ExplainImplementationFinding

**Type:** Query
**Actor:** developer, reviewer, or authority owner

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `receipt_ref` | digest/path | yes | generated receipt |
| `finding_id` | string | yes | stable normalized finding |

### Output

| Field | Source |
| --- | --- |
| disposition and diagnostic code | `EvaluationReceipt.findings[]` |
| canonical concept/edge and selected profile | bound receipt inputs |
| source unit, entry point, and digest | `ImplementationBinding` projection |
| native diagnostic and raw-artifact reference | `NativeEvaluationBundle` |
| claim limit and unsupported reason | profile/evaluator contract |
| owner route and residue | finding normalization |

The query cannot convert evidence into acceptance or promotion.

## InspectBindingCoverage

**Type:** Query
**Actor:** profile author or implementation reviewer

### Input

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `profile_ref` | id/version/digest | yes | implementation profile |
| `concept_scope` | selector | yes | bounded admitted concept set |

### Output

| Coverage class | Meaning |
| --- | --- |
| admitted-and-bound | exactly one current binding and entry point |
| admitted-unbound | semantic identity lacks implementation binding |
| duplicate | multiple admitted bindings |
| orphan | implementation leaf lacks admitted identity |
| stale | digest/projection disagreement |
| unsupported | source shape cannot be resolved by selected evaluator |
| excluded | profile explicitly leaves the concept outside its claim |
