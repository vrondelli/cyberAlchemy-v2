# EVF verification-tier enforcement candidate v1

This additive candidate enforces explicit EVF verification tiers `V0`, `V1`,
and `V2`. It keeps the verification contract result separate from the property
result: a valid counterexample may satisfy the contract, while missing,
conflicting, unresolved, stale, fixture, drifted, or incomplete evidence cannot.

## Implemented boundary

- `V0` requires one exact, completed, non-fixture provider route whose capability
  applies to a declared property trait.
- `V1` requires at least two routes with distinct route IDs and independence
  groups. Provider results must agree; voting is forbidden.
- `V2` adds detected negative controls for subject, oracle, denominator,
  evidence, and execution failures.
- Every invocation binds an exact profile, property definition, subject, and
  bounds digest. Unknown request fields are rejected.
- Failure at the requested tier never changes the request. A satisfiable lower
  tier may be reported as informational `available_lower_tier`, while
  `verified_tier` remains null.

`L0`, `L1`, and `L2` remain historical TDE development-layer labels. The
compatibility record maps their shapes to candidate `V0`, `V1`, and `V2`
requirements without rewriting history or granting a tier retroactively.

## Validation

Run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 validate.py
```

The construction suite uses generated local inputs to test enforcement logic;
it does not constitute provider or product evidence. The exact locally bound
Soufflé 2.5, Java 17, and Alloy 6.2.0 runtime files are currently available in
the WSL user tool path. Compatibility therefore reports
`ELIGIBLE_FOR_FRESH_INVOCATION`. Runtime availability alone does not grant a
verification tier; a fresh invocation still has to satisfy the requested
contract.

## Authority and open questions

This package has `authority_effect: none`. It grants no product approval,
runtime admission, release admission, publication, or deployment.

V3 trait-complete adapter enforcement and V4 repair assurance remain outside
this layer. Their requirements are owned by the candidate Definition Pack and
plan in `define/candidates/evf-verification-tier-enforcement/`.
