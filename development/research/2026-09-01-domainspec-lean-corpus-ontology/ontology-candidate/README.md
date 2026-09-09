# DomainSpec Lean corpus ontology candidate

This private package organizes the accepted findings from the frozen DomainSpec Lean corpus research at commit `169d4a46aeaafba62c8bad127fc0522c3223e962` into a durable, validator-backed candidate ontology surface.

It is an `authority-governance` research candidate. Its operational route is `CA2-ROUTE-IMPLEMENT`, while the whole-corpus semantic owner remains unselected. Every record has `authority_effect: none`.

## What is represented

- `sources.json` gives all 12 reviewed sources an explicit disposition and binds every Lean declaration by immutable commit/path/blob, declaration kind, qualified name, line, and declaration-line digest.
- `nodes.json` records eight research findings with exact selector references, method, uncertainty, claim ceiling, closed proposal kinds, non-executable review responsibilities, and finding-local promotion prerequisites.
- `relations.json` is validator-enforced empty while the semantic owner remains unselected: the research does not justify canonical semantic edges between findings.
- `invariants.json` preserves the non-collapse and authority ceilings supported by the sources.
- `residue.json` keeps corpus observations, D65 predecessor gaps, and forbidden inferences visible.
- `materialization.json` records the ontology-vault `package-required` classification without reusing historical context as write authorization.
- `schema/package.schema.json` documents the version-pinned closed package shapes. It is a companion schema; `scripts/validate.py` is the normative executable validator.
- `scripts/validate.py` rejects unknown versions and checks closed shapes, identities, references, source bytes, exact Lean declaration bindings, authority ceilings, total source disposition, empty relations, and each receipt's internal integrity.
- `receipts/` contains append-only historical validation receipts over all package content except prior receipts. Receipt supersession is explicit from v2 onward; no receipt is treated as current merely because its filename sorts last.

## Claim ceiling

This package does not establish a canonical definition, adopted Product Capability, accepted capability-local business ontology, admitted DomainSpec v2 source, compiled system ontology, implementation binding, current proof, conformance result, owner acceptance, promotion, publication, release, or runtime enforcement.

## Validation

From the repository root:

```bash
python3 cyberAlchemy-v2/development/research/2026-09-01-domainspec-lean-corpus-ontology/ontology-candidate/scripts/validate.py
```

The validator is check-only. Receipt materialization is a separate explicit write.

Run its built-in negative checks, including unknown-version and comment-selector rejection, with:

```bash
python3 cyberAlchemy-v2/development/research/2026-09-01-domainspec-lean-corpus-ontology/ontology-candidate/scripts/validate.py --self-test
```

The frozen commit and tree bindings are authoritative for source validation. The local Lean checkout's `HEAD` relation to that commit is reported as diagnostic metadata and cannot make an immutable selector pass or fail.
