# B06 independent review scope

Review candidate DSV2-ORODI-RECOVERY-B05-001, bound by PRODUCT-TEST-MANIFEST.json SHA-256 `073f5a2c3d75786f96ce100fa0b0f5bf2c4a16df0f9cee397cc119574d92bb9a`. The input allowlist and exact hashes are in inputs.json. No registered ontology is a dependency of this review.

The implementation author prepared this packet. Preparation checks and a replay of the stored evaluation are not independent review. One separately assigned native reviewer must return a joined receipt before B06 can complete.

## Required review questions

1. Does source and evidence closure bind the implementation, actual Python/SQLite/Node runtime, scenario tests, observer, adapter and evaluator as claimed? Identify any important unbound dependency or incorrect identity relationship.
2. Can malformed, duplicated, stale, missing or relabeled evidence produce a passing claim? Check whether normalized facts remain meaningfully bound to the original raw records and source predicates.
3. Does the observer enforce the stated read-only, path, SQLite mode, size, timing and connection-lifetime boundaries? Distinguish before/after capture evidence from producer-owned intra-test assertions.
4. Does the adapter preserve historical-versus-fresh evidence, formation-only F26 and mixed F27/F30, unknown runtime outcomes and required 30 x 2 denominator?
5. Are the two legacy fixture-format failures genuinely confined to test selection, and does the product's stated regression requirement permit their treatment as operational residue? Do not infer acceptance of that treatment from a green focused test run.
6. Is the stated claim ceiling honest, including the pre-COMMIT check versus physical commit-completion deadline, source/test independence, runtime admission and deployment exclusions?

## Reviewer boundary and deliverable

Use only inputs.json's exact file allowlist and directly required selected byte references. Read repository files without modifying them. Pure evaluator calls and bounded temporary probes are permitted; temporary fixtures must remain separate from the frozen packet. Do not run campaign.py or assemble.mjs against B05 because they write outputs. Do not fix findings inside the reviewed candidate.

Return the reviewed manifest hash; PASS or BLOCK with explicit qualifications; actionable findings with severity, absolute path, one-based lines, reproduction and impact; checks actually run; checks not run; a separate assessment of the legacy failures; and whether this exact candidate is ready for the owner's product decision. The recommendation is not approval. Avoid claims based only on supplied PASS labels.

The parent owns joining the receipt, preserving frozen bytes, publishing the review evidence locally, and updating the construction frontier. B07 remains pending until independent review closes.
