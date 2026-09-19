# N43 Distill validation

Mode: Standard; one proposal track; Proposer and read-only Balancer; two rounds.

## Round 1

Proposer compared envelope schema, evaluator-receipt schema, boundary vocabulary, producer admission, profile admission, packet projection, and implementation.

Balancer objection — dependency ordering: the evaluator receipt binds an exact envelope digest, so the envelope schema must become concrete first. Reconciliation retains only the proposal-level envelope schema.

## Round 2

Proposer tested JSON Schema Draft 2020-12, YAML schema, flat records, nested records, and invented new compatibility families.

Balancer objection — evidence status: only Draft 2020-12 closed-object schemas are established across the exact live precedents. YAML and competing flat/nested owner options are not source-backed. Reconciliation routes the single established formalism directly and keeps the candidate nested by the independent responsibility groups already defined in the closure SPEC.

Smallest coherent unit: one candidate envelope schema plus one valid instance and hostile structural/semantic probes. It closes the N42-A representation enough for evaluator-receipt design and recomposes into N39 placement, N40 currentness, N41 identity, and N42 inline-carrier choices without changing them.

Frame expiry: reopen formalism choice only if an admitted consumer requires a consequence-distinct non-JSON contract. Premortem: the likely failure is treating structural validity as completeness truth; the guardrail is a separate consumer attestation and semantic-validator layer.

Verdict: `pass-direct-json-schema-2020-12-candidate-proposal`.
