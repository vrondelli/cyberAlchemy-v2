# Interactive Ontology Learning Map — Workable Example

This private fixture-backed viewer presents the pinned DomainSpec-v2 Key & Door
fixture as three synchronized projections: graph, authored outline, and native
records/relations tables. Selection is stable across lenses and always resolves
through the persistent provenance inspector.

The example is read-only candidate demo evidence. It has `authority_effect:
none` and is ineligible for `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`,
`CROSS_FEATURE_UNSUPPORTED`, promotion, and publication.

## Run locally

From the repository root:

```bash
python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root "$PWD" \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --check

python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root "$PWD" \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/?lens=graph&selected=key-and-door.UnlockDoor`.

## Deterministic model checks

```bash
node --test cyberAlchemy-v2/development/iolm-workable-example/tests/*.test.mjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py
```

These suites validate only the fixture boundary and pure models. They do not
stand in for rendered-browser, accessibility, usability, or manual evidence.
