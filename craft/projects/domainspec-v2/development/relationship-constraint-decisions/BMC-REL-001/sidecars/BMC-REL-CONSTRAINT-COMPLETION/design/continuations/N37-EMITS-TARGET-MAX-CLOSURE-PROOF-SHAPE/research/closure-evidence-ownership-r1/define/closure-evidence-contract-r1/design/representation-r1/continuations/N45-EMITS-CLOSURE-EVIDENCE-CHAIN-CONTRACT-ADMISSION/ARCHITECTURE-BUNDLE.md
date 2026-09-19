# N45 architecture bundle

## 1. Context view

The consumer project owner attests exact eligible Entity/Event populations, placement, and complete incoming `emits` adjacency in the N43 envelope. The separately owned evaluator consumes that exact envelope and emits the N44 receipt. N45 governs whether those candidate contracts may jointly become the target for later Plan work.

## 2. Structure view

- Semantic authority: prior owner decisions for canonical `emits`, duplicate rejection, `target_max=1`, counting unit, and N37 proof shape.
- Completeness authority: consumer-owned, snapshot-bound N43 envelope.
- Evaluation authority: evaluator identity, algorithm, deterministic result precedence, and N44 receipt.
- Lifecycle authority: later planning, implementation admission, packet projection, promotion, and release remain separate.

## 3. Integration and versioning view

The candidate chain is exact-byte and digest bound: receipt schema -> evaluator -> envelope schema -> envelope -> graph/source manifest/registry/profile -> prior policy receipts. Changing any bound bytes produces a new candidate/evaluation; it never rewrites an old receipt.

## 4. Persistence and concurrency view

N41 preserves independent digest-addressed sidecars without implicit supersession. N44 receipts are immutable snapshot results. Currentness stays external; parallel or historical receipts coexist and are selected only by exact path and digest.

## 5. Authority and trust view

N45-A would admit only the coordinated candidate Design contract. It would not make compiler output a completeness attestation, make the evaluator a semantic owner, treat a receipt as packet acceptance, or authorize executable mutation.

## 6. Validation-contract view

Positive validation must bind an exact N43 envelope to an exact N44 receipt and exercise all four result outcomes. Hostile validation must reject partial-chain admission, mixed snapshots, silent duplicate coalescence, incomplete-closure pass, currentness inference, unknown fields/results, authority inflation, and packet/profile/implementation bundling.
