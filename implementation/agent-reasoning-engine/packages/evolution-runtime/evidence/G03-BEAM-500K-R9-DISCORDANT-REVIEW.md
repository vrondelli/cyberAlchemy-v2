# G03 BEAM 500K IE r9 — discordant-answer review

Status: **private preliminary source-and-answer audit of exposed development
cases**, 2026-10-03 UTC. This does not change r9's sealed primary score or
qualify an untouched cohort by itself.

## Bound evidence

The deterministic [review-packet builder](../research/g03-beam-r1/build-beam-500k-dev-ie-r9-discordant-review.py)
bound all 19 non-tied question pairs to their question, both final answers,
rubric items, and sealed scores. Its private packet SHA-256 is
`c5ff8ee5a00a99c41cfa82edf7076210854a1938e9b5516aa587f0af72df94cb`.
The separate [source-review builder](../research/g03-beam-r1/build-beam-500k-dev-ie-r9-source-review.py)
bound those exact 19 IDs to native evaluator answers and cited conversation
turns from the pinned 500K **development** Parquet only, at private SHA-256
`bc2b2d7e06ebfc6862105bebf2d7711770552ed16020d11540cf2a6f8b4a611f`.
Neither builder reads reserved 100K evaluator values or sends model requests.
Raw answers, conversation turns, and evaluator references remain in the
private archive, not this repository.

## Preliminary case disposition

Of 14 rubric-favoring treatment pairs, **nine** give the requested fact or
formula directly and agree with a cited user turn: free-throw percentage,
shopping schedule, age/profession, investment amount, training cost, lens
decision date, tool versions, sequence formula, and relationship duration.
This is a single-agent source/answer review, not an independent blinded
adjudication. Their probe ID prefixes are `2c413d7a`, `3f98850e`,
`45a30701`, `4af4a8c9`, `51b33f57`, `79548ee8`, `a30c6b37`, `bfed0d1b`,
and `d1fba1d9`.

Five favorable pairs need explicit caution:

| Probe prefix | Preliminary finding |
| --- | --- |
| `2fd0d301` | The cited user turn says the party is **at my place** on 1423 Maple Street, but treatment says the address appeared only in an assistant suggestion and does **not** establish home. The rubric awards the mentioned address despite that incorrect qualification. |
| `3d7e1537` | Treatment leads with a different point pair and lists the reference pair only among alternatives; the judge awarded both mention criteria. The cited user turn contains the reference pair. |
| `8548b293` | Treatment answers “not stated,” yet receives partial mention credit for voice coaching. Cited turns cover preparation and hopes, but the native reference also seems to turn proposed steps into completed readiness; its temporal interpretation needs adjudication. |
| `9700f2da` | The cited exchange verifies the product rule on a particular two-factor function. Treatment mostly describes other functions and gives a generic product-rule outline without that function's full derivative or distribution. Partial rubric credit may overstate target-answer quality. |
| `b070f906` | Treatment answers “not stated” and adds generic related advice; the rubric gives partial mention credit although the native reference concerns a particular backend/frontend recommendation. |

Of five rubric-favoring control pairs, the practical/emotional routine case
(`6439bc12`) is a clear control gain: it states the schedule the treatment
omits. The laptop comparison (`cfed2021`) is at least a narrower control
advantage in coverage, though neither answer lists all reference prices or a
final recommendation. The other three need caution: the apartment case
(`057348b6`) discusses different prices/alternatives from the cited
three-apartment exchange; the residence case (`94348351`) gives “not stated”
in both arms despite a cited user turn explicitly saying New Gary, Saint
Helena; and the salary case (`cbd257f4`) is a **reference-currentness
conflict**. Its cited turn says approximately $75,000 CAD, but a later
user turn selected by treatment explicitly says a recent raise to $80,000
CAD as a senior engineer. Both arms answer $80,000 to a *current salary*
question. Do not score that case as an uncomplicated treatment failure or
rewrite the native reference after the fact.

## Post-hoc sensitivity, not the primary result

The [fixed sensitivity script](../research/g03-beam-r1/audit-beam-500k-dev-ie-r9-mention-sensitivity.py)
sets four clear mention-credit treatment gains (`2fd0d301`, `3d7e1537`,
`8548b293`, `b070f906`) to ties while leaving every loss unchanged. The
paired mean becomes **+0.11389** with a 20,000-resample paired-bootstrap
95% interval of **+0.02326 to +0.21042**. Also tying the target-mismatch
case `9700f2da` yields **+0.10451**, interval **+0.01424 to +0.20000**.
Both remain above r9's numeric development threshold, but these are
**post-hoc conservative diagnostics**, not preregistered replacement scores,
answer-level accuracy, native BEAM results, or independent superiority.
They do not solve rubric fidelity or source-label ambiguity.

## Next evidence gate

Before opening any reserved 100K evaluator values, fix a held-out protocol
that scores *direct answers to the asked question*, binds source/reference
integrity review without selecting cases by outcomes, retains a matched BM25
control and exact 8K/5K constraints, and reports full model plus local
selector cost. The 100K population has only 16 reserved conversations; its
source-only projection contains **32 IE questions** (two per reserved
conversation), versus eight IE questions in the four development
conversations. This count reads only the previously stripped source-only
JSONL and sealed split; no reserved evaluator answer or rubric was opened.
Source-integrity eligibility, 8K admissions, and predeclared claim ceiling
need source-only/evaluator-separated preflight.
Do not reuse r9's adapted criterion-only score as an official BEAM score.

## Equal-budget control verification

An initially suspected evidence-budget imbalance was **not real**. R9's
historical BM25 control uses 2,500-character *fragments* packed into a
5,000-character *projection*. Its observed projection lengths range from
4,900 to 5,000 characters (mean 4,966.33), versus the same 5,000-character
ceiling for dual-view. A separately versioned source-only 5K BM25
reconstruction sealed 60/60 selections at private SHA-256
`058c069af971657d124734f010f9be8595cf56686e5f8e72003cd56e8ca9680e`;
all 60 projection hashes were **identical** to r9's actual control. The
receipt field named `previous_bm25_2k5_projection_sha256` is a historical
misnomer for the 2,500-character *fragment* cap; the bound hash is of the
5,000-character projection. A secondary evaluator-only citation audit
confirmed the same 31/60 hit-all and 33/74 cited-turn reach for that BM25
control versus dual-view's 43/60 and 47/74, private receipt SHA-256
`0982e92b2618f0dc46ddbbb1332f53b1986f2c7b1acf81a85265e1069d015e54`.
This resolves the budget-confound concern, not the answer-scorer and
reference-integrity concerns. No new model call was made.

## Open Questions

- Can two independent reviewers agree on direct-answer and label-integrity
  adjudication for the 19 exposed discordant pairs without outcome-driven
  rule changes?
- Does the reserved population support enough eligible paired IE questions
  for a meaningful, prospectively frozen accuracy claim?
- Which exact scorer can be made compatible with BEAM while rejecting
  incidental mention and unsupported reference-currentness assumptions?
- Does dual-view retain a *direct-answer* advantage over its already
  equal-5K BM25 control on an untouched population?
