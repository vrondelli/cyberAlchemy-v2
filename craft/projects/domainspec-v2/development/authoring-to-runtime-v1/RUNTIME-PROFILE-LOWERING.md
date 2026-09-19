# I05 — explicit runtime/provider profile lowering

Date: 2026-09-17. Authority effect: none.
Scope: authoring, exact selection formation, and same-source executable target
validation. Provider execution, per-integration graph joins, and the public
application command are separate I06/I07 obligations in EXECUTION-DAG.json.

## Supported construction syntax

The existing application-v1 scanner now accepts a separate runtime-profile.
This bounded syntax forms the current provider contract; it does not claim that
all shorthand in the target AUTHORING-TO-RUNTIME guide is implemented.

```alch
domain commerce "Commerce"
profile application-v1
owner commerce-team

runtime-profile CommerceProduction:
  target typescript
  selection provider-selection:commerce-production
  provider-pack domainspec.reference-postgresql16-nats-http/v1-candidate
  runtime node "26.8.1"
  provider persistence postgresql:16
  provider messaging nats:jetstream
  provider outbound-http http:outbound
  provider inbound-http http:inbound
  environment DATABASE_URL secret-reference required
  environment INBOUND_BIND_ADDRESS endpoint-reference required
  environment NATS_URL endpoint-reference required
  environment PAYMENT_BASE_URL endpoint-reference required
  environment WEBHOOK_SECRET secret-reference required
```

The explicitly selected provider pack owns library names and versions. Authors
do not repeat them or override individual libraries. All four capability roles
must be selected explicitly; there is no default provider, runtime or profile.
The five names above are references only. No environment is read during formation,
and no URL, password or secret value is accepted in these clauses.

The same provider selections work with:

| Target | Explicit runtime clause | Meaning |
| --- | --- | --- |
| typescript | runtime node "26.8.1" | Existing generated Node engine requirement |
| python | runtime python ">=3.11" | Existing generated Python requirement |
| rust | runtime rust-edition "2024" | Existing Cargo edition, not a compiler-version or MSRV claim |

These requirements share one backend source with the generated package manifests.
Unsupported targets, packs, providers, versions or environment slots fail closed.
This is the existing reference pack, not an arbitrary plugin/provider catalog.

## Formation and consumption

Alch's public lowerApplicationRuntimeProfiles(source, profileId, compiler) validates
every authored profile through DomainSpec's public resolveProviderRuntimeProfileV1.
The selected pack resolves its exact language-specific matrix, then delegates to
the existing provider-selection validator. The emitted providers.json retains the
unchanged domainspec.provider-pack-selection/v1-candidate contract.

Each declared profile emits:

- runtime-profiles/<normalized-profile>/providers.json
- runtime-profiles/<normalized-profile>/requirements.json

runtime-profiles/trace.json binds the source bytes, explicitly selected profile,
provider and requirement digests, and emitted files. The currentness check reforms
from source instead of trusting edited hashes. Duplicate normalized paths and
selection identities reject; invalid unselected profiles cannot hide.

Domain formation, Rule projection and executable preparation accept an explicit
ApplicationRuntimeContext containing profile and compiler. Authored profiles
without that context reject. The selected runtime target must match executable
selection.language. Profile artifacts are companion files, not domain nodes.
The executable result retains the selected runtime; it does not start providers.

## Acceptance boundaries

Focused tests cover exact TypeScript/Python/Rust provider JSON; pack-owned library
resolution; absent/duplicate/unknown roles; wrong target/runtime; credential and
executable clauses; multiple profiles; source/output/currentness drift; and
same-source preservation of domain nodes, FormalClaims, Rules and condition joins.
Existing domain/executable/API native tests remain predecessors.

I06 must join these selections to exact logical integration references; I07 must
deliver safe user-facing loading/build/verification. No graph or runtime execution
guarantee follows from I05 formation. Remaining decisions and obligations are owned
by CURRENT-REVIEW-AND-PLAN.md and EXECUTION-DAG.json.
