# W1 — Structural forms

## Status

- Entity target form accepted as
  `W1-ENTITY-A-VALIDATED-EXTENSIBLE-FACTORY`.
- Value Object target form accepted as
  `W1-VALUE-A-OWNED-VALUE-PROTOCOL`.
- Enum target form accepted as
  `W1-ENUM-A-NOMINAL-BOUNDARY`.
- W1 target-form decisions are complete.
- No W1 type is implementation-ready.

## Enum

- Exact decision:
  [`../decisions/W1-ENUM-001.json`](../decisions/W1-ENUM-001.json).
- `architecture.EnumImplementation` is the implementation architecture identity;
  it does not replace the canonical DomainSpec Enum definition.
- TypeScript retains the selected owned const-object provider. Python targets
  nominal `Enum`, and Rust targets a native enum.
- Python and Rust use explicit total emit and fallible parse adapters; raw
  strings and wire strings do not become domain members.
- Composition closes the finite set before native type generation and blocks
  duplicate keys, duplicate values, cycles, repeated contributions, and new
  canonical members.
- Python and Rust targets remain `proposed` until their exact profile protocols
  and digest-bound providers exist.

## Value Object

- Exact decision:
  [`../decisions/W1-VALUE-OBJECT-001.json`](../decisions/W1-VALUE-OBJECT-001.json).
- Equality and hashing use the same complete normalized tuple; reference
  identity is forbidden.
- Validators are owner-bound at factory definition time. Factory extensions
  may add validators but cannot change fields, normalization, equality,
  hashing, construction, or immutability.
- Target forms are a TypeScript owned arrow-function factory, Python frozen
  dataclass, and Rust immutable struct. They remain `proposed` until exact
  profile protocols and digest-bound providers exist.
- Nested Value Objects compose through their owned equality and hash protocols.
- Each profile must still close its recursively equality-compatible and
  hashable component domain; ambient host-language object behavior is not
  admitted by this decision.

## Entity

- Exact decision:
  [`../decisions/W1-ENTITY-001.json`](../decisions/W1-ENTITY-001.json).
- The factory binds one or more owner-resolved Rule validators at factory
  definition time. Arbitrary per-call validators are forbidden.
- Factory extension is additive and acyclic: it may add declared defaults,
  pure normalization, validators, and declared derived values, but cannot
  remove base validators, replace identity, change the canonical binding, or
  make the output mutable.
- Target forms are TypeScript factory record, Python frozen Entity dataclass,
  and Rust Entity struct. They remain `proposed` until exact profile protocols
  and digest-bound providers exist.
- Object-reference, Python object-ID, or pointer identity cannot serve as
  canonical identity evidence.

W1 exits with all structural target forms owner-decided and discriminating
identity, equality, finite-set, composition, and wire-boundary negatives. This
closes design selection only; implementation admission remains blocked.
