# Auth Foundation verification-tier bridge plan

## Objective

Run the Auth Foundation exact fail-closed authorization property through the
candidate EVF V0-V2 enforcement kernel using exact, current Auth evidence.
This package is additive construction evidence. It grants no product approval,
runtime admission, release admission, or operational authority.

## Implementation layers

### L0 - exact single-route proof

After this layer, we know whether one fresh independent-verifier execution can
bind the property, subject, bounds, and executable EVF evidence strongly enough
to satisfy V0.

- Minimum unit: executable route plus exact source bindings.
- Exit evidence: `V0-RESULT.json` is `satisfied` and names V0.
- Deferred: corroboration, hostile controls, operational packaging.

### L1 - independent corroboration

After this layer, we know whether the Rust-backed executable evidence and the
Lean-backed theorem evidence independently agree at the property boundary.

- Minimum unit: two fresh verifier executions with different route IDs and
  independence groups.
- Exit evidence: `V1-RESULT.json` is `satisfied` and names V1.
- Preserved guarantee: the L0 route remains independently sufficient for V0.
- Deferred: negative-control class closure and runtime admission.

### L2 - hostile-control closure

After this layer, we know whether all five V2 negative-control classes are
backed by existing Auth hostile-control or mutation evidence.

- Minimum unit: exact subject, oracle, denominator, evidence, and execution
  controls joined to the two L1 routes.
- Exit evidence: `V2-RESULT.json` is `satisfied` and names V2.
- Preserved guarantees: L0 and L1 remain independently reproducible.
- Deferred: V3 trait-complete verification, admission, release, deployment,
  continuous execution, and customer-facing certification.

## Product construction and operational support

Product construction is limited to the bridge, exact bindings, deterministic
join logic, regression tests, and local evidence. Operational support such as
scheduling, monitoring, service ownership, artifact publication, key custody,
and customer delivery remains outside this package.

## Claim boundary

The Lean route is mapped to the kernel's `executable-evaluation` capability
because this V0-V2 kernel observes a real Lean typechecker-backed EVF verifier
execution. This does not claim V3 theorem completeness or expand the kernel's
trait vocabulary.

## Open Questions

- Should a later V3 profile add an explicit theorem-checking capability?
- Which admitted runtime, if any, should own continuous Auth verification?
- Which external assurance standard should consume this evidence package?

