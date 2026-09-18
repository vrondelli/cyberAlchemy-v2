# Compact-note successor final review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Disposition: no material blocker found for the bounded v2 construction freeze at
these hashes. No live model or tokenizer calls were made by the reviewer.

## Bounded review evidence

Compared v1/v2 protocol, chunk prompts, preflight, runner and native freeze builder.
Verified ledger, prepare, launcher and scorer calibration are byte-identical to v1.
The preflight's complete task partitions are also identical: no task, dated turn,
source word or final question was dropped or changed. Ingestion still hides the
future question and gold. The same compact-note instructions apply to both arms;
only treatment retains the already defined citation requirement.

Independently verified the v1 result is stopped, with **5301 known model tokens** and
**zero final answers**. V2 preflight recomputes to **188464 reserved tokens** for
**64 generations**, fitting **199499 remaining tokens**. Together the budget preserves
the original **204800-token** branch ceiling. Note output and measured carry caps
are 384; final output remains 1024. Actual per-request tokenizer admission, receipt
usage validation, failure accounting, no-retry behavior and cumulative enforcement
remain in the reviewed runner. No new token allowance is inferred.

Independently ran v2 runner and chunk suites: **5/5 tests passed**. These exercise
complete paired fake execution, saved treatment claims, failed usage and no retry,
source completeness, query isolation and admission rejection. They do not establish
live completion or quality.

The explicit eight-bullet/120-word/plain-note instruction is a reasonable operational
response to v1's completion exhaustion before any scored answer existed. It is a
prompt intervention, not a deterministic word/bullet validator; report observed
adherence separately if used in interpretation. The tighter cap may still fail or
lose necessary user information. The intended omission of generic assistant advice
is an equal-arm summarization policy, not source-access cropping: all source turns
remain provided during ingestion. Source-dependent losses remain valid evidence.

## Research continuity judgment

The builder parents v2 hypotheses to v1 records and links the actual failed-run
observations. The primary H1/H0 contrast remains ordinary notes versus source-linked
notes, with H2 retaining fact-loss as a competing explanation. A separate H3 is not
required to execute this bounded operational adaptation, provided completion gains
are reported as feasibility evidence rather than a controlled causal proof of the
compact instruction. The changed intervention and its trigger are explicit in the
protocol and predecessor decision. A claim that compact wording itself caused an
improvement would require its own prospective hypothesis and comparison.

The native rubric/calibration and all prior scorer limits remain unchanged. Alias
validity is existence, not semantic entailment or proof of prior exposure. The
selectivity metric remains N/A for this memory subset. Final answer quality still
requires blind native-rubric review; complete ingestion is not a passing benchmark.

The coordinator must execute and validate the actual freeze; the reviewed builder
binds v2 protocol/code/evidence and preserves predecessor observations. Root index
hashes are not a transitive pin of every imported runtime source. No serving,
release or research-retention admission follows from this review.

## Exact reviewed sources

Paths relative to this directory; SHA-256 byte hashes.

| File | SHA-256 |
| --- | --- |
| `PROTOCOL.md` | `cc63573408ff023f0cf7592af37f5c24c85e6006681dedb6468169f0787b2ab1` |
| `chunks.mjs` | `5eab803251e35011c6e4f863228af1f45a02fe56184b94095c5ca8753cc36da7` |
| `preflight.mjs` | `57fb1c20cd5cf90b5d1c9e5417f778212b6b49a9be8eeabe28a9b17c94c90f06` |
| `runner.mjs` | `aa23323f668cf34e6d5bc19646230b6caabdd28bae6855b10dd0e2c774c9886d` |
| `freeze.mjs` | `6fc37baf32a46b0b49903c65b98cb69fea4b02c28c7bae21d1976925899b3008` |
| `run.mjs` | `b659ab8aea2b54522de9a803a1c16601fb0a8e5505c04ec7da629dcd2529df70` |
| `prepare.mjs` | `32ad33db4acd8944d38bd1294a80ae190d1f35c3bc7bb56535b3fc87ca7c286e` |
| `ledger.mjs` | `6cf3be47c17e411faa379603801bdbd23f38590a73d087ea021db579c4302893` |
| `preflight-compact-notes/result.json` | `dc591a29faa6df05e927a26e5c7054298c9a0a680e1ccfc403c7a8aab4eb0857` |
| `scorer-calibration.json` | `4a61e027209909475b9e650e7d5d33247a1670b92f718ea5945bfaca63de711b` |
| `runner.test.mjs` | `788f9c81c653b3fa2f9c8831158ef2edbaf1a4825d27072a05576acb423a0e2f` |
| `chunks.test.mjs` | `0d2e1382e832ac13c6cc56cae281cdc213aeabbd54dc5508958849e8e8a38cd6` |

## Open Questions

Will the instructed note shape finish within 384 tokens, and will useful facts survive
for the unseen questions? These are empirical questions. Coordinator owns freeze,
live execution, blind answer review, combined v1/v2 accounting and D02/D04 outcomes.
