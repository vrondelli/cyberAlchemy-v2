# Task Session Result — SWU-IOLM-00C-A

## Summary

- Task: `SWU-IOLM-00C-A` candidate contract and authority guard
- Result: `PASS`
- Runtime: local
- Adapter: none
- Strict coverage: pass
- Decision gate: `G-OWNER` and `G-POSTURE` pass
- Subagent closeout: n/a; none dispatched

The candidate contract now requires posture, stable identity, source-set digest,
compiler version, and provenance across input, build receipt, and normalized
view records. Candidate evidence is explicitly non-authoritative and cannot
satisfy `G-DSV2-SG`.

## Candidate-contract handle

- Handle: `iolm-candidate-contract/v1`
- Input schema: `prototype/contracts/candidate/candidate-input.schema.json`
- Build-receipt schema: `prototype/contracts/candidate/candidate-build-receipt.schema.json`
- View schema: `prototype/contracts/candidate/candidate-view.schema.json`
- Fixture manifest: `prototype/fixtures/candidate-contract/manifest.json`
- Validator: `prototype/contracts/candidate/validate_candidate_contract.py`
- Authority posture: `candidate`; no FPR, ontology, release, publication, or
  `G-DSV2-SG` effect

## Implementation files

- `prototype/contracts/candidate/README.md`
- `prototype/contracts/candidate/candidate-input.schema.json`
- `prototype/contracts/candidate/candidate-build-receipt.schema.json`
- `prototype/contracts/candidate/candidate-view.schema.json`
- `prototype/contracts/candidate/validate_candidate_contract.py`
- `prototype/fixtures/candidate-contract/manifest.json`
- `prototype/fixtures/candidate-contract/positive/minimal-candidate-envelope.json`
- `prototype/fixtures/candidate-contract/negative/authority-collapse-fixtures.json`

## Validation

Command:

```bash
python3 cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/validate_candidate_contract.py
```

Raw verdict:

```text
ACCEPT positive:minimal-candidate-envelope
REJECT negative:missing-posture code=POSTURE_REQUIRED
REJECT negative:authoritative-self-label code=AUTHORITATIVE_SELF_LABEL
REJECT negative:missing-provenance code=PROVENANCE_REQUIRED
REJECT negative:missing-source-digest code=SOURCE_DIGEST_REQUIRED
REJECT negative:missing-compiler-version code=COMPILER_VERSION_REQUIRED
REJECT negative:invalid-stable-id code=STABLE_ID_INVALID
REJECT negative:duplicate-stable-id code=STABLE_ID_DUPLICATE
REJECT negative:dangling-stable-endpoint code=STABLE_ENDPOINT_MISSING
REJECT negative:g-dsv2-sg-evidence-claim code=G_DSV2_SG_EVIDENCE_FORBIDDEN
REJECT negative:provenance-digest-mismatch code=PROVENANCE_DIGEST_MISMATCH
REJECT negative:cross-document-identity-mismatch code=CROSS_DOCUMENT_IDENTITY_MISMATCH
REJECT negative:minted-schema-binding-substitution code=MINTED_SCHEMA_BINDING_INVALID
PASS candidate-contract schemas=3 positive=1 negative=12
```

Additional checks:

- Python compile: `PASS`.
- Scoped `git diff --check`: `PASS`.
- Draft 2020-12 schema self-check: `PASS` inside the validator.

## Acceptance verdict

`PASS` — one minimal candidate envelope is accepted and every named negative is
rejected for its expected discriminating code. AC-12 and `G-CANDIDATE` are
satisfied for this contract unit only.

## Residue and stop

- `SWU-IOLM-00C-B` is dependency-ready but remains unselected.
- No candidate graph was compiled and no graph/hierarchy/table view was built;
  those remain 00C-B/C work.
- `G-DSV2-SG` remains open and unchanged for L0A authoritative labeling/rebind.
- The two pre-existing broken IOLM documentation links remain outside this SWU.
- Stop after this receipt, as required by the execution pack.

## Boundary check

No upstream DomainSpec source or FPR state, public `arcanum/` content,
production surface, 00C-B/C implementation, or publication authority was
mutated.
