# G01 shared-reliability exposed C diagnostics

After the failed four-task [fallback campaign](../g01-reasoning-fallback-campaign-r1/RESULT-NOTE.md), an opt-in shared transport policy was added to both control and candidate: retry historical-view admission without assistant reasoning only after the original full view is denied, and allow one concise, receipt-accounted correction after a verified output-cap response during discovery. The raw archive, failed model receipt, fixed 8K window, and original token/call budgets remain. The policy is explicit in the [control freeze](CONTROL-FREEZE.json) and [candidate freeze](CANDIDATE-FREEZE.json).

The already exposed C/zstd `a47dfbbf` task was re-run once per arm as a **mechanism diagnostic, not prospective benchmark evidence**. Both runs selected a final context: control in 26 model calls and 81,899 known model tokens, candidate in 13 calls and 47,005 known model tokens. Neither reasoning fallback nor output-cap correction activated in either run. This demonstrates that both arms can complete under this policy on a different model trajectory; it does **not** demonstrate that the policy repaired either original failure. Provider-free tests exercise the two recovery branches. No native accuracy comparison was claimed from these exposed diagnostics.

Full receipts are retained at `/opt/are/evolution-runtime/g01-shared-reliability-c-control-diagnostic-r1` and `/opt/are/evolution-runtime/g01-shared-reliability-c-candidate-diagnostic-r1` on the GLM VPS. These diagnostics used immutable source snapshot `/opt/are/evolution-runtime/g01-shared-reliability-source-r1`; later source edits require a new snapshot.

## Open Questions

- Can a deterministic receipt-bound probe exercise both recovery branches on the live transport without relying on a stochastic model trajectory?
- On a fresh predeclared cohort, will shared reliability keep all pairs scoreable while the candidate improves native accuracy and cost?
