# G02 r11 code-anchor r3 — exposed task-4 full episode

Status, 2026-10-03: **terminal scored; frozen success condition failed**. This is an ARE-only, already-exposed development rerun, not a matched pair or an independent campaign.

The separately frozen task-4 input added three previously sealed r3 code-anchor path/line hints to the original focused source packet for the exact base commit and issue digest. The freeze SHA-256 was `d7e5cf6350c08d73615c85bc742153ed69690be1d50bb80fc91ca9d90da8a61f`. It preserved the r11 20-call policy, used a 512 MiB container limit, and predeclared success as native File-F1 above 0.25 without lowering Span-F1 below 0.4050405597869837.

The full episode settled with `final_context_selected`, ten model responses, 136,835 known model tokens, zero unknown-usage requests, and 166.095 seconds. The initial packet actually delivered all three added paths: `to_json.hpp`, `identity_tag.hpp`, and `detected.hpp`; the complete initial packet held eight source reads and 9,161 source bytes. Prediction and costs were sealed before native scoring at `PRE-SCORE-SEAL.json` SHA-256 `2007692af663086e7bd15c138026de8861ce24813bfd3d62f26edfd56ada2ff2`.

The native scorer returned **Span-F1 0.1302002245** and **File-F1 0.2222222222**. The archived r11 task-4 ARE result was Span-F1 **0.4050405598**, File-F1 **0.25**, and **85,443** known tokens. Thus both quality measures fell, and the new episode used **51,392 more tokens (+60.15%)**. These are non-matched, single-exposed-task observations; they do not estimate an intervention effect. The native-score SHA-256 is `375b6decb9258f4387512fb72e505c1840ba3e8c5d22c75f48b99c486a82074a`; the compact result SHA-256 is `26de27cd4eb9ab2e587a4291b328b21b0d57d6141209fd099610e2ef20907707`.

An independent local audit recomputed both F1 values from the native metrics, verified all five pre-score input hashes, score-script and native-score hashes, ten model-response events, and the three added paths in the eight-read packet. The full VPS run was copied to `/home/vlad_/are-benchmark-archive/g02-r11-code-anchor-r3-full-episode-task4-r1/raw/`; an `rsync --checksum` dry run found no VPS/WSL difference. No VPS data was removed. The scored result rejects direct promotion of the r3 code-anchor packet as a full-episode quality improvement on task 4, despite its positive post-hoc file-set replay.

A post-score trajectory comparison found that the archived ARE prediction named three files: `from_json.hpp`, `type_traits.hpp`, and the amalgamated `single_include/nlohmann/json.hpp`. The rerun named those same three plus `to_json.hpp`; it did not name the other two added initial-packet headers. The fourth file reduced native File-F1 rather than improving it. This describes the observed final selection, not a new source-only admission rule or an independently estimated effect.

## Open Questions

- What caused the full agent to omit or devalue the delivered paths despite the earlier file-set and one-shot signals? Diagnose from source and sealed trajectory without treating task 4 as fresh validation.
- Can a general, issue-grounded acquisition policy improve actual reads and both native quality measures on more than one exposed development task before a separately frozen untouched cohort?
- Which fresh, exposure-clean population can support the eventual paired G02 superiority gate? This result supplies no answer to that claim gate.
