# Validation

- Dispatch: `2026-07-26-ontology-working-prototype-gap`
- Validated at: `2026-07-26T09:53:40Z`
- Parent approver: `parent`
- Frozen sheet SHA-256: `6d96ff4aaac0127b92c46e1677f53743d96c4068ebb1daede45b95945c901f3a`
- Auditor verdict: `RECOMMEND_ACCEPT`
- Parent verdict: `ACCEPT`

## Artifact checks

- `research.md` contains exactly three explorer sections, headed `Agent 1`, `Agent 2`, and `Agent 3`, plus the reciprocal connection to `findings.md`.
- `findings.md` opens with `Goal`, `TL;DR`, and `Context` in that order; contains the current-state boundary, gap matrix, finite witness, build slices, acceptance observations, verdict matrix, typed negative bank, residue, and reciprocal connection; and closes with named-owner Open Questions.
- The indeterminate witness is concrete and separate from the fail bank: `C-SPECIALIZES-D2-D1` produces `policy-indeterminate` with `POLICY_OWNER_UNBOUND`.
- Required first-prototype slices are classified exhaustively as `already-deployed` or `build-from-owned`; `novel-attempt` is reserved for deferred semantic-hierarchy induction.
- `git diff --check` passes for `research.md`, `findings.md`, this receipt, and the dispatch ledger.

## Current executable baseline

These commands re-check adjacent repository evidence. They do not validate the proposed ontology prototype.

```bash
python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root /home/vrondelli/projects/domainspec-core \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --check
```

Result: `PASS`, exit `0`, four nodes, three edges, `posture: candidate`, `authority_effect: none`.

```bash
node --test cyberAlchemy-v2/development/iolm-workable-example/tests/*.test.mjs
```

Result: exit `1`; 50 tests, 46 pass, four fail. All four failures are `SNAPSHOT_CONTRACT_BINDING_MISMATCH`, confirming the current A1-to-A2 drift described in the findings.

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py
```

Result: `PASS`, exit `0`; eight tests.

```bash
PYTHONDONTWRITEBYTECODE=1 python3 \
  arcanum/arcana/ontology-vault/development/schema-validation-plan/tests/validate_branch_json_schema.py

PYTHONDONTWRITEBYTECODE=1 python3 \
  arcanum/arcana/ontology-vault/development/schema-validation-plan/tests/validate_branch_schema.py
```

Result: both `PASS`, exit `0`. These are generic candidate-schema pressure tests, not CyberAlchemy ontology runtime evidence.

## Claim boundary

The accepted research conclusion is:

> The current checkout does not witness a working ontology prototype. The smallest defensible next target is a build-from-owned, ontology-oriented candidate-graph validation and inspection prototype.

The stronger label `bounded ontology prototype` remains unavailable until the proposed finite contract actually executes and produces current positive, fail, indeterminate, deterministic, independent-receipt, projection, denied-write, and human-inspection evidence. This validation receipt has `authority_effect: none`; it does not implement, promote, publish, or authorize the prototype.
