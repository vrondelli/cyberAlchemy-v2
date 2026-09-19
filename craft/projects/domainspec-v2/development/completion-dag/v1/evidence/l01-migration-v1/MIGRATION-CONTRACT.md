# L01 migration contract candidate

The proposed product is a bounded compatibility layer that keeps existing consumers working while making input selection, parser rejection and changed-file validation explicit. This is a definition-stage candidate, not implemented migration or approval.

## Required concepts

### Retain — proposed; owner: DomainSpec migration owner

Keep the selected existing surface and its supported semantics available while migration candidates are tested. Retention does not reapprove its implementation or expand its guarantees.

Formal constraint: `retain(x) => remove(x)=false and supported_behavior(x) preserved within the selected profile`. Keep working consumers available. Example: Preserve TDE obligation keys and BTE/SFOL entry points. Boundary: Local migration disposition, not a new canonical DomainSpec type.

### Adapt — proposed; owner: DomainSpec migration owner

Introduce a separately testable successor boundary that preserves declared valid-input semantics and makes unsupported or invalid inputs explicit, without editing frozen sources.

Formal constraint: `valid_selected_input(i) => O_successor(i)=O_baseline(i); invalid(i) => no_success_output(i)`. Repair the interface while preserving the meaning of valid inputs. Example: Add checked derivation that rejects parser violations instead of discarding them. Boundary: Diagnostics may improve only as explicitly declared; no implicit caller cutover.

### Retire — proposed; owner: DomainSpec migration owner

Propose ending a precisely named compatibility surface only after its consumers, replacement coverage and rollback are demonstrated, followed by a separate explicit removal/cutover decision.

Formal constraint: `retirement_eligible(x) => exact_consumers(x) and replacement_tested(x) and rollback_defined(x); eligible != authorized`. Remove nothing until replacement and recovery are proven and removal is authorized. Example: Replace obsolete changed-file selection only after all selected path cases pass. Boundary: Existing DROP exclusions remain exclusions; this pack grants no deletion.

### Compatibility envelope — proposed; owner: DomainSpec migration owner

Name the exact input dialect, selected source bytes, existing profile and derivation identity, outputs, diagnostics and consumer for every comparison.

Formal constraint: `E=(dialect,source_refs,profile_ref,deriver_ref,consumer,output_contract); compare only within E`. State exactly which old behavior a successor must preserve. Example: Compare the sample aspect fixture against its existing legacy derivation; do not compare its count with a different machine profile. Boundary: No universal Markdown/JSON equivalence claim.

### Obligation correspondence — proposed; owner: DomainSpec migration owner

Reuse the existing selected derivation and its obligation identities. A bridge preserves each obligation and reports unmapped or unsupported material explicitly; it does not reconstruct obligations through generated Markdown or infer parity from equal counts.

Formal constraint: `mapped(O_source)=O_bridge with identities and semantic payloads preserved; unmapped != passed; different profiles require explicit correspondence`. Carry existing checks across without inventing or dropping checks. Example: Keep legacy SHA1 keys from source_anchor, rule_type and canonical_params; preserve the existing EVF S1 fixed obligation ID within that separate profile. Boundary: No hash algorithm replacement or new obligation denominator.

## Per-item scope

All 33 ledger rows and two additional notes have one proposed disposition in dispositions.json. Retain the TDE package, BTE/SFOL consumers, specification sources, current relationship validator and tag tools. Adapt the checked legacy-input boundary and changed-file selector. Retain staging cards only as evidence. Keep historical DROP exclusions. Defer generic Batch3 skill/harness destinations, unbound DCB work and UI. No current interface is proposed for immediate deletion.

## Consumer compatibility

### L00-C01: TDE src/cli.ts and src/index.ts deriveFeature

- Preserve supported aspect and normalized SPEC derivation, legacy keys, ordering and valid-output content
- Expose explicit aspect, normalized-spec and legacy-auto selections
- legacy-auto preserves aspect precedence and reports the selected dialect/ignored alternate; never merge inputs
- Explicit normalized-spec uses only SPEC.md; explicit aspect uses only the existing recognized aspect set
- Missing selected input and parser violations reject without success artifacts; unparseable formal content remains needs-formal
- Add checked API/entry point; do not silently change deriveFeature return shape or CLI callers

### L00-C02: TDE src/bte/structural-emitter.ts; src/bte/feature-projector.ts

- Retain current structural-emitter and feature-projector consumers
- Compare exact obligations and diagnostic payloads for selected existing fixtures
- Do not change emitter output paths or use an unverified generated view as source

### L00-C03: TDE src/minted-project/derive.ts and l1/l2 modules

- Use exact existing machine profile and derivation implementation with source/registry/graph pins
- Preserve native obligation identities and payloads; no Markdown fallback
- Unsupported profile/material stays explicit; no count-based equivalence with legacy
- Do not generalize the EVF S1 fixed single obligation or E05 owns-reachability scope

### L00-C04: validate-doc-links.ts / validate-relationships.ts / validate-content.ts

- Preserve spec/features default and project-root relationship YAML
- Normalize Git repository-relative paths to the configured feature root using a selected repository root; reject traversal/outside-root paths
- Handle changed Markdown, spaces, rename/delete records and Git errors explicitly; a Git error must not become empty successful work
- Changed-only absence is no-work, not evidence that all documents were validated; deleted/renamed inputs receive explicit dispositions
- Preserve existing relationship/content semantics and validate selected changed files equivalently to normal scan

### L00-C05: aggregate-concept-registry.ts and governance/tags tools

- Retain exact waiver bytes and expiry/owner semantics
- No automatic reset or migration of v1 data into current evidence
- Update explanatory navigation separately from authority or active waiver records

### L00-C06: tools/build-financial-settlement-sfol.ts, run-financial-settlement-sfol.ts, BTE CLI scripts

- Keep SFOL/BTE entry points available and preserve their selected contracts
- Treat their machine-artifact consumers separately from Markdown parsing
- No entire-package retirement based solely on a legacy input label

## JSON-to-obligation semantics

The selected existing machine profile and its exact deriver own the obligation set. The migration boundary accepts only that profile's supported machine artifacts and preserves its IDs, predicates, source anchors and provenance. Legacy keys remain the existing SHA1(source_anchor | rule_type | canonical_params) contract; the separate EVF S1 profile retains its own fixed single-obligation contract. Different profiles are not equal because counts match.

No synthetic universal obligation list is introduced. No machine input is silently rendered into Markdown and re-parsed. Unsupported material/profile mappings remain explicit. A future cross-profile bridge must declare exact source-to-target correspondence, unmapped material and tested semantic preservation before claiming equivalence.

## Compatibility and rollback

Use additive successor modules and explicit entry points. Preserve existing functions and commands until a separately selected consumer-cutover candidate is tested and approved. Keep all frozen source and decision records byte-identical. A failed prototype returns diagnostics and creates no success artifacts. Rollback selects the previous exact entry point and input bindings; it does not rewrite history or delete failed evidence. No data-format migration is selected here.

Retirement requires an exact consumer list, tested replacement coverage, unresolved-consumer disposition, rollback demonstration and separate removal/cutover authorization. An eligible retirement candidate is not an authorized deletion.

## Proposed product tests

- **L01-T01**: Supported aspect input preserves full native obligation identities/payloads and output ordering.
- **L01-T02**: Normalized SPEC fixture preserves full native obligation identities/payloads.
- **L01-T03**: Mixed input selects the declared dialect, reports alternate ignored sources and never doubles obligations.
- **L01-T04**: Absent input or malformed tables/endpoints yields reject, diagnostic sources, and no success artifact.
- **L01-T05**: Unparseable formal content retains needs-formal; it is not guessed or dropped.
- **L01-T06**: Machine inputs retain selected profile identities; stale source/graph/registry references reject.
- **L01-T07**: Unsupported machine profile/material remains explicit; no Markdown fallback or forced parity.
- **L01-T08**: Changed-file selection handles repository-relative v2 paths, spaces, containment, rename/delete and Git failure.
- **L01-T09**: No-work is distinct from full-scan PASS; changed selected files have normal-scan-equivalent diagnostics.
- **L01-T10**: Frozen legacy code, accepted candidates and waiver bytes stay unchanged.
- **L01-T11**: Rollback selects the previous exact entry point/input bindings and keeps failed-candidate evidence.

## Open questions and claim limits

- L01-Q01: Which concrete Batch3 skill/harness destinations are still wanted? Owner: DomainSpec migration owner. Blocks: Only selection of those deferred items. Next: Locate exact owner-controlled source/consumer before inclusion.
- L01-Q02: What current DCB candidate, if any, discharges the historical note? Owner: DCB correctness owner. Blocks: DCB inclusion only. Next: Resolve exact delivery/evidence; retain unknown meanwhile.
- L01-Q03: Which current AEO waivers should remain applicable? Owner: Code-tag waiver owners. Blocks: Waiver changes only. Next: Review each exact waiver; keep all unchanged meanwhile.
- L01-Q04: Which external/dynamic callers must join a later removal decision? Owner: DomainSpec migration owner. Blocks: Retirement and caller cutover, not additive prototype. Next: Expand consumer discovery when an exact retirement target is selected.

Definition checks cover row/consumer coverage, source currency and non-conflicting scope. They do not demonstrate that any proposed behavior is implemented. No canonical definitions or registered ontologies are changed. The full program denominator remains unchanged; UI is deferred, not completed.
