# G03 BEAM 100K IE r13 — source-only transfer and prospective label rule

Status: **private candidate protocol, fixed before reserved 100K evaluator
values or GLM answers are opened**. The first executable stage is source-only;
its output cannot authorize answer dispatch or scoring by itself.

## Source-only and tokenizer results — before answer dispatch

The exact port produced **32/32** source-only matched selections, private
SHA-256 `82a1fc4f3f422033885c56eb0121a6d188a2d65cd6b1bc0bcfda48bec9cfcd73`.
An independent no-model reconstruction verified both projections and
question hashes for 32/32, plus 16/16 conversation keys disjoint from the
500K development keys; private audit SHA-256
`d647e119cc0823f745a27e6d661bd45194e3fc02e52aae6f8b3e48efec82b116`.
Two exposed R9 development questions replayed to identical historical
control and treatment selection hashes under the installed ONNX environment.
The reserved 64 answer wires are sealed at private SHA-256
`5182fb6cd39441a2fd1867d848d11bcf9ae976ef0a09bb07b1b5b1de58942058`.
Same-account VPS tokenizer admission passed **64/64**, with maximum prompt
usage **1,614** tokens plus the fixed 512-token answer reserve; **zero
answer-generation calls** were made in these stages. Its copied private
result SHA-256 is
`1d9ed586d426491fd0cdd2d1ecc588701ac50ab64ac8456c8bd2b7a7f8a8dc33`.
The WSL selector environment is persistent at
`/home/vlad_/.local/share/are-beam-python-3.14/`, with Python 3.14,
NumPy 2.5.3, ONNX Runtime 1.30.0, and tokenizers 0.23.2; the sealed
selection receipt also records these versions. Its dependency installation
does not change the ONNX/tokenizer model-file pins or grant scoring authority.

For a subsequent exact answer stage, bind the above wire and tokenizer
hashes, run the 64 requests in sealed order, `max_tokens: 512`, zero retries,
stop at the first invalid provider/answer receipt, and archive all raw
attempts. If incomplete, no top-up or 32-pair claim is allowed. This freezes
the answer stage's method before its first generation call; scoring and
label review remain separate gates below.

The answer stage subsequently completed **64/64 valid** zero-retry calls on
the VPS, 32 matched question pairs, with **81,445 known prompt** and
**7,409 known completion tokens**, plus 221.660 seconds summed call time
(not campaign wall time).
The raw result was copied privately to WSL and has SHA-256
`79a271dbfa27bca7ff855e477199fd46c9b11abe3dd0d47df004a557fb6f0716`.
A separate raw-attempt hash and identity audit passed for every call at
private SHA-256
`e3cda154789426075cc39b36fe607721099fef9711443c9b0a166eb1ad7b33b8`.
These are **sealed answers, not correctness results**. No evaluator reference
or label was read during generation or receipt audit. The private roots are
`/opt/are/evolution-runtime/g03-beam-100k-ie-r13-answer-run/` and
`/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13/ANSWER-RUN/`;
neither is a public payload.

### Label-free answer-stage usage audit

The [numeric-only auditor](../research/g03-beam-r1/audit-beam-100k-ie-r13-answer-cost.py)
(script SHA-256 `01c3b100ba4af5e811e87046eabb4944179670a37fa7eb004a37bcb4b08ed6dd`)
read only the pinned `RUN-RESULT.json` metadata and its passed raw-receipt
audit, not answer text, references, reviewer forms, or scorer output. It
verified 32 distinct matched pairs, 64/64 HTTP-200 valid zero-retry calls,
and both recorded usage totals. Its private write-once
`ANSWER-COST-AUDIT.json` is SHA-256
`afb953d308cc08951eccb33818b1de6db69e2d80db40d44a71b1608b40cbf2cb`.

| Answer arm, 32 calls each | Known prompt tokens | Known completion tokens | Known total tokens | Summed call time |
| --- | ---: | ---: | ---: | ---: |
| BM25 control | 40,301 | 3,329 | 43,630 | 102.414 s |
| ARE treatment | 41,144 | 4,080 | 45,224 | 119.246 s |

The treatment/control known-total-token ratio is **1.03653** and summed
call-time ratio is **1.16435**; 22/32 pairs used more treatment tokens, and
16/32 had a longer treatment call. This is descriptive answer-stage usage,
not campaign wall-clock speed, provider billing, full-cycle cost, correctness,
or superiority. In particular r13 currently has **no cost-efficiency gain to
claim** on known answer tokens. Accuracy remains pending the independent
answer-blind Vlad/Dave label decisions and separately frozen scorer.

The answer-blind native-label review input was then built from the pinned
100K Parquet and full chronological source histories **without reading either
arm's answers or scorer output**. It binds all 32 references and cited turns
to 16 complete histories. The private reviewer files are
`/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13/LABEL-REVIEW-INPUT.json`
(SHA-256 `74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970`)
and `LABEL-REVIEW-HISTORIES.json` (SHA-256
`2bbf93c78e0b26662e306aae692030166d89b3652f64d4ae9559832eca53cb99`).
The binding manifest SHA-256 is
`3d4ca280664826fb3c23476134e76da2ac5173a9ce86fb0f49e7c3e2bd43c802`.
Status remains **review pending**: these files contain inputs, not Vlad/Dave
dispositions or valid labels.

### Independent reviewer handoff

Vlad and Dave each have a separate blank JSON form in the same private
directory: `LABEL-REVIEW-VLAD-TEMPLATE.json` and
`LABEL-REVIEW-DAVE-TEMPLATE.json`. Each reviewer should copy only their
template to `LABEL-REVIEW-VLAD.json` or `LABEL-REVIEW-DAVE.json`, then fill
all 32 `decisions` independently using `LABEL-REVIEW-INPUT.json` and the
matching conversation in `LABEL-REVIEW-HISTORIES.json`. For each `probe_id`,
set `disposition` to `supported-current`, `conflicted`, or `ambiguous`;
provide at least one relevant `evidence_turn_ids` entry and a brief factual
`reason`. Check the complete history for later updates, not just cited
turns. Do **not** open `ANSWER-RUN/` or any scorer output during this review.
The two template SHA-256 values are
`c422276cbcfa68b60cef5f141d9f166b78e391e114c98e41982b01390e446eee`
and `271946ff648d2de35636b7ee454d0167a81710c568b3af82e6a029cfec1df7e0`
for Vlad and Dave respectively. The sealing script rejects blank/incomplete
forms, mismatched source hashes, invalid turn IDs, or a claim that arm
answers/scorer outputs were seen. It records any disagreement as
`ambiguous` without forced consensus. Until both complete forms are sealed,
there is no valid 100K accuracy result.

### Answer-blind terminal review helper

The private [review helper](../research/g03-beam-r1/review-beam-100k-ie-r13.py)
lets each human reviewer list the 32 questions, see one question and its cited
turns, page or search its **complete** chronological history, and record an
explicit decision. It pins the two review-input hashes and the reviewer
template hashes above. It opens no model answer or scorer path. Its
`--full-history-reviewed` flag is a **human attestation**, not software proof
that all pages were read. The fixed [sealer](../research/g03-beam-r1/seal-beam-100k-ie-r13-label-decisions.py)
remains the authority for validating both finished forms; the helper does not
seal labels or score answers.

From the checkout root, substitute `Dave` for `Vlad` and a listed probe ID:

```sh
python3 implementation/agent-reasoning-engine/packages/evolution-runtime/research/g03-beam-r1/review-beam-100k-ie-r13.py --reviewer Vlad list
python3 implementation/agent-reasoning-engine/packages/evolution-runtime/research/g03-beam-r1/review-beam-100k-ie-r13.py --reviewer Vlad show PROBE_ID --page 1
python3 implementation/agent-reasoning-engine/packages/evolution-runtime/research/g03-beam-r1/review-beam-100k-ie-r13.py --reviewer Vlad show PROBE_ID --search 'update phrase'
python3 implementation/agent-reasoning-engine/packages/evolution-runtime/research/g03-beam-r1/review-beam-100k-ie-r13.py --reviewer Vlad record PROBE_ID supported-current 12,48 --full-history-reviewed
```

The record command prompts for a private factual reason, so it does not go
into shell history or process arguments. Use the appropriate disposition and
actual evidence-turn IDs; inspect every history page for later updates before
attesting. Each explicit record atomically saves only that reviewer's form,
which can be resumed or corrected case by case. The helper's synthetic tests
passed, and read-only live checks listed 0/32 for each reviewer and opened a
history page without creating a form. **No real reviewer decision has been
entered or inferred by the agent.**

### Answer-blind scorer-source preflight

The separate [scorer-source preflight](../research/g03-beam-r1/preflight-beam-100k-ie-r13-judge-source.py)
verified the pinned reviewer input and complete histories against their exact
SHA-256 values, bound all **32 questions** and **53 cited turns** to **16 full
histories**, and verified the historical r12 scorer source and exact system
prompt SHA-256 `8db418bb000b4a022fd74f7db88ff7a9470235b65f78175db8c4979069ba5a8c`.
The private `JUDGE-SOURCE-PREFLIGHT.json` receipt SHA-256 is
`f2c76a591ead557e1ede2ca61a84237e05b650dad60c43187563ec0cb7d6d9bb`.
Its largest cited-source packet has 12,934 content characters and six cited
turns. Mutating a cited turn, a full-history turn, or the historical prompt
was rejected in focused tests. The preflight read **no model answer, reviewer
decision, or scorer output**, and made zero tokenizer or judge calls.

This is a source-structure and prompt-identity result, **not** 8K tokenizer
admission or a valid scorer transfer. The scorer wires, two-pass handling, and
invalid-output rule must be frozen and tested after both answer-blind human
reviews are sealed; the 64 scorer requests then need actual same-account
tokenizer admission before any scoring. Character counts do not substitute
for token counts. No 100K accuracy or superiority result follows.

The post-label [blinded scorer-wire builder](../research/g03-beam-r1/build-beam-100k-ie-r13-judge-wires.py)
is prepared but **has not been run on reserved answers**. Its four synthetic
tests passed. It first verifies the source-only preflight, exact two-reviewer
seal, reviewer-form hashes, all 32 dispositions, and the ≥28 supported-current
gate. Only after those checks does it open the already audited answer attempts;
it then rechecks all 64 raw hashes and creates 64 blind IDs plus a separate
private arm map. A missing or failed label seal stops before any answer read.
After both human forms are complete, seal them to the fixed private filename
`LABEL-DECISIONS.json`, verify its printed SHA-256, and pass that digest to
the builder's `--label-sha256` argument. Keep both builder outputs under the
private r13 archive root. This is input preparation only; r13 scorer
execution, actual tokenizer admission, two-pass calls, and accuracy analysis
remain separate uncompleted stages.

The separate [r13 source-grounded scorer runner](../research/g03-beam-r1/run-beam-100k-ie-r13-source-grounded-judge.mjs)
is now implemented and passed three **synthetic-only** tests. It hash-pins
the unchanged historical r12 runner, extracts the exact calibrated system
prompt, validates 64 blinded r13 wires, and freezes the scorer before any
provider request. It tokenizes all 64 exact request messages on the same
account; any failed or over-8K tokenizer result stops with **zero** judge
generation calls. Only a 64/64 tokenizer pass allows two zero-retry judgment
passes, forward then reverse order, at most **128 calls**. Invalid responses
stop and remain terminal, rather than being replaced. Its outputs are
private attempts and receipts, not an automatic accuracy or superiority
claim. The runner has **not** been deployed or run on real r13 wires, and
has made **zero** r13 tokenizer or judge calls so far.

The independent [raw scorer auditor](../research/g03-beam-r1/audit-beam-100k-ie-r13-source-grounded-judge.py)
and [paired accuracy analysis](../research/g03-beam-r1/analyze-beam-100k-ie-r13-pairs.py)
are also implemented but **synthetic-tested only**. The auditor requires the
sealed label digest before opening real scorer files; it rechecks all 64
tokenizer admissions, the exact frozen request hashes and order, 128 raw
zero-retry attempt hashes, both blind passes, usage, and the independently
derived arm map. Any invalid attempt or repeat disagreement fails the scorer
transfer gate; the analysis cannot proceed. Its five synthetic audit tests
passed, including arm-map tampering rejection.

The analysis preserves **all 32 selected pairs** and the fixed
control-favoring sensitivity for disputed labels. It samples the 16 complete
two-question conversations with replacement for 20,000 paired bootstrap
resamples, using Python MT19937 seeded from the first eight hex digits of the
sealed answer-stage freeze SHA-256; sorted one-indexed ranks 500 and 19,500
form the interval. It also reports the two-sided exact McNemar result. Both
primary and sensitivity lower bounds must exceed zero for the bounded IE
accuracy direction gate. Six synthetic analysis tests passed, including
determinism, denominator retention, negative-effect rejection, and malformed
label/cluster rejection. Neither script has opened real r13 scorer output;
there is still **no 100K correctness estimate or superiority claim**.

## Population and exact source-only transfer

Use all 16 conversation keys in the already sealed 100K holdout partition
(`DEV-SPLIT.json` SHA-256
`3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e`),
two information-extraction questions per conversation: **32 paired questions**.
The source-only JSONL SHA-256 is
`bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d`.
The 16 keys have no key overlap with the 30-conversation BEAM 500K
development population. Preserve the existing four-conversation 100K
development partition and every 500K development example as exposed.

Port the *same* r9 dual-view source selector, with no reference/citation
reads: control BM25 on 2,500-character fragments into at most 5,000
characters; treatment 600-character fragments, BM25 top-300 candidate
pool, the pinned MiniLM ONNX cross-encoder to form r7's 5,000-character
selection, then r9's cross-scored 2,500-character semantic view plus
novel-turn lexical fill to a 5,000-character total. Pin source code,
ONNX/tokenizer files, dependency versions, every selected fragment identity,
projection hash, and all 32 question hashes. Do not tune this mechanism on
100K citations, references, answers, or failures. A source-only mismatch or
missing projection stops the stage; it is not silently replaced.

## Prospective evaluator and label integrity

Before seeing either arm's answer or scorer result, an evaluator-only review
must inspect, for each of the 32 questions, the native reference, native
`source_chat_ids` and complete chronological conversation. Vlad and Dave
review the same question/reference/history without arm identity or outputs.
Each records `supported-current`, `conflicted`, or `ambiguous`, plus cited
turn IDs and a short private reason. An answer that was true earlier but
superseded by a later explicit user update is **conflicted** for a question
asking for the current state. A reference with unsupported completion,
inverted event order, wrong arithmetic, or unresolved target ambiguity is
not `supported-current`. Disagreement remains `ambiguous` until separately
adjudicated without seeing arm outputs. Never silently rewrite a native
reference to match a model answer.

All 32 selected pairs stay in the primary denominator. A conflicted or
ambiguous reference gives neither arm a primary correct credit; report its
count and IDs. In a prespecified control-favoring sensitivity, assign every
such pair treatment incorrect/control correct. At least **28/32** must be
`supported-current` for an accuracy superiority claim; otherwise the
campaign can report only a diagnostic. The label disposition and reviewer
receipts must be sealed before scorer output is read. This rule preserves
the entire selected cohort while making label failures visible.

## Later dispatch and claim gate, not authorized by source-only success

The separately frozen answer stage must use identical GLM-5.3-flash model,
question prompt, 8,192-token request boundary and 512-token output cap for
both arms; every request must pass the same-account tokenizer, both 5K
evidence ceilings and a fresh readiness check. At most 64 matched answer
calls, no automatic retry or post-failure replacement. Seal every final
answer before the evaluator-only label review or scoring. The r12
source-grounded direct-answer scorer is a *development-calibrated candidate*;
its exact prompt, full cited turns, two-pass use and invalid-output handling
must be frozen separately before 100K scoring. A failed scorer transfer
blocks superiority even if answer numbers look favorable.

For this 32-question IE subset, the primary quality measure is ARE-minus-
BM25 strict-correct proportion across all 32 pairs. Use 20,000 paired
bootstrap resamples at the **conversation** level (16 clusters, two
questions each) with a deterministic seed from the eventual cohort freeze.
An accuracy-only directional claim requires all 32 paired generations and
valid scorer judgments, at least 28 supported-current labels, a primary
95% lower bound above zero, and a control-favoring sensitivity lower bound
above zero. The exact McNemar result, per-pair outcomes, invalidity,
token use, local selector CPU, and elapsed time are reported separately.
No native ten-ability, full BEAM, cost, speed, or broad ARE superiority claim
follows. Product-page publication remains a distinct reviewed decision.

## Open Questions

- Will an exact source-only r9 mechanism port produce valid 5K projections
  for all 32 reserved questions without reading evaluator fields?
- Can two answer-blind reviewers certify at least 28 of 32 native references
  against full histories, including later updates?
- Will the calibrated r12 judge transfer reliably to untouched questions,
  and will 16 conversation clusters support a positive lower bound?
