# Current formal authoring and lowering implementation

Status: S03/S04 complete for the L0 formation slice; the separate bounded S06
realization is now documented in `EXECUTABLE-LOWERING.md`. Authority effect: none.

The existing Alch parser now selects `profile application-v1` explicitly and
returns `alchlang.application-source/v1-candidate`. Its formal declarations
contain typed sorted-FOL syntax trees and Rule references. Its data declarations
contain fields, types and exact reference targets rather than unchecked source
rows. Duplicate domain/owner declarations, missing symbols and unsupported
declarations reject. The legacy compiler does not consume this carrier.

The current typed source slice includes Entity, Value Object, Enum, Event, and
Operation declarations. Scalars are `String`, `Bool`, and `UInt64`, matching the
current DomainSpec typed substrate. Fields can name another data declaration,
use `optional<T>`, `list<T>`, `set<T>`, or reference an explicit Entity identity
with `-> Order.id`. Composite sum types and remaining declaration kinds are
still C02/C03 work; unsupported constructs are rejected, not silently retained.
This stage does not claim the full application profile is ready.

## Formal source API

The Alch public API exports:

```typescript
lowerApplicationFormalClaims(source, bindings, exactSourceBytes)
```

`source` is the authored `.alch` text, which the API reparses. `bindings` uses
`alchlang.formal-claim-bindings/v1`, contains the exact source SHA-256 and owner,
and binds each authored claim exactly once. The per-claim properties are:

- `claim_id`, `claim_version`, and nullable `supersedes`;
- `business_meaning_ref` and `business_acceptance_ref`;
- `definition_binding_ref`;
- `formal_language_profile_ref`;
- `identity_algorithm_ref`.

Every reference contains `path`, `sha256`, `size_bytes`, and `current: true`.
`exactSourceBytes` is a caller-supplied map of bounded relative paths to bytes.
The API performs no filesystem discovery or provider effects. It verifies every
selected reference against those bytes, validates selected meaning and
definition records, verifies explicit definition edges and transitive closure,
and rejects a changed profile or unsupported identity algorithm.

The implemented fol-core parser is pinned to the exact selected record in
DomainSpec's `formalization/profiles/formal-language-profiles.json`, rather than
trusting an arbitrary document that reuses its profile ID. Other records in the
same registry do not enter the claim's selected-profile semantic digest.

The supported identity algorithm is exported as
`FORMAL_IDENTITY_ALGORITHM_BYTES`. A caller must include those exact bytes and
explicitly bind their reference. The algorithm preserves proposition structure,
sorts and parameter order; it does not claim logical or alpha equivalence.
Definition closure is a key-sorted JSON array of exact definition bodies sorted
by definition ID. The exact definition binding is also part of claim identity.

Accepted meaning and acceptance records are supplied inputs. The compiler does
not create, authenticate, or grant acceptance. Tests use synthetic fixture
decisions only. Schema/identity validation does not become owner approval.

## Output and remaining work

The function returns the parsed model, FormalClaimSource/v4-candidate objects,
their deterministic `formalization/claims/<name>.json` bytes, and a source trace
for every emitted claim. Representation and structural semantic identity have
separate digests. Each claim retains `adapter-required` for the later TDE v2
projection and declares that its InterpretationModel belongs to an external
evaluation context.

`lowerApplicationDomain` now forms the domain partition and formal sources,
condition bindings and non-executable operation shapes. The focused fixture
compiles through the current DomainSpec compiler and joins exact claim bytes.
The trace hashes every project file and every formed companion; companion
entries also record byte counts. Authored enum variant descriptions remain in
the source trace because the backend sum contract does not own that prose.

`assertApplicationDomainCurrent` re-forms from the exact source, bindings and
external bytes and compares the complete formation. Edited files, missing or
extra files, trace edits, and edits hidden behind refreshed hashes reject.
This validates exact formation, not proposition truth or executable behavior.

Event occurrence realization is I00/C02 work; unsupported Event lowering
continues to reject. Operation shapes from this formation API remain
non-executable; the separate S06 API validates explicit action bindings and
plans native code. Formation alone is not executable realization.

Verification on 2026-09-17:

- typed application-source tests cover distinct roles, nested types, identity
  references, unknown clauses, wrong kinds and duplicate domain/owner inputs;
- formal-lowering tests cover byte repeatability, source trace, whitespace and
  provider independence, semantic identity mutations, stale/missing bindings,
  definition closure mutations, and profile-semantic mutations;
- emitted claims and fixture meaning/definition bindings are checked against
  the actual DomainSpec draft-2020-12 schemas;
- Alch strict typecheck passes.
