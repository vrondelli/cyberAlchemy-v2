# Sequential LongMemEval final instrument review

Reviewer: `/root/pilot_selectivity`. Date: 2026-09-18. Authority effect: none.
Disposition: no remaining material blocker in the reviewed instruments for the
bounded development run, subject to coordinator continuity freeze and complete hash
bindings. This does not claim live completion or answer-quality improvement.

## Evidence

Independently ran runner and ledger offline suites: **9/9 tests passed**, with no
model/tokenizer calls. The fake-provider schedule covers all 64 generations and
retains 24 treatment note claims. Per-call admission failure prevents generation;
known failed usage is counted and the run stops without retry. The source ledger
checks exact replay, chronology, roles, source coverage, corruption and predecessor
integrity. Tests establish instrumentation behavior rather than live model quality.

Read and independently recomputed the compact preflight reservation: **200928 tokens**,
**64 generations**, **16 final answers**, admitted under **204800 tokens**, with
per-call context admission true. Original failed admission remains preserved.

The runner compares every actual tokenized message to its task/arm/phase baseline
plus the 512-token carry reservation before generation. Actual input and completion
usage are checked against that reservation and output cap, respectively; cumulative
usage includes every known generated token and failed known usage. The low-reasoning
provider enforces the pinned model and validates reasoning/cache subsets. Unknown
usage stops the run and is not treated as zero.

Both arms receive the same full historical words in the same whole-turn partitions.
Neither ingestion prompt receives the future query or gold. Treatment receives only
the additional source aliases and citation instruction. Its generated notes are
appended as real ARE unverified model claims with source epoch and predecessor
provenance, sealed/replayed, saved under task/arm/repetition/step call paths, and read
back from the claim content for subsequent prompts. The final question sees the last
notes only; archive source recovery is not injected.

The protocol now correctly calls `sN-mN` ledger-bound aliases and retains the mapping
to actual event digests. Claims are not semantic facts. `used_source_refs` establishes
that an alias exists in the full task source ledger; it does not prove that the source
was already presented at that note step or that its text entails the claim. Report
reference existence separately from actual attribution/entailment. This limitation
does not leak future source text into the model, but prevents calling every valid
alias a grounded fact. The experimental contrast also bundles citation instructions
with ledger-backed storage; it does not isolate storage implementation alone.

## Native-rubric calibration review

Reviewed all six synthetic examples against the exact pinned native rubric. Agreement
is **6/6**, with no disagreements:

| Example | Reviewer decision | Reason |
| --- | --- | --- |
| preference-good | true | Correctly recalls and uses the stated nature-documentary preference. |
| preference-bad | false | Ignores the preference and incorrectly claims it is unavailable. |
| update-good | true | States the updated seven while distinguishing the earlier four; native update rubric permits prior information. |
| multi-incomplete | false | Supplies only one of two required towns; native rubric rejects incomplete subsets. |
| abstain-good | true | Correctly identifies the requested preference as unstated. |
| abstain-bad | false | Invents a color for an unanswerable question. |

These are six transparent rubric checks, not statistical judge calibration or measured
evaluator accuracy. Actual outputs still require blind independent native-rubric
review with fixed denominators and preserved ambiguity. This remains an adapted
sequential oracle-history study, not an official full-history or retrieval score.

## Freeze boundary

The launcher verifies declared bindings and native continuity, checks disk space,
reconstructs the source ledger, compares exact partition hashes to preflight, and
creates an exclusive live directory. The coordinator still owns generating and
validating the actual native freeze manifest with complete source, model, scoring,
review, schedule and evidence bindings. The freeze builder was subsequently reviewed: it materializes matching sequential
hypotheses/experiment records, preserves parent counterevidence, verifies native
continuity and emits exact source bindings. The resulting freeze is still pending
coordinator execution. The added protocol Metric applicability section correctly marks inherited
selectivity-misapplication and its criterion N/A for this memory subset, not zero
or passed; native quality, completion and tokens govern this branch. The root reasoning-state index binding is not a transitive runtime-source
closure; avoid claiming it pins every imported implementation file. No reserve task or live answer was inspected for this review.

## Exact reviewed sources

Paths relative to this directory; SHA-256 byte hashes.

| File | SHA-256 |
| --- | --- |
| `freeze.mjs` | `30fad97f33c554532f3d28f7fae5dfe93fc9a2754f6a76b0041c790b93ec7d4e` |
| `runner.mjs` | `cc55ae688c5d14fd016a76de78cebea8311f40704d218dc7ae8dd9bf9878707c` |
| `run.mjs` | `b659ab8aea2b54522de9a803a1c16601fb0a8e5505c04ec7da629dcd2529df70` |
| `prepare.mjs` | `32ad33db4acd8944d38bd1294a80ae190d1f35c3bc7bb56535b3fc87ca7c286e` |
| `ledger.mjs` | `6cf3be47c17e411faa379603801bdbd23f38590a73d087ea021db579c4302893` |
| `chunks.mjs` | `b4077ee20d404a444fe91ae1bee149b9ce12e5f19388fb129857b99d79aabfc6` |
| `preflight.mjs` | `8f52d37b6cc12c610a772fa4469cd23de08476a9ee9893dd0d807710244c48ef` |
| `PROTOCOL.md` | `7143b5427054e305f33c70546aa6ad91ae59d30314da03e22d9418fb043c5a48` |
| `scorer-calibration.json` | `4a61e027209909475b9e650e7d5d33247a1670b92f718ea5945bfaca63de711b` |
| `../longmemeval/native-rubric.py` | `64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12` |
| `preflight-compact-notes/result.json` | `b4b9b7c13116c42c8770812f0f76c752aff73536d68ded7454b4692048eb9eb4` |
| `runner.test.mjs` | `788f9c81c653b3fa2f9c8831158ef2edbaf1a4825d27072a05576acb423a0e2f` |
| `ledger.test.mjs` | `907042919bc5260d3956704c47fa7d7b2d8a19b5c0aa44c2e0e10fa89b0167eb` |
| `../selectivity-v2/provider.mjs` | `f5cbfd61af0b833bac15828ed827147db742a60ce256f6d32c5e05d4a3d6f46e` |

## Open Questions

Will reasoning plus note content finish within 512 completion tokens? Will notes
retain the facts required by the unseen query? Will source references help enough
to offset their token burden? Live outcomes must decide these questions. Coordinator
owns freeze, execution, blind scoring, D02/D04 evidence and research-wide accounting.
