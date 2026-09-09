# Lean Ontology Evidence Compiler implementation candidate

This private, local, read-only Python implementation realizes the first
`ValidateTypedOntologyEdge` vertical. It validates one closed JSON request
against immutable Git objects at commit
`169d4a46aeaafba62c8bad127fc0522c3223e962`.

The evidence-backed direction is:

```text
FormalClaim --formalizes--> BusinessMeaning
```

This follows `SpecificationOntology.Edge.WellTyped`; it deliberately rejects
the reverse direction. The validator also resolves every supporting declaration
by repository, commit, path, blob, qualified name, declaration kind, line, and
declaration-line SHA-256.

Run the positive fixture:

```bash
python3 cyberAlchemy-v2/product/lean-ontology-evidence-compiler/implementation/validate_typed_edge.py \
  cyberAlchemy-v2/product/lean-ontology-evidence-compiler/implementation/fixtures/positive.json
```

Run the tests:

```bash
python3 -m unittest discover \
  cyberAlchemy-v2/product/lean-ontology-evidence-compiler/implementation/tests -v
```

Output is canonical compact JSON. A successful result is only
`reviewable-candidate-evidence`. Rejections use deterministic codes and a
nonzero process status. Neither result carries acceptance, admission,
conformance, publication, release, deployment, or execution authority.
