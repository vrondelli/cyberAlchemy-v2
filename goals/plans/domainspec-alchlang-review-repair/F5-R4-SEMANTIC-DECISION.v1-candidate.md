# F5 R4 semantic decision — owner response pending

Date: 2026-10-03. Status: `BLOCK` for R4 BusinessMeaning acceptance,
FormalClaim authoring, capability admission, neutral-set emission and any
claim that the case projection is an executable FormalClaim-derived set.
This record is a decision request, not an owner decision.

## Decision question

Should the accepted R4 meaning be the current candidate capsule's pure
Boolean decision (`shouldCreateMakeupAppliedEvent` iff the same-date
`MAKEUP_APPLIED` count is zero under positive makeup), or the older
count/side-effect invariant? The two are not interchangeable: one states a
decision result; the other makes a side-effect/cardinality claim.

## Options

1. **Pure decision (recommended for the current TDE slice).** Preserve the
   current R4 capsule and five-case projection. The owner must supply or
   approve a BusinessMeaning/acceptance chain for exactly that meaning,
   followed by a definition binding and FormalClaim source. Benefit: the
   existing pure-decision tests remain relevant. Cost: no write/event or
   application equivalence claim follows from them.
2. **Count/side-effect invariant.** Treat the older wording as intended.
   Revisit the current R4 capsule, graph binding, TDE oracle and runtime
   controls before authoring the claim. Benefit: it may align with the
   historical business statement. Cost: the current pure-decision projection
   cannot be promoted or reused as if equivalent.
3. **Defer R4 claim.** Keep the candidate-local projection as a regression
   and pursue independent repair tracks. Benefit: no unsupported semantic
   decision is inferred. Cost: F5's current R4 neutral-set/provider vertical
   remains incomplete.

## Evidence and boundary

- The minted `NoDuplicateMakeupRule` points to the v1 candidate-local
  semantic capsule; it does not assert business acceptance or release.
- The v2 R4 predicate names an external owner-acceptance receipt that is
  absent in this checkout; that receipt would not itself be a BusinessMeaning
  acceptance record.
- No current R4 BusinessMeaning v1/v2 or FormalClaim v2/v4 instance was
  found in the selected formalization/implementation sources. The current
  BusinessMeaning v2 contract requires a base accepted meaning reference.
- The R4 case projection replays exact authored cases only. It is neither a
  neutral obligation set nor provider observation.

Selected option: **pending owner answer**. Source of decision: none.
Remaining blocker: exact accepted R4 meaning and its owner-issued acceptance
and definition-binding chain. No default or silence-as-consent applies.

## Open Questions

- Which option does the owner select, and what exact accepted meaning and
  definition sources will bind the resulting FormalClaim?
