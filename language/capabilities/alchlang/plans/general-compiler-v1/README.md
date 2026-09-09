# AlchLang General Compiler v1 — candidate predecessor

This private package defines the next D65 predecessor after the three accepted reference examples. It proposes what a general AlchLang compilation capability means before any new compiler implementation is authorized.

The central boundary is:

```text
closed governed AlchLang model
  -> declarative carrier v2
  -> target-neutral compilation plan + trace ledger + unsupported residue
  -> later DomainSpec v2 construction (not present here)
```

The core may lower declared semantics. It may not infer semantics from names, embed domain-specific behavior, grant permissions, or execute effects. Domain-specific effects and fixtures belong to separately owned adapters.

## Package surfaces

- `product-capability.json` — proposed product meaning, inputs, outputs, policies, and exclusions.
- `nodes.json` and `relations.json` — capability-local business ontology terms and typed edges.
- `carrier-v2.contract.json` — declarative semantic carrier candidate, including a typed condition AST.
- `residue.json` — owner-routed blockers and explicit claim limits.
- `profile.json` — package identity, exact source bindings, D65 position, and material inventory.
- `schema.json` and `validate.py` — closed node/edge shapes and deterministic validation.
- `receipts/` — append-only validation history; receipts are evidence, never ontology state or authority.

## Current status

`candidate-pending-owner-review`. The three existing verticals are evidence that three bounded compilations can run; they are not evidence that a domain-neutral compiler exists. No Product Capability acceptance, ontology admission, DomainSpec source, compiled system ontology, implementation binding, conformance, release, deployment, or external effect is claimed.

Validate without writing:

```bash
python3 validate.py
```
