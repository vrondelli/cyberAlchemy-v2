# F5 Auth command-boundary meaning candidate

Status: reviewed construction plan, amended after code review found a concrete
same-row provenance counterexample; no DomainSpec acceptance or F5 qualification.

## Product frontier

Author a same-case DomainSpec BusinessMeaning/v1 draft from the exact Auth
command-boundary product ontology and typed Rule/Operation nodes. Auth product
and SFOL admission do not constitute a DomainSpec BusinessMeaning acceptance.
The v2 meaning requires an accepted same-case predecessor that does not yet
exist. Do not borrow the unrelated session-role-permission meaning.

## Dependency DAG

1. Bind the current admitted Auth product and SFOL source bytes, then the
   typed three leaf rules, aggregate guard, operation, context and decision
   nodes. Check typed expression and result structure, not just identifiers.
2. Author a schema-conforming v1 draft whose READY/DENY biconditional is
   limited to normally evaluated, representable command-boundary contexts.
   Include positive and negative examples, multiplicity and same-unique-row
   provenance boundaries, and exclude downstream authorization and production
   security. Do not weaken the admitted Auth definition to fit the current
   typed Rule.
3. Rebuild a read-only source trace from current bytes. Keep concrete leaf
   rule to admitted meaning equivalence `contradicted-by-current-typed-source`
   while the current provenance `exists` can select a nonqualifying row;
   neutral-set eligibility false and authority effect none. Reject changed
   source, subject, rule
   order, guard, result variants and any promotion field.
4. Validate schema and focused negative tests. Submit the exact draft to the
   owner for semantic review separately. Only an actual accepted same-case
   v1 decision can become the v2 predecessor; later v4, preservation, TDE
   neutral derivation, post-TDE finalization and provider observation remain
   subsequent dependencies.

## Scope and gates

Write only a new case-local draft, checker/tests, this plan and repair status.
Do not edit admitted Auth artifacts, generated Rust, historical TDE receipts
or AlchLang lowering. The existing eight Boolean cases and native witnesses
are corroboration, not proof of all-context preservation. The owner's F5
sequencing remains TDE derivation before executable-request finalization.

## D65 lanes

- Product frontier: owner-reviewable same-case DomainSpec meaning draft.
- Runnable work: exact-source checker, schema and adversarial tests.
- Operational support: local test/typecheck only.
- Causal F5 blockers: repair the typed provenance Rule in a versioned successor
  and re-establish exact Auth source bindings; then exact meaning acceptance,
  v2 lineage and definitions,
  v4 claim/preservation/current proof context, neutral TDE set, authenticated
  and isolated provider evidence.
- Deferred residue: downstream E03/E05/L3X/P01-P03 qualification, deployment
  and release.

## Open Questions

- Does the owner accept this exact command-boundary meaning, or require a
  narrower or different rule before an acceptance decision is issued?
- How will a versioned typed-rule successor bind command provenance to the
  same unique qualifying rows without rewriting admitted historical bytes?
- What evidence will establish all-context preservation beyond the current
  source-bound quotient and eight finite witnesses?
