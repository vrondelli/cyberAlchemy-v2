# Implementation analysis — accepted DomainSpec / AlchLang findings (candidate)

Status: bounded planning evidence, 2026-09-27. No target source changed. This
analysis does not close a finding or claim that the whole system was reviewed.
It is a current-byte companion to `PLAN.v1-candidate.md`. Three read-only
analysts returned for AlchLang, DomainSpec/TDE, and package/docs. The
independent reviewer first returned REVISE; its corrections were applied and
the final bounded plan was ACCEPTED before implementation began.

## Current DomainSpec implementation boundaries

| Track / IDs | Current source and paired control | Exact repair boundary / remaining decision |
| --- | --- | --- |
| D / L01, L02 | `craft/projects/domainspec-v2/impl/cli/src/meta-types/catalog.ts` is byte-identical to the accepted logic-review hash. `test/meta-types/catalog.test.ts` checks default counts/root freeze, unknown label/language, duplicate row and baseline digest. | `validateFrozenCatalog` builds valid ID and label sets from the supplied candidate, so it lacks canonical ID-label and row-pair checks. `deepFreeze` skips children when a parent is already frozen. Add mismatched-pair/retired-ID and shallow-frozen-parent controls separately; arbitrary full-row byte equality and cyclic inputs remain owner questions. |
| C / tracked key prerequisite | `impl/test-derivation-engine/src/rules/index.ts` is byte-identical to the review hash; `derive(graph, _rules)` never reads `_rules`. `src/keys/index.ts` hashes source anchor, rule type and params. | Select semantic versus occurrence obligation identity and the exact rule-set/semantic-source fingerprint before changing keys. Add changed-rule-set and changed-formula freshness controls; a changed key alone does not prove downstream invalidation. |
| C / W3-02 | `src/rules/index.ts` uses `isClosedForm || !isBareCall` and a prior text-shaped ternary branch, so prose can become `calculation`. `src/grammar/normalized-spec.test.ts` samples structural obligations but lacks this negative. | Require recognized AST in both branches. Preserve closed-form positive coverage and classify prose/opaque calls as `needs-formal`; do not call classification arithmetic proof. |
| C / F2 | `src/emit/tests.ts` requires a count-cap AST but uses hard-coded first/duplicate witnesses and expected booleans; `src/emit/tests.test.ts` checks only the existing cap-one sample and emitted strings. | Generate witness cardinalities/outcomes from operator and cap, or explicitly report unsupported shapes. Add cap-two/operator boundary tests and a mutant that would pass the previous hard-coded oracle. |
| C / W3-01 | `src/bte/validation/validate-semantics.ts` validates each exact set's digest, then compares only logical-identity keys. `validate-semantics.test.ts` tests missing/extra identities and a stale own digest. | Compare `content_sha256` for matching identities and test independently valid changed-content sets at comparator and bundle caller. Equal set IDs are not part of the accepted request. |
| G / W3-04 | `impl/cli/src/assurance/certify.ts` rejects an existing target before work and immediately before `renameSync(staging, target)`. `test/assurance/certify.test.ts` covers pre-existing target, not an interleaving. | Select an atomic no-replace publication mechanism for supported filesystems, then test a competing target creation between preparation and publication. Keep Lean-dependent proof tests separately unqualified when pinned Lean is unavailable; no actual certificate overwrite was observed in the review. |

All six listed implementation files are clean relative to Git's index. The
catalog, rules, BTE comparator and certify files also match the accepted
current-byte review hashes sampled in this planning turn. The relevant tests
were read, not rerun here. Their existing positive checks must continue to
pass after a repair; the missing negatives are not inferred from test names.

## Current package and documentation boundaries

| IDs | 2026-09-27 observation | Implementation-analysis consequence |
| --- | --- | --- |
| W1-01 | `definitions/minted-project/supported-profiles.yml` still pins the prior relationships digest `82c55e...`; the accepted review observed current `relationships.yml` digest `19790f...`. | Reconcile meaning and fixture/profile bindings before rerunning the named Key-and-Door positive and causal negative controls. Do not only rehash. |
| W2-01, W2-02, W2-03 | Current `definitions/DEFINITIONS.md` still calls `@6` current, `meta-types.md` still says generated-target observation is unimplemented, and `formalization-method.json` still lacks a context-only identity transition. | Documentation/method edits must preserve `@10` pointer, static-only observation ceiling, and claim-owned versus external evaluation-context separation. |
| N9 | Check-only `formalization/validate.mjs` still BLOCKs at DSF-V008 (seven missing/outside-root refs) and DSF-V053 (two definition-registry currentness refs). `formalization-package.json` and `validate.mjs` already have unrelated user edits. | Inspect those diffs before touching package inputs. Resolve source provenance/meaning without adding a sibling runtime dependency or weakening fail-closed checks. |
| N10 | Check-only DomainSpec ontology validator still rejects the first Architecture source as stale. The AlchLang package validator still BLOCKs on `public-realization` and two selected-source drifts. | Reconcile exact current sources, then rerun full validators to expose any later blockers. A first-error fix does not imply package PASS. |
| W1-03, W1-04, W1-07, N8/W1-02 | AlchLang `implementation/README.md`, `docs/FORMAL-CLAIMS.md`, and `docs/LANGUAGE.md` have pre-existing user edits. Current diff shows a path migration but leaves the focused meta-type test's old argument; it relabels the FormalClaim snippet current without adding the required ceiling. | Preserve unrelated edits and fix the exact documented commands/examples with parser/CLI controls. The bridge Mapping example requires complete semantic reconciliation or a supported replacement, not a one-field patch. |

### Exact F-track file and control map

| Accepted IDs | Target and present predicate | Repair/control dependency |
| --- | --- | --- |
| N8/W1-02 | `language/capabilities/alchlang/plans/general-compiler-v1/implementation/README.md:28` recommends linting the predecessor `../domainspec` project. Its `specs/typed-backend/nodes/typed-mapping.json` contains only description/source/target, while `craft/projects/domainspec-v2/impl/cli/src/input/project-model.ts:508-521` requires direction, totality and Mapping fields on the non-typed path. | Select either a supported current project or a reviewed complete Mapping contract; run the literal documented bridge lint and one invalid Mapping control. Do not patch direction alone. The README has unrelated path/documentation edits. |
| W1-03 | `implementation/docs/FORMAL-CLAIMS.md:109-120` labels the snippet current but omits a `ceiling` before the Rule. | Add an explicit claim ceiling and parser control for the exact fenced current-profile block. The file already carries unrelated compatibility/source-path edits. |
| W1-04 | `implementation/docs/LANGUAGE.md:46,52` uses bare `check`/`build` commands even though the selected CLI defaults to the DomainSpec backend and its sidecar prerequisite. | Use an explicit local-compat backend for the historical example or supply a fully bound DomainSpec example; check both commands from the stated directory. Preserve the existing multi-file-composition addition. |
| W1-07 | `implementation/README.md:229` passes `../../../cyberAlchemy-v2/.../meta-type-output.test.ts` to the wrapper, which forwards arguments from `craft/projects/domainspec-v2/impl`. Current existence checks found the documented path absent and `../../../../language/.../meta-type-output.test.ts` present. | Correct the argument and run its host-side test first. The literal wrapper also manages a Docker module volume, so its operational execution needs a separate exact environment choice; path correctness alone is the bounded documentation fix. |
| N11/W1-08 | `language/capabilities/alchlang/README.md:69-70` duplicates the repository directory in two commands after saying “From the repository root.” | Remove only the extra prefix and smoke both literal commands from root. The package validator can still BLOCK for W1-06; a corrected path is not package PASS. |
| N10/W1-06 | `language/capabilities/alchlang/product-capability.json:57` uses `public-realization`, outside the responsibility enum in `capability/schemas/capability.schema.json:49`; `language/capabilities/alchlang/sources.json` has D65 and Language Project selected-source drift. | Owner-route vocabulary must express the intended no-public-realization posture without silently selecting a runtime owner; owner-reviewed source selections then refresh exact hashes. Current check-only validator reproduced these same three errors. |
| W1-01 | `craft/projects/domainspec-v2/definitions/minted-project/supported-profiles.yml` pins relationship authority SHA `82c55e...` while the current `definitions/relationships/relationships.yml` is `19790f...`. | Review authority meaning before re-binding; run the named Key-and-Door positive and all intended negative controls so a registry prerequisite no longer masks their predicates. |
| N9 | `craft/projects/domainspec-v2/formalization/formalization-package.json` retains three `cyberAlchemy-v2/ontology/*` origins, two old `projects/domainspec-v2/formalization/development/...` records and two `arcanum/...` method records that DSF-V008 cannot resolve locally. The package file and `validate.mjs` have unrelated user edits adding a guide/schema and checks. DSF-V053 also rejects two definition-registry refs. | Decide whether each missing origin is a current local import with reviewed provenance, historical external citation, or removed non-required source; then reconcile the registry refs. Do not make the sibling a runtime prerequisite or refresh digests over substituted meaning. Run the complete check-only validator afterward. |
| N10 (ontology) | `craft/projects/domainspec-v2/ontology/sources.json` pins Architecture SHA `c9e26c...`; current `ARCHITECTURE.md` is `3a02f0...`. Check-only `validate-ontology.mjs --require-receipt` stops at this first source. | Review the changed Architecture semantics, then refresh its selected source and derived receipt through the declared process. Rerun the validator to discover later blockers; do not weaken first-source currentness. |
| W1-05 | `craft/projects/domainspec-v2/AUTHORING-TO-RUNTIME.md:632-636` puts Rule consumers and runtime-profile authoring solely under target although bounded `application-v1` projections already exist. | Reword current versus target with implemented candidate forms, while retaining absent typed relationship admission and no provider/runtime observation. Cross-check with the existing consumer and runtime-profile tests; no syntax expansion is implied. |
| W2-01/W2-02/W2-04 | `definitions/DEFINITIONS.md:1699` calls `@6` current despite `current-implementation.json` selecting `@10`; `definitions/meta-types/meta-types.md:45-46` calls generated-target observation unimplemented; `IMPORT-MANIFEST.md:93` names a relocated historical vocabulary destination. | Correct current navigation and static-observation status without rewriting frozen baseline/history. W2-04 is a MINOR/KEEP relocation annotation, not an import-failure repair. |

Current check-only validator status was reproduced in this planning turn:
AlchLang `BLOCK` with the three errors above; formalization `block` at DSF-V008
and DSF-V053; DomainSpec ontology exits 1 at `source.architecture:stale`.
At the implementation phase, a separate check-only run of
`definitions/meta-types/validate-current-implementation.mjs` also failed at
`system-integration evidence digest drift:compiler`: current clean compiler
bytes hash `e4fee61d...`, while the pointer records `528be3d4...`. This is a
newly observed validator blocker, not yet classified as an accepted finding or
repaired by refreshing a digest; its source semantics and provenance need
review before any binding change.
After meaning-reviewed local bindings for Architecture, definitions, the
meta-type human card, and relationships were refreshed in the ontology source
list, its validator advanced to a missing historical
`source.system-integration-r2` refinement result. No equivalent local file
was found by path inventory, so this is a provenance blocker, not a digest
refresh task. The ontology receipt and downstream outputs remain unqualified.
Those failures are current package-input evidence, not authority admission or
proof that unrelated compiler paths fail. The F-track join order is: review
source meaning and dirty overlaps; repair the selected local input; execute
its literal user-facing command/fixture; rerun the complete validator; inspect
any newly exposed downstream blocker. Documentation-only fixes may proceed
independently when their examples do not claim package PASS.

## AlchLang analysis (A/B/E)

| Track / IDs | Current source and paired control | Exact repair boundary / remaining decision |
| --- | --- | --- |
| A1 / N1, N2, W2-03, F5 | `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim-lowering.ts` places interpretation data in identity inputs and resolves the selected acceptance artifact without interpreting its decision. `test/formal-claim-lowering.test.ts` lacks interpretation-only and contradictory-acceptance controls. | Separate claim-owned meaning from evaluation-context identity and join owner, subject, outcome and exact decision evidence. The selected acceptance-record shape and owner decision are required before a concrete patch. The test has an unrelated pre-existing schema-path relocation. |
| A2 / F1, W4-EVF-01, F3 | `src/application-evf-evidence.ts` maps caller outcome into bounded pass without decoding the provider receipt; `src/application-runtime-observation.ts` allows null participants and does not join cleanup run to stage execution. Same-named tests omit contradictory receipt and unrelated-run controls. | Select typed provider receipt/request/comparability contract and a causal run-to-stage/cleanup mapping; add counterexamples while preserving independent stage identities. These four source/test paths are untracked user work, not disposable scaffolds. |
| A3 / F4–F6 | `research/2026-09-22-alchlang-obligation-derivation/REPORT.md` is untracked and retains the Value Object profile mismatch, incomplete context/bound fingerprints, and underspecified unknown outcome. | Correct the proposed report without claiming new engine behavior or runtime proof; preserve its existing draft bytes. |
| B / N3–N7, W4-OUTBOX-05 | `src/durable-outbox-runtime.ts` and `test/durable-outbox.test.ts` are current clean targets. Existing tests cover basic replay/reclaim but not same-worker stale settlement, failed-settlement interleaving, exhausted file-backed reopen, subset/policy replay, equal-instant offsets, or throwing telemetry after COMMIT. | Design persisted generation fence, atomic conditional settlement, recovery budget, complete replay identity, canonical instant and post-commit telemetry handling together. Schema migration and worker API changes are part of the unit; late acknowledgement before reclaim remains a policy question. |
| E / W4-HTTP-03 | `src/http-invocation-adapter.ts` checks model in `resolveBinding` but not `sendOnce`; `src/integration-runtime-types.ts` defines `BindingIdentity` without model, and `src/outbound-runtime.ts` strips model before calling `sendOnce`. | Carry exact model through port, caller and adapter; add direct wrong-model/zero-fetch and outbound positive controls. The adapter is already modified only for its standalone type-import path, which must be preserved. |
| E / W4-UI-04 | `docs-app/src/workspace.ts` regex-checks editable source then executes a hard-coded approval; `docs-app/src/workspace.test.ts` lacks changed-rule and unsupported-declaration controls. | Owner selects executable editor semantics or explicitly fixed simulation. Match command and UI text to that contract; test the accepted false-green mutation. |

## Join, gates and claim ceiling

- The independent DomainSpec/TDE analyst returned read-only C/D/F2/G analysis.
  Its exact file/test pairs confirm the catalog, TDE emitter/rules/key, BTE
  comparator, minted fixture and certify boundaries above. The TDE key change
  needs an explicit stale-and-rederive or dual-read migration for persisted
  obligations/evidence; BTE may need an additive content-mismatch diagnostic.
  Certify's target-exists check has no current interleaving control, and a
  no-replace claim must name the supported filesystems. No tests or validators
  were run by this analyst. It verified that `formalization-package.json` and
  `validate.mjs` are modified user work with hashes matching the candidate
  baseline; the package's baseline Git-state label was corrected from `clean`
  to `modified` after this return.
- The independent docs/package analyst returned read-only F1/F2 analysis and
  reproduced the three check-only package validators: AlchLang BLOCKs on
  `public-realization` plus D65/Language Project source drift; formalization
  BLOCKs on seven DSF-V008 origins and two DSF-V053 definition-registry refs;
  ontology first rejects stale Architecture source. It also found
  `formalization/definitions/formalization-definitions.json` naming an absent
  `arcanum/definitions/DEFINITIONS.md` and stale CyberAlchemy authority
  size/hash. That binding requires source-provenance classification before
  mutation. The documented bridge Mapping must be complete, not merely gain
  `direction`; literal command/fixture checks follow source decisions. Its
  validation DAG is source-meaning and dirty merge boundary → selected input
  repair → original positive/negative or literal command → complete validator
  → investigation of newly exposed blockers. It generated no receipts or
  target edits.
- The independent reviewer returned REVISE on the missing formalization
  definition binding, persisted migrations, certificate fail-closed behavior,
  per-track implementation sheet, and stale governance wording. These are
  plan-quality corrections, not new accepted findings. Re-review ACCEPTED the
  corrected plan and implementation sheet.
- Target implementation remains a separate phase after plan acceptance; no
  repository governance or additional confirmation gate applies. Live provider,
  persistent crash, browser and Lean qualification remain distinct from local
  source/test analysis.

## Open Questions

- Which exact rule-set/version and semantic source fields form the TDE freshness
  identity, and which consumers must invalidate prior evidence?
- Which supported filesystems and atomic no-replace primitive define W3-04's
  implementation and interleaving control?
- Which authority-owned source reconciliation resolves the existing
  formalization, ontology, minted fixture and AlchLang package drifts?
