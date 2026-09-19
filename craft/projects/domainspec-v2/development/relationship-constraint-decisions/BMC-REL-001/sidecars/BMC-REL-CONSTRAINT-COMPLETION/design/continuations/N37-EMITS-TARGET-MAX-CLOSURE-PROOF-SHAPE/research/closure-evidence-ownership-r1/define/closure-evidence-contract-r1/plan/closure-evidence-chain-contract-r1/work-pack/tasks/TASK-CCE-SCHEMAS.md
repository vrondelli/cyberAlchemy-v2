# TASK-CCE-SCHEMAS

Objective: materialize the two separately owned EVF contract schemas without semantic inflation.

## SWU-CCE-002 — envelope

- Source: N43 candidate schema SHA-256 `410c2f6f62355d532c98d920f70adc240d760d08484d89d2c49186ca8dacdec9` and minimal fixture.
- Writes: `contracts/emits-incoming-closure-evidence-envelope.v1.schema.json`, `fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/valid-minimal-envelope.v1.json`, and its execution receipt.
- Required transformation: replace candidate `$id`, title, description, `schema_version`, and internal fixture contract path/version with the selected EVF v1 identity; preserve every semantic field and closed-key constraint.
- Acceptance: Draft 2020-12 schema valid; fixture validates; inline exact populations, placement, incoming adjacency, snapshot, attestation, currentness boundary, and `authority_effect:none` remain closed.

## SWU-CCE-003 — evaluator receipt

- Dependency: joined SWU-CCE-002 terminal and Invoke closeout receipts.
- Source: N44 candidate schema SHA-256 `9e200fe8ce4f7ad4d9c440fe700648c85b782380ba8789005b1d2ff1b91b2430` and four result fixtures.
- Writes: `contracts/emits-target-max-evaluation-receipt.v1.schema.json`, four fixtures under `fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/`, and its execution receipt.
- Required transformation: replace candidate identity/path fields with the selected EVF v1 identity and bind the exact admitted envelope schema and fixture digests.
- Acceptance: error > invalid > incomplete closure > pass precedence remains deterministic; currentness stays external or unknown; claim ceiling and `authority_effect:none` remain closed.

Both units are repository-local reversible writes. Neither admits the schemas to a relationship profile or implements an evaluator.
