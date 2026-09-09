# Validation Result

Status: `PASS` for package-link integrity; `FLAG` for lifecycle evidence  
Validated: 2026-07-13  
Command: `node cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/scripts/validate.mjs`

## Verified Structure

- 8 canonical artifact examples are present and carry the expected example
  canonical-kind to authority-kind rollups.
- 7 artifact edges have known endpoints and candidate predicates.
- 7 ontology nodes satisfy the package-level node contract.
- 9 ontology relations have known endpoints, candidate predicates, expected
  authority effects, evidence references, and forbidden-collapse notices.
- 3 UX fixture files are present.
- All `CAV2-D42` governed artifact tree fields used by the example are present.
- No artifact claims `authority_state: promoted`.

## Preserved Flags

1. `ux-rule-remove-item-runtime-contract` is intentionally unmapped because the
   current `NODE-MODEL.md` initial concept set has no runtime-contract concept.
2. No Playwright or browser evidence has been run.
3. Fixture expectations are illustrative and uncalibrated.
4. Ontology nodes and relations are package-level candidates, not live vault
   schema.

## Claim Boundary

This result validates links and example contracts only. It does not validate
the accessible-name behavior, complete accessibility, user comprehension,
runtime conformance, ontology schema admission, or authority promotion.

