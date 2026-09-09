# Alch product and business ontology

Status: complete bounded candidate. Authority effect: none.

This package corrects the earlier record-heavy representation of Alch. A
`record` is only a closed data shape. Domain identity, value, vocabulary,
rules, state, behavior, authority, integration and presentation retain distinct
semantic roles.

The package has four synchronized views:

- `alch-language-model.alch` is the canonical Alch source for the semantic core;
- `DEFINITIONS.md` and `DEFINITIONS-INDEX.md` define its critical language;
- `product-ontology.json` describes Alch's users, jobs, capability and outcomes;
- `business-ontology.json` describes the domain meanings and construct families.

`definition-pack.json` binds the views and records the completion criteria.
`validate.py` checks definition coverage, references, non-collapse,
orthogonality, product/business separation and compiled-source evidence.

The word complete is bounded to the Alch semantic product surface represented
here. Optional compiler profiles may add construct contracts, but may not
change these meanings silently.

## Compile and validate

From `plans/general-compiler-v1/implementation`:

```bash
node scripts/run-toolchain.mjs tsx src/core-cli.ts check ../../../define/alch-product-business-ontology-v1/alch-language-model.alch --backend local-compat
node scripts/run-toolchain.mjs tsx src/core-cli.ts build ../../../define/alch-product-business-ontology-v1/alch-language-model.alch --backend local-compat --out ../../../define/alch-product-business-ontology-v1/generated
```

From the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 language/capabilities/alchlang/define/alch-product-business-ontology-v1/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 language/capabilities/alchlang/define/alch-product-business-ontology-v1/test_negative_mutations.py
```

## Decision boundary

This is a candidate Definition Pack and ontology view. It does not promote
definitions, admit a compiler profile, authorize effects, or establish product
adoption.
