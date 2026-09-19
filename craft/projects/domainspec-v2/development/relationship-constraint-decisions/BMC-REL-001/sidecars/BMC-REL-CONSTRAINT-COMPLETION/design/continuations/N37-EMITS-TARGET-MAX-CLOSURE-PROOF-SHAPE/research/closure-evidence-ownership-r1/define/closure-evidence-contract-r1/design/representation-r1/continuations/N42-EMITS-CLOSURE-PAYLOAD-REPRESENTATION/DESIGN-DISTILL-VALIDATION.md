# N42 Distill validation

Mode: Standard; one proposal track; Proposer and read-only Balancer; two rounds.

## Round 1

Proposer compared payload representation, schema serialization, boundary vocabulary, producer admission, profile admission, evaluator implementation, and packet projection.

Balancer objection — dependency ordering: schema and resolver contracts cannot close until the carrier of the population, placement, and incoming-adjacency payloads is known. Serialization, producer admission, profile, implementation, and packet projection remain independent later owners.

Reconciliation: retain only the payload-carrier question.

## Round 2

Proposer compared inline exact sets, digest-bound external manifests, and a closed per-payload inline-or-reference tagged union.

Balancer objection — unjustified flexibility: B introduces external consumer-owned payload artifacts and resolver obligations; C additionally creates variant combinations and compatibility surface. Reconciliation admits all three because the Define contract expressly allows exact sets or manifest references, while recommending A because no current evidence establishes scale pressure that requires externalization or mixed carriers.

## Smallest coherent unit

One representation rule shared by the three closure-proof payload groups. It closes because the payloads, carrier variants, digest boundary, resolver consequence, and consumer-attestation boundary are explicit. It recomposes into N39 placement, N40 snapshot binding, and N41 digest identity without changing them.

Frame expiry: revisit the recommendation if measured payload size, reuse, or independently versioned manifests become a confirmed constraint. Premortem: the likely failure is treating a compiler-generated manifest as consumer completeness authority; guardrail by preserving the consumer attestation and rejecting implicit discovery under every option.

Verdict: `pass-three-admissible-payload-representation-actions-owner-pending`.
