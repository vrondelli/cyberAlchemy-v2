# Financial-settlement property decision

Status: awaiting financial domain-owner decision. Authority effect: none.

## Recommendation

Select **C3 first**. Its proposed rule is a pure calculation: return one half
when the integer limit is at least 100, and two fifths otherwise. Three fixtures
cover above, at and below the threshold, and two existing mutations change the
comparison and return value. This is the smallest coherent way to measure
whether the CRABS property, counterexample, repair and replay mechanism transfers
to a second domain.

Select **P4** when the priority is effect and ordering assurance. Its proposed
rule requires one payout write followed by one matching `PayoutCreated` event
when payout is positive and no prior payout exists. Six existing mutations cover
missing, incorrect and reordered effects. Its current denominator contains only
the eligible case; zero-payout and duplicate-payout behavior are explicit
residue, and the effect adapter adds a larger observation trust surface.

The options are C3, P4, both as separate packages, a bounded revision, or stop.
C3 and P4 must retain separate denominators and promotion decisions if both are
chosen.

## Preflight finding

The prior adoption report is useful candidate evidence, but it cannot be reused
as a current execution binding. Formal owner approval is false. Its recorded
runner and source-proposal digests no longer match current bytes, and its
consumer implementation paths are absent from this checkout. The schema and
validator handles still match. After owner selection, the transfer must locate
or restore the real consumer and freeze a new binding before executing.

## Claim boundary

Selection confirms the property meaning and opens bounded construction. It does
not approve a repair, admit the prior adoption report, grant release authority,
or establish full financial-settlement coverage.

## Open Questions

- Who is authorized to confirm the financial-settlement business meaning?
- Where is the consumer implementation referenced by the prior adoption report?
