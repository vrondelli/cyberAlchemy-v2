---
fixture_id: F1
generation: 001
review_state: approved
evaluation_state: not-run
---

# F1 Fabrication Gate Evidence Review

## Observed Boundary

The bounded specimen accepts an immutable candidate plus substrate-specific
source material and returns an explicit success/failure result. Candidate mode
and substrate fail closed; PDF matching normalizes symmetrically and applies
mode-sensitive locator rules. In intake, a missing parse or failed gate writes
a reject and continues before a `PendingFact` can be appended.

## Existing Explanation Set

| ID | Explanation |
| --- | --- |
| A-01 | Existing Rule/Operation/Workflow behavior accounts for predicate evaluation and result production. |
| A-02 | Contextual pre-queue gate role accounts for where the artifact acts. |
| A-03 | Validation-gate architecture pattern accounts for fail-closed routing before admission. |
| A-04 | Ordinary sequencing accounts for gate-before-append order. |
| A-05 | Aggregation accounts for candidate, mode, substrate, locator, and source-slice participation. |
| A-06 | Named-instance behavior accounts for local `F-EXTRACTOR-FABRICATION` specifics. |

The receipt records the complete 6 x 5 predicate matrix. No observation is
declared globally irreducible.

## Substitutions

- Permitted: an NFC/whitespace-equivalent source representation preserves the
  normalized match branch (`f_extractor_fabrication.py:127-131,175-183`).
- Breaking: OCR character substitution and off-by-one page substitution are
  explicitly rejected with `F_EXTRACTOR_FABRICATION`
  (`test_f_extractor_fabrication.py:110-149`).

## Uncertainty

The evidence is local to this gate and these selectors. It does not establish
cross-domain portability, a Processor kind, or a compound kind.

## Review Boundary

This review freezes evidence inputs only. SWU-CDSC-006 owns evaluation.
