# Runtime Handoff Pack — SWU-APE-ONT-004

Strict coverage: `pass`

The selected unit adds one evidence-only observation projection contract. Its
facts distinguish observations from effective constraints and use exactly one
closed provenance carrier: observed, derived, owner-resolved, or unsupported.
Every carrier has an owner route and resolves nonempty raw-reference IDs against
the projection registry. Derived, owner-resolved, and unsupported carriers also
carry their kind-specific derivation, decision, or diagnostic reference.

The exact product scope is five files: the schema; cases, expected projection,
and focused Node checker under `examples/enum/provenance/`; and the existing
ontology validator. The lifecycle output is `SWU-APE-ONT-004.json`. No ontology,
profile, adapter, authority, or publication file is in scope.

Acceptance requires four positive carrier cases, missing/mixed/unresolved
negative cases, and a two-fact conflict whose normalized diagnostic is identical
in forward and reverse input order. Validate with Node `22.13.0`, repeat the
focused checker byte-for-byte, run the full ontology validator, compare all live
post-images with staged bytes, and run scoped `git diff --check`.

The claim ceiling is local schema and deterministic fixture behavior. This does
not prove raw evidence authenticity, real adapter correctness, owner-decision
currency, language parity, promotion, release, or production readiness. The
older flat TypeScript fact fixture and hostile duplicate JSON keys remain
explicitly outside this SWU.
