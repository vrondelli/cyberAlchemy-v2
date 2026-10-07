# G02 r11 guarded delta verifier r3 — terminal supply result

Status, 2026-10-04: **stopped before provider dispatch because the prospectively
fixed shortlist coverage gate failed**. No r3 tokenizer or generation request
was made, and no fresh task was consumed.

The [pre-evaluation protocol](G02-R11-GUARDED-DELTA-VERIFIER-EXPOSED-R3-PROTOCOL-2026-10-04.md)
froze a role-stratified shortlist and an order-invariant candidate-versus-
abstention verifier. The source-only builder reduced the sealed r1 top-24
rankings to 45 candidates across 12 tasks, retaining fused leaders and the
first source, test, documentation, configuration, and outside-prior-ranking
candidate.

The evaluator-only coverage audit found only **3/22** undelivered-gold file
occurrences, all in `ansible/ansible`, versus the frozen minimum of four hits
across two repositories. The retained hits were:

- task 1: `docs/docsite/rst/user_guide/playbooks_filters.rst`;
- task 5: `lib/ansible/modules/apt.py`; and
- task 5: `lib/ansible/modules/dnf.py`.

The other three repositories had zero shortlist hits. The gate therefore
failed before the zero-retry GLM runner could freeze or dispatch. This rejects
the exact “first candidate per artifact role” compression: it loses too much
of r1's cross-repository acquisition coverage even though the full depth-24
ranking retained 9/22 missing-gold paths across three repositories.

## Receipts

- packet builder SHA-256:
  `a7bb0a95bf13ffe4fe928562f7fc519e33075768dc8d382a6d7824206e9522ab`
- packet SHA-256:
  `a9dc4039a4d859423ab33265c8283a13c4bb79aa6eefa28bd35b2876f5d63e61`
- coverage auditor SHA-256:
  `5d3ab463df6241acdb3d3fc5d5134f144fc0809e5dd6c0461dbed58184f002fa`
- coverage audit SHA-256:
  `a4ea88dc701c8c347b8f81179e2bfcdbf8f6ee4a66316e924f0a0e86b5237484`
- private packet root:
  `/home/vlad_/are-benchmark-archive/g02-r11-guarded-delta-packets-exposed-r3-20261004`
- provider generation calls: zero;
- provider tokenizer calls: zero;
- fresh tasks consumed: zero.

The runner, sealer, and final evaluator remain unused frozen implementation
evidence. There is no r3 run root because the acquisition gate stopped before
runner freeze.

## Claim boundary

This is negative exposed-development evidence. It does not weaken r1's full
depth-24 acquisition result, but it proves that the exact role-stratified
compression is not an eligible verifier supply. No ARE quality, DSH, transfer,
or superiority claim follows.

## Open Questions

- Can a low-cost discriminator preserve the full top-24 cross-repository reach
  without sending all 288 candidate placements to GLM?
- Should the next G02 development step use a local semantic/cross-encoder
  screen, or reserve pointwise GLM verification for a smaller independently
  retrieved set?
