# G01 BugSwarm hybrid r6 — exposed development protocol

Status: fixed before r6 tokenizer or generation dispatch. This is a new
exposed-development policy on the same 24 BugSwarm repositories, not a repair
of r2's failed gate, fresh confirmation, ContextBench, official RepoMap,
live ARE, or a product superiority claim. Original HTTP log/diff payloads
remain transport-provisional.

## Frozen inputs and budget

- Source-only packet SHA-256:
  `5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e`.
  Packet seal SHA-256:
  `fd1ab5a039a5345b61e9d556a5ddd79723ff66ed2d88ef795e1b75a1ad680cdc`.
- Same GLM-5.3-flash account and transport as r2. Admit all 24 exact packet
  prompts through the provider tokenizer. Each must have at most 7,680 prompt
  tokens, reserving 512 output tokens within 8,192. No generation if any
  tokenizer call fails. Summed tokenizer prompt tokens must not exceed
  **84,615** (1.5 times original r1's 56,410 known prompt tokens).
- If admitted, at most one low-reasoning generation request per case, 24 in
  original ordinal order, no automatic retries, at most 512 output tokens per
  call. Invalid responses count invalid; transport failure stops. The model
  must choose at most eight distinct IDs from the exact packet.
- Seal source-only selected paths and raw provider receipts before an
  evaluator-only process opens the unchanged r1 gold. Keep all private files
  in a new r6 directory, with checksum-identical WSL copies.

## Exposed advancement gate

On the original fixed 24-case denominator: 24/24 valid selections and labels;
GLM MRR@8 at least **+0.10** above both original r1 GLM and standalone ARE;
at least **16/24** wins against ARE; a positive lower end of the same
repository-unit 20,000-draw paired bootstrap 95% interval; at least **two**
of Java ordinals 16, 17, and 20 newly contributing positive MRR; and the
token budget above. A failed component fails advancement. All comparisons
are exposed development diagnostics, even if the gate passes. Independent
superiority still requires a distinct frozen, label-screened cohort and
validated source transport.

## Open Questions

- Will all exact packets pass the same-account tokenizer and aggregate cost cap?
- Will the new Java candidates improve GLM selections without degrading r2's
  existing wins?
- Which distinct BugSwarm cohort can support independent confirmation with
  authenticated or reproducible logs and diffs?
