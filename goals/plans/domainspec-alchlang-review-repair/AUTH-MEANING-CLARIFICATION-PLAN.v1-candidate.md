# Auth command-boundary meaning clarification — candidate plan

Status: construction plan for owner review, not a semantic acceptance or F5 result.

## Finding

The admitted Auth product definition requires matching rows for non-empty inbound
identifiers, and its trust model includes `request_id` among those identifiers.
The admitted ontology also specifies the trusted/non-empty authentication and
complete/non-empty route predicates, multiplicity-preserving lists, and exact
candidate provenance. Its individual Rules do not explicitly state that
`request_id` itself must be non-empty. The pinned DomainSpec BusinessMeaning/v1
draft does not enumerate the qualifier predicates or state the request-ID
guard. These are clarification gaps, not evidence that the admitted product
meaning accepted that separate DomainSpec draft.

## Dependency DAG

1. Pin and verify the current bytes of the product-admission decision, its
   definitions, capability and ontology, the v1 meaning draft, and the v2 typed
   Rule/Operation source. Preserve all existing pins and historical results.
2. Prepare a separate, case-local clarification candidate. It must specify
   non-empty `request_id`; exactly one row satisfying each complete selected
   authentication and route qualifier set; list-entry multiplicity; and
   candidate equality to the inbound ID and those same unique rows. Include
   positive and separating negative examples, exact source refs, and an
   explicit owner-decision question. It has no acceptance effect.
3. Prepare a complete successor BusinessMeaning before seeking DomainSpec
   meaning acceptance. Use the existing v1 candidate schema with the same
   `meaning_id`, a distinct version, and its permitted `supersedes` string
   naming the predecessor identity. Bind the predecessor's exact path, SHA,
   and size in the separate clarification/review artifact, not an invented
   BusinessMeaning field. Do not use the v2 candidate schema: its
   `base_accepted_meaning_ref` requires an accepted base absent in this case.
   Select at most one current draft; do not rewrite or silently supersede the
   pinned v1 file.
4. Independently review the candidate against the admitted product bytes and
   exact v2 AST. Add successor-specific checks without rebinding the historical
   checker, trace, report, or evidence. Record any remaining semantic mismatch.
5. Obtain an actual owner interpretation decision for the clarification, then
   a separate exact owner acceptance decision for the complete versioned
   BusinessMeaning. Clarification acceptance alone is interpretation evidence,
   not DomainSpec meaning acceptance or all-context preservation. Only after
   those decisions and a separate preservation argument route v4, TDE,
   post-TDE executable request, provider and F5 through their own gates.

## D65 lanes and claim ceiling

- Product frontier: one explicit, reviewable meaning candidate.
- Runnable work: digest-bound clarification, independent review, and local
  validation of its source/identity links.
- Operational support: local checks only; no deployment or external effect.
- Causal blocker: owner interpretation and acceptance of the precise READY
  predicate, followed by an all-context preservation argument.
- Deferred residue: v4 FormalClaim, neutral TDE set, post-TDE request,
  authenticated provider observation, EVF/F5 and runtime guarantees.

The already selected F5 order is unchanged: TDE derives exact cases and
witnesses, then a separate finalizer issues the executable verification
request. AlchLang lowering is not rerun on the TDE output. No local check in
this plan grants acceptance, F5 satisfaction, or
`runtime_guarantees_observed`.

## Open Questions

- Does the product owner confirm that non-empty `request_id` is part of READY?
- Does the owner confirm the exact typed qualifier inventory as the normative
  meaning of “qualifying,” including duplicate list entries?
- What independently replayable argument will establish all-context
  preservation across source, generator, generated Rust, and wrapper?
