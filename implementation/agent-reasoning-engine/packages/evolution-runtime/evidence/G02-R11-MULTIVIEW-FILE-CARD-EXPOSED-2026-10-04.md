# G02 r11 multi-view file-card acquisition — exposed development

Status, 2026-10-04: the prospectively fixed, source-only acquisition screen
**passed its exposed-development gate**. This is candidate-generation evidence,
not an actual ARE read, native quality score, independent transfer, DSH
comparison, or superiority result.

## Hypothesis and boundary

The preceding location-type diagnosis found 22 native-gold paths absent from
the files delivered by ARE, including documentation, configuration, tests, and
code. Generic full-repository lexical retrieval reached only 6/22 at depth 24,
including one path outside the prior relation union. External work on
[retrieval-oriented code representations](https://arxiv.org/abs/2607.11046)
and [graph-guided localization](https://arxiv.org/abs/2503.09089) suggests
representing repository artifacts through complementary compact views rather
than treating raw source or paths as the only retrieval surface. The evidence
here tests that mechanism locally; it does not reproduce either paper.

Before evaluator access, the source program fixed six rankings:

1. path plus inferred artifact role;
2. a structural card containing declarations, imports, configuration keys,
   headings, test names, and the first 40 lines;
3. bounded raw text;
4. the same corpus queried with up to 16 terms extracted from issue-matching
   neighborhoods in already delivered files;
5. the pinned prior code-only lexical ranking; and
6. the pinned prior relation-union ranking.

The rankings were combined with deterministic reciprocal-rank fusion (`k=60`).
Every file came from the exact Git base, had to be tracked, regular, UTF-8 text,
and no larger than 262,144 bytes. Delivered paths were excluded. No reference
path, score, model response, or DSH result was available to the source stage.

The frozen depth-24 gate required at least eight undelivered-gold hits, at
least two hits outside the prior relation union, and hits in at least two
repositories.

## Result

| Depth | Undelivered-gold hits | Outside-union hits | Repositories with a hit |
| ---: | ---: | ---: | ---: |
| 12 | 7/22 | 1 | 3 |
| 24 | **9/22** | **3** | **3** |
| 48 | 12/22 | 4 | 3 |
| 96 | 15/22 | 4 | 3 |

The depth-24 gate passed. Against the pinned code-only lexical screen at the
same depth, the fused representation added three gold hits and two
outside-union hits, with unchanged three-repository coverage. The newly
reachable cross-layer examples include the Ansible filter guide at rank 18,
Ansible's module executor at rank 11, and the Meraki documentation fragment at
rank 23. The result therefore changes G02's frontier: acquisition beyond the
old candidate union is possible without increasing the source-window cap.

The complete top 24 still contains 288 candidate placements for nine hits.
It is not an eligible three-read policy.

## R2 compact-card selector — terminal rejection

The next step was separately frozen before its model calls. Each of the 24
candidates carried an integer ID, path, inferred artifact roles, contributing
retrieval views, structural key terms, and one bounded source window. The
instruction emphasized that related-but-unchanged files are false positives,
allowed zero to three selections, and recommended abstention. All 12 packets
passed the same-account 8K tokenizer gate. The WSL controller used the existing
remote-mounted transport: requests executed inside the VPS provider-gateway
container, and the credential never crossed the host boundary.

The zero-retry run produced **12/12 valid responses** and 13 proposed paths,
using 44,235 known chooser tokens and 71.408 seconds of summed generation
time. After the responses were sealed, evaluator access found only **1/13**
new-gold selections (7.69% precision), in one repository. Set-based
counterfactual mean File-F1 fell **0.53597 → 0.43955** (delta -0.09642), with
one improved task and nine regressed tasks. The frozen gate required five
hits, two repositories, at least 20% precision, and nonnegative mean File-F1;
it failed.

The sole hit was `lib/ansible/executor/module_common.py` on task 5. The model
instead favored plausible tests or nearby implementation files on most other
tasks. The exact r2 compact-card selector is rejected and must not consume a
fresh cohort. The result also shows why candidate reach and selection quality
must remain separate gates: r1 improved reach, but that improvement did not
survive three-read selection.

## R3 role-stratified guarded verifier — terminal supply rejection

A separately frozen [r3 guarded-verifier protocol](G02-R11-GUARDED-DELTA-VERIFIER-EXPOSED-R3-PROTOCOL-2026-10-04.md)
then attempted to preserve artifact diversity while reducing the top-24 pool
before independent candidate-versus-abstention judgments. Its source-only
shortlist retained 45 candidates, but the pre-provider evaluator gate found
only **3/22** undelivered-gold occurrences, all in one repository. The fixed
minimum was four hits across two repositories, so r3 stopped with **zero GLM
or tokenizer calls**. The exact role-stratified compression is rejected; see
the [terminal result](G02-R11-GUARDED-DELTA-VERIFIER-EXPOSED-R3-RESULT-2026-10-04.md).

## Reproducibility receipts

- Source program SHA-256:
  `9a94cfff4b2d67ec40777d9f785e44de995357efca63ca7749a69269ab230bfc`
- Evaluator program SHA-256:
  `bd1b6637548153696d6483806fc0bfb9b7d59a033c04634024e2978c7c31f672`
- Gold-blind source seal SHA-256:
  `2f01525c5e58f35755a3943462d9d90fcac23c1386587ea02aae4620592cd8fb`
- Evaluator audit SHA-256:
  `1fcfbdfde1fab5788f4d9e94595db4c945b100d03f8e6e8b481428362b8847e6`
- Private output root:
  `/home/vlad_/are-benchmark-archive/g02-r11-multiview-file-card-exposed-r1-20261004`
- Provider calls: zero.
- Fresh tasks consumed: zero.

R2 chooser receipts:

- Packet builder SHA-256:
  `d83df2d0492e17da5b49cc5a0867c58c0c36dea3e97698aceb7437f1a998c677`
- Runner SHA-256:
  `2d41f5da1e81a0b95c75d461a79bd9e91ad53fb03383add38013ffb09f62e594`
- Freeze SHA-256:
  `fd6d8ff0405c687e1580975a06fbebb02bcbcf181700c0412120ab59eef80d25`
- Sealed responses SHA-256:
  `b24b6780e93a5bfd57739ba6e8f6bcdce0108a9b3c0523c0deae5211c420305f`
- Evaluator audit SHA-256:
  `484865230bac7eddd2f1af355fca926e3bb051282cac16c54a95c72fd6d5b056`
- Private chooser root:
  `/home/vlad_/are-benchmark-archive/g02-r11-multiview-choice-exposed-r2-20261004`
- Generation calls: 12 chooser calls plus one bounded readiness call; no
  retries.
- Fresh tasks consumed: zero.

## Claim ceiling

R1 establishes an exposed candidate-acquisition improvement only. R2 directly
rejects this compact-card GLM selector, and r3 rejects the exact role-stratified
compression before provider dispatch. None establishes that ARE can turn
the reachable paths into better spans, that quality exceeds DSH, or that the
mechanism transfers independently. No product or superiority claim follows.

## Open Questions

- Which representation can distinguish files actually changed by the
  reference patch from plausible tests and neighboring implementation files?
- Would source-to-issue entailment scored independently per candidate work
  better than another listwise chooser, or merely add model cost?
- Can the same sealed mechanism transfer to a distinct matched cohort without
  another DSH denominator failure?
