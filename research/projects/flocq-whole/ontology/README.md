# Flocq benchmark ontology

Candidate, source-grounded ontology for the frozen Vero Flocq benchmark. It separates product meaning, Lean system structure, and their trace bridge before proof work begins.

## Result

- Product branch: `product-ontology.json`
- System branch and architecture patterns: `system-ontology.json`
- Product-to-system/spec traceability: `bridge-ontology.json`
- Exact selected bytes and digests: `sources.json`
- First proof frontier: `proof-context.json`
- Replay checks: `validation.json`
- Measured wall time: `timing.json`
- Searchable record surface: `inventory/`

The package covers 22 manifest modules, 73 scored APIs, and 203 scored specs. Its status is `candidate_not_admitted`: it does not claim that any theorem is proved or that the ontology is accepted for enforcement.

Regenerate from the frozen benchmark checkout:

```bash
python3 generate.py /path/to/benchmarks/Flocq --started-epoch <epoch> --ingestion-ended-epoch <epoch>
```
