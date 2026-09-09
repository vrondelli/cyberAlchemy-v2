# Operations

## ValidateGraph

Input: candidate graph, node schema, edge schema, and pinned policy.

Ordered rules:

1. validate all required node fields and enums;
2. validate unique IDs and endpoint resolution;
3. reject unknown node kinds and predicates;
4. validate allowed source-kind, predicate, and target-kind triples;
5. reject stored inverse read directions;
6. enforce per-source cardinalities;
7. reject any non-`none` authority effect;
8. detect cycles over `derives-from` only;
9. retain `contradicts` as symmetric and non-composing;
10. return stable diagnostics in deterministic order.

Postcondition: no output is written until the full input is evaluated.

## EvaluateCandidate

Input: one `RelationCandidate` and the same pinned policy.

- If an admitted policy exists and all rules hold, emit `policy-pass`.
- If an admitted policy exists and a rule fails, emit `policy-fail`.
- If the candidate is well formed but no policy owner/rule exists, emit
  `policy-indeterminate` with `POLICY_OWNER_UNBOUND`.

The first package specifies only the third path for `specializes`; it does not
invent an admission rule.

## EmitRunBundle

Input: in-memory validation result, dispositions, projection, input digests,
evaluator digest, and isolation result.

Write scope: one newly created `generated/runs/<run-id>/` directory.

The operation writes canonical JSON with sorted keys, stable arrays, no wall
clock fields in comparison artifacts, and a receipt that binds every artifact
digest. Existing run directories and fixture paths are never overwritten.

## Failure Semantics

Schema, policy, path, digest, or isolation errors terminate before publishing a
complete receipt. A failed run may write only to its isolated incomplete run
directory and must never modify governed inputs.
