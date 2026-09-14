# Trusted Dataset Consumer

Status: integration candidate  
Authority effect: none

This example records how the existing Trusted Dataset materialization capability
uses the standalone Orchestrator. Its adapter calls the public pure RWO API
directly because the domain host already owns its durable journal and external
effects. Validation emits a typed result; generic output conditions select the
publication or quarantine branch.

Run the complete local consumer journey from the CyberAlchemy v2 root:

```sh
TMPDIR="$PWD/orchestrator/api/target/test-tmp" \
  python3 trusted-dataset-materialization/validate.py
```

The integration preserves the old binding identities in
`LEGACY-PROVENANCE.json`. Passing this journey is local candidate evidence and
does not admit the dataset ontology, authorize publication, or prove production
readiness.

## Open Questions

See `../../authority/definitions/DEFINITIONS.md#open-questions`.
