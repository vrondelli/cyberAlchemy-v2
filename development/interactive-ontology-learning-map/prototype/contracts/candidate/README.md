# IOLM Candidate Contract

This contract wraps one minted-project graph for the private IOLM candidate
pipeline. It does not copy DomainSpec authority: all three records require
`posture: candidate`, retain source/compiler/provenance bindings, and prevent a
candidate receipt from serving as `G-DSV2-SG` evidence.

The contract family is:

- `candidate-input.schema.json` — binds the live minted graph, source manifest,
  build receipt, profile digests, source-set digest, and compiler version;
- `candidate-build-receipt.schema.json` — records bounded candidate validation
  with explicit authority limits;
- `candidate-view.schema.json` — carries the normalized candidate graph with
  stable node/edge identities and record-level provenance.

Validate the schemas and all positive/negative fixtures from the repository root:

```bash
python3 cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/validate_candidate_contract.py
```

The command uses the host's Draft 2020-12 `jsonschema` implementation, checks
cross-document identity/provenance invariants, accepts one minimal envelope, and
must reject every named mutant for its expected error code.
