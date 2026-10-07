# F5 Auth SFOL to DomainSpec v4 correspondence — construction plan

Date: 2026-10-03. Status: reviewed candidate implementation unit; no v4
FormalClaim, TDE-neutral set, admission or F5 qualification.

## Product frontier

Use the current *admitted Auth SFOL claim* as non-synthetic source material
for the DomainSpec v4 claim gap. Its one typed predicate is a conjunction of
three Boolean inputs, and TDE has eight finite valuations. An exact technical
correspondence can identify those inputs and cases, but it cannot turn Auth's
existing admission into a DomainSpec v4 admission or prove the abstractions
equivalent to the concrete command-boundary operation.

## Dependency DAG

1. **Select authority and source bytes.** Read the exact Auth product
   admission decision and its pinned definitions, capability and business
   ontology, plus the separate SFOL admission decision and its pinned claim
   and module. Select the exact clause manifest and current TDE case set.
   Independently re-read current regular-file bytes from the Auth checkout
   and compare them to the selected source Map; reject symlinks, changed or
   missing selected bytes, and inconsistent identities.
   Auth source files retain historical candidate labels; the later owner
   decision admits their exact Auth-level bytes, not v4 meaning.
2. **Check the typed clause and finite domain.** Require one admitted,
   three-input Boolean `AND` predicate for `AUTH-CB-SFOL-READY-IFF`. Check
   eight unique valuations of the three flags, their case identities,
   source clause/module digests and Boolean expected oracle values (one true,
   seven false). This checks the existing TDE selection; it does not replace
   TDE derivation or prove concrete input reachability.
3. **Map candidate relations and losses.** Record each Boolean flag's
   candidate Auth rule ID and exact typed ontology-property IDs. Check ID
   presence and property type/cardinality, but mark semantic equivalence
   `unverified`: Auth rules are prose and the abstraction loses list
   multiplicity, concrete identities/permission/provenance construction and
   realizability of arbitrary flag combinations. The Boolean-to-READY/DENY
   result mapping also needs preservation review.
4. **Keep the hard gate.** Emit a deterministic correspondence/loss report
   with `blocked-for-v4-admission` and `neutral_set_eligible:false`. Do not
   emit a purported current v4 FormalClaim, v2 TDE payload, neutral set,
   finalized request, EVF pass or authority effect. The DomainSpec
   `smt-sfol` solver profile is not Auth's finite Boolean `domainspec-sfol/v1`
   profile; substitution must be rejected. List missing v4-specific accepted
   BusinessMeaning v2, subject-bound acceptance, definition graph, formal
   profile/identity selection, projection/preservation, and current proof
   context (selected source-manifest missing; historical build digest drift).
5. **Validate and replay.** Focused tests must pass on current non-synthetic
   Auth bytes and reject changed admission pins, definitions/ontology/claim,
   altered AST/input sort, missing/duplicate case, oracle mismatch and false
   profile substitution. Recompute to test deterministic currentness and
   preserve no-authority/no-neutral-set fields.

## Review and D65 lanes

Independent implementation analysis checked the current Auth admission
hashes and the v4 contract. Independent plan review accepted this as a typed
correspondence and abstraction-loss inventory, not a second case derivation
or a v4 claim. It emphasized that exact rule/property ID links are only
candidate correspondences because the ontology rule statements are prose.

- Current product frontier: a source-backed, testable Auth-to-v4 semantic
  correspondence report.
- Runnable product work: implement the Auth-case-local builder/validator and
  separating tests; independently review final bytes.
- Operational support: later provider provenance and isolation are not needed
  for this source-mapping unit.
- Causal blocker for F5 satisfaction: v4-specific accepted meaning and claim,
  exact TDE projection/preservation and current proof context, executable
  oracle, provider identity and enforced execution policy.
- Deferred residue: owner review/admission, E03/E05/L3X/P01-P03 successor
  qualification, release and deployment after an eligible chain exists.

## Open Questions

- Which exact DomainSpec BusinessMeaning v2 and acceptance can represent the
  admitted Auth command-boundary meaning without inventing a new owner choice?
- Which checked abstraction and result-map proof will connect the concrete
  Auth operation to the three Boolean SFOL inputs and READY/DENY outcomes?
- How will the current source-manifest/build proof-context gap be closed?
