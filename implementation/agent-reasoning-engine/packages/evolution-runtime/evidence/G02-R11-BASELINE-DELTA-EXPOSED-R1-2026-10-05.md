# G02 r11 baseline-aware causal-delta chooser — exposed r1

Status, 2026-10-05: **terminal rejection before evaluator gold was opened**. This is a private exposed development choice, not an actual ARE read, native score, matched pair, or superiority result.

The [source-and-sealed-ARE-output packet builder](../research/g02-product-r4/build-g02-r11-baseline-delta-packets-exposed-r1.py) retained exactly the previously sealed multi-view top-24 candidates for each of the 12 r11 tasks. It added the 33 already-selected ARE paths and bounded excerpts from their pinned base source, so the chooser could compare an additional file's responsibility with context ARE already had. It read no reference patch, native score, DSH output, or evaluator gold. All 12 packets were sealed before GLM dispatch at private SHA-256 `050acc7b183a8f6db8cdc4f7bab8561b1c381e9a3ce59c01d1928930947357a7`; maximum packet size was 19,926 bytes.

The [zero-retry runner](../research/g02-product-r4/run-g02-r11-baseline-delta-exposed-r1.mjs) froze the exact policy at `FREEZE.json` SHA-256 `981cb24fd02a99d1e588cefe84f9bbef4af323cb91d5f40228986c611d9ebd5e`. It required one optional addition, a candidate evidence-window line, and a stated responsibility not covered by the baseline; abstention was valid. Its exposed advancement gate required 12/12 valid responses, at least three new gold files across two repositories, proposal precision at least one third, nonnegative counterfactual mean File-F1, and at most 65,000 known chooser tokens. The frozen denominator and gate were not changed after responses.

Same-account tokenizer admission passed **12/12** before any generation. The provider then returned **12/12 valid** zero-retry responses, with **52,980 known chooser tokens** and **103.144 seconds summed generation time**. Eleven responses abstained; the sole proposal was `lib/ansible/modules/dnf.py` on exposed task 5. The [response sealer](../research/g02-product-r4/seal-g02-r11-baseline-delta-exposed-r1.py) bound all starts, request hashes, raw payloads, selected paths, usage, and the complete denominator at private `RESPONSE-SEAL.json` SHA-256 `faad96e72978d18bad6830f9ccf9c7473cef0b1bd2a52eb8af68bcd045cd2569`.

With only **one** proposed file, the maximum possible new-gold count is one, below the frozen minimum of three. The advancement gate is therefore **impossible to pass regardless of the label**. No evaluator gold or native scorer was opened. The exact one-shot baseline-aware policy is rejected; its 11 abstentions may protect precision, but they cannot support the required acquisition gain. It must not consume a fresh G02 cohort or be portrayed as an ARE quality improvement. The prior listwise chooser's 1/13 precision and this policy's over-abstention bracket the problem: a next hypothesis needs a way to gather decisive evidence when candidate responsibility remains uncertain, not simply a stricter wording of the same static 24-card choice.

SemNav's [candidate-workspace comparison and focused verification-question loop](https://arxiv.org/html/2609.31176) motivates a possible *different* active-evidence mechanism; this one-shot chooser did not implement that loop or reproduce the paper. Any successor must be separately versioned, bounded for all-in provider cost, tested on exposed tasks, and frozen before a fresh matched cohort.

## Open Questions

- Can an explicit verification question drive one additional source observation that resolves a candidate-versus-baseline ambiguity without producing many false additions?
- Which acquisition path preserves the multi-view pool's cross-repository reach while fitting the three-read cap?
- Can a qualified policy improve both native File-/Span-F1 and total tokens/time against matched DSH on a fresh denominator?
