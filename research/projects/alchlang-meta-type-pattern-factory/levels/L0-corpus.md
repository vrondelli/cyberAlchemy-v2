# L0 — corpus

## Observed substrate

- DomainSpec has an owner-admitted frozen `@10` baseline with 13 backend
  meta-types and 39 TypeScript/Python/Rust realization rows.
- Meta-type definition, realization, proof provider, factory execution, CLI
  instantiation, and provider runtime are already separate packages.
- The factory is an explicit-registry, immutable-input proof DAG; it creates
  evidence and does not grant authority.
- The canonical CLI plans one node/language realization, publishes to a new
  target atomically, and includes a baseline-bound receipt.
- Provider-neutral D45-D49 system-integration formation exists, but canonical
  provider runtime and observed runtime guarantees remain open.
- AlchLang owns product-facing meaning and typed terms/edges. Its current
  carrier is parser-independent and target-neutral.
- The current AlchLang compiler lowers Markdown directly and renders mostly
  TypeScript/JSON outputs without invoking the DomainSpec proof factory.
- Its pattern registry successfully demonstrates dependency-derived
  availability, but only for `DS-D1.4 Operation` and two patterns.
- The SQLite transactional Outbox is a local candidate implementation. It is
  not evidence that the canonical provider-runtime gap is closed.

Full source identities are in [the source record](../sources/SOURCE-RECORD.md).

