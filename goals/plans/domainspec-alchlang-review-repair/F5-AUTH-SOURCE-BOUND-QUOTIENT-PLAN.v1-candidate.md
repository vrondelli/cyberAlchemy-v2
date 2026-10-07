# F5 Auth source-bound quotient checker — candidate plan

## Product frontier and evidence ceiling

The current Auth SFOL correspondence derives the three-Boolean `AND` clause
and all eight valuations; the native witness bridge runs one concrete context
per valuation. Neither result establishes how the generated Rust operation
behaves on every other concrete context. This unit checks a narrower,
source-bound algebraic factorization of the exact current successor Rust:

For any representable `CommandBoundaryContext c` whose rule evaluations
terminate normally, let `alpha(c)` be the outcomes of the three selected
public Rust rules. If the reviewed rule functions are stable and pure, the
selected guard and operation imply `admit_authorization_command(c) = Ready`
iff all components of `alpha(c)` are true; otherwise the result is `Deny`.
The eight existing native witnesses corroborate that all abstract triples are
reachable. This is not a proof that any leaf rule implements accepted business
meaning, a formal verification of Rust/compiler semantics, a DomainSpec-v4
claim, a TDE-neutral set, provider evidence, or F5 satisfaction.

## Plan → analysis → review → implementation DAG

1. **Select current bytes.** Reuse the current successor binding and full CLI
   receipt validation from the Auth native-witness bridge. Check the exact
   receipt artifact size/SHA against on-disk generated Rust and Cargo bytes;
   independently pin the reviewed Rust file's literal SHA-256
   `6501579fd22c0ba60d876331ab2208406996dd46bbf73913dc64778194e08d1a`
   and size `12987`, so a future candidate receipt cannot silently redefine
   the reviewed source;
   retain the historical build-digest drift. Re-derive the Auth SFOL clause
   and eight cases from the existing correspondence. Do not edit any admitted
   Auth source, historical receipt, generated Rust or TDE case.
2. **Constrain source interpretation.** Implement a case-local strict checker
   for this exact reviewed Rust source, not a general parser or a regex search
   over arbitrary code. Bind the whole-file SHA and size; fail closed on
   duplicate/missing named functions, unrecognized guard/operation body,
   changed context field/enum definitions, leaf-rule bodies, result variants
   or extra code. The checker may recognize exact
   function-body templates with a balanced lexical boundary scanner and
   inspect the fixed leaf-rule bodies, but it must not infer purity from a
   function name or ignore comments/strings that could conceal a decoy. A
   whole-file byte pin plus manually reviewed derivation is an acceptable
   narrow result; do not call it an automated purity proof.
3. **Derive a bounded certificate.** Record exact source, receipt,
   correspondence and witness identities; the three rule selectors; the
   checked guard composition and operation branch derivation; assumptions
   about ordinary Rust evaluation, terminating/stable/pure leaf outcomes and
   compiler/source identity; the equation above, restricted to instances of
   the exact pinned struct definitions rather than deployed ingress contexts;
   and an explicit claim ceiling. Do not label it an admitted v4 FormalClaim
   or `all-context preservation`. If the certificate includes eight-witness
   existential corroboration, re-execute those witnesses rather than trust a
   cached report hash. Replay must re-read current bytes and rederive the
   certificate, rejecting stale or rehashed caller-held data.
4. **Negative controls.** Reject in-memory source mutants: `OR`, omitted,
   duplicated or swapped rule call, swapped Ready/Deny branches, extra branch,
   side-effecting or unknown call, duplicate function and comment/string
   decoy. Exercise the semantic recognizer directly on mutants in a test-only
   path, bypassing the production digest gate; otherwise hash rejection makes
   these controls vacuous. Reject changed receipt/binding/Rust bytes and forged rehashed
   certificate. Keep eight native cases as independent runtime corroboration,
   not premises of the universal equation.
5. **Validate and synchronize.** Run focused Auth checker tests and strict
   TypeScript checking; review exact write set and candidate wording. Record
   only the supported source-bound result in `IMPLEMENTATION-STATUS.md`.

## Selected context and write scope

- `auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/domainspec-v4-correspondence.ts`:
  typed clause and eight exact selected cases, with explicit abstraction
  losses and unverified semantic-equivalence status.
- `auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/native-witness.ts`:
  current-successor binding, validated receipt, exact Rust/Cargo selection,
  and eight concrete native observations.
- `auth-foundation/implementation/current-runtime-successor-v1/command-boundary/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs`:
  selected context, three leaf rules, guard and operation.
- `auth-foundation/implementation/current-runtime-successor-v1/command-boundary/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json`:
  current CLI-valid artifact and typed-closure receipt, distinct from the
  historical build pin.
- Write only new case-local checker and tests, this plan and the repair status.
  No compiler, generator, ontology, admitted decision or runtime mutation.

## D65 lanes

- Current product frontier: reviewed exact-source quotient certificate.
- Runnable product work: strict source recognition, source/receipt binding,
  derivation report, replay and negative controls.
- Operational support: local bounded test/typecheck; no provider request.
- Causal blockers for F5: owner-selected v4 meaning and subject acceptance,
  checked leaf-rule-to-meaning preservation, current proof-context admission,
  TDE-neutral cases and independently authenticated provider execution.
- Deferred operational residue: deployment, release and downstream
  E03/E05/L3X/P01–P03 requalification.

## Open Questions

- Can a reviewed exact-source certificate be expressed without overstating
  the trust placed in the fixed Rust source and ordinary compiler semantics?
- Which owner-selected v4 meaning and preservation relation will connect
  these concrete rule outcomes to a neutral obligation set?
