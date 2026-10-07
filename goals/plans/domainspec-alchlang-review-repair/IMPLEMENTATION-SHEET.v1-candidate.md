# Exact-file implementation sheet (candidate)

Status: planning only, 2026-09-27. No target repair is authorized by this
document alone: independent plan review precedes the separate implementation
phase. Paths below are relative to this repository. Before each track, list
all transitive callers/consumers with `rg`, record current hashes and Git state,
and inspect dirty diffs. Preserve all pre-existing edits; use additive patches.
Rollback means reverse only this repair's hunks (or restore the affected
transaction from a verified backup), never reset a dirty file wholesale.

Abbreviations: `AL` =
`language/capabilities/alchlang/plans/general-compiler-v1/implementation`;
`DS` = `craft/projects/domainspec-v2`; `CLI` = `DS/impl/cli`;
`TDE` = `DS/impl/test-derivation-engine`.

| Track | Initial file ownership and dirty overlap | Contract, migration and rollback boundary | Focused planned validation (from cwd) |
| --- | --- | --- | --- |
| A1 | `AL/src/formal-claim-lowering.ts`, `AL/test/formal-claim-lowering.test.ts` (test modified); `DS/formalization/method/formalization-method.json` and relevant identity definitions after diff check. | Keep claim-owned meaning in identity; move interpretation/context into evaluation freshness. Bind selected acceptance owner, subject, outcome and exact decision evidence. Preserve unrelated test path edit. No persisted migration assumed until consumers are inventoried; changed identity schema must invalidate old evaluation evidence, not silently upgrade it. Revert only new lowering/method hunks if controls fail. | `AL`: `node scripts/run-toolchain.mjs tsx --test test/formal-claim-lowering.test.ts`; then `npm run typecheck`. |
| A2 | `AL/src/application-evf-evidence.ts`, `AL/src/application-runtime-observation.ts`, paired same-named tests (all untracked user work). | Receipt/request/outcome comparison must be explicit and typed; stage participant and cleanup must be causally linked to one observed run without mandatory shared operation ID. Never overwrite untracked files wholesale. No provider/live migration. Roll back only new hunks. | `AL`: `node scripts/run-toolchain.mjs tsx --test test/application-evf-evidence.test.ts test/application-runtime-observation.test.ts`; then `npm run typecheck`. |
| A3 | `research/2026-09-22-alchlang-obligation-derivation/REPORT.md` (untracked user work). | Correct Value Object profile, context/bound fingerprints and explicit unknown provenance as a proposal; no engine claim or data migration. Preserve draft and reverse only new prose. | Inspect report diff against accepted F4–F6 predicates; no test can certify report semantics. |
| B | `AL/src/durable-outbox-runtime.ts`, `AL/test/durable-outbox.test.ts` (clean); inventory worker API callers before edits. | Transactional v2→v3 SQLite migration with attempt preservation, legacy lease revocation, exhausted-row dead-letter and complete replay identity; legacy incomplete replay conflicts. Every claim has a persisted increasing generation; publish/fail use atomic owner+generation+status predicate. Roll back failed migration as one transaction; never dispatch mixed schema. Validate a backup/reopen before any live DB application. Old-worker cutover excluded. | `AL`: `node scripts/run-toolchain.mjs tsx --test test/durable-outbox.test.ts`; file-backed reopen, stale-settlement, failed-migration and throwing-telemetry controls; `npm run typecheck`. |
| C | `TDE/src/emit/tests.ts`, `src/emit/tests.test.ts`, `src/rules/index.ts`, `src/keys/index.ts`, `src/grammar/normalized-spec.test.ts`, `src/bte/validation/validate-semantics.ts` and paired test, `src/index.test.ts` (clean at baseline); inventory every key consumer. | Count witnesses from AST cap/operator or reject unsupported; classify calculations by recognized AST; compare exact-set member hashes. Version current obligation key over rule-set plus semantic-source fingerprints. Existing persisted keys/evidence remain history but are stale-and-rederive; if derivation fails, no old evidence promotion. Roll back new key version/code together; preserve old history. | `TDE`: `pnpm exec vitest run src/emit/tests.test.ts src/grammar/normalized-spec.test.ts src/bte/validation/validate-semantics.test.ts src/index.test.ts`; `pnpm run typecheck`; then full `pnpm test`. |
| D | `CLI/src/meta-types/catalog.ts`, `test/meta-types/catalog.test.ts` (clean). | Compare candidate entries against canonical ID/label membership pairs and retired IDs, not arbitrary full-row equality. Freeze descendants even if a parent is already frozen. No persistent migration; revert only catalog/test hunks. | `CLI`: `node --import tsx --test test/meta-types/catalog.test.ts`; then `npm run typecheck`. |
| E1 | `AL/src/http-invocation-adapter.ts` (modified user type import), `src/integration-runtime-types.ts` (untracked), `src/outbound-runtime.ts` and exact paired tests after inventory. | Propagate model identity through public send boundary before any fetch. Preserve modified import/untracked type file. No persisted migration; revert only model-contract hunks. | `AL`: focused adapter/outbound tests selected by `rg --files test`; `npm run typecheck`; direct wrong-model must have zero fetches. |
| E2 | `AL/docs-app/src/workspace.ts`, `src/workspace.test.ts`; inspect current dirty state before touch. | Select executable editor semantics if supported; otherwise explicitly fixed simulation and reject unsupported edits. UI claim and execution must match. No persistence migration; revert only new UI hunks. | `AL/docs-app`: `npm exec vitest run src/workspace.test.ts`; `npm run build`; browser execution remains separately qualified. |
| F1 | `AL/README.md`, `AL/docs/FORMAL-CLAIMS.md`, `AL/docs/LANGUAGE.md` (modified); `language/capabilities/alchlang/README.md`, `product-capability.json`, `sources.json`; Mapping fixture at `language/capabilities/alchlang/plans/general-compiler-v1/domainspec/specs/typed-backend/nodes/typed-mapping.json`. | Preserve user prose/path edits. Resolve complete Mapping or choose supported project; current FormalClaim ceiling; literal backend/path recipes. Responsibility enum and selected-source digests change only after meaning/provenance review, never to silence validator. Roll back only own documentation/JSON edits; no runtime migration. | Run literal README commands from their stated cwd, relevant parser/lint control, then from repo root `python3 language/capabilities/alchlang/scripts/validate.py`. Any first-error unblock requires full rerun. |
| F2 | `DS/definitions/minted-project/supported-profiles.yml`, `DS/AUTHORING-TO-RUNTIME.md`, `DS/definitions/DEFINITIONS.md`, `DS/definitions/meta-types/meta-types.md`, `DS/IMPORT-MANIFEST.md`; `DS/formalization/formalization-package.json` and `validate.mjs` (dirty), `DS/formalization/definitions/formalization-definitions.json` (clean), `DS/ontology/sources.json`; inventory derived receipts. | Verify authority meaning and classify each missing origin as local import/historical external/non-required. Rebind only legitimate local sources and current definition refs; retain provenance and independent candidate limits. Do not depend on sibling checkout at runtime. Minted positives and negatives must reach their own predicates. Preserve dirty formalization edits and historical record. Revert only own bindings/prose; regenerate derived receipts only after source validation. | `DS/formalization`: `node validate.mjs`; `DS/ontology`: `node validate-ontology.mjs --require-receipt`; from `TDE`: `pnpm exec vitest run src/minted-project/key-door-vertical.test.ts` including its positive and causal negative cases; rerun each complete validator after repairs. |
| G | `CLI/src/assurance/certify.ts`, `test/assurance/certify.test.ts` (dirty after the prior repair). | Recheck atomic no-replace publication on the supported primitive and deterministic competing-create control, preserving the competing target. Failed staging remains for separately inspected cleanup under the owner-selected policy; no automatic pathname-based recursive deletion. Retention diagnostic/procedure is operational hardening outside W3-04's original publication predicate. No persisted migration. Reverse only new hunks. | `CLI`: `node --import tsx --test test/assurance/certify.test.ts`; `npm run typecheck`; inspect the retained-stage failure test separately. Lean-dependent proof remains unqualified if pinned Lean unavailable. |

## Join and evidence ceiling

Tracks sharing semantics or files join before merge: A1/C identity; A2 provider
and runtime observation; F1/F2 package provenance; B/E outbound behavior.
Run AlchLang implementation `npm test`, DomainSpec TDE `pnpm test`, relevant
CLI suites and all three validators after focused controls. A failing unrelated
baseline is recorded, not suppressed. An independent closer maps each of the
38 ledger IDs to a source diff, separating negative and positive controls,
command output, and residual limit. Local tests do not establish provider
authenticity, production runtime guarantees, Lean qualification, or the
unreviewed whole-system coverage.

## Open Questions

- A1 exact acceptance-record decision schema and A2 provider receipt schema
  require source-contract inspection before patches.
- E2 must choose executable editor versus fixed simulation from the actual
  workspace product contract; an unsupported edit may be refused explicitly.
- G needs a supported filesystem and no-replace primitive to be named in code
  and test; absence is fail-closed, not a best-effort rename.
