# First Longitudinal Shadow Result

Status: rejected with preserved counterevidence  
Authority effect: none  
Activation: none  
Result digest: `fe3936b472d9cfea37248953b86e1d769fde0c90946eb15c20f59f8af91abce4`

## Outcome

The first post-predecessor shadow cohort did not support the typed longitudinal
projection:

| Measure | Legacy baseline | Candidate |
| --- | ---: | ---: |
| Independently labeled episodes passed | 20/20 | 20/20 |
| Accuracy | 100% | 100% |
| Absolute improvement | — | 0 points |
| Protected failures | 0 | 0 |

The frozen contract required at least 15 points of absolute improvement and at
least 80% candidate accuracy. The candidate cleared accuracy and safety but had
no improvement, so the result is `shadow-rejected`. `lpc.shadow` is not settled,
no continuity handoff is available, and Cycle 2 remains waiting.

## Cohort and independence

- The scanner found 74 new relevant sessions and 150 candidate turns after
  excluding all 75 predecessor sessions.
- The first freeze failed closed when the active session changed after scanning.
- The stable v2 freeze excluded that drifting session and selected 20 episodes
  across nine stable sessions from 44 eligible candidates.
- One separate evaluator agent emitted 20 typed verdicts covering all six
  workflow-family labels. The verdict set contains 21 preference events and no
  raw quotations or protected failures.
- The durable artifacts contain derived metadata, typed events, verdicts,
  hashes, and receipts only. The temporary raw-message handoff was deleted
  after its typed verdicts were sealed.

## Diagnosis

Independent review found zero genuine resolver-discriminating boundaries:

- cross-objective boundary: 0;
- cross-workflow exception: 0;
- temporal expiry or inferred conflict: 0;
- cross-thread recurrence: 0;
- later scoped revision/revocation that distinguishes resolvers: 0; and
- any legacy/candidate decision divergence: 0.

The cohort mostly measured immediate same-scope recall. Scope fields were
present in some labels, but no later query placed objective, workflow, time, or
thread scopes in competition. The result therefore measures oracle-construction
consistency, not the intended longitudinal advantage.

## Frozen revision contract

The next shadow revision must freeze 24 episodes before scoring, with four from
each stratum:

1. cross-objective boundary;
2. cross-workflow exception;
3. temporal expiry or inferred conflict;
4. revision/revocation followed by a distinct later query;
5. cross-thread recurrence; and
6. same-scope or no-preference controls.

At least 12 episodes must have a structure capable of producing different
legacy and candidate decisions. Every non-control query must be a genuinely
later observed application point. Selection within a stratum is chronological
or hash-ordered before resolver scoring, overlapping windows are deduplicated,
and source/session contributions are capped. A missing stratum leaves the
cohort collecting; easier cases cannot substitute for it.

The predeclared thresholds remain candidate accuracy at least 80%, absolute
improvement at least 15 points, zero protected failures, and at least 75%
accuracy in every discriminating stratum.

## Revision runtime

The revision contract is now executable in
`src/longitudinal-shadow-revision-v1.mjs` through the closed JSON entry point
`bin/longitudinal-shadow-revision.mjs`.

The runtime validates every classification against the sealed ingestion
manifest, requires a genuinely later observed application turn, rejects false
cross-thread labels, deduplicates overlapping windows, caps contributions per
session, and selects chronologically inside each stratum. It emits
`COLLECTING` with an exact deficit for every missing stratum; it cannot replace
a missing boundary with an easier case. Assessment is unavailable until the
balanced 24-episode cohort is frozen, then applies the overall and per-stratum
thresholds above. These records remain derived-only and have no activation or
authority effect.

The first revision discovery pass reviewed 66 stable sessions and 90 selected
turns with a separate evaluator. Four source sessions had drifted and two more
were omitted by the sensitive-content screen. The evaluator found zero valid
classifications: no observed later application exercised a discriminating
boundary. Many single-turn records contained injected context in the user field;
repeated real prompts were parallel agent branches. The real-source freeze is
therefore `COLLECTING`, with a deficit of four in each of the six strata. This
is a bounded negative discovery result, not a candidate score. The temporary
message handoffs were removed after the derived review was recorded.

## Evidence

- Stable cohort and source snapshot:
  `../../evidence/longitudinal-continuity-authorized-automation-v1/shadow-v2/`
- Sealed assessment and typed verdicts:
  `../../evidence/longitudinal-continuity-authorized-automation-v1/shadow-v2/assessment-v2/`
- The `shadow-v1` directory preserves the earlier freeze whose evaluator
  handoff rejected source drift.
- `../../evidence/longitudinal-continuity-authorized-automation-v1/revision-v1/`
  contains the derived discovery review, empty classifications, collecting
  cohort, evaluator queue, and artifact receipt.

## Next frontier

`lpc.shadow-revise`: collect and independently classify the six frozen strata
through the revision runtime. The runtime is ready; the natural evidence is
not yet sufficient. A later source snapshot must distinguish actual user
utterances from injected context and seek truly later application turns.
Do not advance to `lpc.canary`, emit the Cycle 1 handoff, or start linked
automation treatment from this result.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
