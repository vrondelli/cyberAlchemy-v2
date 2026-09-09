---
tags: [ccb, validation-experiment, regex, projection, patterns, conventions]
node_type: conceptual
is_session: false
layer: domain
nature: technical, reference
status: active
version: 0.3.4
last_updated: 2026-05-11
related_specs:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
---

# CCB Projection Patterns — the Regex Rules

## Objective

Single auditable record of the regex rules that drive CCB field projection — the `PATTERNS` table consumed by `derive_extraction_config` — together with the empirical evidence trail (what we tested, what failed, what the failure mode actually was) that has shaped each rule into its current v0.3.4 form. This document exists so that any future change to PATTERNS arrives with the history of *why* the rules look the way they do, not just *what* the current spec asserts. It answers: "What is each regex doing, what bug in an earlier version forced the current shape, and what is still untested?"

## The composition rule

For every field in a CCB template, the extraction regex is composed deterministically from two inputs: the field's `label` (display string) and the field's `value_type` (one of the five members of the sealed PATTERNS enum). Composition formula:

```
re.escape(label) + r"[: \t]+" + PATTERNS[value_type]
```

- **`re.escape(label)`** — the field's display string used as an anchor. Special characters in the label are escaped so the label is matched literally (e.g., `re.escape("Nome")` → `"Nome"`, `re.escape("CPF/CNPJ")` → `"CPF/CNPJ"` with the slash literalized).
- **Separator `[: \t]+`** — one or more of `:`, space, or tab. **Deliberately excludes `\n`.** See Lessons 1 and 2 below for why widening this class (to `\s`, for example) breaks under `re.MULTILINE | re.DOTALL | re.IGNORECASE`.
- **PATTERN tail** — value-type-specific capturing group selected from the table below.

The mask/extract pipeline applies the compiled pattern with `re.MULTILINE | re.DOTALL | re.IGNORECASE`. All flag interactions in the evidence trail below assume those flags are live.

## The PATTERNS table (v0.3.4)

| value_type | regex tail | captures | example input → capture |
|---|---|---|---|
| `number` | `(\d+)` | run of digits | `Idade: 42` → `42` |
| `date_dd_mm_yyyy` | `(\d{2}/\d{2}/\d{4})` | Brazilian date | `Emissão: 12/03/2026` → `12/03/2026` |
| `currency_brl` | `R\$\s*([\d.,]+)` | R$-prefixed amount | `Valor: R$ 1.234,56` → `1.234,56` |
| `percentage` | `([\d.,]+)\s*%` | %-suffixed numeric | `Taxa: 2,5 %` → `2,5` |
| `text_to_eol` | `(\S[^\n]*?)$` | free text, line-bounded, must start non-whitespace | `Nome: JOSÉ` → `JOSÉ` |

Canonical definition lives at [domain.md → derive_extraction_config](../../../internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md). Any drift between that file, `core/projection.py`'s PATTERNS dict, and this table is a governance violation.

## Evidence trail — what we tested and what failed

### Validated (positive evidence)

- All five PATTERN tails produce expected captures on synthetic single-field inputs. See `tests/test_projection.py::test_each_value_type_produces_expected_regex_tail[*]` (5 parametrized cases — one per value_type).
- `date_dd_mm_yyyy`, `currency_brl`, `percentage`, `number` applied during migration of 4 baseline templates (`tpl11`, `tpl16`, `tpl19`, `tpl20`) — 206 fields total. Structurally valid: no observed projection failures on the file contents during migration.

### Failures the test suite caught — chronological

**1. Original `text_to_eol = (.+?)$` (v0.3.3)** — failed idempotency under prod's `_sanitize_template_text` flags (`re.MULTILINE | re.DOTALL | re.IGNORECASE`). Why: `DOTALL` makes `.` match `\n`, so the lazy capture `.+?` can match across lines. Detected by the v0.3.2 mask-idempotency gate.

**2. Separator prefix `[:\s]+` (v0.3.3.1)** — failed idempotency on multi-field realistic baseline (`tpl11.json`). Why: `\s` includes `\n` under `DOTALL`. After pass 1 strips a field value, pass 2's `Label[:\s]+` could consume `: \n` (the trailing newline counts as `\s`), advancing the engine to the NEXT line and capturing/erasing the following field's content. Concrete trace (the agent's verbatim trace was):

```
Input:  "Nome: JOSÉ DA SILVA\nEndereço: RUA DAS FLORES, 123\n..."
Pass 1: "Nome: \nEndereço: RUA DAS FLORES, 123\n..." (correct — only Nome's value erased)
Pass 2: "Nome: \n\n..." (BUG — Endereço's value AND its label were eaten by the now-walked prefix)
```

Fixed by tightening prefix to `[: \t]+`.

**3. `text_to_eol = ([^\n]+?)$` with `[: \t]+` prefix (v0.3.4 first attempt)** — eliminates cross-line bleed but leaves a trailing-space residual. Why: lazy quantifier `[^\n]+?` requires ≥1 char. When the field value is empty after pass 1, the engine backtracks through the prefix to find a 1-char capture in the residual whitespace. Concrete trace:

```
Input pass 1:  "Nome: JOSÉ DA SILVA\n"
Output pass 1: "Nome: \n"        (trailing space survives — it was prefix, not capture)
Input pass 2:  "Nome: \n"
Output pass 2: "Nome:\n"         (prefix gives back the space; lazy captures the residual space; erased)
```

**4. Proposed fix `text_to_eol = (\S[^\n]*?)$` (v0.3.4 final)** — structural fix: require the first captured character to be non-whitespace (`\S`), so the engine cannot backtrack into residual prefix whitespace to satisfy a 1-char capture. After pass 1, the residual line `"Nome: \n"` contains no `\S` character after the label/prefix, so pass 2's pattern fails to match at all — idempotency holds by construction.

**Empirical validation: CONFIRMED GREEN (2026-05-11).** `pytest -q` against the full harness suite reports **239 passed, 0 failed**. The two tests that previously failed under the v0.3.4-first-attempt tail now pass:
- `tests/test_projection.py::test_text_to_eol_pattern_is_idempotent_under_prod_mask_flags` — applies the projected regex twice under prod's `re.MULTILINE | re.DOTALL | re.IGNORECASE` flags on the residual-trailing-space input; pass 2 produces byte-equal output to pass 1.
- `tests/test_promote_dry_run.py::test_dry_run_emits_two_inserts` — exercises the realistic baseline `rules/baseline/tpl11.json` section_config end-to-end through the mask-idempotency promotion gate; gate passes.

Theory delivered: the `\S` start-anchor structurally rejects whitespace-only residuals on pass 2 because the residual line `"Label: \n"` contains no non-whitespace character between the prefix and `\n`. The regex engine cannot satisfy the capture, so pass 2 produces no replacement — strict per-pass idempotency by construction.

### Untested today (gaps to acknowledge)

- **No end-to-end PDF run** through the projection. Pattern correctness on real CCB documents at production-PDF scale is unproven.
- **Multi-field interaction** beyond the 2-field synthetic trace (`Nome` + `Endereço`). Realistic templates have dozens of adjacent fields with varied value_types; emergent interactions have not been exercised.
- **`currency_brl`'s `\s*` substring** could in theory backtrack across lines under `DOTALL` (analogous to the prefix bug). Not yet empirically observed because no baseline currency field has been promoted yet.
- **`percentage`'s trailing `\s*%`** has the same theoretical fragility as `currency_brl`'s internal `\s*`.

## Lessons learned

1. **`\s` includes `\n` under `DOTALL`.** Use `[: \t]` for line-bounded separator classes — never the generic `\s` class once `DOTALL` is in effect.
2. **Lazy quantifiers can backtrack to capture residual whitespace.** If a capture must be non-empty, require its first character to be non-whitespace (`\S`) so the engine cannot satisfy the quantifier by consuming leftover separator characters.
3. **Two-pass idempotency is the structural test.** Single-pass output can look correct on synthetic inputs but fall apart when the mask is re-applied (defensive programming or stage-pair invariance). The v0.3.2 mask-idempotency gate has caught every regex bug this session.
4. **SC5 and mask-idempotency are both load-bearing.** SC5 asserts byte-equal extracted values on every won DV (real PDFs). Mask-idempotency asserts the regex composition is stable under re-application. They catch different failure modes; neither subsumes the other.
5. **PATTERNS is sealed governance.** Changing any entry, adding a member, or modifying the separator class all require a version bump plus governance review. The seal is what makes "by construction" claims tractable.
6. **Empirical first, theoretical second.** Every "by construction" claim about PATTERNS in this session has been wrong on first attempt. Run the test before sealing.

## Governance link

The PATTERNS table is locked at the file referenced above (`domain.md → derive_extraction_config`). Modifying it requires:

- Version bump on `domain.md` AND `data-model.md`.
- Update to `core/projection.py` PATTERNS dict.
- Re-run of every harness group whose stored `extraction_config` would shift.
- Sign-off per `governance.md → ValueType seal` and `governance.md → Projection determinism`.

## Open obligations

- End-to-end PDF run on a realistic corpus subset to validate beyond synthetic tests.
- Adversarial test inputs to probe `currency_brl`'s `\s*` and `percentage`'s trailing `\s*%` backtracking under `DOTALL`.
- Document any v0.3.5+ tail/prefix changes here as they happen.
