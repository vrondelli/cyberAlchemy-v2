---
tags: [ccb, baseline-templates, data-quality, validation-experiment]
node_type: backlog
is_session: false
layer: domain, application
nature: technical, procedural
status: active
version: 0.2.0
last_updated: 2026-05-11
---

# CCB Baseline Template — Data Quality Issues

## Objective

Track and remediate the three template-level data-quality issues in the harness baseline rule set (`internal_tools/ccb-registration-demo/matching-test/rules/baseline/`) that the v0.3.5 four-agent drift investigation surfaced as Phase 4 follow-ups. None of these issues are root cause of the 0/63 harness coverage finding (that was the resolver-unwired root cause, sealed in v0.3.5 spec changes). They are pre-existing data-quality problems that would surface once the wiring is corrected and the harness starts producing meaningful per-template coverage numbers.

Backlog scope is deliberately narrow: identify the authoritative shape per template, resolve the duplicate / empty / broken field, document the resolution. **No spec changes** — these are template-data fixes, not feature-spec changes.

## Backlog Categories

- **Bug Fixes & Correctness**: tpl16 / tpl19 / tpl20 individual template data fixes (priority-sorted below).

---

# Bug Fixes & Correctness

---

## [2026-05-11] [HIGH] — tpl16 dual canonical_text — which is authoritative? — NOT DONE

**Context:**
Surfaced by the v0.3.5 drift investigation. Template `tpl16.json` carries two canonical_text strings that diverge by 1326 characters:
- `rule.canonical_text` — 31628 chars (rule-level, top-of-file)
- `section_config.sections.legal_text.canonical_text` — 30302 chars (nested under section_config)

The two strings cannot both be authoritative simultaneously. The harness's gate cascade picks one (currently the section_config nested one — see [operations.md → ApplyLegalTextGate](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#applylegaltextgate) step 1 reading `template.section_config.sections.legal_text.text`). The rule-level field is presumably forensic, but the divergence has not been documented anywhere.

**What needs to be done:**
- Determine which string was authored when (`git log -p` on the file).
- Identify which of the two is the authoritative canonical_text under the v0.3.4 rule-file schema (the one ApplyLegalTextGate consumes).
- Drop the duplicate, or rename one for explicit forensic role (e.g., `rule.canonical_text_pre_mask`).
- Document the resolution in this backlog entry (move to DONE) AND in `rules/baseline/README.md` if it exists, else in the file's per-template comment.
- Success criterion: zero baseline templates under `rules/baseline/*.json` carry two diverging canonical_text strings.

**Affected files:**
- `internal_tools/ccb-registration-demo/matching-test/rules/baseline/tpl16.json` — primary file; one of the two canonical_text fields needs to be removed or renamed.
- Other baseline templates may also have this pattern — audit them all once the canonical shape is decided.

---

## [2026-05-11] [HIGH] — tpl19 empty `variable_zones` — mask is a no-op — NOT DONE

**Context:**
Surfaced by the v0.3.5 drift investigation. Template `tpl19.json` has `section_config.sections.legal_text.variable_zones = []`. Under [`ApplyLegalTextGate`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#applylegaltextgate) algorithm step 2, an empty `variable_zones` list makes the mask an identity function (failure-mode 2: "mask is identity; the gate compares raw normalized text. Not an error — this is the correct behavior for templates whose canonical_text has no value-bearing regions worth masking").

The question is whether tpl19's canonical_text genuinely has no value-bearing regions (a legitimate legal-text-only template), or whether the deriver / authoring process simply failed to populate the zones for this template. The harness treats both cases identically (no error, raw-text comparison) — the data-quality concern is documenting which interpretation is correct.

**What needs to be done:**
- Open `tpl19.json` and inspect the legal_text canonical string. Identify any anchored value-bearing regions (dates, names, account numbers, CPF/CNPJ slots) that should have been zones.
- If zones are missing: populate `variable_zones` with `{zone_name, anchor_before, anchor_after, occurrence}` per the v0.3.4 schema.
- If zones are genuinely absent: add an inline comment / template-level note documenting that the empty array is intentional ("no value-bearing regions in this template's legal_text").
- Success criterion: tpl19's empty `variable_zones` is either populated with real zones or annotated as intentional.

**Affected files:**
- `internal_tools/ccb-registration-demo/matching-test/rules/baseline/tpl19.json` — populate or annotate `variable_zones`.

---

## [2026-05-11] [HIGH] — tpl20 broken `anchor_after` not in canonical_text — NOT DONE

**Context:**
Surfaced by the v0.3.5 drift investigation. Template `tpl20.json` declares a zone `company_site2` with `anchor_after = '. A contratação de seu'`, but that exact string does **not appear** in the template's `canonical_text`. Under [`extract_zone`](../../../domains/documents_validation/extractors/ccb/_engine.py) (`_engine.py:300-312`), the regex `re.escape(anchor_before) + r"(.*?)" + re.escape(anchor_after)` won't find a match, so this zone contributes no mask. The `legal_text_diff_chars` therefore includes the would-be-masked region as a real diff, which can fail [`ApplyLegalTextGate`](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#applylegaltextgate) even when the underlying DV matches.

Provenance is unclear: was the anchor copied from an older canonical_text version? Was canonical_text re-extracted after the zone was authored? Was the anchor mis-transcribed by the deriver?

**What needs to be done:**
- `git log -p` `tpl20.json` to identify when `company_site2.anchor_after` was authored and when `canonical_text` was last re-extracted.
- Either:
  - Fix the anchor to match a real substring of `canonical_text` (find the closest legitimate anchor; correct the zone).
  - Remove the zone entirely if no valid anchor exists in the current canonical_text.
- Document the resolution in this backlog entry (move to DONE).
- Success criterion: every `anchor_before` and `anchor_after` in every baseline template's `variable_zones` is a verbatim substring of that template's `canonical_text`. Add a structural check to `cli/migrate_rules.py` (or wherever rule migration lives) to enforce this going forward.

**Affected files:**
- `internal_tools/ccb-registration-demo/matching-test/rules/baseline/tpl20.json` — fix or remove `company_site2` zone.
- Optionally: `internal_tools/ccb-registration-demo/matching-test/cli/migrate_rules.py` (or wherever rule validation lives) — add the anchor-substring structural check.

---

---

## [2026-05-11] [P2] — PDF-grounded `variable_zones` for derived templates — NOT DONE

**Context:**
Surfaced by the v0.3.6 recursive-pipeline diagnostic (worker 1 + worker 2 + evaluator) and deferred from v0.3.6 spec scope by user decision. Currently the deriver (`agents/deriver/_common.py`) pairs LLM-proposed anchors into `variable_zones` without validating that those anchors actually delimit real variable content in the cluster PDFs. The LLM proposes plausible `(anchor_before, anchor_after)` pairs from the pooled legal_text band, the deterministic grid scores them against the cluster's training DVs, but neither step verifies that the anchors correspond to PDF-grounded variable regions (account numbers, dates, names, CPF/CNPJ slots) rather than to coincidentally co-occurring static substrings.

When anchors are NOT PDF-grounded, the mask becomes either (a) a no-op (anchors don't match anywhere in the canonical_text) or (b) a structural sanity overhang (anchors match but the masked region contains static template text, not variable content). Both cases produce `legal_text_diff_chars > 0` on real DVs where the underlying template should match — the v0.3.6 matcher-identical gate scoring catches this at derivation time (`pass_count = 0` → `error = "no_viable_anchor"`), but only after a full grid pass; PDF-grounded variable-zone identification at the LLM-proposal step would fail faster and produce better anchor candidates.

**What needs to be done:**
- Extend the LLM proposal step (`propose_anchor_regexes` in `agents/deriver/_common.py`) to additionally pass per-cluster sample DV PDF text and ask the LLM to identify regions where the text VARIES across the cluster's DVs (rather than just proposing anchors from the medoid alone).
- Add a deterministic validation step: for each proposed `(anchor_before, anchor_after)` pair, check that the captured region differs across at least 2 of the cluster's training DVs (PDF-grounded variability check). Anchors whose captured region is byte-identical across all cluster DVs are rejected — they identify static template text, not variable content.
- Update operations.md `DeriveRuleSet` step 2 to document the PDF-grounded variable-zone identification step once implemented.
- Success criterion: derived templates' `variable_zones` are demonstrably PDF-grounded — every emitted zone's captured region varies across at least 2 cluster DVs.

**Priority:** P2 (deferred from v0.3.6 — the v0.3.6 matcher-identical gate scoring already catches the symptom at derivation time, so this is a derivation-efficiency + anchor-quality improvement, not a correctness gap).

**Affected files:**
- `internal_tools/ccb-registration-demo/matching-test/agents/deriver/_common.py` — extend `propose_anchor_regexes` and add the variability-check step.
- `internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md` — document the new step under `DeriveRuleSet` once implemented.

**Provenance:** v0.3.6 sealed decision — *"PDF-grounded `variable_zones` is out of scope for v0.3.6 — backlog item."* See [v0.3.6 spec bump](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md#change-history).

---

## Provenance

Surfaced by the v0.3.5 four-agent drift investigation (Phase 4 — Template Data Quality, found alongside but distinct from the resolver-unwired root cause). See:
- Conversation note: [2026-05-11-1430-baseline-coverage-drift-investigation.md](../conversations/2026-05-11-1430-baseline-coverage-drift-investigation.md)
- v0.3.5 spec changes: [operations.md](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md#change-history), [governance.md](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md#change-history)

User-sealed decision: do NOT fix these in v0.3.5 spec bump. Backlog them. Fix when the harness wiring is corrected and these templates start producing meaningful per-template coverage numbers that exercise the broken zones.
